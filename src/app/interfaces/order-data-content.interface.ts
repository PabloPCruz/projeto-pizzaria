import { Bebida, BordaTipo, Pedido } from "./pedido.interface";
import { Endereco } from "./endereco.interface";

export interface OrderData {
    // Dados do Pedido
    tamanho: string;
    sabores: string[];
    observacoes?: string;

    // Opcionais
    borda?: BordaTipo;
    bebida?: Bebida[];

    // Dados do Endereço (baseado no modelo Endereco)
    cep?: string;
    rua: string;
    number: string;
    complemento?: string;
    bairro: string;
    cidade: string;

    // Dados adicionais
    nome?: string;
}