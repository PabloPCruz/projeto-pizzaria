import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';

@Component({
  selector: 'app-menu-sizes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-12 sm:mt-16" aria-labelledby="tamanhos-title">
      <h2 id="tamanhos-title" class="title-sub">Tamanhos</h2>
      <p class="mt-2 text-sm leading-relaxed text-cream-muted">
        Quanto maior a pizza, mais sabores você pode escolher. Os valores são informativos: o total do pedido e a taxa
        de entrega são confirmados pela loja no WhatsApp.
      </p>
      <div class="card mt-5 overflow-x-auto">
        <table class="w-full text-left">
          <caption class="sr-only">Tamanhos de pizza com fatias, máximo de sabores e valor para sabores tradicionais e especiais</caption>
          <thead class="bg-ink-700 text-[0.8125rem] text-gold sm:uppercase sm:tracking-[0.14em]">
            <tr>
              <th scope="col" class="px-3 py-3 sm:px-6">Tamanho</th>
              <th scope="col" class="px-2 py-3 text-right sm:px-6">Tradicionais</th>
              <th scope="col" class="px-2 py-3 text-right sm:px-6">Especiais</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track row.size.id) {
              <tr class="border-t border-ink-500/50">
                <th scope="row" class="px-3 py-4 font-normal sm:px-6">
                  <span class="block font-display text-lg font-semibold">{{ row.size.label }}</span>
                  <span class="mt-0.5 block text-sm text-cream-muted">
                    {{ row.size.slices }} fatias · até {{ row.size.maxFlavors }} {{ row.size.maxFlavors === 1 ? 'sabor' : 'sabores' }}
                  </span>
                </th>
                <td class="whitespace-nowrap px-2 py-4 text-right sm:px-6"><app-price [value]="row.prices.tradicional" [quiet]="true"></app-price></td>
                <td class="whitespace-nowrap px-2 py-4 text-right sm:px-6"><app-price [value]="row.prices.especial" [quiet]="true"></app-price></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-price-rule-notice class="mt-4 block"></app-price-rule-notice>
      <p class="mt-2 text-sm leading-snug text-cream-muted">Os sabores doces têm o mesmo valor dos tradicionais.</p>
    </section>
  `,
})
export class MenuSizesComponent {
  readonly rows = this.menu.getSizes().map((size) => ({ size, prices: this.menu.getPizzaPrices(size.id) }));
  constructor(private menu: MenuFacadeService) {}
}
