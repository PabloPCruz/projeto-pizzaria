import { Component, EventEmitter, Output } from '@angular/core';
import { take } from 'rxjs/operators';
import { CartFacadeService } from '../../facade/cart.facade.service';
import { OrderFacadeService } from '../../facade/order.facade.service';

@Component({
  selector: 'app-review-step',
  template: `
    @if (view$ | async; as view) {
      <div class="mx-auto max-w-xl">
        <app-pizza-summary [view]="view" [editable]="true" (edit)="editStep.emit($event)"></app-pizza-summary>

        @if (cart$ | async; as cart) {
          @if (cart.drinks.length > 0) {
            <section class="card mt-4 p-5" aria-labelledby="bebidas-pedido-title">
              <h3 id="bebidas-pedido-title" class="font-display text-xl font-semibold">Bebidas no pedido</h3>
              <ul class="mt-3 space-y-1 text-sm">
                @for (drink of cart.drinks; track drink.id) {
                  <li>{{ drink.quantity }} × {{ drink.label }}</li>
                }
              </ul>
              <p class="mt-3 text-sm text-cream-dim">Para mudar a quantidade ou retirar, volte ao passo anterior.</p>
            </section>
          }
        }

        <div class="card mt-4 flex flex-wrap items-center justify-between gap-4 p-5">
          <span class="font-medium" id="qtd-pizza-label">Quantidade de pizzas iguais</span>
          <app-quantity-stepper [value]="quantity" label="esta pizza" (valueChange)="quantity = $event"></app-quantity-stepper>
        </div>

        <p role="alert" class="mt-4 animate-fade-in text-sm text-danger" [hidden]="!error">{{ error }}</p>

        <button type="button" class="btn-primary mt-5 w-full py-4 text-base" (click)="add()">
          <lucide-icon [name]="view.editing ? 'check' : 'shopping-cart'" [size]="20"></lucide-icon>
          {{ view.editing ? 'Salvar alterações' : 'Adicionar ao carrinho' }}
        </button>
      </div>
    }
  `,
})
export class ReviewStepComponent {
  readonly view$ = this.order.view$;
  readonly cart$ = this.cartFacade.view$;
  quantity = 1;
  error = '';

  /** Emite `true` quando a pizza salva substituiu uma que já estava no carrinho (edição). */
  @Output() added = new EventEmitter<boolean>();
  /** O cliente quer corrigir uma parte da pizza: emite o índice do passo (0 tamanho, 1 sabores, 2 borda, 3 extras). */
  @Output() editStep = new EventEmitter<number>();

  constructor(
    private order: OrderFacadeService,
    private cartFacade: CartFacadeService
  ) {
    // Ao editar, a quantidade começa na que a pizza já tinha no carrinho.
    this.order.view$.pipe(take(1)).subscribe((view) => (this.quantity = view.draft.quantity));
  }

  add(): void {
    const editing = this.order.isEditing();
    if (this.order.addToCart(this.quantity)) {
      this.error = '';
      this.added.emit(editing);
    } else {
      this.error = 'Escolha o tamanho e pelo menos 1 sabor antes de adicionar ao carrinho.';
    }
  }
}
