import { InjectionToken } from '@angular/core';
import { PriceTable } from '../interfaces/pizza-menu.interface';

/**
 * TABELA DE PREÇOS — preencha os valores em reais (ex.: 49.9).
 * Enquanto um valor estiver ausente, o site não mostra preço nem total e a mensagem
 * do WhatsApp informa que o valor será confirmado pelo atendente.
 *
 * pizza: por tamanho e categoria de sabor (tradicional | especial | doce).
 *        Com vários sabores na mesma pizza vale o preço do sabor mais caro.
 * crust: por borda (ids em menu.data.ts). Sem borda custa 0.
 * drink: por id de bebida (ids em menu.data.ts).
 *
 * Exemplo:
 *   pizza: { grande: { tradicional: 59.9, especial: 69.9, doce: 64.9 } },
 *   crust: { catupiry: 8 },
 *   drink: { 'coca-2l': 14 },
 */
export const PRICES: PriceTable = {
  pizza: {},
  crust: {},
  drink: {},
};

export const PRICE_TABLE = new InjectionToken<PriceTable>('PRICE_TABLE', {
  providedIn: 'root',
  factory: () => PRICES,
});
