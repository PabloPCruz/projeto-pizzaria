import { Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { OrderFacadeService } from '../../facade/order.facade.service';

@Component({
  selector: 'app-dough-step',
  template: `
    @if (view$ | async; as view) {
      <div role="radiogroup" aria-labelledby="step-title" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="choice" for="dough-none">
          <input
            type="radio"
            name="dough"
            class="peer"
            id="dough-none"
            [checked]="view.draft.doughId === null"
            (change)="order.selectDough(null)"
          />
          <ng-container *ngTemplateOutlet="dot"></ng-container>
          <span class="block min-w-0 flex-1 font-semibold">Sem preferência de massa</span>
        </label>
        @for (dough of doughs; track dough.id) {
          <label class="choice" [attr.for]="'dough-' + dough.id">
            <input
              type="radio"
              name="dough"
              class="peer"
              [id]="'dough-' + dough.id"
              [checked]="view.draft.doughId === dough.id"
              (change)="order.selectDough(dough.id)"
            />
            <ng-container *ngTemplateOutlet="dot"></ng-container>
            <span class="block min-w-0 flex-1 font-semibold">{{ dough.label }}</span>
          </label>
        }
      </div>
    }
    <ng-template #dot>
      <span class="choice-radio" aria-hidden="true"></span>
    </ng-template>
  `,
})
export class DoughStepComponent {
  readonly doughs = this.menu.getDoughs();
  readonly view$ = this.order.view$;

  constructor(
    private menu: MenuFacadeService,
    readonly order: OrderFacadeService
  ) {}
}
