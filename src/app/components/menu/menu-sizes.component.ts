import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';

@Component({
  selector: 'app-menu-sizes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-12 sm:mt-16" aria-labelledby="tamanhos-title">
      <h2 id="tamanhos-title" class="title-sub">Tamanhos</h2>
      <p class="mt-2 text-sm leading-relaxed text-cream-muted">
        Quanto maior a pizza, mais sabores você pode escolher. Os valores são confirmados pelo WhatsApp.
      </p>
      <div class="card mt-5 overflow-hidden">
        <table class="w-full text-left">
          <caption class="sr-only">Tamanhos de pizza com número de fatias e máximo de sabores</caption>
          <thead class="bg-ink-700 text-[0.8125rem] uppercase tracking-[0.14em] text-gold">
            <tr>
              <th scope="col" class="px-4 py-3 sm:px-6">Tamanho</th>
              <th scope="col" class="px-4 py-3 sm:px-6">Fatias</th>
              <th scope="col" class="px-4 py-3 sm:px-6">Sabores (máx.)</th>
            </tr>
          </thead>
          <tbody>
            @for (size of sizes; track size.id) {
              <tr class="border-t border-ink-500/50">
                <th scope="row" class="px-4 py-4 font-display text-lg font-semibold sm:px-6">{{ size.label }}</th>
                <td class="px-4 py-4 text-cream-muted sm:px-6">{{ size.slices }} fatias</td>
                <td class="px-4 py-4 text-cream-muted sm:px-6">{{ size.maxFlavors }} {{ size.maxFlavors === 1 ? 'sabor' : 'sabores' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class MenuSizesComponent {
  readonly sizes = this.menu.getSizes();
  constructor(private menu: MenuFacadeService) {}
}
