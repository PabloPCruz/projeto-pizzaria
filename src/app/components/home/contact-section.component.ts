import { ChangeDetectionStrategy, Component } from '@angular/core';
import { STORE_INFO } from '../../data/store-info';
import { StoreFacadeService } from '../../facade/store.facade.service';

@Component({
  selector: 'app-contact-section',
  templateUrl: './contact-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSectionComponent {
  readonly store = STORE_INFO;
  readonly hoursText = this.storeFacade.hoursText;
  readonly closedDaysText = this.storeFacade.closedDaysText;
  readonly phoneUrl = this.storeFacade.phoneUrl;
  readonly whatsappUrl = this.storeFacade.whatsappUrl;

  constructor(private storeFacade: StoreFacadeService) {}
}
