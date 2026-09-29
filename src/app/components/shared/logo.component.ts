import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * A logo tem muito espaço vazio ao redor. Aqui ela é recortada para o conteúdo
 * (proporção ~1.22:1) sem alterar o arquivo original.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="relative block overflow-hidden" [style.height.px]="height" [style.width.px]="height * 1.222">
      <img
        src="assets/img/logo-pizzaria.png"
        [alt]="decorative ? '' : 'Disk Pizza — Estd. 2015'"
        width="1080"
        height="1080"
        class="absolute max-w-none"
        style="width: 140.8%; left: -22.5%; top: -18.9%"
      />
    </span>
  `,
  styles: [':host{display:inline-block;line-height:0}'],
})
export class LogoComponent {
  @Input() height = 48;
  /** `true` quando o nome da loja já aparece em texto ao lado. */
  @Input() decorative = false;
}
