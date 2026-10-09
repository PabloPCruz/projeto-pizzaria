import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector } from '@angular/core';
import { STORE_INFO } from '../../data/store-info';
import { StoreFacadeService } from '../../facade/store.facade.service';
import { ClockService } from '../../services/clock.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  constructor(
    private clock: ClockService,
    private storeFacade: StoreFacadeService,
    private injector: Injector,
    private cdr: ChangeDetectorRef
  ) {}

  readonly store = STORE_INFO;
  readonly year = new Date(this.clock.now()).getFullYear();
  readonly whatsappUrl = this.storeFacade.whatsappUrl;
  readonly phoneUrl = this.storeFacade.phoneUrl;

  /** Pedindo a confirmação antes de apagar. */
  confirmingErase = false;
  /** Os dados acabaram de ser apagados (avisa com role=status). */
  erased = false;

  askErase(): void {
    this.erased = false;
    this.confirmingErase = true;
    // O botão seguro ("Cancelar") recebe o foco: apagar exige uma escolha ativa.
    setTimeout(() => document.getElementById('erase-cancel')?.focus());
  }

  cancelErase(): void {
    this.confirmingErase = false;
    setTimeout(() => document.getElementById('erase-trigger')?.focus());
  }

  async erase(): Promise<void> {
    // Só carrega o código de apagar (checkout, carrinho…) quando o cliente confirma: não pesa na abertura do site.
    const { PrivacyFacadeService } = await import('../../facade/privacy.facade.service');
    this.injector.get(PrivacyFacadeService).eraseMyData();
    this.confirmingErase = false;
    this.erased = true;
    this.cdr.markForCheck();
    setTimeout(() => document.getElementById('erase-trigger')?.focus());
  }
}
