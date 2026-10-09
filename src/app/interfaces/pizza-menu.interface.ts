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
  /** `true` = a foto é a mais parecida disponível, não a do sabor: a tela avisa "Foto ilustrativa". */
  illustrative?: boolean;
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

/** Faixa de preço da pizza: o doce segue a dos tradicionais, o especial tem a sua. */
export type PriceTier = 'tradicional' | 'especial';

/**
 * Preços INFORMATIVOS do cardápio (só exibição). Não entram em totais, carrinho nem na mensagem do WhatsApp.
 * Um valor ausente significa "a loja ainda não informou": a tela não mostra nada para o item.
 */
export interface MenuPriceTable {
  pizza: Record<PizzaSizeId, Record<PriceTier, number>>;
  /** A borda custa diferente conforme o tamanho da pizza. */
  crust: Partial<Record<CrustId, Record<PizzaSizeId, number>>>;
  drink: Partial<Record<string, number>>;
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
