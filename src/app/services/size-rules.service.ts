import { Injectable } from '@angular/core';
import { CatalogService } from './catalog.service';
import { PizzaSizeId } from '../interfaces/pizza-menu.interface';

export interface FlavorValidation {
  valid: boolean;
  error?: string;
}

/** Regra de negócio: cada tamanho aceita um número máximo de sabores. */
@Injectable({ providedIn: 'root' })
export class SizeRulesService {
  constructor(private catalog: CatalogService) {}

  maxFlavors(size: PizzaSizeId | null): number {
    return (size && this.catalog.getSize(size)?.maxFlavors) || 0;
  }

  canAddFlavor(size: PizzaSizeId | null, selectedIds: readonly string[]): boolean {
    return selectedIds.length < this.maxFlavors(size);
  }

  /** Mantém só os primeiros sabores que cabem no tamanho. */
  trimToSize(size: PizzaSizeId | null, selectedIds: readonly string[]): string[] {
    return selectedIds.slice(0, this.maxFlavors(size));
  }

  validate(size: PizzaSizeId | null, selectedIds: readonly string[]): FlavorValidation {
    if (!size) return { valid: false, error: 'Escolha o tamanho da pizza.' };
    if (selectedIds.length === 0) return { valid: false, error: 'Escolha pelo menos 1 sabor.' };
    if (selectedIds.some((id) => !this.catalog.getFlavor(id))) {
      return { valid: false, error: 'Há um sabor que não está mais no cardápio. Escolha novamente.' };
    }
    const max = this.maxFlavors(size);
    if (selectedIds.length > max) {
      return { valid: false, error: `Este tamanho aceita no máximo ${max} ${max === 1 ? 'sabor' : 'sabores'}.` };
    }
    return { valid: true };
  }
}
