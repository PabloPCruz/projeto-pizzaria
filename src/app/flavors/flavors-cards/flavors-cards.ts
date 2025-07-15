import { Component } from '@angular/core';
import { FLAVORS } from './flavors.mock';

@Component({
  standalone: false,
  selector: 'app-flavors-cards',
  templateUrl: './flavors-cards.html',
  styleUrls: ['./flavors-cards.css']
})
export class FlavorsCards {
  public sabores = FLAVORS;
}
