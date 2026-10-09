import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StoreFacadeService } from '../../facade/store.facade.service';

/**
 * Convite para receber promoções: o botão só abre uma conversa no WhatsApp da loja com a mensagem pronta.
 * Não promete cadastro automático: quem inclui o cliente na lista de transmissão é a própria loja.
 */
@Component({
  selector: 'app-promo-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section border-t border-ink-500/40" aria-labelledby="promo-title">
      <div class="container-page">
        <div class="card mx-auto max-w-2xl border-gold/40 p-6 text-center sm:p-10" appReveal>
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold" aria-hidden="true">
            <lucide-icon name="tag" [size]="22"></lucide-icon>
          </span>
          <p class="eyebrow mt-4">Promoções</p>
          <h2 id="promo-title" class="section-title">Gostaria de receber nossas promoções?</h2>
          <p class="lead mt-3">
            O botão abre uma conversa com a loja no WhatsApp, com a mensagem já pronta. É só enviar para pedir para
            entrar na lista de transmissão.
          </p>
          <p class="mt-5">
            <a [href]="promoUrl" target="_blank" rel="noopener noreferrer" class="btn-gold min-h-[48px] gap-2 px-8">
              <app-brand-icon name="whatsapp" [size]="20"></app-brand-icon>
              Pedir promoções no WhatsApp<span class="sr-only"> (abre em nova aba)</span>
            </a>
          </p>
          <p class="mt-4 text-sm text-cream-muted">Para receber as promoções, salve o número da loja nos seus contatos.</p>
        </div>
      </div>
    </section>
  `,
})
export class PromoCtaComponent {
  readonly promoUrl = this.store.promoSignupUrl;
  constructor(private store: StoreFacadeService) {}
}
