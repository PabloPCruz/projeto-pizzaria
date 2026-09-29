import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { STORE_INFO } from '../data/store-info';
import { CheckoutDraft, CheckoutErrors } from '../interfaces/cart.interface';
import { CartService } from '../services/cart.service';
import { CepLookupResult, CepService } from '../services/cep.service';
import { CheckoutDraftService } from '../services/checkout-draft.service';
import { CheckoutValidationService } from '../services/checkout-validation.service';
import { DeliveryZone, DeliveryZoneService } from '../services/delivery-zone.service';
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
  /** Raio da entrega grátis, em km (para os textos da tela). */
  readonly freeDeliveryRadiusKm = STORE_INFO.freeDelivery.radiusKm;
  /** Zona de entrega do CEP informado: `free` (até o raio), `outside` ou `unknown` (mensagem padrão). */
  readonly zone$: Observable<DeliveryZone>;

  private readonly zoneState = new BehaviorSubject<DeliveryZone>({ status: 'unknown' });
  /** `true` = consultar a zona do CEP atual; `false` = cancelar e voltar a `unknown`. */
  private readonly zoneRequests = new Subject<boolean>();

  constructor(
    private draftStore: CheckoutDraftService,
    private cart: CartService,
    private cep: CepService,
    private validation: CheckoutValidationService,
    private whatsapp: WhatsappMessageService,
    private format: FormatService,
    private deliveryZone: DeliveryZoneService
  ) {
    this.draft$ = this.draftStore.draft$;
    this.zone$ = this.zoneState.asObservable();

    // switchMap: uma consulta nova, ou o CEP ser editado, cancela a anterior (resposta atrasada nunca vale).
    this.zoneRequests
      .pipe(
        switchMap((go) => {
          if (!go) return of<DeliveryZone>({ status: 'unknown' });
          const d = this.draftStore.snapshot;
          return this.deliveryZone.check(d.cep, { street: d.street, number: d.number, city: d.city, state: d.state });
        })
      )
      .subscribe((zone) => this.zoneState.next(zone));

    // CEP completo salvo de uma visita anterior: recalcula a zona ao abrir o checkout.
    if (this.format.onlyDigits(this.draftStore.snapshot.cep).length === 8) this.zoneRequests.next(true);
  }

  get draft(): CheckoutDraft {
    return this.draftStore.snapshot;
  }

  get zone(): DeliveryZone {
    return this.zoneState.value;
  }

  update(patch: Partial<CheckoutDraft>): void {
    this.draftStore.update(patch);
  }

  /** Máscara do CEP. Qualquer edição invalida a zona de entrega até uma nova consulta. */
  setCep(value: string): void {
    this.draftStore.update({ cep: this.format.cep(value) });
    this.zoneRequests.next(false);
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
        if (result.status === 'ok') {
          const patch = Object.fromEntries(Object.entries(result.address).filter(([, value]) => !!value));
          this.draftStore.update(patch);
        }
        // A distância é consultada mesmo que o ViaCEP não conheça o CEP (a localização tem outra base):
        // só um CEP incompleto fica de fora.
        if (result.status !== 'invalid') this.zoneRequests.next(true);
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
    const draft = this.draftStore.snapshot;
    // "Grátis" só vale se a zona foi calculada para o CEP que está no formulário agora.
    const zone = this.zoneState.value;
    const freeDelivery = zone.status === 'free' && zone.cep === this.format.onlyDigits(draft.cep);
    return { ok: true, url: this.whatsapp.buildLink(this.cart.snapshot, draft, { freeDelivery }) };
  }

  /** Limpa carrinho e formulário (usar só quando o cliente pedir um novo pedido). */
  startOver(): void {
    this.cart.clear();
    this.draftStore.reset();
    this.zoneRequests.next(false);
  }
}
