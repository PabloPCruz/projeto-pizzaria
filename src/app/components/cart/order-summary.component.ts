import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CartView } from '../../facade/cart.facade.service';
import { CheckoutFacadeService } from '../../facade/checkout.facade.service';

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

      <div
        class="mt-5 flex items-start gap-3 rounded-xl border border-gold/60 bg-gold/10 p-4 text-sm leading-relaxed text-gold-light"
        role="note"
        id="delivery-fee-notice"
      >
        <lucide-icon name="info" [size]="20" class="mt-0.5 shrink-0"></lucide-icon>
        <p>{{ notice }}</p>
      </div>

      <button type="submit" form="checkout-form" class="btn-primary mt-5 w-full py-4 text-base" aria-describedby="delivery-fee-notice">
        <lucide-icon name="send" [size]="20"></lucide-icon>
        Enviar pedido pelo WhatsApp
      </button>
    </div>
  `,
})
export class OrderSummaryComponent {
  @Input({ required: true }) view!: CartView;
  readonly notice = this.checkout.deliveryFeeNotice;

  constructor(private checkout: CheckoutFacadeService) {}
}
