import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { CartFacadeService, CartView } from '../../facade/cart.facade.service';

type LineKind = 'pizza' | 'drink';

@Component({
  selector: 'app-cart-items',
  templateUrl: './cart-items.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CartItemsComponent {
  @Input({ required: true }) view!: CartView;

  /** Linha aguardando confirmação de remoção (confirmação simples, sem diálogo). */
  confirming: { kind: LineKind; id: string } | null = null;
  /** Texto lido por leitores de tela após remover/alterar. */
  live = '';

  constructor(
    private cart: CartFacadeService,
    private host: ElementRef<HTMLElement>
  ) {}

  isConfirming(kind: LineKind, id: string): boolean {
    return this.confirming?.kind === kind && this.confirming.id === id;
  }

  askRemove(kind: LineKind, id: string): void {
    this.confirming = { kind, id };
    // O botão "Remover" some; leva o foco ao botão de confirmação.
    setTimeout(() => document.getElementById(`confirm-${kind}-${id}`)?.focus());
  }

  cancelRemove(): void {
    this.confirming = null;
  }

  confirmRemove(kind: LineKind, id: string, label: string): void {
    const lines = [...this.view.pizzas.map((p) => ['pizza', p.id]), ...this.view.drinks.map((d) => ['drink', d.id])];
    const index = lines.findIndex(([k, i]) => k === kind && i === id);
    const remaining = lines.length - 1;
    if (kind === 'pizza') this.cart.removePizza(id);
    else this.cart.removeDrink(id);
    this.confirming = null;
    // Foco não pode se perder: vai para o próximo item (ou o anterior, se era o último) ou, sem itens, para o estado vazio.
    setTimeout(() => {
      if (remaining === 0) {
        document.getElementById('vazio-title')?.focus();
        return;
      }
      const headings = this.host.nativeElement.querySelectorAll<HTMLElement>('[data-line-heading]');
      headings[Math.min(index, headings.length - 1)]?.focus();
    });
    this.live = `${label} removido do carrinho.`;
  }

  setPizzaQuantity(id: string, quantity: number): void {
    this.cart.setPizzaQuantity(id, quantity);
  }

  setDrinkQuantity(id: string, quantity: number): void {
    this.cart.setDrinkQuantity(id, quantity);
  }
}
