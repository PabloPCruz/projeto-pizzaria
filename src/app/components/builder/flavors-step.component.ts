import { Component, OnDestroy, ViewChild } from '@angular/core';
import { take } from 'rxjs/operators';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { BuilderView, OrderFacadeService } from '../../facade/order.facade.service';
import { FlavorCategory, PizzaFlavor } from '../../interfaces/pizza-menu.interface';
import { FlavorOptionDialogComponent } from './flavor-option-dialog.component';

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

  /** Pop-up para escolher a opção dos sabores que têm (calabresa com cebola ou catupiry, chocolate ao leite ou branco...). */
  @ViewChild(FlavorOptionDialogComponent) optionDialog?: FlavorOptionDialogComponent;

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

  /** Esgotado hoje (data/availability.ts). Um sabor esgotado já escolhido continua clicável, para poder ser retirado. */
  isUnavailable(flavor: PizzaFlavor): boolean {
    return !this.menu.isAvailable(flavor.id);
  }

  isBlocked(view: BuilderView, flavor: PizzaFlavor): boolean {
    return !this.isSelected(view, flavor) && (view.remainingFlavors === 0 || this.isUnavailable(flavor));
  }

  /** Tocar num sabor bloqueado (limite atingido): o controle está desabilitado, então explica por quê. */
  onBlockedTap(view: BuilderView, flavor: PizzaFlavor): void {
    if (!this.isBlocked(view, flavor)) return;
    this.say(this.isUnavailable(flavor) ? `${flavor.name} não está disponível hoje.` : this.limitMessage(view));
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

  /** Nome do sabor com a opção escolhida ("Calabresa (com catupiry)"). */
  flavorLabel(view: BuilderView, id: string): string {
    return this.menu.flavorLabel(id, view.draft.flavorOptions[id]);
  }

  /** "Opção: com cebola ou com catupiry" (vazio nos sabores sem opção). */
  optionsText(flavor: PizzaFlavor): string {
    return this.menu.optionsText(flavor);
  }

  /** A opção escolhida em minúsculas ("com cebola"), ou vazio se ainda não escolheu. */
  chosenText(view: BuilderView, flavor: PizzaFlavor): string {
    const id = view.draft.flavorOptions[flavor.id];
    return flavor.options?.find((o) => o.id === id)?.label.toLowerCase() ?? '';
  }

  /** O sabor tem opção para escolher. */
  hasOptions(flavor: PizzaFlavor | undefined): boolean {
    return !!flavor?.options?.length;
  }

  idHasOptions(id: string): boolean {
    return this.hasOptions(this.menu.getFlavor(id));
  }

  /** Enquanto algum sabor escolhido ainda não teve a opção definida, diz qual (é o mesmo motivo que bloqueia o "Avançar"). */
  pendingOptionError(view: BuilderView): string {
    const error = view.validation.error ?? '';
    return error.startsWith('Escolha a opção') ? error : '';
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
    // Sabor com opção: abre o pop-up para escolher já (a opção é obrigatória).
    if (!wasSelected && this.hasOptions(flavor)) this.optionDialog?.open(flavor);
  }

  remove(view: BuilderView, id: string): void {
    const flavor = this.menu.getFlavor(id);
    if (flavor) this.toggle(view, flavor);
  }

  /** Lápis ao lado do sabor: reabre o pop-up com a opção atual marcada. */
  editOption(view: BuilderView, id: string): void {
    const flavor = this.menu.getFlavor(id);
    if (flavor && this.hasOptions(flavor)) this.optionDialog?.open(flavor, view.draft.flavorOptions[id]);
  }

  /** Botão "Escolher" do aviso: abre o pop-up do primeiro sabor que ainda está sem opção. */
  choosePending(view: BuilderView): void {
    const id = view.draft.flavorIds.find((fid) => this.hasOptions(this.menu.getFlavor(fid)) && !view.draft.flavorOptions[fid]);
    if (id) this.editOption(view, id);
  }

  onOptionChosen(event: { flavorId: string; optionId: string }): void {
    this.order.selectFlavorOption(event.flavorId, event.optionId);
  }

  /** Fechou o pop-up sem escolher: sabor que ainda não tem opção sai da pizza (a opção é obrigatória). */
  onOptionDismissed(flavorId: string): void {
    this.view$.pipe(take(1)).subscribe((view) => {
      if (!view.draft.flavorIds.includes(flavorId) || view.draft.flavorOptions[flavorId]) return;
      this.order.toggleFlavor(flavorId);
      this.say(`${this.flavorName(flavorId)} não foi adicionado: escolha uma opção para incluir o sabor.`);
    });
  }

  private compute(): readonly PizzaFlavor[] {
    return this.menu.searchFlavors(this.term, this.filter === 'todos' ? undefined : this.filter);
  }
}
