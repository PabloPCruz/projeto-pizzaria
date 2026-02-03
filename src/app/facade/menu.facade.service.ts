import { Injectable } from '@angular/core';
import { ALL_FLAVORS } from 'mocks/mock-flavors/all-flavors.mock';
import { TRADICIONAIS } from 'mocks/mock-flavors/tradicional-flavors.mock';
import { DOCES_TRADICIONAIS } from 'mocks/mock-flavors/doces-tradicional.mock';
import { DOCES_ESPECIAIS } from 'mocks/mock-flavors/doces-especiais.mock';
import { Flavor } from '../interfaces/flavor.interface';

/**
 * Facade para operações relacionadas a sabores e menu
 * Centraliza a lógica de carregamento de sabores de diferentes categorias
 */
@Injectable({
  providedIn: 'root'
})
export class MenuFacadeService {

  /**
   * Obtém todos os sabores disponíveis
   */
  getAllFlavors(): Flavor[] {
    return ALL_FLAVORS;
  }

  /**
   * Obtém sabores tradicionais
   */
  getTraditionalFlavors(): Flavor[] {
    return TRADICIONAIS;
  }

  /**
   * Obtém sabores especiais (best flavors)
   */
  getSpecialFlavors(): Flavor[] {
    return ALL_FLAVORS; // Usando ALL_FLAVORS como especiais (BEST_FLAVORS)
  }

  /**
   * Obtém doces tradicionais
   */
  getTraditionalSweets(): Flavor[] {
    return (DOCES_TRADICIONAIS || []) as Flavor[];
  }

  /**
   * Obtém doces especiais
   */
  getSpecialSweets(): Flavor[] {
    return (DOCES_ESPECIAIS || []) as Flavor[];
  }

  /**
   * Obtém um sabor específico por nome
   */
  getFavorByName(nome: string): Flavor | undefined {
    const allFlavors = this.getAllCombinedFlavors();
    return allFlavors.find(f => f.sabor === nome);
  }

  /**
   * Busca sabores por termo
   */
  searchFlavors(termo: string): Flavor[] {
    const allFlavors = this.getAllCombinedFlavors();
    const termoLower = termo.toLowerCase();
    return allFlavors.filter(f =>
      f.sabor.toLowerCase().includes(termoLower) ||
      f.ingredientes.toLowerCase().includes(termoLower)
    );
  }

  /**
   * Obtém todos os sabores combinados de todas as categorias
   */
  private getAllCombinedFlavors(): Flavor[] {
    return [
      ...ALL_FLAVORS,
      ...(TRADICIONAIS || []),
      ...(DOCES_TRADICIONAIS || []),
      ...(DOCES_ESPECIAIS || [])
    ] as Flavor[];
  }
}
