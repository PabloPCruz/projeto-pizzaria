import { Component } from '@angular/core';
import { ALL_FLAVORS } from './all-flavors.mock';
import { transform } from 'typescript';
import { trigger, transition, style, animate } from '@angular/animations';
import { from } from 'rxjs';


@Component({
  standalone: false,
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
  public sabores = ALL_FLAVORS;
}
