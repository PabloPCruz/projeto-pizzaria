import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { EMPTY, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { CheckoutFacadeService, CheckoutResult } from '../../facade/checkout.facade.service';
import { CheckoutDraft, CheckoutErrors, CheckoutField, PaymentMethod } from '../../interfaces/cart.interface';
import { CepLookupResult } from '../../services/cep.service';

export type CepState = 'idle' | 'loading' | 'ok' | 'not-found' | 'error';

export interface OrderSent {
  url: string;
  /** `true` = o navegador bloqueou a nova aba; a tela mostra o link para o cliente clicar. */
  blocked: boolean;
  /** Texto do pedido, para o botão "Copiar mensagem". */
  message?: string;
  /** `true` = navegador embutido (Instagram, Facebook...): o cliente abre o WhatsApp pelo botão. */
  inApp?: boolean;
  /** `true` = o aparelho estava sem internet ao enviar: o WhatsApp só abre com conexão. */
  offline?: boolean;
  /** `true` = o link é longo: o WhatsApp pode abrir sem o texto todo (usar "Copiar mensagem do pedido"). */
  tooLong?: boolean;
}

/** Acima disso o link do wa.me corre o risco de ser cortado (o limite real varia por aparelho). */
const MAX_LINK_LENGTH = 4000;

/** Quanto esperar a consulta de entrega terminar antes de montar o link do pedido. */
const ZONE_WAIT_MS = 3000;

/** Navegadores embutidos em apps (Instagram, Facebook, Messenger, WeChat, Line), onde abrir outra aba costuma falhar. */
export function isInAppBrowser(userAgent: string = navigator.userAgent): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Messenger|MicroMessenger|Line\//i.test(userAgent);
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
  readonly zone$ = this.checkout.zone$;
  readonly radiusKm = this.checkout.freeDeliveryRadiusKm;

  readonly payments: readonly { id: PaymentMethod; label: string; hint: string }[] = [
    { id: 'pix', label: 'Pix', hint: '' },
    { id: 'cartao', label: 'Cartão', hint: '' },
    { id: 'dinheiro', label: 'Dinheiro', hint: 'Informe se precisa de troco' },
  ];

  errors: CheckoutErrors = {};
  submitted = false;
  cepState: CepState = 'idle';
  /** Falha ao montar o link (não deve acontecer; evita um botão que "não faz nada"). */
  sendError = '';

  @Output() sent = new EventEmitter<OrderSent>();

  private readonly lookups = new Subject<boolean>();
  private readonly destroy$ = new Subject<void>();
  private lastLookedUpCep = '';
  /** Campos que o cliente já visitou: só eles mostram erro antes do primeiro envio. */
  private readonly touched = new Set<CheckoutField>();
  private waiting = false;

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

  /** "Não sei meu CEP": alterna entre CEP com busca automática e endereço totalmente manual. */
  setManualAddress(manual: boolean): void {
    this.checkout.setManualAddress(manual);
    this.lastLookedUpCep = '';
    this.cepState = 'idle';
    this.lookups.next(false);
    this.revalidate();
    // O campo que estava em foco (CEP) some ao ligar o modo manual: leva o foco ao primeiro campo do endereço.
    setTimeout(() => document.getElementById(manual ? 'field-street' : 'field-cep')?.focus());
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
    this.onBlur('cep');
    const cep = this.checkout.draft.cep;
    if (cep.replace(/\D/g, '').length === 8 && cep !== this.lastLookedUpCep) this.lookupCep();
  }

  setPayment(payment: PaymentMethod): void {
    this.update({ payment });
  }

  submit(): void {
    if (this.waiting) return;
    this.submitted = true;
    // Consulta de entrega ainda em andamento: espera um pouco para a mensagem já sair com a informação certa.
    if (this.checkout.zoneLoading) {
      this.waiting = true;
      this.checkout.setBusy(true);
      // Sair da página cancela a espera: o WhatsApp não pode abrir sozinho depois.
      this.checkout
        .zoneSettled(ZONE_WAIT_MS)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.waiting = false;
          this.checkout.setBusy(false);
          this.send();
        });
      return;
    }
    this.send();
  }

  private send(): void {
    this.sendError = '';
    let result: CheckoutResult;
    try {
      result = this.checkout.submit();
    } catch {
      this.sendError = 'Não foi possível montar a mensagem do pedido. Revise os textos digitados e tente de novo.';
      setTimeout(() => this.showAlert('send-error-alert'));
      return;
    }
    if (!result.ok) {
      this.errors = result.errors;
      setTimeout(() => this.focusFirstInvalid());
      return;
    }
    this.errors = {};
    if (isInAppBrowser()) {
      this.sent.emit({ url: result.url, blocked: true, inApp: true, message: result.message, ...this.linkNotes(result.url) });
      return;
    }
    // Abre o WhatsApp em nova aba. Sem "noopener" na lista de features, porque com ele o retorno
    // é sempre null e não daria para saber se o navegador bloqueou; o opener é anulado logo depois.
    const win = window.open(result.url, '_blank');
    if (win) win.opener = null;
    this.sent.emit({ url: result.url, blocked: !win, message: result.message, ...this.linkNotes(result.url) });
  }

  get errorList(): { field: CheckoutField; label: string; message: string }[] {
    const fields: CheckoutField[] = [...FIELD_ORDER, 'cart'];
    return fields
      .filter((f) => !!this.errors[f])
      .map((f) => ({ field: f, label: FIELD_LABEL[f] ?? 'Pedido', message: this.errors[f] as string }));
  }

  /** Rola até um alerta do topo do formulário (respeita "reduzir movimento") e leva o foco para ele. */
  private showAlert(id: string): void {
    const alert = document.getElementById(id);
    if (!alert) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    alert.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    alert.focus({ preventScroll: true });
  }

  focusField(field: CheckoutField): void {
    // 'cart' não é um campo: leva o foco ao bloco de itens.
    const id = field === 'cart' ? 'itens-title' : field === 'payment' ? 'field-payment-pix' : 'field-' + field;
    document.getElementById(id)?.focus();
  }

  ngOnDestroy(): void {
    this.checkout.setBusy(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private linkNotes(url: string): Pick<OrderSent, 'offline' | 'tooLong'> {
    return { offline: typeof navigator !== 'undefined' && navigator.onLine === false, tooLong: url.length > MAX_LINK_LENGTH };
  }

  /** Botão "Tentar de novo" depois de uma falha de rede na busca do CEP. */
  retryCep(): void {
    if (this.checkout.draft.cep.replace(/\D/g, '').length === 8) this.lookupCep();
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
        // Falha de rede não conta como "já consultei": sair do campo de novo tenta outra vez.
        this.lastLookedUpCep = '';
        break;
      default:
        this.cepState = 'idle';
    }
  }

  private revalidate(): void {
    const all = this.checkout.validate();
    if (this.submitted) {
      this.errors = all;
      return;
    }
    // Antes do primeiro envio, só mostra o erro dos campos que o cliente já visitou.
    this.errors = Object.fromEntries(Object.entries(all).filter(([field]) => this.touched.has(field as CheckoutField))) as CheckoutErrors;
  }

  /** Ao sair de um campo, valida só ele (e os que já foram visitados). */
  onBlur(field: CheckoutField): void {
    this.touched.add(field);
    this.revalidate();
  }

  private focusFirstInvalid(): void {
    const first = FIELD_ORDER.find((f) => !!this.errors[f]);
    if (first) this.focusField(first);
  }
}
