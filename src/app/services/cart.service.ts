import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartState, DrinkLine, NewPizzaLine, PizzaLine } from '../interfaces/cart.interface';
import { PizzaSizeId } from '../interfaces/pizza-menu.interface';
import { CatalogService } from './catalog.service';
import { PersistenceService } from './persistence.service';
import { SizeRulesService } from './size-rules.service';

const STORAGE_KEY = 'cart';
const MAX_QUANTITY = 20;
/** Carrinho esquecido por mais de 3 dias não volta de surpresa. */
const CART_TTL_MS = 3 * 24 * 60 * 60 * 1000;
/** Mesmo limite do campo de observações da pizza. */
const MAX_NOTES = 300;

const EMPTY_CART: CartState = { pizzas: [], drinks: [] };

/** Carrinho com pizzas e bebidas. Todo estado novo é salvo no localStorage imediatamente. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly state = new BehaviorSubject<CartState>(EMPTY_CART);

  readonly state$: Observable<CartState> = this.state.asObservable();
  readonly itemCount$: Observable<number> = this.state$.pipe(map((s) => this.countItems(s)));

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private persistence: PersistenceService,
    private catalog: CatalogService,
    private sizeRules: SizeRulesService
  ) {
    this.hydrate();
    // Outra aba mexeu no carrinho: esta passa a mostrar o mesmo (a última gravação vale, sem sobrescrever às cegas).
    this.persistence.changes$(STORAGE_KEY).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.hydrate());
  }

  get snapshot(): CartState {
    return this.state.value;
  }

  addPizza(pizza: NewPizzaLine): void {
    const line: PizzaLine = { ...pizza, id: this.newId(), quantity: this.clamp(pizza.quantity) };
    this.commit({ ...this.snapshot, pizzas: [...this.snapshot.pizzas, line] });
  }

  /** Troca os dados de uma pizza já no carrinho, mantendo o id e a posição. `false` se ela não existe mais. */
  replacePizza(id: string, pizza: NewPizzaLine): boolean {
    if (!this.snapshot.pizzas.some((p) => p.id === id)) return false;
    const line: PizzaLine = { ...pizza, id, quantity: this.clamp(pizza.quantity) };
    this.commit({ ...this.snapshot, pizzas: this.snapshot.pizzas.map((p) => (p.id === id ? line : p)) });
    return true;
  }

  /** Repetir a mesma bebida soma a quantidade em vez de criar outra linha. */
  addDrink(drinkId: string, quantity = 1): void {
    const drinks = this.snapshot.drinks;
    const existing = drinks.find((d) => d.drinkId === drinkId);
    const next: DrinkLine[] = existing
      ? drinks.map((d) => (d === existing ? { ...d, quantity: this.clamp(d.quantity + quantity) } : d))
      : [...drinks, { id: this.newId(), drinkId, quantity: this.clamp(quantity) }];
    this.commit({ ...this.snapshot, drinks: next });
  }

  setPizzaQuantity(id: string, quantity: number): void {
    if (quantity < 1) return this.removePizza(id);
    this.commit({
      ...this.snapshot,
      pizzas: this.snapshot.pizzas.map((p) => (p.id === id ? { ...p, quantity: this.clamp(quantity) } : p)),
    });
  }

  setDrinkQuantity(id: string, quantity: number): void {
    if (quantity < 1) return this.removeDrink(id);
    this.commit({
      ...this.snapshot,
      drinks: this.snapshot.drinks.map((d) => (d.id === id ? { ...d, quantity: this.clamp(quantity) } : d)),
    });
  }

  removePizza(id: string): void {
    this.commit({ ...this.snapshot, pizzas: this.snapshot.pizzas.filter((p) => p.id !== id) });
  }

  removeDrink(id: string): void {
    this.commit({ ...this.snapshot, drinks: this.snapshot.drinks.filter((d) => d.id !== id) });
  }

  clear(): void {
    this.commit(EMPTY_CART);
  }

  private hydrate(): void {
    this.state.next(this.sanitize(this.persistence.read<unknown>(STORAGE_KEY, null, CART_TTL_MS)));
  }

  private commit(next: CartState): void {
    this.state.next(next);
    this.persistence.write(STORAGE_KEY, next);
  }

  private countItems(state: CartState): number {
    return [...state.pizzas, ...state.drinks].reduce((sum, l) => sum + l.quantity, 0);
  }

  private clamp(quantity: number): number {
    return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity) || 1));
  }

  private newId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Reconstrói o carrinho salvo linha a linha, validando tipos e regras do cardápio.
   * Linhas inválidas (tamanho/bebida desconhecidos, sem nenhum sabor válido) são descartadas;
   * sabores excedentes ao limite do tamanho são cortados.
   */
  private sanitize(raw: unknown): CartState {
    const data = raw as { pizzas?: unknown; drinks?: unknown } | null;
    if (!data || typeof data !== 'object' || !Array.isArray(data.pizzas) || !Array.isArray(data.drinks)) {
      return EMPTY_CART;
    }

    const pizzas: PizzaLine[] = [];
    for (const item of data.pizzas as Record<string, unknown>[]) {
      if (!item || typeof item !== 'object') continue;
      const size = typeof item['size'] === 'string' ? this.catalog.getSize(item['size'] as PizzaSizeId)?.id : undefined;
      if (!size) continue;
      const flavorIds = this.sizeRules.trimToSize(size, this.catalog.sanitizeFlavorIds(item['flavorIds']));
      if (flavorIds.length === 0) continue;
      const crustId = typeof item['crustId'] === 'string' && this.catalog.getCrust(item['crustId']) ? item['crustId'] : null;
      pizzas.push({
        id: typeof item['id'] === 'string' && item['id'] ? item['id'] : this.newId(),
        size,
        flavorIds,
        crustId,
        notes: typeof item['notes'] === 'string' ? item['notes'].slice(0, MAX_NOTES) : '',
        quantity: this.clamp(Number(item['quantity'])),
      });
    }

    const drinks: DrinkLine[] = [];
    for (const item of data.drinks as Record<string, unknown>[]) {
      if (!item || typeof item !== 'object') continue;
      if (typeof item['drinkId'] !== 'string' || !this.catalog.getDrink(item['drinkId'])) continue;
      // A mesma bebida em duas linhas (dado antigo ou editado à mão) vira uma só, somando a quantidade.
      const existing = drinks.find((d) => d.drinkId === item['drinkId']);
      if (existing) {
        existing.quantity = this.clamp(existing.quantity + this.clamp(Number(item['quantity'])));
        continue;
      }
      drinks.push({
        id: typeof item['id'] === 'string' && item['id'] ? item['id'] : this.newId(),
        drinkId: item['drinkId'],
        quantity: this.clamp(Number(item['quantity'])),
      });
    }

    // Ids repetidos (pizzas e bebidas) quebrariam edição e remoção: a repetição ganha um id novo.
    const seen = new Set<string>();
    for (const line of [...pizzas, ...drinks]) {
      if (seen.has(line.id)) line.id = this.newId();
      seen.add(line.id);
    }

    return { pizzas, drinks };
  }
}
