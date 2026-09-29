import { Component, EventEmitter, Output } from '@angular/core';
import { CartFacadeService } from '../../facade/cart.facade.service';
import { OrderFacadeService } from '../../facade/order.facade.service';

@Component({
  selector: 'app-review-step',
  template: `
    @if (view$ | async; as view) {
      <div class="mx-auto max-w-xl">
        <app-pizza-summary [view]="view"></app-pizza-summary>

        @if (cart$ | async; as cart) {
          @if (cart.drinks.length > 0) {
            <section class="card mt-5 p-5" aria-labelledby="bebidas-pedido-title">
              <h3 id="bebidas-pedido-title" class="font-display text-xl font-semibold">Bebidas no pedido</h3>
              <ul class="mt-3 space-y-1 text-sm">
                @for (drink of cart.drinks; track drink.id) {
                  <li>{{ drink.quantity }} × {{ drink.label }}</li>
                }
              </ul>
              <p class="mt-3 text-xs text-cream-dim">Para mudar a quantidade ou retirar, volte ao passo anterior.</p>
            </section>
          }
        }

        <div class="card mt-5 flex flex-wrap items-center justify-between gap-4 p-5">
          <span class="font-medium" id="qtd-pizza-label">Quantidade de pizzas iguais</span>
          <app-quantity-stepper [value]="quantity" label="esta pizza" (valueChange)="quantity = $event"></app-quantity-stepper>
        </div>

        <p role="alert" class="mt-4 text-sm text-danger" [hidden]="!error">{{ error }}</p>

        <button type="button" class="btn-primary mt-5 w-full py-4 text-base" (click)="add()">
          <lucide-icon name="shopping-cart" [size]="20"></lucide-icon>
          Adicionar ao carrinho
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

  @Output() added = new EventEmitter<void>();

  constructor(
    private order: OrderFacadeService,
    private cartFacade: CartFacadeService
  ) {}

  add(): void {
    if (this.order.addToCart(this.quantity)) {
      this.error = '';
      this.added.emit();
    } else {
      this.error = 'Escolha o tamanho e pelo menos 1 sabor antes de adicionar ao carrinho.';
    }
  }
}
