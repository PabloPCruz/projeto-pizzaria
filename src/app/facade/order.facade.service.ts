import { Bebida, opcoesBebida } from '../interfaces/drinks.interface';
import { Borda } from '../interfaces/border.interface';
import { OrderData } from '../interfaces/order-data.interface';
import { Injectable } from '@angular/core';
import { OrderService } from '../services/order.service';
import { FormatService } from '../services/format.service';

@Injectable({
  providedIn: 'root',
})
export class OrderFacadeService {
  private orderData!: OrderData;

  constructor(
    private orderService: OrderService,
    private formatService: FormatService
  ) {}

  // Métodos para atualizar dados específicos do pedido
  setPedidoData(pedido: OrderData): void {
    this.orderData.tamanho = pedido.tamanho;
    this.orderData.sabores = [...pedido.sabores];
    this.orderData.observacoes = pedido.observacoes;
  }

  setEnderecoData(endereco: OrderData): void {
    this.orderData.cep = endereco.cep;
    this.orderData.rua = endereco.rua;
    this.orderData.number = endereco.number;
    this.orderData.complemento = endereco.complemento;
    this.orderData.bairro = endereco.bairro;
    this.orderData.cidade = endereco.cidade;
  }

  setBorda(borda: Borda): void {
    this.orderData.borda = borda;
  }

  setBebidas(bebidas: Bebida[]): void {
    this.orderData.bebida = bebidas;
  }

  setNome(nome: string): void {
    this.orderData.nome = nome;
  }

  /**
   * Gera mensagem formatada de bebidas usando FormatService
   */
  private formatarBebidas(): string {
    if (!this.orderData.bebida || this.orderData.bebida.length === 0) {
      return 'Sem bebida';
    }
    return this.formatService.formatarBebidas(this.orderData.bebida);
  }

  /**
   * Formata borda usando FormatService (sem duplicação)
   */
  private formatarBorda(): string {
    return this.formatService.formatarBorda(this.orderData.borda);
  }

  /**
   * Gera mensagem para WhatsApp com dados do pedido
   */
  gerarMensagemWhatsapp(): string {
    const msg = `Boa noite! Segue meu pedido realizado no site, por gentileza confirmar o valor:

${this.orderData.nome ? `Nome: ${this.orderData.nome}` : ''}
Pedido: ${this.orderData.tamanho}
Sabores: ${this.orderData.sabores.join(', ')}
Bebida: ${this.formatarBebidas()}
Borda: ${this.formatarBorda()}
Observações: ${this.orderData.observacoes || 'Não possui'}
Endereço: Rua ${this.orderData.rua}, Número: ${this.orderData.number}, Complemento: ${this.orderData.complemento || 'N/A'}, Bairro: ${this.orderData.bairro}, Cidade: ${this.orderData.cidade}`;

    return encodeURIComponent(msg.trim());
  }

  /**
   * Limpa o pedido
   */
  clearOrder(): void {
    this.orderData = {
      tamanho: '',
      sabores: [],
      observacoes: '',
      borda: undefined,
      bebida: [],
      cep: '',
      rua: '',
      number: '',
      complemento: '',
      bairro: '',
      cidade: '',
      nome: '',
    };
  }

  /**
   * Valida se o pedido está completo
   */
  isOrderValid(): boolean {
    return !!(
      this.orderData.tamanho &&
      this.orderData.sabores.length > 0 &&
      this.orderData.rua &&
      this.orderData.number &&
      this.orderData.bairro &&
      this.orderData.cidade
    );
  }

  /**
   * Getters específicos para facilitar o uso no componente
   */
  getPedidoData() {
    return {
      tamanho: this.orderData.tamanho,
      sabores: this.orderData.sabores,
      observacoes: this.orderData.observacoes,
    };
  }

  getEnderecoData() {
    return {
      cep: this.orderData.cep,
      rua: this.orderData.rua,
      number: this.orderData.number,
      complemento: this.orderData.complemento,
      bairro: this.orderData.bairro,
      cidade: this.orderData.cidade,
    };
  }

  getBorda(): Borda | undefined {
    return this.orderData.borda;
  }

  getBebidas(): Bebida[] {
    return this.orderData.bebida || [];
  }
}
