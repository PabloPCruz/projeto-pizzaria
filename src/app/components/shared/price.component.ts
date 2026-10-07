import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Mostra um valor já formatado pela facade ou, se não houver preço cadastrado, o aviso padrão. Nunca inventa valores. */
@Component({
  selector: 'app-price',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span *ngIf="value !== null && value !== undefined; else pending" class="font-semibold text-gold-light">{{ value }}</span>
    <ng-template #pending>
      <span *ngIf="!quiet" class="text-xs text-cream-muted">Valor confirmado pelo WhatsApp</span>
    </ng-template>
  `,
})
export class PriceComponent {
  @Input() value: string | null | undefined = null;
  /** Sem preço, não escreve nada (a tela já avisa uma vez no resumo do pedido). */
  @Input() quiet = false;
}
