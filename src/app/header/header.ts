import { Component } from '@angular/core';
import { } from '@angular/material/core'
import { trigger, transition, style, animate } from '@angular/animations';


@Component({
  standalone: false,
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

}
