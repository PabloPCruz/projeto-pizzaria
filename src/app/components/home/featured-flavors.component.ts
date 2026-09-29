import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';

@Component({
  selector: 'app-featured-flavors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      @for (flavor of flavors; track flavor.id) {
        <li><app-flavor-card [flavor]="flavor"></app-flavor-card></li>
      }
    </ul>
    <p class="mt-10 text-center">
      <a routerLink="/cardapio" class="btn-ghost px-8">Ver cardápio completo</a>
    </p>
  `,
})
export class FeaturedFlavorsComponent {
  readonly flavors = this.menu.getFeaturedFlavors();
  constructor(private menu: MenuFacadeService) {}
}
