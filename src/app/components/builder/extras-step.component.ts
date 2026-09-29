import { Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { BuilderView, OrderFacadeService } from '../../facade/order.facade.service';

@Component({
  selector: 'app-extras-step',
  templateUrl: './extras-step.component.html',
})
export class ExtrasStepComponent {
  readonly view$ = this.order.view$;

  constructor(
    private menu: MenuFacadeService,
    private order: OrderFacadeService
  ) {}

  setNotes(value: string): void {
    this.order.setNotes(value);
  }

  /** Sabores com "opção" no cardápio impresso (ex.: catupiry ou cebola): o cliente detalha nas observações. */
  hints(view: BuilderView): { name: string; hint: string }[] {
    return view.draft.flavorIds
      .map((id) => this.menu.getFlavor(id))
      .filter((f): f is NonNullable<typeof f> => !!f?.optionHint)
      .map((f) => ({ name: f.name, hint: f.optionHint as string }));
  }
}
