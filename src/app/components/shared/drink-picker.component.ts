import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { map } from 'rxjs/operators';
import { CartFacadeService, DrinkLineView } from '../../facade/cart.facade.service';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { Drink } from '../../interfaces/pizza-menu.interface';

/**
 * Lista de bebidas ligada ao carrinho: a quantidade mostrada é sempre a do carrinho
 * (não some sozinha, sobrevive a recarregar e reflete remoções feitas em outra tela).
 * Sem a bebida: botão "Adicionar". Com ela: − quantidade + (− na quantidade 1 remove).
 */
@Component({
  selector: 'app-drink-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lines$ | async; as lines) {
      <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        @for (drink of visibleDrinks(lines); track drink.id) {
          <li
            [id]="'drink-' + drink.id"
            class="card flex items-center justify-between gap-3 p-3 pl-4 transition-colors duration-base"
            [ngClass]="lines.has(drink.id) ? '!border-gold/60 bg-gold/[.06]' : ''"
          >
            <span class="flex min-w-0 items-center gap-2.5">
              <lucide-icon [name]="drink.group === 'cerveja' ? 'wine' : 'cup-soda'" [size]="18" class="shrink-0 text-gold"></lucide-icon>
              <span class="min-w-0 leading-snug">
                <span class="block break-words">{{ drink.label }}</span>
                <span class="block text-sm"><app-price [value]="priceOf(drink)" [quiet]="true"></app-price></span>
              </span>
            </span>
            @if (lines.get(drink.id); as line) {
              <app-quantity-stepper
                class="animate-fade-in"
                [value]="line.quantity"
                [min]="0"
                [label]="drink.label"
                (valueChange)="change(drink, line, $event)"
              ></app-quantity-stepper>
            } @else if (isUnavailable(drink)) {
              <span class="shrink-0 rounded-full border border-warn/50 bg-warn/10 px-2.5 py-0.5 text-xs font-medium text-warn">Indisponível hoje</span>
            } @else {
              <button
                type="button"
                class="btn-ghost min-h-[44px] shrink-0 px-4 py-2"
                (click)="add(drink)"
                [attr.aria-label]="'Adicionar ' + drink.label + ' ao carrinho'"
              >
                <span class="inline-flex items-center gap-1.5"><lucide-icon name="plus" [size]="16"></lucide-icon>Adicionar</span>
              </button>
            }
          </li>
        }
      </ul>
    }
    <p class="sr-only" role="status" aria-live="polite">{{ live }}</p>
  `,
})
export class DrinkPickerComponent {
  /**
   * `true` = lista só as bebidas que ainda NÃO estão no pedido (usado no carrinho, onde as já escolhidas
   * aparecem em "Seus itens"; assim a mesma bebida nunca fica repetida na tela).
   */
  @Input() onlyAvailable = false;

  readonly drinks = this.menu.getDrinks();
  readonly lines$ = this.cart.view$.pipe(
    map((view) => new Map<string, DrinkLineView>(view.drinks.map((d) => [d.drinkId, d])))
  );
  live = '';

  constructor(
    private menu: MenuFacadeService,
    private cart: CartFacadeService,
    private host: ElementRef<HTMLElement>
  ) {}

  /** Esgotada hoje (data/availability.ts): sem "Adicionar". Se já está no pedido, continua com o − para poder retirar. */
  isUnavailable(drink: Drink): boolean {
    return !this.menu.isAvailable(drink.id);
  }

  /** Valor só informativo (a bebida entra no pedido sem valor; a loja confirma o total). */
  priceOf(drink: Drink): string | null {
    return this.menu.getDrinkPrice(drink.id);
  }

  visibleDrinks(lines: Map<string, DrinkLineView>): readonly Drink[] {
    return this.onlyAvailable ? this.drinks.filter((d) => !lines.has(d.id)) : this.drinks;
  }

  add(drink: Drink): void {
    this.cart.addDrink(drink.id);
    this.live = `${drink.label} adicionada ao carrinho. Quantidade: 1.`;
    if (this.onlyAvailable) {
      // A linha some daqui (passa para "Seus itens"): o foco vai para o próximo "Adicionar" da lista.
      // Era a última? A seção inteira some e o foco vai para "Seus itens", onde a bebida acabou de entrar.
      setTimeout(() => {
        const next = this.host.nativeElement.querySelector<HTMLElement>('button[aria-label^="Adicionar"]');
        // A seção removida deixa o botão antigo solto no DOM: só vale o que ainda está na página.
        (next?.isConnected ? next : document.getElementById('itens-title'))?.focus();
      });
    } else {
      this.focusAfterRender(drink.id, 'button[aria-label^="Aumentar"]');
    }
  }

  change(drink: Drink, line: DrinkLineView, quantity: number): void {
    if (quantity < 1) {
      this.cart.removeDrink(line.id);
      this.live = `${drink.label} removida do carrinho.`;
      this.focusAfterRender(drink.id, 'button[aria-label^="Adicionar"]');
      return;
    }
    this.cart.setDrinkQuantity(line.id, quantity);
    this.live = `${drink.label}: ${quantity} no carrinho.`;
  }

  /** O botão focado é trocado (Adicionar ⇄ stepper): devolve o foco ao controle equivalente da mesma linha. */
  private focusAfterRender(drinkId: string, selector: string): void {
    setTimeout(() => document.querySelector<HTMLElement>(`#drink-${drinkId} ${selector}`)?.focus());
  }
}
