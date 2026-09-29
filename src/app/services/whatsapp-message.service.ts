import { Injectable } from '@angular/core';
import { STORE_INFO } from '../data/store-info';
import { CartState, CheckoutDraft, PaymentMethod } from '../interfaces/cart.interface';
import { CatalogService } from './catalog.service';
import { FormatService } from './format.service';
import { PricingService } from './pricing.service';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
};

/** Aviso exibido na tela do checkout (voz da loja). Não faz parte da mensagem do cliente. */
export const DELIVERY_FEE_NOTICE =
  'A taxa de entrega será calculada e informada pela loja na confirmação do pedido pelo WhatsApp.';

/** Monta a mensagem do pedido e o link wa.me. Não calcula nem exibe taxa de entrega. */
@Injectable({ providedIn: 'root' })
export class WhatsappMessageService {
  constructor(
    private catalog: CatalogService,
    private format: FormatService,
    private pricing: PricingService
  ) {}

  paymentLabel(method: PaymentMethod): string {
    return PAYMENT_LABELS[method];
  }

  /**
   * Mensagem em primeira pessoa, como o cliente pedindo. Só texto e negrito do WhatsApp:
   * emojis (acima de U+FFFF) chegam quebrados via wa.me. Nunca calcula taxa de entrega.
   */
  buildMessage(cart: CartState, draft: CheckoutDraft): string {
    const blocks: string[][] = [];

    blocks.push([`Olá, ${STORE_INFO.name}! Sou *${draft.name.trim()}* e gostaria de fazer um pedido:`]);

    let index = 1;
    for (const pizza of cart.pizzas) blocks.push(this.pizzaLines(index++, pizza));
    for (const drink of cart.drinks) blocks.push(this.drinkLines(index++, drink));

    const total = this.pricing.cartTotal(cart);
    if (total !== null) blocks.push([`*Total dos itens:* ${this.money(total)} (entrega não inclusa)`]);

    blocks.push(this.deliveryLines(draft));

    const payment = this.paymentLines(draft);
    if (payment.length) blocks.push(payment);

    const notes = draft.generalNotes.trim();
    if (notes) blocks.push(['*Observações*', notes]);

    blocks.push([
      total === null
        ? 'Aguardo a confirmação do valor total e da taxa de entrega. Obrigado!'
        : 'Aguardo a confirmação da taxa de entrega e do valor final. Obrigado!',
    ]);

    return blocks.map((lines) => lines.join('\n')).join('\n\n');
  }

  buildLink(cart: CartState, draft: CheckoutDraft): string {
    const text = encodeURIComponent(this.buildMessage(cart, draft));
    return `https://wa.me/${STORE_INFO.whatsappNumber}?text=${text}`;
  }

  private pizzaLines(index: number, pizza: CartState['pizzas'][number]): string[] {
    const size = this.catalog.getSize(pizza.size);
    const flavors = pizza.flavorIds.map((id) => this.catalog.getFlavor(id)?.name ?? id);
    const total = this.pricing.pizzaLineTotal(pizza);

    const head = [`*${index}. Pizza ${size?.label ?? pizza.size}*`];
    if (size) head.push(`${size.slices} fatias`);
    if (pizza.quantity > 1) head.push(`${pizza.quantity}x`);

    const out = [head.join(' · '), `Sabores: ${this.format.list(flavors)}`];
    // Sem borda não vira linha: menos ruído.
    if (pizza.crustId) out.push(`Borda: ${this.catalog.getCrust(pizza.crustId)?.label ?? pizza.crustId}`);
    // Uma linha só: quebras de linha nas observações desalinhariam a mensagem.
    const notes = pizza.notes.replace(/\s*\n+\s*/g, ' / ').trim();
    if (notes) out.push(`Obs.: ${notes}`);
    if (total !== null) out.push(`Valor: ${this.money(total)}`);
    return out;
  }

  private drinkLines(index: number, drink: CartState['drinks'][number]): string[] {
    const label = this.catalog.getDrink(drink.drinkId)?.label ?? drink.drinkId;
    const total = this.pricing.drinkLineTotal(drink);

    const head = [`*${index}. ${label}*`];
    if (drink.quantity > 1) head.push(`${drink.quantity}x`);

    const out = [head.join(' · ')];
    if (total !== null) out.push(`Valor: ${this.money(total)}`);
    return out;
  }

  private deliveryLines(draft: CheckoutDraft): string[] {
    const complement = draft.complement.trim();
    return [
      '*Entrega*',
      `${draft.street.trim()}, ${draft.number.trim()}${complement ? ` — ${complement}` : ''}`,
      `${draft.neighborhood.trim()} — ${draft.city.trim()}/${draft.state.trim().toUpperCase()}`,
      `CEP ${this.format.cep(draft.cep)}`,
      `Contato: ${this.format.phone(draft.phone)}`,
    ];
  }

  private paymentLines(draft: CheckoutDraft): string[] {
    if (!draft.payment) return [];
    const label = PAYMENT_LABELS[draft.payment];
    if (draft.payment !== 'dinheiro') return ['*Pagamento*', label];
    const change = this.format.parseMoney(draft.changeFor);
    return [
      '*Pagamento*',
      change !== null && change > 0
        ? `${label} · troco para ${this.money(change)}`
        : `${label} · não preciso de troco`,
    ];
  }

  /** Moeda com espaço comum (o Intl usa espaço sem quebra, que alguns clientes exibem estranho). */
  private money(value: number): string {
    return this.format.currency(value).replace(/ /g, ' ');
  }
}
