import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
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
          @if (unavailable) {
            <p class="mt-1 inline-block rounded-full border border-warn/50 bg-warn/10 px-2.5 py-0.5 text-xs font-medium text-warn">Indisponível hoje</p>
          }
          <p class="mt-1 text-sm leading-relaxed text-cream-muted">
            {{ flavor.ingredients || 'Ingredientes a confirmar com a loja.' }}
          </p>
          @if (optionsText) {
            <p class="mt-1 text-xs font-medium text-gold-light">{{ optionsText }}</p>
          }
          @if (flavor.illustrative) {
            <p class="illustrative-note mt-1 text-xs text-cream-dim">Foto ilustrativa</p>
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
          @if (flavor.illustrative) {
            <span class="illustrative-note absolute bottom-2 left-2 rounded-full bg-ink-900/85 px-2.5 py-1 text-xs text-cream-muted">
              Foto ilustrativa
            </span>
          }
        </div>
        <div class="flex flex-1 flex-col gap-1.5 p-4 sm:gap-2 sm:p-5">
          <h3 class="text-xl font-semibold leading-snug">{{ flavor.name }}</h3>
          @if (unavailable) {
            <p class="inline-block self-start rounded-full border border-warn/50 bg-warn/10 px-2.5 py-0.5 text-xs font-medium text-warn">Indisponível hoje</p>
          }
          <p class="text-sm leading-relaxed text-cream-muted">
            {{ flavor.ingredients || 'Ingredientes a confirmar com a loja.' }}
          </p>
          @if (optionsText) {
            <p class="mt-auto pt-1 text-xs font-medium text-gold-light">{{ optionsText }}</p>
          }
        </div>
      </article>
    }
  `,
})
export class FlavorCardComponent {
  @Input({ required: true }) flavor!: PizzaFlavor;
  @Input() compact = false;

  constructor(private menu: MenuFacadeService) {}

  /** Esgotado hoje (data/availability.ts). */
  get unavailable(): boolean {
    return !this.menu.isAvailable(this.flavor.id);
  }

  get optionsText(): string {
    return this.menu.optionsText(this.flavor);
  }

  get categoryLabel(): string {
    return CATEGORY_LABEL[this.flavor.category];
  }
}
