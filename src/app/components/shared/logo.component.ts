import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Proporção da logo recortada (767×628). */
const RATIO = 767 / 628;

/**
 * Logo já recortada para o conteúdo (proporção ≈ 1,22:1), em WebP de 320 e 640 px com PNG de reserva.
 * O arquivo original (1080×1080, ~300 KB) tem muito espaço vazio ao redor e não é mais baixado.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <picture>
      <source
        type="image/webp"
        srcset="assets/img/logo-crop-320.webp 320w, assets/img/logo-crop-640.webp 640w"
        [attr.sizes]="width + 'px'"
      />
      <img
        src="assets/img/logo-crop-640.png"
        [alt]="decorative ? '' : 'Disk Pizza — Estd. 2015'"
        width="767"
        height="628"
        decoding="async"
        [attr.fetchpriority]="priority ? 'high' : null"
        class="block"
        [style.height.px]="height"
        [style.width.px]="width"
      />
    </picture>
  `,
  styles: [':host{display:inline-block;line-height:0}'],
})
export class LogoComponent {
  @Input() height = 48;
  /** `true` quando o nome da loja já aparece em texto ao lado. */
  @Input() decorative = false;
  /** Logo visível logo na abertura da página (cabeçalho, topo da home): baixar com prioridade. */
  @Input() priority = false;

  get width(): number {
    return Math.round(this.height * RATIO);
  }
}
