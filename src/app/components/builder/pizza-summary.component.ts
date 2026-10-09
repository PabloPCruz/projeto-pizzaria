import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
          <div class="flex items-center justify-between gap-2">
            <dt class="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-gold-soft">Tamanho</dt>
            @if (editable) {
              <button type="button" class="-my-3 inline-flex min-h-[44px] items-center px-2 text-sm font-medium text-gold underline underline-offset-2 hover:text-gold-light" aria-label="Editar tamanho" (click)="edit.emit(0)">Editar</button>
            }
          </div>
          <dd class="mt-1">
            @if (size; as s) {
              {{ s.label }} · {{ s.slices }} fatias
            } @else {
              <span class="text-cream-dim">Não escolhido</span>
            }
          </dd>
        </div>
        <div>
          <div class="flex items-center justify-between gap-2">
            <dt class="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-gold-soft">
              Sabores ({{ view.draft.flavorIds.length }}/{{ view.maxFlavors }})
            </dt>
            @if (editable) {
              <button type="button" class="-my-3 inline-flex min-h-[44px] items-center px-2 text-sm font-medium text-gold underline underline-offset-2 hover:text-gold-light" aria-label="Editar sabores" (click)="edit.emit(1)">Editar</button>
            }
          </div>
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
          <div class="flex items-center justify-between gap-2">
            <dt class="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-gold-soft">Borda</dt>
            @if (editable) {
              <button type="button" class="-my-3 inline-flex min-h-[44px] items-center px-2 text-sm font-medium text-gold underline underline-offset-2 hover:text-gold-light" aria-label="Editar borda" (click)="edit.emit(2)">Editar</button>
            }
          </div>
          <dd class="mt-1">{{ crustLabel }}</dd>
        </div>
        @if (view.draft.notes.trim() || editable) {
          <div>
            <div class="flex items-center justify-between gap-2">
              <dt class="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-gold-soft">Observações</dt>
              @if (editable) {
                <button type="button" class="-my-3 inline-flex min-h-[44px] items-center px-2 text-sm font-medium text-gold underline underline-offset-2 hover:text-gold-light" aria-label="Editar observações" (click)="edit.emit(3)">Editar</button>
              }
            </div>
            @if (view.draft.notes.trim()) {
              <dd class="mt-1 whitespace-pre-line break-words text-cream-muted">{{ view.draft.notes }}</dd>
            } @else {
              <dd class="mt-1 text-cream-dim">Sem observações</dd>
            }
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
  /** Na revisão: mostra um botão "Editar" em cada parte. Emite o índice do passo (0 tamanho, 1 sabores, 2 borda, 3 observações). */
  @Input() editable = false;
  @Output() edit = new EventEmitter<number>();

  constructor(private menu: MenuFacadeService) {}

  get size() {
    return this.view.draft.size ? this.menu.getSize(this.view.draft.size) : undefined;
  }

  get flavorNames(): string[] {
    return this.view.draft.flavorIds.map((id) => this.menu.flavorLabel(id, this.view.draft.flavorOptions[id]));
  }

  get crustLabel(): string {
    const id = this.view.draft.crustId;
    return id ? this.menu.getCrust(id)?.label ?? id : 'Sem borda';
  }
}
