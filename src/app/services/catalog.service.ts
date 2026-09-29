import { Injectable } from '@angular/core';
import { CRUSTS, DRINKS, FLAVORS, PIZZA_SIZES } from '../data/menu.data';
import {
  Crust,
  Drink,
  FlavorCategory,
  PizzaFlavor,
  PizzaSize,
  PizzaSizeId,
} from '../interfaces/pizza-menu.interface';

/** Acesso somente leitura ao cardápio (tamanhos, sabores, bordas e bebidas). */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  getSizes(): readonly PizzaSize[] {
    return PIZZA_SIZES;
  }

  getSize(id: PizzaSizeId): PizzaSize | undefined {
    return PIZZA_SIZES.find((s) => s.id === id);
  }

  getFlavors(category?: FlavorCategory): readonly PizzaFlavor[] {
    return category ? FLAVORS.filter((f) => f.category === category) : FLAVORS;
  }

  getFlavor(id: string): PizzaFlavor | undefined {
    return FLAVORS.find((f) => f.id === id);
  }

  searchFlavors(term: string, category?: FlavorCategory): readonly PizzaFlavor[] {
    const normalized = this.normalize(term);
    const base = this.getFlavors(category);
    if (!normalized) return base;
    return base.filter(
      (f) => this.normalize(f.name).includes(normalized) || this.normalize(f.ingredients).includes(normalized)
    );
  }

  /** Aceita qualquer valor vindo de fora (localStorage) e devolve só ids de sabores que existem, sem repetição. */
  sanitizeFlavorIds(ids: unknown): string[] {
    if (!Array.isArray(ids)) return [];
    const known = ids.filter((id): id is string => typeof id === 'string' && !!this.getFlavor(id));
    return [...new Set(known)];
  }

  getCrusts(): readonly Crust[] {
    return CRUSTS;
  }

  getCrust(id: string): Crust | undefined {
    return CRUSTS.find((c) => c.id === id);
  }

  getDrinks(): readonly Drink[] {
    return DRINKS;
  }

  getDrink(id: string): Drink | undefined {
    return DRINKS.find((d) => d.id === id);
  }

  private normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }
}
