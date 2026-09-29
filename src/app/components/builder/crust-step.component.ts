import { Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { OrderFacadeService } from '../../facade/order.facade.service';

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
          <span class="block font-semibold">Sem borda recheada</span>
        </label>
        @for (crust of crusts; track crust.id) {
          <label class="choice" [attr.for]="'crust-' + crust.id">
            <input
              type="radio"
              name="crust"
              class="peer"
              [id]="'crust-' + crust.id"
              [checked]="view.draft.crustId === crust.id"
              (change)="order.selectCrust(crust.id)"
            />
            <ng-container *ngTemplateOutlet="dot"></ng-container>
            <span class="block font-semibold">{{ crust.label }}</span>
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
}
