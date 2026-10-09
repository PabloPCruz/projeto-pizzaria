import { Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { OrderFacadeService } from '../../facade/order.facade.service';
import { PizzaSizeId } from '../../interfaces/pizza-menu.interface';

@Component({
  selector: 'app-crust-step',
  template: `
    @if (view$ | async; as view) {
      <div role="radiogroup" aria-labelledby="step-title" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="choice" for="crust-none">
          <input
            type="radio"
            name="crust"
            class="peer"
            id="crust-none"
            [checked]="view.draft.crustId === null"
            (change)="order.selectCrust(null)"
          />
          <ng-container *ngTemplateOutlet="dot"></ng-container>
          <span class="block min-w-0 flex-1 font-semibold">Sem borda recheada</span>
        </label>
        @for (crust of crusts; track crust.id) {
          <label class="choice" [attr.for]="'crust-' + crust.id">
            <input
              type="radio"
              name="crust"
              class="peer"
              [id]="'crust-' + crust.id"
              [checked]="view.draft.crustId === crust.id"
              [disabled]="isUnavailable(crust.id) && view.draft.crustId !== crust.id"
              (change)="order.selectCrust(crust.id)"
            />
            <ng-container *ngTemplateOutlet="dot"></ng-container>
            <span class="block min-w-0 flex-1 font-semibold">
              {{ crust.label }}
              @if (isUnavailable(crust.id)) {
                <span class="mt-1 block w-fit rounded-full border border-warn/50 bg-warn/10 px-2.5 py-0.5 text-xs font-medium text-warn">Indisponível hoje</span>
              }
            </span>
            <span class="shrink-0 whitespace-nowrap text-sm">
              <app-price [value]="crustPrice(crust.id, view.draft.size)" [quiet]="true"></app-price>
            </span>
          </label>
        }
      </div>
    }
    <ng-template #dot>
      <span class="choice-radio" aria-hidden="true"></span>
    </ng-template>
  `,
})
export class CrustStepComponent {
  readonly crusts = this.menu.getCrusts();
  readonly view$ = this.order.view$;

  constructor(
    private menu: MenuFacadeService,
    readonly order: OrderFacadeService
  ) {}

  /** Esgotada hoje (data/availability.ts). */
  isUnavailable(crustId: string): boolean {
    return !this.menu.isAvailable(crustId);
  }

  /** Valor só informativo da borda no tamanho escolhido (a tela só chega aqui com tamanho). */
  crustPrice(crustId: string, size: PizzaSizeId | null): string | null {
    return size ? this.menu.getCrustPrice(crustId, size) : null;
  }
}
