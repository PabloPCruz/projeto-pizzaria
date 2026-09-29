import { Component } from '@angular/core';
import { CartFacadeService } from '../../facade/cart.facade.service';
import { OrderSent } from './checkout-form.component';

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent {
  readonly view$ = this.cart.view$;
  /** Preenchido depois que o link do WhatsApp foi gerado. */
  sent: OrderSent | null = null;

  constructor(private cart: CartFacadeService) {}

  onSent(sent: OrderSent): void {
    this.sent = sent;
    window.scrollTo({ top: 0 });
  }

  backToEdit(): void {
    this.sent = null;
  }
}
