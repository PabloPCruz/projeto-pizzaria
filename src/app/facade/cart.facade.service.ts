import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartState } from '../interfaces/cart.interface';
import { CartService } from '../services/cart.service';
import { CatalogService } from '../services/catalog.service';
import { FormatService } from '../services/format.service';
import { PricingService } from '../services/pricing.service';

export interface PizzaLineView {
  id: string;
  title: string;
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

/** Carrinho para as telas: linhas já com rótulos, valores formatados e operações de edição. */
@Injectable({ providedIn: 'root' })
export class CartFacadeService {
  readonly view$: Observable<CartView>;
  readonly itemCount$: Observable<number>;

  constructor(
    private cart: CartService,
    private catalog: CatalogService,
    private pricing: PricingService,
    private format: FormatService
  ) {
    this.itemCount$ = this.cart.itemCount$;
    this.view$ = this.cart.state$.pipe(map((state) => this.toView(state)));
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
        return {
          id: p.id,
          title: size ? `Pizza ${size.label} · ${size.slices} fatias` : `Pizza ${p.size}`,
          flavors: p.flavorIds.map((id) => this.catalog.getFlavor(id)?.name ?? id),
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
