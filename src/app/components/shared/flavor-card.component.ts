import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PizzaFlavor } from '../../interfaces/pizza-menu.interface';

const CATEGORY_LABEL: Record<PizzaFlavor['category'], string> = {
  tradicional: 'Tradicional',
  especial: 'Especial',
  doce: 'Doce',
};

/**
 * Cartão de sabor: foto quando existe; caso contrário um placeholder por categoria (sem imagem quebrada).
 * `compact` é a versão horizontal usada na lista do cardápio. A proporção é fixa (sem salto de layout).
 */
@Component({
  selector: 'app-flavor-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (compact) {
      <article class="card card-hover flex h-full gap-4 p-3">
        <div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-700 sm:h-24 sm:w-24">
          <app-flavor-image [flavor]="flavor" [width]="96" [height]="96" [iconSize]="26" [small]="true"></app-flavor-image>
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
        <div class="relative aspect-[16/10] overflow-hidden bg-ink-700 sm:aspect-[4/3]">
          <app-flavor-image
            [flavor]="flavor"
            [iconSize]="40"
            imgClass="transition-[opacity,transform] duration-[600ms] ease-soft group-hover:scale-[1.04]"
          ></app-flavor-image>
          <span class="badge absolute left-3 top-3 bg-ink-900/85">{{ categoryLabel }}</span>
        </div>
        <div class="flex flex-1 flex-col gap-1.5 p-4 sm:gap-2 sm:p-5">
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
