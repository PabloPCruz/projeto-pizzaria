import { Inject, Injectable } from '@angular/core';
import { PRICE_TABLE } from '../data/prices';
import { CartState, DrinkLine, PizzaLine } from '../interfaces/cart.interface';
import { FlavorCategory, PriceTable, PizzaSizeId } from '../interfaces/pizza-menu.interface';
import { CatalogService } from './catalog.service';

/**
 * Cálculo de valores. Sempre devolve `null` quando algum preço ainda não foi informado
 * em prices.ts, para a interface nunca mostrar um total parcial ou inventado.
 * Não existe taxa de entrega aqui: ela é calculada pela loja na confirmação pelo WhatsApp.
 */
@Injectable({ providedIn: 'root' })
export class PricingService {
  constructor(
    @Inject(PRICE_TABLE) private prices: PriceTable,
    private catalog: CatalogService
  ) {}

  /** Preço de uma unidade de pizza (base + borda). */
  pizzaUnitPrice(size: PizzaSizeId, flavorIds: readonly string[], crustId: string | null): number | null {
    const categories = flavorIds
      .map((id) => this.catalog.getFlavor(id)?.category)
      .filter((c): c is FlavorCategory => !!c);
    if (categories.length === 0) return null;

    const basePrices = categories.map((c) => this.prices.pizza[size]?.[c]);
    if (basePrices.some((p) => p === undefined)) return null;
    const base = Math.max(...(basePrices as number[]));

    if (!crustId) return base;
    const crust = this.prices.crust[crustId as keyof PriceTable['crust']];
    return crust === undefined ? null : base + crust;
  }

  pizzaLineTotal(line: PizzaLine): number | null {
    const unit = this.pizzaUnitPrice(line.size, line.flavorIds, line.crustId);
    return unit === null ? null : unit * line.quantity;
  }

  drinkUnitPrice(drinkId: string): number | null {
    return this.prices.drink[drinkId] ?? null;
  }

  drinkLineTotal(line: DrinkLine): number | null {
    const unit = this.drinkUnitPrice(line.drinkId);
    return unit === null ? null : unit * line.quantity;
  }

  /** Total dos itens (sem entrega). `null` se qualquer item estiver sem preço ou o carrinho estiver vazio. */
  cartTotal(cart: CartState): number | null {
    const totals = [
      ...cart.pizzas.map((p) => this.pizzaLineTotal(p)),
      ...cart.drinks.map((d) => this.drinkLineTotal(d)),
    ];
    if (totals.length === 0 || totals.some((t) => t === null)) return null;
    return (totals as number[]).reduce((sum, t) => sum + t, 0);
  }
}
