import { Component } from '@angular/core';
import { OrderFacadeService } from '../../facade/order.facade.service';

@Component({
  selector: 'app-extras-step',
  templateUrl: './extras-step.component.html',
})
export class ExtrasStepComponent {
  readonly view$ = this.order.view$;

  constructor(private order: OrderFacadeService) {}

  setNotes(value: string): void {
    this.order.setNotes(value);
  }
}
