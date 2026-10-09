import { InjectionToken } from '@angular/core';

/**
 * ITENS ESGOTADOS HOJE — ids de sabores, bordas e bebidas (os ids estão em menu.data.ts).
 * Vazio = tudo disponível. Para marcar algo como esgotado, coloque o id aqui e publique o site;
 * para liberar de novo, tire o id e publique. Item esgotado aparece como "Indisponível hoje" e não pode ser escolhido;
 * um pedido que já o contenha não é enviado até o item ser removido.
 *
 * Exemplo: ['tradicional-calabresa', 'nutella', 'fanta-2l']
 */
export const UNAVAILABLE_ITEM_IDS: readonly string[] = [];

export const UNAVAILABLE_ITEMS = new InjectionToken<readonly string[]>('UNAVAILABLE_ITEMS', {
  providedIn: 'root',
  factory: () => UNAVAILABLE_ITEM_IDS,
});
