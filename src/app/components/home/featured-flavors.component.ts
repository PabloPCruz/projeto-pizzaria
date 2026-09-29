import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';

/**
 * No celular os destaques viram uma fileira que desliza de lado (cada cartão encaixa ao rolar), o que
 * evita uma página enorme; a partir de `sm` voltam a ser grade.
 */
@Component({
  selector: 'app-featured-flavors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul
      class="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 pt-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-0 lg:grid-cols-3"
      tabindex="0"
      aria-label="Sabores em destaque"
    >
      @for (flavor of flavors; track flavor.id; let i = $index) {
        <li class="w-[78%] max-w-[20rem] shrink-0 snap-start sm:w-auto sm:max-w-none" [appReveal]="(i % 3) * 80">
          <app-flavor-card [flavor]="flavor" class="block h-full"></app-flavor-card>
        </li>
      }
    </ul>
    <p class="mt-8 text-center sm:mt-10">
      <a routerLink="/cardapio" class="btn-ghost px-8">Ver cardápio completo</a>
    </p>
  `,
})
export class FeaturedFlavorsComponent {
  readonly flavors = this.menu.getFeaturedFlavors();
  constructor(private menu: MenuFacadeService) {}
}
