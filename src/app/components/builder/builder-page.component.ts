import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { BuilderView, OrderFacadeService } from '../../facade/order.facade.service';

export interface BuilderStep {
  label: string;
  title: string;
  hint: string;
}

export const BUILDER_STEPS: readonly BuilderStep[] = [
  { label: 'Tamanho', title: 'Escolha o tamanho', hint: 'O tamanho define quantos sabores cabem na pizza.' },
  { label: 'Sabores', title: 'Escolha os sabores', hint: 'Pode misturar salgado e doce, até o limite do tamanho.' },
  { label: 'Borda', title: 'Escolha a borda', hint: 'Opcional. Se preferir, fique sem borda recheada.' },
  { label: 'Extras', title: 'Bebidas e observações', hint: 'Tudo opcional. As bebidas vão direto para o carrinho.' },
  { label: 'Revisão', title: 'Revise sua pizza', hint: 'Confira tudo antes de adicionar ao carrinho.' },
];

@Component({
  selector: 'app-builder-page',
  templateUrl: './builder-page.component.html',
})
export class BuilderPageComponent implements OnInit {
  readonly steps = BUILDER_STEPS;
  readonly view$ = this.order.view$;

  step = 0;
  /** Sentido da última troca de passo (só para a animação de deslizar). */
  dir: 'fwd' | 'back' = 'fwd';
  /** Pizza acabou de ir para o carrinho: mostra o painel de próximos passos. */
  added = false;
  /** `true` = o que foi salvo era a edição de uma pizza do carrinho (texto do painel muda). */
  addedWasEdit = false;
  /** Aviso de sabores removidos ao trocar para um tamanho menor (aria-live). */
  notice = '';
  /** Motivo pelo qual não dá para avançar (aria-live). */
  stepError = '';
  /** O cliente veio da revisão para corrigir algo: o botão de avançar volta direto para a revisão. */
  returnToReview = false;

  @ViewChild('stepHeading') stepHeading?: ElementRef<HTMLElement>;
  @ViewChild('addedHeading') addedHeading?: ElementRef<HTMLElement>;

  constructor(
    private order: OrderFacadeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.order.reconcileEdit();
    // Ao recarregar, volta ao passo em que o cliente estava (limitado ao que o rascunho permite).
    this.view$.pipe(take(1)).subscribe((view) => {
      this.step = Math.min(this.order.getStep(), this.maxReachable(view));
    });
  }

  /** Maior passo alcançável: tamanho e sabores são obrigatórios; borda e extras são opcionais. */
  maxReachable(view: BuilderView): number {
    if (!view.draft.size) return 0;
    return view.validation.valid ? this.steps.length - 1 : 1;
  }

  /** Mensagem de bloqueio do passo atual, ou string vazia se pode avançar. */
  blockingError(view: BuilderView, step = this.step): string {
    if (step === 0 && !view.draft.size) return 'Escolha o tamanho para continuar.';
    if (step === 1 && !view.validation.valid) return view.validation.error ?? 'Escolha pelo menos 1 sabor.';
    return '';
  }

  next(view: BuilderView): void {
    this.stepError = this.blockingError(view);
    if (this.stepError) return;
    if (this.returnToReview) {
      // Pizza ainda válida: volta à revisão; senão, os sabores precisam de atenção primeiro.
      this.go(view.validation.valid ? this.steps.length - 1 : 1);
      return;
    }
    this.go(this.step + 1);
  }

  /** Botão "Editar" da revisão: vai ao passo e, ao terminar, "Voltar à revisão" leva direto de volta. */
  editFromReview(index: number): void {
    this.go(index);
    this.returnToReview = true;
  }

  back(): void {
    this.go(this.step - 1);
  }

  goTo(index: number, view: BuilderView): void {
    if (index <= this.maxReachable(view)) this.go(index);
  }

  onFlavorsRemoved(event: { removed: number; label: string; max: number }): void {
    if (event.removed === 0) {
      this.notice = '';
      return;
    }
    this.notice = `Tamanho ${event.label} aceita no máximo ${event.max} ${event.max === 1 ? 'sabor' : 'sabores'}: ${
      event.removed
    } ${event.removed === 1 ? 'sabor foi removido' : 'sabores foram removidos'} da sua pizza.`;
  }

  /** Desiste da edição: a pizza do carrinho continua exatamente como estava. */
  cancelEdit(): void {
    this.order.cancelEdit();
    this.returnToReview = false;
    this.step = 0;
    this.notice = '';
    this.stepError = '';
    void this.router.navigate(['/carrinho']);
  }

  onAdded(wasEdit = false): void {
    this.added = true;
    this.addedWasEdit = wasEdit;
    this.notice = '';
    this.stepError = '';
    setTimeout(() => this.addedHeading?.nativeElement.focus());
  }

  addAnother(): void {
    this.added = false;
    this.returnToReview = false;
    this.go(0);
  }

  private go(index: number): void {
    this.dir = index < this.step ? 'back' : 'fwd';
    this.step = Math.max(0, Math.min(this.steps.length - 1, index));
    // Chegou à revisão (ou saiu da edição): o atalho de volta já cumpriu o papel.
    if (this.step === this.steps.length - 1) this.returnToReview = false;
    if (this.step >= 2) this.notice = '';
    this.stepError = '';
    this.order.setStep(this.step);
    setTimeout(() => {
      this.stepHeading?.nativeElement.focus({ preventScroll: true });
      this.stepHeading?.nativeElement.scrollIntoView({ block: 'start' });
    });
  }
}
