import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
      <img
        [src]="flavor.image"
        [attr.alt]="decorative ? '' : 'Pizza de ' + flavor.name"
        loading="lazy"
        decoding="async"
        [attr.width]="width"
        [attr.height]="height"
        class="img-fade h-full w-full object-cover"
        [class.is-loaded]="loaded"
        [class]="imgClass"
        (load)="loaded = true"
        (error)="failed = true"
      />
    } @else {
      <div class="flavor-ph" [class.flavor-ph--sm]="small" [attr.data-cat]="flavor.category" aria-hidden="true">
        <span class="flavor-ph__icon">
          <lucide-icon [name]="flavor.category === 'doce' ? 'cake-slice' : 'pizza'" [size]="iconSize" [strokeWidth]="1.25"></lucide-icon>
        </span>
      </div>
    }
  `,
  styles: [':host{display:block;height:100%;width:100%}'],
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
}
