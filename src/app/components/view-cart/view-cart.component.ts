import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../services/cart.service';
import { CartFacadeService } from '../../facade/cart.facade.service';
import { Borda } from '../../interfaces/border.interface';

@Component({
  selector: 'view-cart',
  templateUrl: './view-cart.component.html',
  styleUrl: './view-cart.component.scss'
})
export class ViewCartComponent implements OnInit {
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  taxaEntrega: number = 0;
  desconto: number = 0;
  total: number = 0;

  constructor(private cartFacade: CartFacadeService) {}

  ngOnInit(): void {
    this.cartFacade.getCartItems$().subscribe((items) => {
      this.cartItems = items;
      this.calcularTotais();
    });
    this.taxaEntrega = this.cartFacade.getTaxaEntrega();
    this.desconto = this.cartFacade.getDesconto();
  }

  calcularTotais(): void {
    this.subtotal = this.cartFacade.calcularSubtotal(this.cartItems);
    this.total = this.cartFacade.calcularTotal(this.subtotal);
  }

  removerItem(id: string): void {
    this.cartFacade.removeFromCart(id);
  }

  atualizarQuantidade(id: string, quantidade: number): void {
    this.cartFacade.updateQuantity(id, quantidade);
  }

  finalizarPedido(): void {
    this.cartFacade.finalizarPedido().then(() => {
      alert('Pedido finalizado com sucesso!');
      this.cartFacade.clearCart();
    });
  }

  getSaboresFormatados(sabores: string[]): string {
    return this.cartFacade.formatarSabores(sabores);
  }

  getBoridasFormatadas(borda: Borda | string | undefined): string {
    return this.cartFacade.formatarBorda(borda);
  }

  getBebidasFormatadas(bebidas: any[] | undefined): string {
    if (!bebidas) return 'Nenhuma bebida';
    return this.cartFacade.formatarBebidas(bebidas);
  }
}