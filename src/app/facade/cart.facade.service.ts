import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartState } from '../interfaces/cart.interface';
import { CartService } from '../services/cart.service';
import { CatalogService } from '../services/catalog.service';
import { FormatService } from '../services/format.service';
import { LastOrderService } from '../services/last-order.service';
import { PricingService } from '../services/pricing.service';

export interface PizzaLineView {
  id: string;
  title: string;
  /** Título + sabores: distingue pizzas iguais no tamanho para quem usa leitor de tela. */
  ariaLabel: string;
  flavors: string[];
  crust: string;
  notes: string;
  quantity: number;
  /** Total da linha (unidade x quantidade) já formatado, ou `null` sem preço cadastrado. */
  total: string | null;
}

export interface DrinkLineView {
  id: string;
  drinkId: string;
  label: string;
  quantity: number;
  total: string | null;
}

export interface CartView {
  pizzas: PizzaLineView[];
  drinks: DrinkLineView[];
  itemCount: number;
  isEmpty: boolean;
  /** Total dos itens formatado. `null` = há itens sem preço; a loja confirma o valor. Nunca inclui entrega. */
  total: string | null;
}

/** Oferta de repetir o último pedido enviado (só os itens). */
export interface LastOrderView {
  /** Uma linha por item: "2× Pizza Grande: Calabresa e Poderosa · borda Catupiry", "Coca-Cola 2L". */
  items: string[];
  /** Algum item do pedido antigo saiu do cardápio e não volta ao carrinho. */
  dropped: boolean;
}

/** Carrinho para as telas: linhas já com rótulos, valores formatados e operações de edição. */
@Injectable({ providedIn: 'root' })
export class CartFacadeService {
  readonly view$: Observable<CartView>;
  readonly itemCount$: Observable<number>;
  /** `null` = não há pedido anterior para repetir. */
  readonly lastOrder$: Observable<LastOrderView | null>;

  constructor(
    private cart: CartService,
    private catalog: CatalogService,
    private pricing: PricingService,
    private format: FormatService,
    private lastOrder: LastOrderService
  ) {
    this.itemCount$ = this.cart.itemCount$;
    this.view$ = this.cart.state$.pipe(map((state) => this.toView(state)));
    this.lastOrder$ = this.lastOrder.lastOrder$.pipe(
      map((last) => (last ? { items: this.describe(last.cart), dropped: last.dropped } : null))
    );
  }

  /** Coloca de volta no carrinho os itens do último pedido enviado. */
  repeatLastOrder(): void {
    const last = this.lastOrder.snapshot;
    if (last) this.cart.restore(last.cart);
  }

  private describe(cart: CartState): string[] {
    const times = (quantity: number) => (quantity > 1 ? `${quantity}× ` : '');
    const pizzas = cart.pizzas.map((p) => {
      const size = this.catalog.getSize(p.size)?.label ?? p.size;
      const flavors = this.format.list(p.flavorIds.map((id) => this.catalog.flavorLabel(id, p.flavorOptions?.[id])));
      const crust = p.crustId ? ` · borda ${this.catalog.getCrust(p.crustId)?.label ?? p.crustId}` : '';
      return `${times(p.quantity)}Pizza ${size}: ${flavors}${crust}`;
    });
    const drinks = cart.drinks.map((d) => `${times(d.quantity)}${this.catalog.getDrink(d.drinkId)?.label ?? d.drinkId}`);
    return [...pizzas, ...drinks];
  }

  setPizzaQuantity(id: string, quantity: number): void {
    this.cart.setPizzaQuantity(id, quantity);
  }

  setDrinkQuantity(id: string, quantity: number): void {
    this.cart.setDrinkQuantity(id, quantity);
  }

  removePizza(id: string): void {
    this.cart.removePizza(id);
  }

  removeDrink(id: string): void {
    this.cart.removeDrink(id);
  }

  addDrink(drinkId: string): void {
    this.cart.addDrink(drinkId);
  }

  clear(): void {
    this.cart.clear();
  }

  private toView(state: CartState): CartView {
    const money = (value: number | null) => (value === null ? null : this.format.currency(value));
    const total = this.pricing.cartTotal(state);
    return {
      pizzas: state.pizzas.map((p) => {
        const size = this.catalog.getSize(p.size);
        const title = size ? `Pizza ${size.label} · ${size.slices} fatias` : `Pizza ${p.size}`;
        const flavors = p.flavorIds.map((id) => this.catalog.flavorLabel(id, p.flavorOptions?.[id]));
        return {
          id: p.id,
          title,
          ariaLabel: `${title}: ${flavors.join(', ')}`,
          flavors,
          crust: p.crustId ? this.catalog.getCrust(p.crustId)?.label ?? p.crustId : 'Sem borda',
          notes: p.notes,
          quantity: p.quantity,
          total: money(this.pricing.pizzaLineTotal(p)),
        };
      }),
      drinks: state.drinks.map((d) => ({
        id: d.id,
        drinkId: d.drinkId,
        label: this.catalog.getDrink(d.drinkId)?.label ?? d.drinkId,
        quantity: d.quantity,
        total: money(this.pricing.drinkLineTotal(d)),
      })),
      itemCount: state.pizzas.reduce((s, p) => s + p.quantity, 0) + state.drinks.reduce((s, d) => s + d.quantity, 0),
      isEmpty: state.pizzas.length === 0 && state.drinks.length === 0,
      total: money(total),
    };
  }
}
