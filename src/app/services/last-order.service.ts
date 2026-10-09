import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartState } from '../interfaces/cart.interface';
import { CartService } from './cart.service';
import { PersistenceService } from './persistence.service';

const STORAGE_KEY = 'last-order';
/** O último pedido fica no aparelho por 30 dias (só os itens: nome, telefone e endereço não entram aqui). */
const LAST_ORDER_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface LastOrder {
  /** Itens já validados contra o cardápio de hoje. */
  cart: CartState;
  /** `true` = algum item do pedido antigo saiu do cardápio e ficou de fora. */
  dropped: boolean;
}

/**
 * Guarda os itens do último pedido enviado para o cliente repetir com um toque.
 * Nunca guarda dados pessoais (esses ficam só no formulário, com validade própria).
 */
@Injectable({ providedIn: 'root' })
export class LastOrderService {
  private readonly state: BehaviorSubject<LastOrder | null>;
  readonly lastOrder$: Observable<LastOrder | null>;

  constructor(
    private persistence: PersistenceService,
    private cart: CartService
  ) {
    this.state = new BehaviorSubject<LastOrder | null>(this.load());
    this.lastOrder$ = this.state.asObservable();
  }

  get snapshot(): LastOrder | null {
    return this.state.value;
  }

  /** Guarda os itens do pedido que acabou de ser montado para envio. Carrinho vazio não substitui o anterior. */
  save(cart: CartState): void {
    if (cart.pizzas.length === 0 && cart.drinks.length === 0) return;
    this.persistence.write(STORAGE_KEY, cart);
    this.state.next(this.load());
  }

  clear(): void {
    this.persistence.remove(STORAGE_KEY);
    this.state.next(null);
  }

  private load(): LastOrder | null {
    const raw = this.persistence.read<unknown>(STORAGE_KEY, null, LAST_ORDER_TTL_MS);
    const cart = this.cart.sanitize(raw);
    const kept = cart.pizzas.length + cart.drinks.length;
    if (kept === 0) return null;
    return { cart, dropped: this.countLines(raw) > kept };
  }

  private countLines(raw: unknown): number {
    const data = raw as { pizzas?: unknown; drinks?: unknown } | null;
    const size = (list: unknown) => (Array.isArray(list) ? list.length : 0);
    return data && typeof data === 'object' ? size(data.pizzas) + size(data.drinks) : 0;
  }
}
