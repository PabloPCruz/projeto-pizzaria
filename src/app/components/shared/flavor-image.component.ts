import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IMAGE_FOCUS } from '../../data/menu.data';
import { PizzaFlavor } from '../../interfaces/pizza-menu.interface';

/**
 * Foto do sabor (ou placeholder por categoria) que preenche o contêiner do pai.
 * O pai define o tamanho/proporção (aspect-ratio) e `relative overflow-hidden`: assim não há salto de layout.
 * A foto aparece com fade ao terminar de carregar; se falhar, cai no placeholder (nunca imagem quebrada).
 */
@Component({
  selector: 'app-flavor-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (flavor.image && !failed) {
      <picture>
        <source type="image/webp" [attr.srcset]="srcset" [attr.sizes]="sizes" />
      <img
        [src]="flavor.image"
        [attr.alt]="decorative ? '' : 'Pizza de ' + flavor.name"
        loading="lazy"
        decoding="async"
        [attr.width]="width"
        [attr.height]="height"
        class="img-fade h-full w-full object-cover"
        [style.object-position]="focus"
        [class.is-loaded]="loaded"
        [class]="imgClass"
        (load)="loaded = true"
        (error)="failed = true"
      />
      </picture>
    } @else {
      <div class="flavor-ph" [class.flavor-ph--sm]="small" [attr.data-cat]="flavor.category" aria-hidden="true">
        <span class="flavor-ph__icon">
          <lucide-icon [name]="flavor.category === 'doce' ? 'cake-slice' : 'pizza'" [size]="iconSize" [strokeWidth]="1.25"></lucide-icon>
        </span>
      </div>
    }
  `,
  styles: [':host{display:block;height:100%;width:100%} picture{display:contents}'],
})
export class FlavorImageComponent {
  @Input({ required: true }) flavor!: PizzaFlavor;
  /** `true` quando o nome do sabor já aparece em texto ao lado (alt vazio, sem repetir para leitor de tela). */
  @Input() decorative = false;
  @Input() width = 640;
  @Input() height = 480;
  @Input() iconSize = 40;
  @Input() small = false;
  /** Classes extras para a <img> (ex.: zoom no hover do cartão). */
  @Input() imgClass = '';

  loaded = false;
  failed = false;

  /** Variantes leves geradas ao lado da foto original (nome-192/320/640/960.webp; ver tools/gerar-imagens.js). */
  get srcset(): string {
    const base = (this.flavor.image ?? '').replace(/\.jpe?g$/i, '');
    return [192, 320, 640, 960].map((w) => `${base}-${w}.webp ${w}w`).join(', ');
  }

  /** Onde fica a pizza na foto (só para as que não ficam no centro). */
  get focus(): string | null {
    return IMAGE_FOCUS[(this.flavor.image ?? '').split('/').pop() ?? ''] ?? null;
  }

  /** Miniaturas ocupam o próprio tamanho; cartões grandes, a largura da coluna. */
  get sizes(): string {
    return this.small ? `${this.width}px` : '(min-width: 1024px) 347px, (min-width: 640px) 45vw, 78vw';
  }
}
