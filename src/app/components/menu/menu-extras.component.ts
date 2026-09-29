import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';

@Component({
  selector: 'app-menu-extras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-2">
      <section aria-labelledby="bordas-title">
        <h2 id="bordas-title" class="text-2xl font-semibold sm:text-3xl">Bordas recheadas</h2>
        <ul class="card mt-5 divide-y divide-ink-500/50">
          @for (crust of crusts; track crust.id) {
            <li class="flex items-center gap-3 px-5 py-3.5">
              <lucide-icon name="sparkles" [size]="16" class="shrink-0 text-gold"></lucide-icon>
              <span>{{ crust.label }}</span>
            </li>
          }
        </ul>
      </section>

      <section aria-labelledby="bebidas-title">
        <h2 id="bebidas-title" class="text-2xl font-semibold sm:text-3xl">Bebidas</h2>
        <ul class="card mt-5 divide-y divide-ink-500/50">
          @for (drink of drinks; track drink.id) {
            <li class="flex items-center gap-3 px-5 py-3.5">
              <lucide-icon [name]="drink.group === 'cerveja' ? 'wine' : 'cup-soda'" [size]="16" class="shrink-0 text-gold"></lucide-icon>
              <span>{{ drink.label }}</span>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class MenuExtrasComponent {
  readonly crusts = this.menu.getCrusts();
  readonly drinks = this.menu.getDrinks();
  constructor(private menu: MenuFacadeService) {}
}
