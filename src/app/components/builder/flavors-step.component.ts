import { Component, OnDestroy } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { BuilderView, OrderFacadeService } from '../../facade/order.facade.service';
import { FlavorCategory, PizzaFlavor } from '../../interfaces/pizza-menu.interface';

type CategoryFilter = FlavorCategory | 'todos';

const LIVE_MS = 6000;

@Component({
  selector: 'app-flavors-step',
  templateUrl: './flavors-step.component.html',
})
export class FlavorsStepComponent implements OnDestroy {
  readonly view$ = this.order.view$;
  readonly filters: readonly { id: CategoryFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    ...this.menu.categories,
  ];

  filter: CategoryFilter = 'todos';
  term = '';
  list: readonly PizzaFlavor[] = this.compute();
  /** Aviso dinâmico lido por leitores de tela (limite atingido, sabor adicionado/removido). Some sozinho. */
  live = '';
  private liveTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private menu: MenuFacadeService,
    private order: OrderFacadeService
  ) {}

  setFilter(id: CategoryFilter): void {
    this.filter = id;
    this.list = this.compute();
  }

  setTerm(value: string): void {
    this.term = value;
    this.list = this.compute();
  }

  isSelected(view: BuilderView, flavor: PizzaFlavor): boolean {
    return view.draft.flavorIds.includes(flavor.id);
  }

  isBlocked(view: BuilderView, flavor: PizzaFlavor): boolean {
    return !this.isSelected(view, flavor) && view.remainingFlavors === 0;
  }

  /** Tocar num sabor bloqueado (limite atingido): o controle está desabilitado, então explica por quê. */
  onBlockedTap(view: BuilderView, flavor: PizzaFlavor): void {
    if (this.isBlocked(view, flavor)) this.say(this.limitMessage(view));
  }

  /** Mostra o aviso e o apaga depois de 6 s (já foi anunciado; não fica parado sobre a lista). */
  private say(message: string): void {
    this.live = message;
    clearTimeout(this.liveTimer);
    this.liveTimer = setTimeout(() => (this.live = ''), LIVE_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.liveTimer);
  }

  private limitMessage(view: BuilderView): string {
    return `Limite de ${view.maxFlavors} ${view.maxFlavors === 1 ? 'sabor' : 'sabores'} atingido. Remova um sabor para escolher outro.`;
  }

  flavorName(id: string): string {
    return this.menu.getFlavor(id)?.name ?? id;
  }

  toggle(view: BuilderView, flavor: PizzaFlavor): void {
    const wasSelected = this.isSelected(view, flavor);
    const ok = this.order.toggleFlavor(flavor.id);
    if (!ok) {
      this.say(this.limitMessage(view));
      return;
    }
    const count = view.draft.flavorIds.length + (wasSelected ? -1 : 1);
    this.say(
      wasSelected
      ? `${flavor.name} removido. ${count} de ${view.maxFlavors} sabores.`
      : count >= view.maxFlavors
        ? `${flavor.name} adicionado. Limite de ${view.maxFlavors} ${view.maxFlavors === 1 ? 'sabor' : 'sabores'} atingido: os demais sabores foram desabilitados.`
        : `${flavor.name} adicionado. ${count} de ${view.maxFlavors} sabores.`
    );
  }

  remove(view: BuilderView, id: string): void {
    const flavor = this.menu.getFlavor(id);
    if (flavor) this.toggle(view, flavor);
  }

  private compute(): readonly PizzaFlavor[] {
    return this.menu.searchFlavors(this.term, this.filter === 'todos' ? undefined : this.filter);
  }
}
