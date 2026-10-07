import { Component } from '@angular/core';
import { CartFacadeService, CartView } from '../../facade/cart.facade.service';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { StoreFacadeService } from '../../facade/store.facade.service';
import { OrderSent } from './checkout-form.component';

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent {
  readonly view$ = this.cart.view$;
  readonly store$ = this.storeFacade.view$;
  /** Preenchido depois que o link do WhatsApp foi gerado. */
  sent: OrderSent | null = null;

  constructor(
    private cart: CartFacadeService,
    private menu: MenuFacadeService,
    private storeFacade: StoreFacadeService
  ) {}

  /** Só oferece "adicionar bebida" enquanto sobrar alguma bebida que ainda não está no pedido. */
  hasDrinksToAdd(view: CartView): boolean {
    return view.drinks.length < this.menu.getDrinks().length;
  }

  onSent(sent: OrderSent): void {
    this.sent = sent;
    window.scrollTo({ top: 0 });
  }

  /** Rola até o formulário de dados (respeita "reduzir movimento") e leva o foco para lá. */
  goToCheckout(): void {
    const heading = document.getElementById('checkout-title');
    if (!heading) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    heading.focus({ preventScroll: true });
  }

  backToEdit(): void {
    this.sent = null;
  }
}
