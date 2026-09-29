import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PizzaFlavor } from '../../interfaces/pizza-menu.interface';

const CATEGORY_LABEL: Record<PizzaFlavor['category'], string> = {
  tradicional: 'Tradicional',
  especial: 'Especial',
  doce: 'Doce',
};

/**
 * Cartão de sabor: foto quando existe; caso contrário um placeholder elegante (sem imagem quebrada).
 * `compact` é a versão horizontal usada na lista do cardápio.
 */
@Component({
  selector: 'app-flavor-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (compact) {
      <article class="card flex h-full gap-4 p-3 transition duration-300 hover:border-gold/50">
        <div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-700 sm:h-24 sm:w-24">
          @if (flavor.image) {
            <img
              [src]="flavor.image"
              [alt]="'Pizza de ' + flavor.name"
              loading="lazy"
              decoding="async"
              width="96"
              height="96"
              class="h-full w-full object-cover"
            />
          } @else {
            <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-600 to-ink-800 text-gold/60" aria-hidden="true">
              <lucide-icon name="pizza" [size]="30" [strokeWidth]="1.25"></lucide-icon>
            </div>
          }
        </div>
        <div class="min-w-0 py-1">
          <h3 class="text-lg font-semibold leading-snug">{{ flavor.name }}</h3>
          <p class="mt-1 text-sm leading-relaxed text-cream-muted">
            {{ flavor.ingredients || 'Ingredientes a confirmar com a loja.' }}
          </p>
          @if (flavor.optionHint) {
            <p class="mt-1 text-xs font-medium text-gold-light">{{ flavor.optionHint }}</p>
          }
        </div>
      </article>
    } @else {
      <article class="group card card-hover flex h-full flex-col overflow-hidden">
        <div class="relative aspect-[4/3] overflow-hidden bg-ink-700">
          @if (flavor.image) {
            <img
              [src]="flavor.image"
              [alt]="'Pizza de ' + flavor.name"
              loading="lazy"
              decoding="async"
              width="640"
              height="480"
              class="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
            />
          } @else {
            <div
              class="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-600 via-ink-700 to-ink-800 text-gold/70"
              aria-hidden="true"
            >
              <lucide-icon name="pizza" [size]="44" [strokeWidth]="1.25"></lucide-icon>
              <span class="font-display text-xs italic tracking-widest text-cream-dim">foto em breve</span>
            </div>
          }
          <span class="badge absolute left-3 top-3 bg-ink-900/85">{{ categoryLabel }}</span>
        </div>
        <div class="flex flex-1 flex-col gap-2 p-5">
          <h3 class="text-xl font-semibold leading-snug">{{ flavor.name }}</h3>
          <p class="text-sm leading-relaxed text-cream-muted">
            {{ flavor.ingredients || 'Ingredientes a confirmar com a loja.' }}
          </p>
          @if (flavor.optionHint) {
            <p class="mt-auto pt-1 text-xs font-medium text-gold-light">{{ flavor.optionHint }}</p>
          }
        </div>
      </article>
    }
  `,
})
export class FlavorCardComponent {
  @Input({ required: true }) flavor!: PizzaFlavor;
  @Input() compact = false;

  get categoryLabel(): string {
    return CATEGORY_LABEL[this.flavor.category];
  }
}
