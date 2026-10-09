import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SPECIAL_PRICE_NOTICE } from '../../data/menu.data';

/** Aviso discreto, só informativo: com um sabor especial na pizza, vale o valor dos especiais para ela inteira. */
@Component({
  selector: 'app-price-rule-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="flex items-start gap-2 text-sm leading-snug text-cream-muted">
      <lucide-icon name="info" [size]="16" class="mt-0.5 shrink-0 text-gold-soft" aria-hidden="true"></lucide-icon>
      <span>{{ notice }}</span>
    </p>
  `,
})
export class PriceRuleNoticeComponent {
  readonly notice = SPECIAL_PRICE_NOTICE;
}
