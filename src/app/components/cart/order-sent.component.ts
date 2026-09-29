import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CheckoutFacadeService } from '../../facade/checkout.facade.service';
import { OrderSent } from './checkout-form.component';

/** Painel exibido depois de gerar o link do WhatsApp. O carrinho NÃO é limpo aqui. */
@Component({
  selector: 'app-order-sent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-enter mx-auto max-w-xl text-center" aria-labelledby="sent-title">
      <div class="card p-8 sm:p-10">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold bg-gold/10 text-gold">
          <lucide-icon name="check" [size]="28"></lucide-icon>
        </span>
        <h2 #heading id="sent-title" tabindex="-1" class="mt-5 text-2xl font-semibold outline-none sm:text-3xl">
          Pedido pronto — envie a mensagem no WhatsApp para confirmar
        </h2>
        <p class="mt-3 text-cream-muted">
          A mensagem com seu pedido já está preenchida. Toque em enviar no WhatsApp para a loja confirmar o valor e a entrega.
        </p>

        @if (sent.blocked) {
          <p role="alert" class="mt-4 rounded-xl border border-gold/50 bg-gold/10 p-3 text-sm text-gold-light">
            O navegador bloqueou a nova aba. Use o botão abaixo para abrir o WhatsApp.
          </p>
        }

        <div class="mt-7 flex flex-col gap-3">
          <a [href]="sent.url" target="_blank" rel="noopener noreferrer" class="btn-primary py-4 text-base">
            <app-brand-icon name="whatsapp" [size]="20"></app-brand-icon>
            {{ sent.blocked ? 'Abrir WhatsApp' : 'Abrir WhatsApp novamente' }}<span class="sr-only"> (abre em nova aba)</span>
          </a>
          <button type="button" class="btn-ghost" (click)="editOrder.emit()">Voltar e editar o pedido</button>
          <button type="button" class="btn-quiet" (click)="startOver()">Fazer novo pedido</button>
        </div>
        <p class="mt-4 text-xs text-cream-dim">"Fazer novo pedido" limpa o carrinho e os dados preenchidos.</p>
      </div>
    </section>
  `,
})
export class OrderSentComponent implements OnInit {
  @Input({ required: true }) sent!: OrderSent;
  @Output() editOrder = new EventEmitter<void>();
  @Output() newOrder = new EventEmitter<void>();
  @ViewChild('heading', { static: true }) heading!: ElementRef<HTMLElement>;

  constructor(private checkout: CheckoutFacadeService) {}

  ngOnInit(): void {
    setTimeout(() => this.heading.nativeElement.focus());
  }

  startOver(): void {
    this.checkout.startOver();
    this.newOrder.emit();
  }
}
