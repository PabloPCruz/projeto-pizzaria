import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MenuFacadeService } from '../../facade/menu.facade.service';
import { BuilderView } from '../../facade/order.facade.service';

/** Resumo da pizza em montagem (barra lateral no desktop e passo de revisão). */
@Component({
  selector: 'app-pizza-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card p-5">
      <h3 class="font-display text-xl font-semibold">Sua pizza</h3>
      <div class="rule-gold !my-4" aria-hidden="true"></div>
      <dl class="space-y-4 text-sm">
        <div>
          <dt class="text-xs font-semibold uppercase tracking-widest text-gold">Tamanho</dt>
          <dd class="mt-1">
            @if (size; as s) {
              {{ s.label }} · {{ s.slices }} fatias
            } @else {
              <span class="text-cream-dim">Não escolhido</span>
            }
          </dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase tracking-widest text-gold">
            Sabores ({{ view.draft.flavorIds.length }}/{{ view.maxFlavors }})
          </dt>
          <dd class="mt-1">
            @if (flavorNames.length > 0) {
              <ul class="space-y-0.5">
                @for (name of flavorNames; track name) {
                  <li>{{ name }}</li>
                }
              </ul>
            } @else {
              <span class="text-cream-dim">Nenhum sabor ainda</span>
            }
          </dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase tracking-widest text-gold">Borda</dt>
          <dd class="mt-1">{{ crustLabel }}</dd>
        </div>
        @if (view.draft.notes.trim()) {
          <div>
            <dt class="text-xs font-semibold uppercase tracking-widest text-gold">Observações</dt>
            <dd class="mt-1 whitespace-pre-line break-words text-cream-muted">{{ view.draft.notes }}</dd>
          </div>
        }
      </dl>
      @if (view.draft.size) {
        <div class="mt-5 flex items-center justify-between border-t border-ink-500/60 pt-4">
          <span class="text-sm text-cream-muted">Valor unitário</span>
          <app-price [value]="view.unitPrice | money"></app-price>
        </div>
      }
    </div>
  `,
})
export class PizzaSummaryComponent {
  @Input({ required: true }) view!: BuilderView;

  constructor(private menu: MenuFacadeService) {}

  get size() {
    return this.view.draft.size ? this.menu.getSize(this.view.draft.size) : undefined;
  }

  get flavorNames(): string[] {
    return this.view.draft.flavorIds.map((id) => this.menu.getFlavor(id)?.name ?? id);
  }

  get crustLabel(): string {
    const id = this.view.draft.crustId;
    return id ? this.menu.getCrust(id)?.label ?? id : 'Sem borda';
  }
}
