import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { PizzaFlavor } from '../../interfaces/pizza-menu.interface';

/**
 * Pop-up para escolher a opção de um sabor que tem (ex.: calabresa com cebola ou com catupiry, chocolate ao leite ou branco).
 * Usa o <dialog> nativo (foco preso, Esc fecha, página inerte por trás), no mesmo padrão do pop-up de bebidas do carrinho.
 * Tocar numa opção escolhe e fecha. Fechar sem escolher emite `dismissed`: quem abriu decide o que fazer.
 */
@Component({
  selector: 'app-flavor-option-dialog',
  template: `
    <dialog
      #dlg
      class="mb-3 mt-auto w-[calc(100%-1.5rem)] max-w-sm overflow-hidden rounded-2xl border border-gold/30 bg-ink-800 p-0 text-cream shadow-2xl shadow-black/70 backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:my-auto"
      aria-labelledby="flavor-option-title"
      (click)="onDialogClick($event)"
      (close)="onClosed()"
    >
      @if (flavor; as f) {
        <div class="animate-fade-in">
          <header class="flex items-start justify-between gap-3 border-b border-ink-500/60 px-5 py-4">
            <div class="min-w-0">
              <p class="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-gold-soft">Escolha a opção</p>
              <h2 id="flavor-option-title" class="mt-0.5 font-display text-xl font-semibold leading-snug">{{ f.name }}</h2>
            </div>
            <button type="button" class="btn-icon shrink-0" aria-label="Fechar" (click)="cancel()">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </header>

          <div class="space-y-2.5 px-5 py-4" role="group" [attr.aria-label]="'Opções de ' + f.name">
            @for (option of f.options; track option.id) {
              <button
                type="button"
                class="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left font-semibold transition-colors duration-base active:scale-[.99]"
                [ngClass]="current === option.id ? 'border-gold bg-gold/[.08] text-gold-light' : 'border-ink-400 bg-ink-800 hover:border-gold/60'"
                [attr.data-option]="option.id"
                [attr.aria-pressed]="current === option.id"
                (click)="choose(option.id)"
              >
                {{ option.label }}
                @if (current === option.id) {
                  <lucide-icon name="check" [size]="18" [strokeWidth]="2.5" class="shrink-0"></lucide-icon>
                }
              </button>
            }
          </div>

          <footer class="border-t border-ink-500/60 px-5 py-4">
            <button type="button" class="btn-ghost w-full" (click)="cancel()">{{ current ? 'Fechar' : 'Cancelar' }}</button>
          </footer>
        </div>
      }
    </dialog>
  `,
})
export class FlavorOptionDialogComponent {
  @ViewChild('dlg', { static: true }) dialog!: ElementRef<HTMLDialogElement>;

  /** Opção escolhida. */
  @Output() chosen = new EventEmitter<{ flavorId: string; optionId: string }>();
  /** O pop-up fechou sem nenhuma escolha (id do sabor). */
  @Output() dismissed = new EventEmitter<string>();

  flavor: PizzaFlavor | null = null;
  /** Opção já escolhida para este sabor (marcada ao reabrir). */
  current: string | undefined;
  private picked = false;

  constructor(private cdr: ChangeDetectorRef) {}

  open(flavor: PizzaFlavor, current?: string): void {
    const dialog = this.dialog.nativeElement;
    if (dialog.open) return;
    this.flavor = flavor;
    this.current = current;
    this.picked = false;
    this.cdr.detectChanges(); // monta as opções antes de mostrar
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  }

  choose(optionId: string): void {
    if (!this.flavor) return;
    this.picked = true;
    this.chosen.emit({ flavorId: this.flavor.id, optionId });
    this.close();
  }

  cancel(): void {
    this.close();
  }

  /** Clique no fundo escuro (o alvo é o próprio <dialog>, não o conteúdo) fecha. */
  onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog.nativeElement) this.close();
  }

  /** Disparado em qualquer fechamento (opção, X, Cancelar, fundo ou Esc). O navegador devolve o foco a quem abriu. */
  onClosed(): void {
    const flavor = this.flavor;
    const picked = this.picked;
    this.flavor = null;
    this.current = undefined;
    document.body.style.overflow = '';
    if (flavor && !picked) this.dismissed.emit(flavor.id);
    this.cdr.markForCheck();
  }

  private close(): void {
    this.dialog.nativeElement.close();
  }
}
