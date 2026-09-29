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

/** Cardápio para as telas: tamanhos, sabores por categoria, busca, bordas e bebidas. */
@Injectable({ providedIn: 'root' })
export class MenuFacadeService {
  readonly categories: readonly { id: FlavorCategory; label: string }[] = (
    Object.keys(FLAVOR_CATEGORY_LABELS) as FlavorCategory[]
  ).map((id) => ({ id, label: FLAVOR_CATEGORY_LABELS[id] }));

  constructor(private catalog: CatalogService) {}

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
}
