import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { CartFacadeService } from '../../facade/cart.facade.service';

/**
 * Pop-up com as bebidas e os valores (informativos), aberto pelo botão "Adicionar bebida" do carrinho.
 * Usa o <dialog> nativo: o foco fica preso dentro, o Esc fecha e o resto da página fica inerte.
 * A lista só é montada enquanto o pop-up está aberto, para não pesar na tela do carrinho.
 */
@Component({
  selector: 'app-drinks-dialog',
  template: `
    <dialog
      #dlg
      class="mb-3 mt-auto w-[calc(100%-1.5rem)] max-w-md overflow-hidden rounded-2xl border border-gold/30 bg-ink-800 p-0 text-cream shadow-2xl shadow-black/70 backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:my-auto"
      aria-labelledby="drinks-dialog-title"
      (click)="onDialogClick($event)"
      (close)="onClosed()"
    >
      @if (isOpen) {
        <div class="flex max-h-[85dvh] animate-fade-in flex-col">
          <header class="flex items-center justify-between gap-3 border-b border-ink-500/60 px-5 py-4">
            <div class="flex items-center gap-3">
              <span class="text-gold"><lucide-icon name="cup-soda" [size]="22"></lucide-icon></span>
              <h2 id="drinks-dialog-title" class="font-display text-xl font-semibold">Bebidas</h2>
            </div>
            <button type="button" class="btn-icon" aria-label="Fechar" (click)="close()">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </header>

          <div class="overflow-y-auto px-5 py-4">
            <app-drink-picker [compact]="true"></app-drink-picker>
          </div>

          <footer class="border-t border-ink-500/60 px-5 py-4">
            <button type="button" class="btn-gold w-full" (click)="close()">
              Concluir
              @if (drinkCount$ | async; as count) {
                <span class="font-normal opacity-80">· {{ count }} no pedido</span>
              }
            </button>
          </footer>
        </div>
      }
    </dialog>
  `,
})
export class DrinksDialogComponent {
  @ViewChild('dlg', { static: true }) dialog!: ElementRef<HTMLDialogElement>;

  /** Quantas bebidas (unidades) já estão no pedido. */
  readonly drinkCount$ = this.cart.view$.pipe(map((view) => view.drinks.reduce((sum, d) => sum + d.quantity, 0)));

  isOpen = false;

  constructor(
    private cart: CartFacadeService,
    private cdr: ChangeDetectorRef
  ) {}

  open(): void {
    const dialog = this.dialog.nativeElement;
    if (dialog.open) return;
    this.isOpen = true;
    this.cdr.detectChanges(); // monta a lista antes de mostrar
    // Evita a página rolar por trás enquanto o pop-up está aberto.
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  }

  close(): void {
    this.dialog.nativeElement.close();
  }

  /** Clique no fundo escuro (o alvo é o próprio <dialog>, não o conteúdo) fecha. */
  onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog.nativeElement) this.close();
  }

  /** Disparado em qualquer fechamento (botões, fundo ou Esc). O navegador devolve o foco a quem abriu. */
  onClosed(): void {
    this.isOpen = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }
}
