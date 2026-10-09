import { InjectionToken } from '@angular/core';
import { MenuPriceTable, PizzaSizeId, PriceTable } from '../interfaces/pizza-menu.interface';

/**
 * PREÇOS INFORMATIVOS DO CARDÁPIO (valores informados pela loja em 2026-10-09).
 * Servem só para o cliente consultar: NÃO entram em total, carrinho nem na mensagem do WhatsApp
 * (por decisão do dono, a loja confirma o valor do pedido). É a única fonte desses valores.
 *
 * pizza: por tamanho e faixa. Pizza com sabor especial: vale o valor dos especiais para a pizza inteira.
 *        Doce não tem faixa própria: segue a dos tradicionais.
 * crust: por borda e tamanho. Borda ausente = a loja ainda não informou.
 * drink: por id de bebida. Bebida ausente = a loja ainda não informou (hoje todas têm valor).
 */
const BORDA_CATUPIRY: Record<PizzaSizeId, number> = { pequena: 11, media: 11.5, grande: 12, big: 12.5, gigante: 13 };
const BORDA_DEMAIS: Record<PizzaSizeId, number> = { pequena: 12, media: 12.5, grande: 13, big: 14.5, gigante: 15 };

export const MENU_PRICES: MenuPriceTable = {
  pizza: {
    pequena: { tradicional: 34.9, especial: 38.9 },
    media: { tradicional: 39.9, especial: 48.9 },
    grande: { tradicional: 49.9, especial: 62.9 },
    big: { tradicional: 57.9, especial: 67.9 },
    gigante: { tradicional: 64.9, especial: 74.9 },
  },
  crust: {
    catupiry: BORDA_CATUPIRY,
    cheddar: BORDA_DEMAIS,
    'catupiry-cheddar': BORDA_DEMAIS,
    nutella: BORDA_DEMAIS,
    'chocolate-ao-leite': BORDA_DEMAIS,
    'chocolate-branco': BORDA_DEMAIS,
    // "Bem casado" na lista da loja = chocolate ao leite com chocolate branco.
    'chocolate-ao-leite-branco': BORDA_DEMAIS,
  },
  drink: {
    'coca-2l': 14,
    'coca-zero-2l': 14,
    'coca-600ml': 8,
    'coca-lata': 6,
    'guarana-2l': 14,
    'fanta-2l': 13,
    'sprite-2l': 13,
    'kuat-2l': 13,
    // A loja informou "Coca 1L" a R$ 10,00 e disse que a Kuat 1,5L tem o mesmo valor.
    'kuat-1-5l': 10,
    'brahma-lata': 4.5,
  },
};

export const MENU_PRICE_TABLE = new InjectionToken<MenuPriceTable>('MENU_PRICE_TABLE', {
  providedIn: 'root',
  factory: () => MENU_PRICES,
});

/**
 * TABELA DE COBRANÇA — hoje vazia DE PROPÓSITO: o dono decidiu que os valores do cardápio são só informativos.
 * Preenchida, o site passa a mostrar totais no carrinho e a mensagem do WhatsApp ganha "Valor:" e "Total dos itens".
 * (A borda aqui tem preço único; a da tabela informativa varia por tamanho, então o PricingService precisaria mudar antes.)
 * Enquanto um valor estiver ausente, o site não mostra total e a mensagem do WhatsApp informa que o valor
 * será confirmado pelo atendente.
 *
 * pizza: por tamanho e categoria de sabor (tradicional | especial | doce); vale o sabor mais caro da pizza.
 * crust: por borda (ids em menu.data.ts). Sem borda custa 0.
 * drink: por id de bebida (ids em menu.data.ts).
 * Exemplo: pizza: { grande: { tradicional: 59.9, especial: 69.9, doce: 64.9 } }, crust: { catupiry: 8 }, drink: { 'coca-2l': 14 }
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
