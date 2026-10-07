import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';
import { CheckoutDraft, PaymentMethod } from '../interfaces/cart.interface';
import { PersistenceService } from './persistence.service';

const STORAGE_KEY = 'checkout';
/** Nome, telefone e endereço não ficam salvos para sempre (aparelho compartilhado). */
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PAYMENT_METHODS: readonly PaymentMethod[] = ['pix', 'cartao', 'dinheiro'];

/** Mesmos limites dos campos do formulário (maxlength): dado salvo/adulterado nunca passa deles. */
const LIMITS: Record<string, number> = {
  name: 60,
  phone: 15,
  cep: 9,
  street: 80,
  number: 10,
  complement: 60,
  neighborhood: 60,
  city: 60,
  state: 2,
  changeFor: 15,
  generalNotes: 400,
};

export const EMPTY_CHECKOUT: CheckoutDraft = {
  name: '',
  phone: '',
  manualAddress: false,
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  payment: null,
  changeFor: '',
  generalNotes: '',
};

/** Dados do formulário de checkout (cliente, endereço, pagamento), salvos a cada alteração. */
@Injectable({ providedIn: 'root' })
export class CheckoutDraftService {
  private readonly draft = new BehaviorSubject<CheckoutDraft>(EMPTY_CHECKOUT);
  readonly draft$: Observable<CheckoutDraft> = this.draft.asObservable();

  private readonly destroyRef = inject(DestroyRef);

  constructor(private persistence: PersistenceService) {
    this.hydrate();
    this.persistence.changes$(STORAGE_KEY).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.hydrate());
  }

  private hydrate(): void {
    this.draft.next(this.restore(this.persistence.read<unknown>(STORAGE_KEY, null, DRAFT_TTL_MS)));
  }

  /** Campo a campo: qualquer valor com tipo errado volta ao valor vazio. */
  private restore(saved: unknown): CheckoutDraft {
    if (!saved || typeof saved !== 'object') return EMPTY_CHECKOUT;
    const data = saved as Record<string, unknown>;
    const text = (key: keyof CheckoutDraft): string => {
      const value = data[key];
      if (typeof value !== 'string') return '';
      // Só as observações podem ter várias linhas.
      const clean = key === 'generalNotes' ? value : value.replace(/[\r\n]+/g, ' ');
      return clean.slice(0, LIMITS[key] ?? 100);
    };
    const payment = PAYMENT_METHODS.includes(data['payment'] as PaymentMethod) ? (data['payment'] as PaymentMethod) : null;
    return {
      name: text('name'),
      phone: text('phone'),
      manualAddress: data['manualAddress'] === true,
      cep: text('cep'),
      street: text('street'),
      number: text('number'),
      complement: text('complement'),
      neighborhood: text('neighborhood'),
      city: text('city'),
      state: text('state'),
      payment,
      changeFor: payment === 'dinheiro' ? text('changeFor') : '',
      generalNotes: text('generalNotes'),
    };
  }

  get snapshot(): CheckoutDraft {
    return this.draft.value;
  }

  update(patch: Partial<CheckoutDraft>): void {
    const next = { ...this.snapshot, ...patch };
    // Troco só faz sentido com pagamento em dinheiro.
    if (next.payment !== 'dinheiro') next.changeFor = '';
    this.draft.next(next);
    this.persistence.write(STORAGE_KEY, next);
  }

  reset(): void {
    this.draft.next(EMPTY_CHECKOUT);
    this.persistence.remove(STORAGE_KEY);
  }
}
