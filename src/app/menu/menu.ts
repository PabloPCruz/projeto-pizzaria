import { Component } from '@angular/core';
import { ALL_FLAVORS } from './all-flavors.mock';


@Component({
  standalone: false,
  selector: 'app-menu',
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {
  public sabores = ALL_FLAVORS;
}
