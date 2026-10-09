import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PizzaBuilderDraft } from '../interfaces/cart.interface';
import { PizzaSizeId } from '../interfaces/pizza-menu.interface';
import { CartService } from '../services/cart.service';
import { FlavorValidation, SizeRulesService } from '../services/size-rules.service';
import { PizzaBuilderService } from '../services/pizza-builder.service';
import { PersistenceService } from '../services/persistence.service';
import { PricingService } from '../services/pricing.service';

const STEP_KEY = 'builder-step';

export interface BuilderView {
  draft: PizzaBuilderDraft;
  maxFlavors: number;
  remainingFlavors: number;
  validation: FlavorValidation;
  /** Preço unitário da pizza montada, ou `null` se algum preço ainda não foi informado. */
  unitPrice: number | null;
  /** `true` = está editando uma pizza que já estava no carrinho (ao salvar, ela é substituída). */
  editing: boolean;
}

/** Montagem de pizza: tamanho, sabores (respeitando o limite), borda e observações. */
@Injectable({ providedIn: 'root' })
export class OrderFacadeService {
  readonly view$: Observable<BuilderView>;

  constructor(
    private builder: PizzaBuilderService,
    private sizeRules: SizeRulesService,
    private pricing: PricingService,
    private cart: CartService,
    private persistence: PersistenceService
  ) {
    this.view$ = this.builder.draft$.pipe(
      map((draft) => {
        const maxFlavors = this.sizeRules.maxFlavors(draft.size);
        return {
          draft,
          maxFlavors,
          remainingFlavors: Math.max(0, maxFlavors - draft.flavorIds.length),
          validation: this.sizeRules.validate(draft.size, draft.flavorIds, draft.flavorOptions),
          unitPrice: draft.size ? this.pricing.pizzaUnitPrice(draft.size, draft.flavorIds, draft.crustId) : null,
          editing: !!draft.editingId,
        };
      })
    );
  }

  /** Devolve quantos sabores foram removidos por não caberem no novo tamanho. */
  selectSize(size: PizzaSizeId): number {
    return this.builder.setSize(size);
  }

  /** `false` = não adicionou, o tamanho já atingiu o limite de sabores. */
  toggleFlavor(flavorId: string): boolean {
    return this.builder.toggleFlavor(flavorId);
  }

  /** Escolhe a opção de um sabor da pizza (ex.: calabresa com cebola ou com catupiry). */
  selectFlavorOption(flavorId: string, optionId: string): void {
    this.builder.setFlavorOption(flavorId, optionId);
  }

  selectCrust(crustId: string | null): void {
    this.builder.setCrust(crustId);
  }

  setNotes(notes: string): void {
    this.builder.setNotes(notes);
  }

  /**
   * Adiciona a pizza montada ao carrinho e zera a montagem. Se for a edição de uma pizza do carrinho,
   * substitui a original (mesmo id e posição). `false` se a pizza estiver inválida.
   */
  addToCart(quantity = 1): boolean {
    const draft = this.builder.snapshot;
    if (!draft.size || !this.sizeRules.validate(draft.size, draft.flavorIds, draft.flavorOptions).valid) return false;
    const line = {
      size: draft.size,
      flavorIds: draft.flavorIds,
      flavorOptions: draft.flavorOptions,
      crustId: draft.crustId,
      notes: draft.notes.trim(),
      quantity,
    };
    // Se a pizza editada sumiu do carrinho no meio do caminho, o trabalho não se perde: entra como nova.
    const replaced = !!draft.editingId && this.cart.replacePizza(draft.editingId, line);
    if (!replaced) this.cart.addPizza(line);
    this.builder.reset();
    this.setStep(0);
    return true;
  }

  /** Abre uma pizza do carrinho para edição, no passo dos sabores. `false` se ela não existe. */
  startEdit(lineId: string): boolean {
    const line = this.cart.snapshot.pizzas.find((p) => p.id === lineId);
    if (!line) return false;
    this.builder.load(line);
    this.setStep(1);
    return true;
  }

  isEditing(): boolean {
    return !!this.builder.snapshot.editingId;
  }

  /** Ao abrir o montador: edição de uma pizza que já saiu do carrinho vira pizza nova (a antiga não ressuscita). */
  reconcileEdit(): void {
    const id = this.builder.snapshot.editingId;
    if (id && !this.cart.snapshot.pizzas.some((p) => p.id === id)) this.builder.clearEditing();
  }

  /** Descarta a edição: o carrinho fica como estava. */
  cancelEdit(): void {
    this.reset();
  }

  reset(): void {
    this.builder.reset();
    this.setStep(0);
  }

  /** Passo atual do assistente (0 = tamanho ... 4 = revisão), salvo para sobreviver a um recarregamento. */
  getStep(): number {
    const saved = Number(this.persistence.read<number>(STEP_KEY, 0));
    return Number.isInteger(saved) && saved >= 0 && saved <= 4 ? saved : 0;
  }

  setStep(step: number): void {
    this.persistence.write(STEP_KEY, step);
  }
}
