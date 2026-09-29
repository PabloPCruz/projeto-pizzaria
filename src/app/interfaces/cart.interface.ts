import { PizzaSizeId } from './pizza-menu.interface';

export interface PizzaLine {
  id: string;
  size: PizzaSizeId;
  flavorIds: string[];
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
  crustId: string | null;
  notes: string;
}

export type PaymentMethod = 'pix' | 'cartao' | 'dinheiro';

export interface CheckoutDraft {
  name: string;
  phone: string;
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
