import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { CartItemsComponent } from './cart-items.component';
import { CartPageComponent } from './cart-page.component';
import { CheckoutFormComponent } from './checkout-form.component';
import { OrderSentComponent } from './order-sent.component';
import { OrderSummaryComponent } from './order-summary.component';

@NgModule({
  declarations: [CartPageComponent, CartItemsComponent, CheckoutFormComponent, OrderSummaryComponent, OrderSentComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: CartPageComponent }])],
})
export class CartModule {}
