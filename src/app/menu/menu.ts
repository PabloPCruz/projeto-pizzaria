import { Component } from '@angular/core';
import { ALL_FLAVORS } from '../../../mocks/mock-flavors/all-flavors.mock';
import { trigger, transition, style, animate } from '@angular/animations';
import { TRADICIONAIS } from 'mocks/tradicional-flavors.mock';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.html',
  styleUrl: './menu.css',
  animations: [
    trigger('routeFadeAnimation', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class Menu {
  public sabores = TRADICIONAIS;

  constructor(){
  }
  
}
