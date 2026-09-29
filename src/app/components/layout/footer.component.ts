import { ChangeDetectionStrategy, Component } from '@angular/core';
import { STORE_INFO } from '../../data/store-info';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly store = STORE_INFO;
  readonly year = new Date().getFullYear();
  readonly whatsappUrl = `https://wa.me/${STORE_INFO.whatsappNumber}`;
  readonly phoneUrl = `tel:+55${STORE_INFO.phoneDisplay.replace(/\D/g, '')}`;
}
