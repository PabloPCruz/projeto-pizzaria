import { Component, EventEmitter, Output } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { OrderFacadeService } from '../../facade/order.facade.service';
import { PizzaSizeId } from '../../interfaces/pizza-menu.interface';

@Component({
  selector: 'app-size-step',
  template: `
    @if (view$ | async; as view) {
      <div role="radiogroup" aria-labelledby="step-title" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        @for (size of sizes; track size.size.id) {
          <label class="choice" [attr.for]="'size-' + size.size.id">
            <input
              type="radio"
              name="size"
              class="peer"
              [id]="'size-' + size.size.id"
              [value]="size.size.id"
              [checked]="view.draft.size === size.size.id"
              (change)="select(size.size.id)"
            />
            <span class="choice-radio mt-1" aria-hidden="true"></span>
            <span class="block">
              <span class="block font-display text-xl font-semibold">{{ size.size.label }}</span>
              <span class="mt-0.5 block text-sm text-cream-muted">
                {{ size.size.slices }} fatias · até {{ size.size.maxFlavors }} {{ size.size.maxFlavors === 1 ? 'sabor' : 'sabores' }}
              </span>
              <span class="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-cream-muted">
                <span>Tradicional <app-price [value]="size.prices.tradicional" [quiet]="true"></app-price></span>
                <span>Especial <app-price [value]="size.prices.especial" [quiet]="true"></app-price></span>
              </span>
            </span>
          </label>
        }
      </div>
      <app-price-rule-notice class="mt-4 block"></app-price-rule-notice>
    }
  `,
})
export class SizeStepComponent {
  readonly sizes = this.menu.getSizes().map((size) => ({ size, prices: this.menu.getPizzaPrices(size.id) }));
  readonly view$ = this.order.view$;

  /** `removed` = quantos sabores saíram por não caberem no tamanho escolhido (0 = nenhum). */
  @Output() flavorsRemoved = new EventEmitter<{ removed: number; label: string; max: number }>();

  constructor(
    private menu: MenuFacadeService,
    private order: OrderFacadeService
  ) {}

  select(id: PizzaSizeId): void {
    const removed = this.order.selectSize(id);
    const size = this.menu.getSize(id);
    this.flavorsRemoved.emit({ removed, label: size?.label ?? '', max: size?.maxFlavors ?? 0 });
  }
}
