import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CheckoutDraft, PaymentMethod } from '../interfaces/cart.interface';
import { PersistenceService } from './persistence.service';

const STORAGE_KEY = 'checkout';
const PAYMENT_METHODS: readonly PaymentMethod[] = ['pix', 'cartao', 'dinheiro'];

export const EMPTY_CHECKOUT: CheckoutDraft = {
  name: '',
  phone: '',
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

  constructor(private persistence: PersistenceService) {
    this.draft.next(this.restore(this.persistence.read<unknown>(STORAGE_KEY, null)));
  }

  /** Campo a campo: qualquer valor com tipo errado volta ao valor vazio. */
  private restore(saved: unknown): CheckoutDraft {
    if (!saved || typeof saved !== 'object') return EMPTY_CHECKOUT;
    const data = saved as Record<string, unknown>;
    const text = (key: keyof CheckoutDraft): string => (typeof data[key] === 'string' ? (data[key] as string) : '');
    const payment = PAYMENT_METHODS.includes(data['payment'] as PaymentMethod) ? (data['payment'] as PaymentMethod) : null;
    return {
      name: text('name'),
      phone: text('phone'),
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
