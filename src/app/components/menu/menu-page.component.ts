import { Component } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { FlavorCategory, PizzaFlavor } from '../../interfaces/pizza-menu.interface';

@Component({
  selector: 'app-menu-page',
  templateUrl: './menu-page.component.html',
})
export class MenuPageComponent {
  readonly categories = this.menu.categories;
  tab: FlavorCategory = 'tradicional';
  term = '';
  visible: readonly PizzaFlavor[] = [];
  counts: Record<FlavorCategory, number> = { tradicional: 0, especial: 0, doce: 0 };

  constructor(private menu: MenuFacadeService) {
    this.refresh();
  }

  /** Posição da aba ativa (o indicador desliza até ela). */
  get tabIndex(): number {
    return Math.max(0, this.categories.findIndex((c) => c.id === this.tab));
  }

  selectTab(id: FlavorCategory, focus = false): void {
    this.tab = id;
    this.refresh();
    if (focus) document.getElementById('tab-' + id)?.focus();
  }

  setTerm(value: string): void {
    this.term = value;
    this.refresh();
  }

  /** Setas, Home e End movem entre as abas (padrão WAI-ARIA de tablist). */
  onTabKey(event: KeyboardEvent): void {
    const ids = this.categories.map((c) => c.id);
    const index = ids.indexOf(this.tab);
    let next = index;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % ids.length;
        break;
      case 'ArrowLeft':
        next = (index - 1 + ids.length) % ids.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = ids.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.selectTab(ids[next], true);
  }

  private refresh(): void {
    this.visible = this.menu.searchFlavors(this.term, this.tab);
    for (const c of this.categories) {
      this.counts[c.id] = this.menu.searchFlavors(this.term, c.id).length;
    }
  }
}
