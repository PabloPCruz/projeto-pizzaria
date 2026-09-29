import { ChangeDetectionStrategy, Component } from '@angular/core';
import { STORE_INFO } from '../../data/store-info';

@Component({
  selector: 'app-contact-section',
  templateUrl: './contact-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSectionComponent {
  readonly store = STORE_INFO;
  readonly phoneUrl = `tel:+55${STORE_INFO.phoneDisplay.replace(/\D/g, '')}`;
  readonly whatsappUrl = `https://wa.me/${STORE_INFO.whatsappNumber}`;
}
