import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/** Controle − / + acessível. Não conhece regra de negócio: só emite a nova quantidade. */
@Component({
  selector: 'app-quantity-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex items-center gap-2" role="group" [attr.aria-label]="'Quantidade de ' + label">
      <button
        type="button"
        class="btn-icon"
        [attr.aria-disabled]="value <= min ? 'true' : null"
        (click)="step(-1)"
        [attr.aria-label]="'Diminuir quantidade de ' + label"
      >
        <lucide-icon name="minus" [size]="18"></lucide-icon>
      </button>
      <output class="min-w-[2.25rem] text-center text-lg font-semibold tabular-nums" aria-live="polite">
        @for (v of [value]; track v) {
          <span class="inline-block animate-tick">{{ v }}</span>
        }
      </output>
      <button
        type="button"
        class="btn-icon"
        [attr.aria-disabled]="value >= max ? 'true' : null"
        (click)="step(1)"
        [attr.aria-label]="'Aumentar quantidade de ' + label"
      >
        <lucide-icon name="plus" [size]="18"></lucide-icon>
      </button>
    </div>
  `,
})
export class QuantityStepperComponent {
  @Input({ required: true }) value = 1;
  @Input({ required: true }) label = '';
  @Input() min = 1;
  @Input() max = 20;
  @Output() valueChange = new EventEmitter<number>();

  /** aria-disabled (e não disabled) nos limites: o botão continua focável e o foco não se perde. */
  step(delta: number): void {
    const next = this.value + delta;
    if (next < this.min || next > this.max) return;
    this.valueChange.emit(next);
  }
}
