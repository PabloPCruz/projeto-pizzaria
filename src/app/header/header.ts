import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { OrderComponent } from '../order/order';
import { MatDialog } from '@angular/material/dialog';


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
export class Header {
  constructor(private dialogBox: MatDialog) { }

  openPedidoDialog() {
    this.dialogBox.open(OrderComponent, {
      width: '600px',
    });
  }
}
