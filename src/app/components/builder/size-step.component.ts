import { Component, EventEmitter, Output } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { OrderFacadeService } from '../../facade/order.facade.service';
import { PizzaSizeId } from '../../interfaces/pizza-menu.interface';

@Component({
  selector: 'app-size-step',
  template: `
    @if (view$ | async; as view) {
      <div role="radiogroup" aria-labelledby="step-title" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        @for (size of sizes; track size.id) {
          <label class="choice" [attr.for]="'size-' + size.id">
            <input
              type="radio"
              name="size"
              class="peer"
              [id]="'size-' + size.id"
              [value]="size.id"
              [checked]="view.draft.size === size.id"
              (change)="select(size.id)"
            />
            <span
              class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-300 transition peer-checked:border-gold peer-checked:bg-gold"
              aria-hidden="true"
            >
              <span class="h-2 w-2 rounded-full bg-ink-900"></span>
            </span>
            <span class="block">
              <span class="block font-display text-xl font-semibold">{{ size.label }}</span>
              <span class="mt-0.5 block text-sm text-cream-muted">
                {{ size.slices }} fatias · até {{ size.maxFlavors }} {{ size.maxFlavors === 1 ? 'sabor' : 'sabores' }}
              </span>
            </span>
          </label>
        }
      </div>
    }
  `,
})
export class SizeStepComponent {
  readonly sizes = this.menu.getSizes();
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
