import { Inject, Injectable } from '@angular/core';
import { UNAVAILABLE_ITEMS } from '../data/availability';
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
  constructor(@Inject(UNAVAILABLE_ITEMS) private unavailable: readonly string[]) {}

  /** `false` = item esgotado hoje (lista em data/availability.ts). Itens fora do cardápio contam como disponíveis aqui. */
  isAvailable(id: string): boolean {
    return !this.unavailable.includes(id);
  }

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

  /** Nome do sabor com a opção escolhida: "Calabresa (com catupiry)". "Sem opção" e sabor sem opção ficam só com o nome. */
  flavorLabel(flavorId: string, optionId?: string): string {
    const flavor = this.getFlavor(flavorId);
    const option = optionId ? flavor?.options?.find((o) => o.id === optionId) : undefined;
    const name = flavor?.name ?? flavorId;
    return option && !option.plain ? `${name} (${option.label.toLowerCase()})` : name;
  }

  /** Só guarda opção que existe, de sabor que está na pizza. Qualquer valor estranho (localStorage) vira `{}`. */
  sanitizeFlavorOptions(raw: unknown, flavorIds: readonly string[]): Record<string, string> {
    const result: Record<string, string> = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
    const data = raw as Record<string, unknown>;
    for (const id of flavorIds) {
      const chosen = data[id];
      if (typeof chosen === 'string' && this.getFlavor(id)?.options?.some((o) => o.id === chosen)) result[id] = chosen;
    }
    return result;
  }

  /** Nomes dos sabores que têm opção e ainda não tiveram uma escolhida. */
  missingOptions(flavorIds: readonly string[], options: Readonly<Record<string, string>>): string[] {
    return flavorIds
      .filter((id) => {
        const flavor = this.getFlavor(id);
        return !!flavor?.options?.length && !flavor.options.some((o) => o.id === options[id]);
      })
      .map((id) => this.getFlavor(id)?.name ?? id);
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
