import { PizzaSizeId } from './pizza-menu.interface';

export interface PizzaLine {
  id: string;
  size: PizzaSizeId;
  flavorIds: string[];
  /** Opção escolhida por sabor (id do sabor -> id da opção). Ausente em pedido salvo antes de existir a escolha. */
  flavorOptions?: Record<string, string>;
  crustId: string | null;
  notes: string;
  quantity: number;
}

export interface DrinkLine {
  id: string;
  drinkId: string;
  quantity: number;
}

export interface CartState {
  pizzas: PizzaLine[];
  drinks: DrinkLine[];
}

export type NewPizzaLine = Omit<PizzaLine, 'id'>;

/** Pizza em montagem, salva a cada alteração para sobreviver a um recarregamento. */
export interface PizzaBuilderDraft {
  size: PizzaSizeId | null;
  flavorIds: string[];
  /** Opção escolhida por sabor (id do sabor -> id da opção). */
  flavorOptions: Record<string, string>;
  crustId: string | null;
  notes: string;
  /** Id da pizza do carrinho que está sendo editada; `null` = montando uma pizza nova. */
  editingId: string | null;
  /** Quantidade de pizzas iguais (só é diferente de 1 ao editar uma linha do carrinho). */
  quantity: number;
}

export type PaymentMethod = 'pix' | 'cartao' | 'dinheiro';

export interface CheckoutDraft {
  name: string;
  phone: string;
  /** `true` = cliente não sabe o CEP: preenche rua, número, bairro, cidade e UF à mão (o CEP não é exigido). */
  manualAddress: boolean;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  payment: PaymentMethod | null;
  /** Valor pelo qual o cliente precisa de troco. Só vale com pagamento em dinheiro. */
  changeFor: string;
  generalNotes: string;
}

export type CheckoutField = keyof CheckoutDraft | 'cart';
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;
