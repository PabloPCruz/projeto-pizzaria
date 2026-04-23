import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CartService, CartItem } from '../services/cart.service';
import { CartCalculationService } from '../services/cart-calculation.service';
import { FormatService } from '../services/format.service';

/**
 * Facade para operações de carrinho
 * Coordena CartService, CartCalculationService e FormatService
 * Fornece uma interface simplificada para componentes
 */
@Injectable({
  providedIn: 'root'
})
export class CartFacadeService {

  constructor(
    private cartService: CartService,
    private calculationService: CartCalculationService,
    private formatService: FormatService
  ) {}

  /**
   * Obtém observable dos itens do carrinho
   */
  getCartItems$(): Observable<CartItem[]> {
    return this.cartService.cartItems$;
  }

  /**
   * Adiciona um item ao carrinho
   */
  addToCart(item: CartItem): void {
    this.cartService.addToCart(item);
  }

  /**
   * Remove um item do carrinho
   */
  removeFromCart(id: string): void {
    this.cartService.removeFromCart(id);
  }

  /**
   * Atualiza a quantidade de um item
   */
  updateQuantity(id: string, quantidade: number): void {
    if (quantidade > 0) {
      this.cartService.updateQuantity(id, quantidade);
    }
  }

  /**
   * Calcula subtotal do carrinho
   */
  calcularSubtotal(items: CartItem[]): number {
    return this.calculationService.calcularSubtotal(items);
  }

  /**
   * Calcula total do carrinho
   */
  calcularTotal(subtotal: number): number {
    return this.calculationService.calcularTotal(subtotal);
  }

  /**
   * Obtém taxa de entrega
   */
  getTaxaEntrega(): number {
    return this.calculationService.getTaxaEntrega();
  }

  /**
   * Obtém desconto aplicado
   */
  getDesconto(): number {
    return this.calculationService.getDesconto();
  }

  /**
   * Aplica cupom de desconto
   */
  aplicarCupom(cupom: string): number {
    return this.calculationService.aplicarCupom(cupom);
  }

  /**
   * Limpa o carrinho
   */
  clearCart(): void {
    this.cartService.clearCart();
  }

  /**
   * Finaliza o pedido
   * TODO: Implementar integração com API
   */
  finalizarPedido(): Promise<any> {
    // Implementação futura
    const items = this.cartService.getCartItems();
    const subtotal = this.calculationService.calcularSubtotal(items);
    const total = this.calculationService.calcularTotal(subtotal);
    
    return Promise.resolve({
      itens: items,
      subtotal,
      total,
      timestamp: new Date()
    });
  }

  /**
   * Obtém total de quantidade de itens
   */
  getCartItemsCount(): number {
    return this.cartService.getCartItemsCount();
  }

  /**
   * Formata sabores para exibição
   */
  formatarSabores(sabores: string[]): string {
    return this.formatService.formatarSabores(sabores);
  }

  /**
   * Formata borda para exibição
   */
  formatarBorda(borda: any): string {
    return this.formatService.formatarBorda(borda);
  }

  /**
   * Formata bebidas para exibição
   */
  formatarBebidas(bebidas: any[]): string {
    return this.formatService.formatarBebidas(bebidas);
  }

  /**
   * Formata tamanho da pizza para exibição
   */
  formatarTamanho(tamanho: string): string {
    return this.formatService.formatarTamanho(tamanho);
  }
}
