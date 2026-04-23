import { Component } from '@angular/core';
import { MenuFacadeService } from '../../../facade/menu.facade.service';

@Component({
  standalone: false,
  selector: 'best-flavors-cards',
  templateUrl: './best-flavors-cards.html',
  styleUrls: ['./best-flavors-cards.css']
})
export class BestFlavorsCards {
  public sabores;

  constructor(private menuFacade: MenuFacadeService) {
    this.sabores = this.menuFacade.getSpecialFlavors();
  }
}
