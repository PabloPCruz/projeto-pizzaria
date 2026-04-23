import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Components
import { OrderComponent } from './order/order';
import { AddressFormComponent } from './address-form/address-form';
import { Header } from './header/header';
import { BestFlavorsCards } from './flavors/best-flavors-cards/best-flavors-cards';
import { Flavors } from './flavors/flavors';
import { Menu } from './menu/menu';
import { ViewCartComponent } from './view-cart/view-cart.component';

// Services
import { OrderService } from '../services/order.service';

@NgModule({
  declarations: [
    OrderComponent,
    AddressFormComponent,
    Header,
    BestFlavorsCards,
    Flavors,
    Menu,
    ViewCartComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  providers: [OrderService],
  exports: [
    OrderComponent,
    AddressFormComponent,
    Header,
    BestFlavorsCards,
    Flavors,
    Menu,
    ViewCartComponent,
  ],
})
export class OrderGeneralModule {}
