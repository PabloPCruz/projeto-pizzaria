import { Injectable } from '@angular/core';
import { CartItem } from './cart.service';

/**
 * Serviço para cálculos e operações do carrinho
 * Centraliza lógica de negócio relacionada ao carrinho
 */
@Injectable({
  providedIn: 'root'
})
export class CartCalculationService {
  
  private taxaEntrega = 0;
  private desconto = 0;

  /**
   * Calcula o subtotal dos itens
   * @param items - Array de itens do carrinho
   * @returns Subtotal
   */
  calcularSubtotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + (item.valor * item.quantidade), 0);
  }

  /**
   * Calcula o total incluindo taxa e desconto
   * @param subtotal - Subtotal do carrinho
   * @returns Total final
   */
  calcularTotal(subtotal: number): number {
    return subtotal + this.taxaEntrega - this.desconto;
  }

  /**
   * Obtém a taxa de entrega configurada
   */
  getTaxaEntrega(): number {
    return this.taxaEntrega;
  }

  /**
   * Define a taxa de entrega
   */
  setTaxaEntrega(taxa: number): void {
    this.taxaEntrega = taxa;
  }

  /**
   * Obtém o desconto configurado
   */
  getDesconto(): number {
    return this.desconto;
  }

  /**
   * Define o desconto
   */
  setDesconto(desconto: number): void {
    this.desconto = desconto;
  }

  /**
   * Aplica cupom de desconto
   * @param cupom - Código do cupom
   * @returns Valor do desconto (0 se cupom inválido)
   */
  aplicarCupom(cupom: string): number {
    // Exemplos de cupons - pode ser expandido
    const cupons: Record<string, number> = {
      'PRIMEIRACOMPRA': 10,
      'DESCONTO5': 5,
      'FRETE': this.taxaEntrega
    };
    
    const desconto = cupons[cupom.toUpperCase()] || 0;
    if (desconto > 0) {
      this.desconto = desconto;
    }
    return desconto;
  }

  /**
   * Calcula o valor total para um item específico
   * @param valor - Valor unitário
   * @param quantidade - Quantidade do item
   * @returns Valor total do item
   */
  calcularValorItem(valor: number, quantidade: number): number {
    return valor * quantidade;
  }
}
