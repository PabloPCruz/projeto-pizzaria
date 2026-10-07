import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';
import { PizzaBuilderDraft, PizzaLine } from '../interfaces/cart.interface';
import { PizzaSizeId } from '../interfaces/pizza-menu.interface';
import { CatalogService } from './catalog.service';
import { PersistenceService } from './persistence.service';
import { SizeRulesService } from './size-rules.service';

const STORAGE_KEY = 'builder';

const MAX_QUANTITY = 20;
/** Pizza (ou edição) abandonada há mais de 3 dias é descartada. */
const BUILDER_TTL_MS = 3 * 24 * 60 * 60 * 1000;

const EMPTY_DRAFT: PizzaBuilderDraft = { size: null, flavorIds: [], crustId: null, notes: '', editingId: null, quantity: 1 };

/** Estado da pizza que o cliente está montando (persistido a cada alteração). */
@Injectable({ providedIn: 'root' })
export class PizzaBuilderService {
  private readonly draft = new BehaviorSubject<PizzaBuilderDraft>(EMPTY_DRAFT);
  readonly draft$: Observable<PizzaBuilderDraft> = this.draft.asObservable();

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private persistence: PersistenceService,
    private sizeRules: SizeRulesService,
    private catalog: CatalogService
  ) {
    this.draft.next(this.restore());
    this.persistence
      .changes$(STORAGE_KEY)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.draft.next(this.restore()));
  }

  get snapshot(): PizzaBuilderDraft {
    return this.draft.value;
  }

  /** Troca o tamanho. Devolve quantos sabores foram removidos por não caberem no novo tamanho. */
  setSize(size: PizzaSizeId): number {
    const current = this.snapshot;
    const flavorIds = this.sizeRules.trimToSize(size, current.flavorIds);
    this.commit({ ...current, size, flavorIds });
    return current.flavorIds.length - flavorIds.length;
  }

  /**
   * Marca/desmarca um sabor. Devolve `false` quando o sabor não foi adicionado
   * porque o tamanho já atingiu o limite de sabores.
   */
  toggleFlavor(flavorId: string): boolean {
    const current = this.snapshot;
    if (current.flavorIds.includes(flavorId)) {
      this.commit({ ...current, flavorIds: current.flavorIds.filter((id) => id !== flavorId) });
      return true;
    }
    if (!this.catalog.getFlavor(flavorId)) return false;
    if (!this.sizeRules.canAddFlavor(current.size, current.flavorIds)) return false;
    this.commit({ ...current, flavorIds: [...current.flavorIds, flavorId] });
    return true;
  }

  setCrust(crustId: string | null): void {
    this.commit({ ...this.snapshot, crustId });
  }

  setNotes(notes: string): void {
    this.commit({ ...this.snapshot, notes });
  }

  /** Carrega uma pizza do carrinho para edição (substitui o rascunho atual). */
  load(line: PizzaLine): void {
    this.commit({
      size: line.size,
      flavorIds: this.sizeRules.trimToSize(line.size, line.flavorIds),
      crustId: line.crustId,
      notes: line.notes,
      editingId: line.id,
      quantity: this.clampQuantity(line.quantity),
    });
  }

  reset(): void {
    this.commit(EMPTY_DRAFT);
  }

  private clampQuantity(value: unknown): number {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) ? Math.min(MAX_QUANTITY, Math.max(1, n)) : 1;
  }

  private commit(next: PizzaBuilderDraft): void {
    this.draft.next(next);
    this.persistence.write(STORAGE_KEY, next);
  }

  private restore(): PizzaBuilderDraft {
    const saved = this.persistence.read<Record<string, unknown> | null>(STORAGE_KEY, null, BUILDER_TTL_MS);
    if (!saved || typeof saved !== 'object') return EMPTY_DRAFT;
    const size =
      typeof saved['size'] === 'string' && this.catalog.getSize(saved['size'] as PizzaSizeId)
        ? (saved['size'] as PizzaSizeId)
        : null;
    const crustId =
      typeof saved['crustId'] === 'string' && this.catalog.getCrust(saved['crustId']) ? saved['crustId'] : null;
    return {
      size,
      flavorIds: this.sizeRules.trimToSize(size, this.catalog.sanitizeFlavorIds(saved['flavorIds'])),
      crustId,
      notes: typeof saved['notes'] === 'string' ? saved['notes'] : '',
      editingId: typeof saved['editingId'] === 'string' && saved['editingId'] ? saved['editingId'] : null,
      quantity: this.clampQuantity(saved['quantity']),
    };
  }
}
