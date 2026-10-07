import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { STORE_INFO } from '../data/store-info';
import { CheckoutDraft, CheckoutErrors } from '../interfaces/cart.interface';
import { StoreStatus } from '../interfaces/store-hours.interface';
import { CartService } from '../services/cart.service';
import { CepLookupResult, CepService } from '../services/cep.service';
import { CheckoutDraftService } from '../services/checkout-draft.service';
import { CheckoutValidationService } from '../services/checkout-validation.service';
import { DeliveryZone, DeliveryZoneService } from '../services/delivery-zone.service';
import { FormatService } from '../services/format.service';
import { StoreHoursService } from '../services/store-hours.service';
import { DELIVERY_FEE_NOTICE, WhatsappMessageService } from '../services/whatsapp-message.service';

export type CheckoutResult =
  | { ok: true; url: string }
  /** `closed` presente = a loja está fechada agora; `errors` vem vazio. */
  | { ok: false; errors: CheckoutErrors; closed?: StoreStatus };

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
    private deliveryZone: DeliveryZoneService,
    private storeHours: StoreHoursService
  ) {
    this.draft$ = this.draftStore.draft$;
    // Recalcula também quando o formulário muda: a zona só vale para o endereço para o qual foi calculada.
    this.zone$ = combineLatest([this.zoneState, this.draftStore.draft$]).pipe(map(([zone, draft]) => this.effectiveZone(zone, draft)));

    // switchMap: uma consulta nova, ou o CEP ser editado, cancela a anterior (resposta atrasada nunca vale).
    this.zoneRequests
      .pipe(
        switchMap((go) => {
          if (!go) return of<DeliveryZone>({ status: 'unknown' });
          const d = this.draftStore.snapshot;
          // Sem CEP (endereço manual) não há entrega grátis: só o CEP, dentro das regras, dá direito a ela.
          if (d.manualAddress) return of<DeliveryZone>({ status: 'unknown' });
          const addr = this.addressKey(d);
          return this.deliveryZone
            .check(d.cep, { street: d.street, number: d.number, city: d.city, state: d.state })
            .pipe(map((zone): DeliveryZone => (zone.status === 'unknown' ? zone : { ...zone, addr })));
        })
      )
      .subscribe((zone) => this.zoneState.next(zone));

    // CEP completo salvo de uma visita anterior: recalcula a zona ao abrir o checkout.
    const saved = this.draftStore.snapshot;
    if (!saved.manualAddress && this.format.onlyDigits(saved.cep).length === 8) this.zoneRequests.next(true);
  }

  get draft(): CheckoutDraft {
    return this.draftStore.snapshot;
  }

  get zone(): DeliveryZone {
    return this.effectiveZone(this.zoneState.value, this.draftStore.snapshot);
  }

  update(patch: Partial<CheckoutDraft>): void {
    this.draftStore.update(patch);
  }

  /**
   * Liga/desliga o preenchimento manual ("não sei meu CEP"). Ligar limpa o CEP e apaga na hora qualquer
   * "entrega grátis" já mostrada (sem CEP ela não existe); o resto do endereço é mantido.
   */
  setManualAddress(manual: boolean): void {
    this.draftStore.update(manual ? { manualAddress: true, cep: '' } : { manualAddress: false });
    this.zoneRequests.next(false);
  }

  /** Máscara do CEP. Qualquer edição invalida a zona de entrega até uma nova consulta. */
  setCep(value: string): void {
    const cep = this.format.cep(value);
    // Outro CEP: o que o CEP anterior preencheu sozinho (e o cliente não mexeu) sai, para não ficar um endereço
    // de outro lugar ao lado do CEP novo.
    this.draftStore.update({ cep, ...this.clearAutoFilled(this.format.onlyDigits(cep)) });
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
        const digits = this.format.onlyDigits(this.draftStore.snapshot.cep);
        if (result.status === 'ok') {
          const patch = Object.fromEntries(Object.entries(result.address).filter(([, value]) => !!value));
          this.draftStore.update(patch);
          this.autoFilled = { cep: digits, values: patch as Partial<CheckoutDraft> };
          // CEP geral de cidade (sem rua): a posição é a do centro da cidade, nunca vale como "grátis".
          if (result.address.street.trim()) this.genericCeps.delete(digits);
          else this.genericCeps.add(digits);
        } else {
          this.genericCeps.delete(digits);
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

  /** Valida e, estando tudo certo, devolve o link wa.me com a mensagem do pedido. Loja fechada: recusa antes de tudo. */
  submit(): CheckoutResult {
    // Sempre recalculado no clique: cobre a virada de horário/dia com a página aberta.
    const status = this.storeHours.snapshot();
    if (!status.open) return { ok: false, errors: {}, closed: status };
    const errors = this.validate();
    if (!this.validation.isValid(errors)) return { ok: false, errors };
    const draft = this.draftStore.snapshot;
    // "Grátis" só com CEP, e só se a zona foi calculada para o CEP e para o endereço que estão no formulário agora.
    const freeDelivery = this.effectiveZone(this.zoneState.value, draft).status === 'free';
    return { ok: true, url: this.whatsapp.buildLink(this.cart.snapshot, draft, { freeDelivery }) };
  }

  /** CEPs (só dígitos) cuja consulta trouxe endereço sem rua. */
  private readonly genericCeps = new Set<string>();
  /** O que a última consulta de CEP preencheu sozinha, e para qual CEP. */
  private autoFilled: { cep: string; values: Partial<CheckoutDraft> } | null = null;

  /** Cidade|UF normalizados: identifica "o mesmo endereço" para a zona de entrega. */
  private addressKey(draft: CheckoutDraft): string {
    const city = draft.city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    return `${city}|${draft.state.trim().toUpperCase()}`;
  }

  /** A zona só vale com CEP, para o CEP e a cidade/UF atuais e se o CEP trouxe uma rua. Senão, `unknown`. */
  private effectiveZone(zone: DeliveryZone, draft: CheckoutDraft): DeliveryZone {
    if (zone.status === 'unknown') return zone;
    const valid =
      !draft.manualAddress &&
      zone.key === this.format.onlyDigits(draft.cep) &&
      (zone.addr === undefined || zone.addr === this.addressKey(draft)) &&
      !this.genericCeps.has(zone.key);
    return valid ? zone : { status: 'unknown' };
  }

  /** Campos que a consulta anterior preencheu e continuam iguais: voltam a vazio quando o CEP muda. */
  private clearAutoFilled(nextCepDigits: string): Partial<CheckoutDraft> {
    const filled = this.autoFilled;
    if (!filled || filled.cep === nextCepDigits) return {};
    this.autoFilled = null;
    const current = this.draftStore.snapshot;
    const patch: Record<string, string> = {};
    for (const [key, value] of Object.entries(filled.values)) {
      if (current[key as keyof CheckoutDraft] === value) patch[key] = '';
    }
    return patch as Partial<CheckoutDraft>;
  }

  /** Limpa carrinho e formulário (usar só quando o cliente pedir um novo pedido). */
  startOver(): void {
    this.cart.clear();
    this.draftStore.reset();
    this.zoneRequests.next(false);
  }
}
