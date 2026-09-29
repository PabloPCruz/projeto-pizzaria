import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Destaque "Taxa de entrega grátis para o seu endereço" (endereço dentro do raio de entrega grátis). */
@Component({
  selector: 'app-delivery-free',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="enter-soft relative flex items-center gap-4 overflow-hidden rounded-2xl border border-gold/70 bg-gradient-to-br from-gold/15 to-gold/[.04]"
      [ngClass]="compact ? 'p-3.5' : 'p-5'"
      role="status"
    >
      <span
        class="flex shrink-0 animate-check-in items-center justify-center rounded-full bg-gold text-ink-900"
        [ngClass]="compact ? 'h-10 w-10' : 'h-12 w-12'"
        aria-hidden="true"
      >
        <lucide-icon name="truck" [size]="compact ? 20 : 24"></lucide-icon>
      </span>
      <div class="min-w-0">
        <p class="font-display font-semibold leading-snug text-gold-light" [ngClass]="compact ? 'text-base' : 'text-xl'">
          Taxa de entrega grátis para o seu endereço
        </p>
        <p class="mt-0.5 text-cream-muted" [ngClass]="compact ? 'text-xs' : 'text-sm'">
          Você está na nossa área de entrega grátis, a até {{ radiusKm }} km da loja.
        </p>
      </div>
      <lucide-icon
        name="sparkles"
        [size]="compact ? 18 : 22"
        class="absolute right-3 top-3 hidden text-gold-soft sm:block"
        aria-hidden="true"
      ></lucide-icon>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class DeliveryFreeComponent {
  @Input() compact = false;
  @Input() radiusKm = 3;
}
