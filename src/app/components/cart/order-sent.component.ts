import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CheckoutFacadeService } from '../../facade/checkout.facade.service';
import { OrderSent } from './checkout-form.component';

/** Painel exibido depois de gerar o link do WhatsApp. O carrinho NÃO é limpo aqui. */
@Component({
  selector: 'app-order-sent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="enter-soft mx-auto max-w-xl text-center" aria-labelledby="sent-title">
      <div class="card p-7 sm:p-10">
        <span class="mx-auto flex h-14 w-14 animate-check-in items-center justify-center rounded-full border border-gold bg-gold/10 text-gold">
          <lucide-icon name="check" [size]="28"></lucide-icon>
        </span>
        <h2 #heading id="sent-title" tabindex="-1" class="title-sub mt-5 outline-none">
          Falta só enviar no WhatsApp
        </h2>
        <p class="mt-3 font-semibold text-gold-light">Seu pedido ainda não foi enviado para a loja.</p>
        <p class="mt-2 text-cream-muted">
          A mensagem com seu pedido já está preenchida. Toque em enviar no WhatsApp para a loja confirmar o valor e a entrega.
        </p>

        @if (sent.blocked) {
          <p role="alert" class="mt-4 rounded-xl border border-gold/40 bg-gold/[.07] p-3 text-sm text-gold-light">
            {{ sent.inApp ? 'Toque no botão abaixo para abrir o WhatsApp.' : 'O navegador bloqueou a nova aba. Use o botão abaixo para abrir o WhatsApp.' }}
          </p>
        }

        <div class="mt-7 flex flex-col gap-3">
          <a [href]="sent.url" target="_blank" rel="noopener noreferrer" class="btn-primary py-4 text-base">
            <app-brand-icon name="whatsapp" [size]="20"></app-brand-icon>
            {{ sent.blocked ? 'Abrir WhatsApp' : 'Abrir WhatsApp novamente' }}<span class="sr-only"> (abre em nova aba)</span>
          </a>
          @if (sent.message) {
            <button type="button" class="btn-ghost" (click)="copy()">{{ copied ? 'Mensagem copiada' : 'Copiar mensagem do pedido' }}</button>
            <span class="sr-only" role="status">{{ copied ? 'Mensagem copiada.' : copyFailed ? 'Não foi possível copiar.' : '' }}</span>
          }
          <button type="button" class="btn-ghost" (click)="editOrder.emit()">Voltar e editar o pedido</button>
          @if (confirmingNew) {
            <div class="animate-fade-in rounded-xl border border-ink-400 p-4 text-left" role="group" aria-label="Confirmar novo pedido">
              <p class="text-sm text-cream-muted">Apagar o carrinho e os dados preenchidos e começar de novo?</p>
              <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" id="confirm-new-order" class="btn-danger flex-1" (click)="startOver()">Sim, apagar tudo</button>
                <button type="button" class="btn-ghost flex-1" (click)="confirmingNew = false">Cancelar</button>
              </div>
            </div>
          } @else {
            <button type="button" class="btn-quiet" (click)="askNewOrder()">Fazer novo pedido</button>
          }
        </div>
        <p class="mt-4 text-sm text-cream-dim">"Fazer novo pedido" limpa o carrinho e os dados preenchidos.</p>
      </div>
    </section>
  `,
})
export class OrderSentComponent implements OnInit {
  @Input({ required: true }) sent!: OrderSent;
  @Output() editOrder = new EventEmitter<void>();
  @Output() newOrder = new EventEmitter<void>();
  @ViewChild('heading', { static: true }) heading!: ElementRef<HTMLElement>;

  copied = false;
  copyFailed = false;
  /** Apagar tudo pede confirmação: um toque sem querer não perde o pedido. */
  confirmingNew = false;

  constructor(
    private checkout: CheckoutFacadeService,
    private cdr: ChangeDetectorRef
  ) {}

  /** Copia o texto do pedido (para colar no WhatsApp quando o link não abre ou o pedido é muito grande). */
  async copy(): Promise<void> {
    const text = this.sent.message ?? '';
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = this.legacyCopy(text);
    }
    this.copied = ok;
    this.copyFailed = !ok;
    this.cdr.markForCheck();
  }

  private legacyCopy(text: string): boolean {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      area.remove();
    }
  }

  ngOnInit(): void {
    setTimeout(() => this.heading.nativeElement.focus());
  }

  askNewOrder(): void {
    this.confirmingNew = true;
    setTimeout(() => document.getElementById('confirm-new-order')?.focus());
  }

  startOver(): void {
    this.checkout.startOver();
    this.newOrder.emit();
  }
}
