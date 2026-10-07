import { ChangeDetectionStrategy, Component } from '@angular/core';
import { STORE_INFO } from '../../data/store-info';
import { ClockService } from '../../services/clock.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  constructor(private clock: ClockService) {}

  readonly store = STORE_INFO;
  readonly year = new Date(this.clock.now()).getFullYear();
  readonly whatsappUrl = `https://wa.me/${STORE_INFO.whatsappNumber}`;
  readonly phoneUrl = `tel:+55${STORE_INFO.phoneDisplay.replace(/\D/g, '')}`;
}
