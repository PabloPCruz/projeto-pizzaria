import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';

@Component({
  selector: 'app-menu-extras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-12 grid grid-cols-1 gap-10 sm:mt-16 lg:grid-cols-2">
      <section aria-labelledby="bordas-title">
        <h2 id="bordas-title" class="title-sub">Bordas recheadas</h2>
        <ul class="card mt-5 divide-y divide-ink-500/50">
          @for (item of crusts; track item.crust.id) {
            <li class="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5">
              <lucide-icon name="sparkles" [size]="16" class="shrink-0 text-gold"></lucide-icon>
              <span class="min-w-0 flex-1 basis-[9rem]">{{ item.crust.label }}</span>
              <span class="ml-auto shrink-0 whitespace-nowrap text-sm"><app-price [value]="item.price" [quiet]="true"></app-price></span>
            </li>
          }
        </ul>
        <p class="mt-3 text-sm leading-snug text-cream-muted">O valor da borda varia conforme o tamanho da pizza. No montador aparece o valor do tamanho escolhido.</p>
      </section>

      <section aria-labelledby="bebidas-title">
        <h2 id="bebidas-title" class="title-sub">Bebidas</h2>
        <ul class="card mt-5 divide-y divide-ink-500/50">
          @for (item of drinks; track item.drink.id) {
            <li class="flex items-center gap-3 px-5 py-3.5">
              <lucide-icon [name]="item.drink.group === 'cerveja' ? 'wine' : 'cup-soda'" [size]="16" class="shrink-0 text-gold"></lucide-icon>
              <span class="min-w-0 flex-1">{{ item.drink.label }}</span>
              <span class="shrink-0 whitespace-nowrap text-sm"><app-price [value]="item.price" [quiet]="true"></app-price></span>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class MenuExtrasComponent {
  readonly crusts = this.menu.getCrusts().map((crust) => ({ crust, price: this.menu.getCrustPriceRange(crust.id) }));
  readonly drinks = this.menu.getDrinks().map((drink) => ({ drink, price: this.menu.getDrinkPrice(drink.id) }));
  constructor(private menu: MenuFacadeService) {}
}
