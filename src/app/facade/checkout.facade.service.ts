import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CheckoutDraft, CheckoutErrors } from '../interfaces/cart.interface';
import { CartService } from '../services/cart.service';
import { CepLookupResult, CepService } from '../services/cep.service';
import { CheckoutDraftService } from '../services/checkout-draft.service';
import { CheckoutValidationService } from '../services/checkout-validation.service';
import { FormatService } from '../services/format.service';
import { DELIVERY_FEE_NOTICE, WhatsappMessageService } from '../services/whatsapp-message.service';

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; errors: CheckoutErrors };

/** Checkout: formulário persistido, busca de CEP, validação e link do WhatsApp. */
@Injectable({ providedIn: 'root' })
export class CheckoutFacadeService {
  readonly draft$: Observable<CheckoutDraft>;
  /** Texto fixo exibido no checkout: a taxa de entrega NÃO é calculada pelo site. */
  readonly deliveryFeeNotice = DELIVERY_FEE_NOTICE;

  constructor(
    private draftStore: CheckoutDraftService,
    private cart: CartService,
    private cep: CepService,
    private validation: CheckoutValidationService,
    private whatsapp: WhatsappMessageService,
    private format: FormatService
  ) {
    this.draft$ = this.draftStore.draft$;
  }

  get draft(): CheckoutDraft {
    return this.draftStore.snapshot;
  }

  update(patch: Partial<CheckoutDraft>): void {
    this.draftStore.update(patch);
  }

  setCep(value: string): void {
    this.draftStore.update({ cep: this.format.cep(value) });
  }

  setPhone(value: string): void {
    this.draftStore.update({ phone: this.format.phone(value) });
  }

  /** Troco: aplica a máscara de reais enquanto o cliente digita. */
  setChangeFor(value: string): void {
    this.draftStore.update({ changeFor: this.format.moneyMask(value) });
  }

  /** Ao sair do campo de troco, completa os centavos ("R$ 100" -> "R$ 100,00"). Valor inválido é deixado como está. */
  normalizeChangeFor(): void {
    const value = this.format.parseMoney(this.draftStore.snapshot.changeFor);
    if (value !== null && value > 0) this.draftStore.update({ changeFor: this.format.moneyField(value) });
  }

  /**
   * Busca o CEP e, se encontrar, preenche rua, bairro, cidade e estado.
   * Número e complemento nunca são tocados, e campo que o ViaCEP devolve vazio
   * (CEP geral de cidade, sem rua/bairro) mantém o que o cliente já digitou.
   */
  lookupCep(): Observable<CepLookupResult> {
    return this.cep.lookup(this.draftStore.snapshot.cep).pipe(
      tap((result) => {
        if (result.status !== 'ok') return;
        const patch = Object.fromEntries(Object.entries(result.address).filter(([, value]) => !!value));
        this.draftStore.update(patch);
      })
    );
  }

  validate(): CheckoutErrors {
    return this.validation.validate(this.cart.snapshot, this.draftStore.snapshot);
  }

  /** Valida e, estando tudo certo, devolve o link wa.me com a mensagem do pedido. */
  submit(): CheckoutResult {
    const errors = this.validate();
    if (!this.validation.isValid(errors)) return { ok: false, errors };
    return { ok: true, url: this.whatsapp.buildLink(this.cart.snapshot, this.draftStore.snapshot) };
  }

  /** Limpa carrinho e formulário (usar só quando o cliente pedir um novo pedido). */
  startOver(): void {
    this.cart.clear();
    this.draftStore.reset();
  }
}
