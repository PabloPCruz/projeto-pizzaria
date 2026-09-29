import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { EMPTY, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { CheckoutFacadeService } from '../../facade/checkout.facade.service';
import { CheckoutDraft, CheckoutErrors, CheckoutField, PaymentMethod } from '../../interfaces/cart.interface';
import { CepLookupResult } from '../../services/cep.service';

export type CepState = 'idle' | 'loading' | 'ok' | 'not-found' | 'error';

export interface OrderSent {
  url: string;
  /** `true` = o navegador bloqueou a nova aba; a tela mostra o link para o cliente clicar. */
  blocked: boolean;
}

/** Ordem visual dos campos: usada para listar erros e focar o primeiro inválido. */
const FIELD_ORDER: readonly CheckoutField[] = [
  'name',
  'phone',
  'cep',
  'street',
  'number',
  'neighborhood',
  'city',
  'state',
  'payment',
  'changeFor',
];

const FIELD_LABEL: Partial<Record<CheckoutField, string>> = {
  name: 'Nome',
  phone: 'Telefone',
  cep: 'CEP',
  street: 'Rua',
  number: 'Número',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado (UF)',
  payment: 'Forma de pagamento',
  changeFor: 'Troco',
};

@Component({
  selector: 'app-checkout-form',
  templateUrl: './checkout-form.component.html',
})
export class CheckoutFormComponent implements OnDestroy {
  readonly draft$ = this.checkout.draft$;

  readonly payments: readonly { id: PaymentMethod; label: string; hint: string }[] = [
    { id: 'pix', label: 'Pix', hint: '' },
    { id: 'cartao', label: 'Cartão', hint: '' },
    { id: 'dinheiro', label: 'Dinheiro', hint: 'Informe se precisa de troco' },
  ];

  errors: CheckoutErrors = {};
  submitted = false;
  cepState: CepState = 'idle';

  @Output() sent = new EventEmitter<OrderSent>();

  private readonly lookups = new Subject<boolean>();
  private readonly destroy$ = new Subject<void>();
  private lastLookedUpCep = '';

  constructor(readonly checkout: CheckoutFacadeService) {
    // switchMap: uma busca nova (ou o CEP ser editado) cancela a anterior.
    this.lookups
      .pipe(
        switchMap((go) => (go ? this.checkout.lookupCep() : EMPTY)),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => this.onLookupResult(result));
  }

  update(patch: Partial<CheckoutDraft>): void {
    this.checkout.update(patch);
    this.revalidate();
  }

  setPhone(value: string): void {
    this.checkout.setPhone(value);
    this.revalidate();
  }

  setChangeFor(value: string): void {
    this.checkout.setChangeFor(value);
    this.revalidate();
  }

  normalizeChangeFor(): void {
    this.checkout.normalizeChangeFor();
    this.revalidate();
  }

  setState(value: string): void {
    this.update({ state: value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2) });
  }

  setCep(value: string): void {
    this.checkout.setCep(value);
    this.revalidate();
    const cep = this.checkout.draft.cep;
    if (cep.replace(/\D/g, '').length === 8) {
      this.lookupCep();
    } else {
      this.lastLookedUpCep = '';
      this.cepState = 'idle';
      this.lookups.next(false);
    }
  }

  /** Ao sair do campo com 8 dígitos, busca se ainda não buscou esse CEP. */
  onCepBlur(): void {
    const cep = this.checkout.draft.cep;
    if (cep.replace(/\D/g, '').length === 8 && cep !== this.lastLookedUpCep) this.lookupCep();
  }

  setPayment(payment: PaymentMethod): void {
    this.update({ payment });
  }

  submit(): void {
    this.submitted = true;
    const result = this.checkout.submit();
    if (!result.ok) {
      this.errors = result.errors;
      setTimeout(() => this.focusFirstInvalid());
      return;
    }
    this.errors = {};
    // Abre o WhatsApp em nova aba. Sem "noopener" na lista de features, porque com ele o retorno
    // é sempre null e não daria para saber se o navegador bloqueou; o opener é anulado logo depois.
    const win = window.open(result.url, '_blank');
    if (win) win.opener = null;
    this.sent.emit({ url: result.url, blocked: !win });
  }

  get errorList(): { field: CheckoutField; label: string; message: string }[] {
    const fields: CheckoutField[] = [...FIELD_ORDER, 'cart'];
    return fields
      .filter((f) => !!this.errors[f])
      .map((f) => ({ field: f, label: FIELD_LABEL[f] ?? 'Pedido', message: this.errors[f] as string }));
  }

  focusField(field: CheckoutField): void {
    // 'cart' não é um campo: leva o foco ao bloco de itens.
    const id = field === 'cart' ? 'itens-title' : field === 'payment' ? 'field-payment-pix' : 'field-' + field;
    document.getElementById(id)?.focus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private lookupCep(): void {
    this.lastLookedUpCep = this.checkout.draft.cep;
    this.cepState = 'loading';
    this.lookups.next(true);
  }

  private onLookupResult(result: CepLookupResult): void {
    switch (result.status) {
      case 'ok':
        this.cepState = 'ok';
        this.revalidate();
        // Só move o foco se o cliente ainda estiver no CEP (ou em lugar nenhum): não rouba o foco de quem já seguiu adiante.
        // Rua vazia (CEP geral de cidade) => Rua; senão o próximo dado é o Número.
        setTimeout(() => {
          const active = document.activeElement;
          if (active && active !== document.body && active.id !== 'field-cep') return;
          document.getElementById(this.checkout.draft.street.trim() ? 'field-number' : 'field-street')?.focus();
        });
        break;
      case 'not-found':
        this.cepState = 'not-found';
        break;
      case 'error':
        this.cepState = 'error';
        break;
      default:
        this.cepState = 'idle';
    }
  }

  private revalidate(): void {
    if (this.submitted) this.errors = this.checkout.validate();
  }

  private focusFirstInvalid(): void {
    const first = FIELD_ORDER.find((f) => !!this.errors[f]);
    if (first) this.focusField(first);
  }
}
