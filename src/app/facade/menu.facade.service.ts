import { Injectable } from '@angular/core';
import { FEATURED_FLAVOR_IDS, FLAVOR_CATEGORY_LABELS } from '../data/menu.data';
import {
  Crust,
  Drink,
  FlavorCategory,
  PizzaFlavor,
  PizzaSize,
  PizzaSizeId,
} from '../interfaces/pizza-menu.interface';
import { CatalogService } from '../services/catalog.service';
import { PizzaPrices, PriceListService } from '../services/price-list.service';

/** Cardápio para as telas: tamanhos, sabores por categoria, busca, bordas e bebidas. */
@Injectable({ providedIn: 'root' })
export class MenuFacadeService {
  readonly categories: readonly { id: FlavorCategory; label: string }[] = (
    Object.keys(FLAVOR_CATEGORY_LABELS) as FlavorCategory[]
  ).map((id) => ({ id, label: FLAVOR_CATEGORY_LABELS[id] }));

  constructor(
    private catalog: CatalogService,
    private prices: PriceListService
  ) {}

  getSizes(): readonly PizzaSize[] {
    return this.catalog.getSizes();
  }

  getFlavors(category?: FlavorCategory): readonly PizzaFlavor[] {
    return this.catalog.getFlavors(category);
  }

  searchFlavors(term: string, category?: FlavorCategory): readonly PizzaFlavor[] {
    return this.catalog.searchFlavors(term, category);
  }

  getFeaturedFlavors(): readonly PizzaFlavor[] {
    return FEATURED_FLAVOR_IDS.map((id) => this.catalog.getFlavor(id)).filter((f): f is PizzaFlavor => !!f);
  }

  getFlavor(id: string): PizzaFlavor | undefined {
    return this.catalog.getFlavor(id);
  }

  getCrust(id: string): Crust | undefined {
    return this.catalog.getCrust(id);
  }

  getSize(id: PizzaSizeId): PizzaSize | undefined {
    return this.catalog.getSize(id);
  }

  getCrusts(): readonly Crust[] {
    return this.catalog.getCrusts();
  }

  getDrinks(): readonly Drink[] {
    return this.catalog.getDrinks();
  }

  /** `false` = item esgotado hoje (lista em data/availability.ts). */
  isAvailable(id: string): boolean {
    return this.catalog.isAvailable(id);
  }

  /** Valores só para exibir (nunca entram em total, carrinho ou mensagem). `null` = a loja ainda não informou. */
  getPizzaPrices(size: PizzaSizeId): PizzaPrices {
    return this.prices.pizzaPrices(size);
  }

  getCrustPrice(crustId: string, size: PizzaSizeId): string | null {
    return this.prices.crustPrice(crustId, size);
  }

  getCrustPriceRange(crustId: string): string | null {
    return this.prices.crustPriceRange(crustId);
  }

  getDrinkPrice(drinkId: string): string | null {
    return this.prices.drinkPrice(drinkId);
  }
}
