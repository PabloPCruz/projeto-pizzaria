export type PizzaSizeId = 'pequena' | 'media' | 'grande' | 'big' | 'gigante';

export interface PizzaSize {
  id: PizzaSizeId;
  label: string;
  maxFlavors: number;
  slices: number;
}

export type FlavorCategory = 'tradicional' | 'especial' | 'doce';

export interface PizzaFlavor {
  id: string;
  name: string;
  category: FlavorCategory;
  /** Ingredientes em texto corrido. Vazio = a loja ainda não informou. */
  ingredients: string;
  /** Opção citada no cardápio impresso, ex.: "Opção catupiry". O cliente detalha em observações. */
  optionHint?: string;
  image?: string;
}

export type CrustId =
  | 'catupiry'
  | 'catupiry-cheddar'
  | 'cheddar'
  | 'nutella'
  | 'chocolate-ao-leite'
  | 'chocolate-branco'
  | 'chocolate-ao-leite-branco';

export interface Crust {
  id: CrustId;
  label: string;
}

export type DrinkGroup = 'refrigerante' | 'cerveja';

export interface Drink {
  id: string;
  label: string;
  group: DrinkGroup;
}

/**
 * Tabela de preços editável. Um valor ausente significa "preço ainda não informado":
 * a interface não exibe valores, a mensagem do WhatsApp omite o total e o cliente pede a confirmação da loja.
 */
export interface PriceTable {
  /** Preço da pizza por tamanho e categoria de sabor. Com vários sabores vale o mais caro. */
  pizza: Partial<Record<PizzaSizeId, Partial<Record<FlavorCategory, number>>>>;
  crust: Partial<Record<CrustId, number>>;
  drink: Record<string, number | undefined>;
}
