import { Injectable } from '@angular/core';
import { CartState, CheckoutDraft, CheckoutErrors } from '../interfaces/cart.interface';
import { CatalogService } from './catalog.service';
import { FormatService } from './format.service';
import { SizeRulesService } from './size-rules.service';
import { inlineText } from './whatsapp-message.service';

/** DDDs que existem no Brasil. */
const VALID_DDD = new Set(
  [
    11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92,
    93, 94, 95, 96, 97, 98, 99,
  ].map(String)
);

/** As 27 unidades da federação. */
const VALID_UF = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS',
  'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

/** Valida o pedido completo antes de gerar o link do WhatsApp. Mensagens já prontas para exibir. */
@Injectable({ providedIn: 'root' })
export class CheckoutValidationService {
  constructor(
    private format: FormatService,
    private sizeRules: SizeRulesService,
    private catalog: CatalogService
  ) {}

  /** Nomes (sem repetir) dos itens do pedido que estão esgotados hoje: sabores, bordas e bebidas. */
  private unavailableItems(cart: CartState): string[] {
    const names: string[] = [];
    const add = (id: string | null, label: string | undefined) => {
      if (id && !this.catalog.isAvailable(id) && !names.includes(label ?? id)) names.push(label ?? id);
    };
    for (const pizza of cart.pizzas) {
      pizza.flavorIds.forEach((id) => add(id, this.catalog.getFlavor(id)?.name));
      add(pizza.crustId, pizza.crustId ? this.catalog.getCrust(pizza.crustId)?.label : undefined);
    }
    cart.drinks.forEach((d) => add(d.drinkId, this.catalog.getDrink(d.drinkId)?.label));
    return names;
  }

  validate(cart: CartState, draft: CheckoutDraft): CheckoutErrors {
    const errors: CheckoutErrors = {};

    const unavailable = this.unavailableItems(cart);
    if (cart.pizzas.length === 0 && cart.drinks.length === 0) {
      errors.cart = 'Adicione pelo menos um item ao pedido.';
    } else if (unavailable.length > 0) {
      errors.cart = `Hoje não temos: ${this.format.list(unavailable)}. Remova do pedido (ou edite a pizza) para continuar.`;
    } else if (cart.pizzas.some((p) => !this.sizeRules.validate(p.size, p.flavorIds, p.flavorOptions).valid)) {
      errors.cart = this.invalidPizzaMessage(cart);
    }

    const name = draft.name.trim();
    if (name.length < 2 || !/\p{L}/u.test(name)) errors.name = 'Informe seu nome.';

    const phoneDigits = this.format.onlyDigits(draft.phone);
    if (!this.isValidPhone(phoneDigits)) errors.phone = 'Informe um telefone válido com DDD.';

    // Sem CEP (endereço manual) o CEP não é exigido, mas todo o resto do endereço é, menos o complemento.
    if (!draft.manualAddress && this.format.onlyDigits(draft.cep).length !== 8) errors.cep = 'Informe o CEP com 8 números.';
    // Vale o texto que vai para a mensagem: emoji e marcadores do WhatsApp são apagados lá, então não contam aqui.
    if (!inlineText(draft.street)) errors.street = 'Informe a rua.';
    if (!/\d/.test(draft.number) && !/^s\/?n$/i.test(draft.number.trim())) errors.number = 'Informe o número (ou "s/n").';
    if (!inlineText(draft.neighborhood)) errors.neighborhood = 'Informe o bairro.';
    if (!inlineText(draft.city)) errors.city = 'Informe a cidade.';
    if (!VALID_UF.has(draft.state.trim().toUpperCase())) errors.state = 'Informe o estado (UF).';

    if (!draft.payment) {
      errors.payment = 'Escolha a forma de pagamento.';
    } else if (draft.payment === 'dinheiro' && draft.changeFor.trim()) {
      const value = this.format.parseMoney(draft.changeFor);
      if (value === null || value <= 0) errors.changeFor = 'Informe um valor válido para o troco.';
    }

    return errors;
  }

  /** Qual é o problema da pizza: opção por escolher (diz qual sabor) ou sabores que não cabem no tamanho. */
  private invalidPizzaMessage(cart: CartState): string {
    const pending = cart.pizzas
      .map((p) => this.sizeRules.validate(p.size, p.flavorIds, p.flavorOptions))
      .find((r) => !r.valid && r.error?.startsWith('Escolha a opção'));
    return pending?.error
      ? `${pending.error} Edite a pizza no carrinho.`
      : 'Há uma pizza com sabores inválidos para o tamanho. Revise o pedido.';
  }

  /** Celular (11 dígitos) começa com 9 depois do DDD; fixo (10) começa com 2 a 5. */
  private isValidPhone(digits: string): boolean {
    if (digits.length !== 10 && digits.length !== 11) return false;
    if (!VALID_DDD.has(digits.slice(0, 2))) return false;
    return digits.length === 11 ? digits[2] === '9' : /[2-5]/.test(digits[2]);
  }

  isValid(errors: CheckoutErrors): boolean {
    return Object.keys(errors).length === 0;
  }
}
