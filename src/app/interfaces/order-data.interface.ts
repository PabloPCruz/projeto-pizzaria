import { Borda } from "./border.interface";
import { Bebida } from "./drinks.interface";

export interface OrderData {
  tamanho: string;
  sabores: string[];
  observacoes?: string;
  borda: Borda | undefined;
  bebida: Bebida[] | undefined;
  cep: string;
  rua: string;
  number: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  nome: string;
}