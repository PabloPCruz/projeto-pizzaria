import { Component, ViewChild } from '@angular/core';
import { CartFacadeService, CartView } from '../../facade/cart.facade.service';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { CheckoutFacadeService } from '../../facade/checkout.facade.service';
import { StoreFacadeService } from '../../facade/store.facade.service';
import { CheckoutFormComponent, OrderSent } from './checkout-form.component';

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent {
  readonly view$ = this.cart.view$;
  readonly store$ = this.storeFacade.view$;
  readonly busy$ = this.checkout.busy$;
  readonly lastOrder$ = this.cart.lastOrder$;
  @ViewChild(CheckoutFormComponent) checkoutForm?: CheckoutFormComponent;
  /** Preenchido depois que o link do WhatsApp foi gerado. */
  sent: OrderSent | null = null;

  constructor(
    private cart: CartFacadeService,
    private menu: MenuFacadeService,
    private storeFacade: StoreFacadeService,
    private checkout: CheckoutFacadeService
  ) {}

  /** Só oferece "adicionar bebida" enquanto sobrar alguma bebida que ainda não está no pedido. */
  hasDrinksToAdd(view: CartView): boolean {
    return view.drinks.length < this.menu.getDrinks().length;
  }

  /** Devolve os itens do último pedido ao carrinho e leva o foco para a lista, onde eles apareceram. */
  repeatLastOrder(): void {
    this.cart.repeatLastOrder();
    setTimeout(() => document.getElementById('itens-title')?.focus());
  }

  onSent(sent: OrderSent): void {
    this.sent = sent;
    window.scrollTo({ top: 0 });
  }

  /**
   * Botão fixo do celular: faz o mesmo que "Finalizar" do resumo. Tudo certo = abre o WhatsApp; algo faltando = mostra os
   * erros e leva ao primeiro campo; loja fechada = mostra "Seu pedido não foi enviado" com o motivo. Nunca fica mudo.
   */
  finalize(): void {
    if (this.checkoutForm) {
      this.checkoutForm.submit();
      return;
    }
    // Sem o formulário na tela (não deveria acontecer): ao menos leva o cliente até a área de dados.
    const heading = document.getElementById('checkout-title');
    heading?.scrollIntoView({ block: 'start' });
    heading?.focus({ preventScroll: true });
  }

  backToEdit(): void {
    this.sent = null;
  }
}
