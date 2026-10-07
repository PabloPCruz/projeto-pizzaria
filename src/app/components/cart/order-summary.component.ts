import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CartView } from '../../facade/cart.facade.service';
import { CheckoutFacadeService } from '../../facade/checkout.facade.service';
import { StoreFacadeService } from '../../facade/store.facade.service';

/** Resumo do pedido: total dos itens (só se houver preço), aviso da taxa de entrega e botão de envio. */
@Component({
  selector: 'app-order-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card p-5 sm:p-6">
      <h2 class="font-display text-xl font-semibold">Resumo do pedido</h2>
      <div class="rule-gold !my-4" aria-hidden="true"></div>

      <dl class="space-y-2 text-sm">
        <div class="flex items-center justify-between">
          <dt class="text-cream-muted">Itens</dt>
          <dd>{{ view.itemCount }}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-cream-muted">Total dos itens</dt>
          <dd class="text-right"><app-price [value]="view.total"></app-price></dd>
        </div>
      </dl>

      @if ((zone$ | async)?.status === 'free') {
        <app-delivery-free id="delivery-fee-notice" class="mt-5" [compact]="true" [radiusKm]="radiusKm"></app-delivery-free>
      } @else {
        <div
          class="mt-5 flex items-start gap-3 rounded-xl border border-ink-400 bg-ink-700 p-4 text-sm leading-relaxed text-cream-muted"
          role="note"
          id="delivery-fee-notice"
        >
          <lucide-icon name="info" [size]="20" class="mt-0.5 shrink-0 text-gold"></lucide-icon>
          <p>{{ notice }}</p>
        </div>
      }

      @if (store$ | async; as store) {
        @if (store.open) {
          <button
            type="submit"
            form="checkout-form"
            class="btn-primary mt-5 w-full whitespace-nowrap px-4 py-4 text-base"
            aria-describedby="delivery-fee-notice"
            [attr.aria-busy]="(busy$ | async) ? 'true' : null"
          >
            @if (busy$ | async) {
              <lucide-icon name="loader-circle" [size]="20" class="animate-spin"></lucide-icon>
              Verificando entrega…
            } @else {
              <lucide-icon name="send" [size]="20"></lucide-icon>
              Finalizar no WhatsApp
            }
          </button>
          <p class="mt-3 text-center text-xs leading-relaxed text-cream-muted">Você confirma o envio dentro do WhatsApp. Nada é cobrado agora.</p>
        } @else {
          <app-store-closed-notice class="mt-5" [message]="store.notice"></app-store-closed-notice>
          <!-- Não é "disabled": tocar nele explica por que o pedido não foi enviado (alerta no formulário). -->
          <button type="submit" form="checkout-form" aria-disabled="true" class="btn mt-3 w-full whitespace-nowrap px-4 py-4 text-base" aria-describedby="store-closed-notice">
            <lucide-icon name="calendar-x" [size]="20"></lucide-icon>
            Loja fechada agora
          </button>
        }
      }
    </div>
  `,
})
export class OrderSummaryComponent {
  @Input({ required: true }) view!: CartView;
  readonly notice = this.checkout.deliveryFeeNotice;
  readonly radiusKm = this.checkout.freeDeliveryRadiusKm;
  readonly zone$ = this.checkout.zone$;
  readonly store$ = this.storeFacade.view$;
  readonly busy$ = this.checkout.busy$;

  constructor(
    private checkout: CheckoutFacadeService,
    private storeFacade: StoreFacadeService
  ) {}
}
