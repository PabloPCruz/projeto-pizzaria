import { Injectable } from '@angular/core';
import { CartState, CheckoutDraft, CheckoutErrors } from '../interfaces/cart.interface';
import { FormatService } from './format.service';
import { SizeRulesService } from './size-rules.service';

/** Valida o pedido completo antes de gerar o link do WhatsApp. Mensagens já prontas para exibir. */
@Injectable({ providedIn: 'root' })
export class CheckoutValidationService {
  constructor(
    private format: FormatService,
    private sizeRules: SizeRulesService
  ) {}

  validate(cart: CartState, draft: CheckoutDraft): CheckoutErrors {
    const errors: CheckoutErrors = {};

    if (cart.pizzas.length === 0 && cart.drinks.length === 0) {
      errors.cart = 'Adicione pelo menos um item ao pedido.';
    } else if (cart.pizzas.some((p) => !this.sizeRules.validate(p.size, p.flavorIds).valid)) {
      errors.cart = 'Há uma pizza com sabores inválidos para o tamanho. Revise o pedido.';
    }

    if (!draft.name.trim()) errors.name = 'Informe seu nome.';

    const phoneDigits = this.format.onlyDigits(draft.phone);
    if (phoneDigits.length < 10 || phoneDigits.length > 11) errors.phone = 'Informe um telefone com DDD.';

    // Sem CEP (endereço manual) o CEP não é exigido, mas todo o resto do endereço é, menos o complemento.
    if (!draft.manualAddress && this.format.onlyDigits(draft.cep).length !== 8) errors.cep = 'Informe o CEP com 8 números.';
    if (!draft.street.trim()) errors.street = 'Informe a rua.';
    if (!draft.number.trim()) errors.number = 'Informe o número (ou "s/n").';
    if (!draft.neighborhood.trim()) errors.neighborhood = 'Informe o bairro.';
    if (!draft.city.trim()) errors.city = 'Informe a cidade.';
    if (!/^[A-Za-z]{2}$/.test(draft.state.trim())) errors.state = 'Informe o estado (UF).';

    if (!draft.payment) {
      errors.payment = 'Escolha a forma de pagamento.';
    } else if (draft.payment === 'dinheiro' && draft.changeFor.trim()) {
      const value = this.format.parseMoney(draft.changeFor);
      if (value === null || value <= 0) errors.changeFor = 'Informe um valor válido para o troco.';
    }

    return errors;
  }

  isValid(errors: CheckoutErrors): boolean {
    return Object.keys(errors).length === 0;
  }
}
