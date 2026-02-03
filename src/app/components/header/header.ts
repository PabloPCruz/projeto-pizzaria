import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { OrderComponent } from '../order/order';
import { MatDialog } from '@angular/material/dialog';
import { CartFacadeService } from '../../facade/cart.facade.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.css',
  animations: [
    trigger('routeFadeAnimation', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class Header implements OnInit {
  cartItemsCount$: Observable<number>;

  constructor(
    private dialogBox: MatDialog,
    private cartFacade: CartFacadeService
  ) {
    this.cartItemsCount$ = this.cartFacade.getCartItems$().pipe(
      map(items => this.cartFacade.getCartItemsCount())
    );
  }

  ngOnInit(): void {
    // Observable é inicializado no constructor
  }

  openPedidoDialog() {
    this.dialogBox.open(OrderComponent, {
      width: '600px',
    });
  }
}
