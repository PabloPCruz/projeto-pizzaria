import { Bebida, opcoesBebida } from '../interfaces/drinks.interface';
import { Borda } from '../interfaces/border.interface';
import { OrderData } from '../interfaces/order-data.interface';
import { Injectable } from '@angular/core';
import { OrderService } from '../services/order.service';

@Injectable({
  providedIn: 'root',
})
export class OrderFacadeService {
  private orderData!: OrderData;

  constructor(private orderService: OrderService) {}

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

  // Método para gerar nomes das bebidas
  private formatarBebidas(): string {
    if (!this.orderData.bebida || this.orderData.bebida.length === 0) {
      return 'Sem bebida';
    }

    return this.orderData.bebida
      .map((bebida) => {
        const nomeFormatado = this.formatarNomeBebida(
          bebida.tipo as opcoesBebida,
        );
        const quantidade =
          bebida.quantidade && bebida.quantidade > 1
            ? ` (${bebida.quantidade}x)`
            : '';
        return `${nomeFormatado}${quantidade}`;
      })
      .join(', ');
  }

  private formatarNomeBebida(tipo: opcoesBebida): string {
    const nomes: Record<opcoesBebida, string> = {
      agua_com_gas: 'Água com Gás',
      agua_sem_gas: 'Água sem Gás',
      coca: 'Coca-Cola',
      fanta: 'Fanta',
      guarana_antarctica: 'Guaraná Antarctica',
      kuat: 'Kuat',
      sprite: 'Sprite',
      fanta_uva: 'Fanta Uva',
      fanta_laranja_2l: 'Fanta Laranja 2L',
      guarana_antarctica_1_5l: 'Guaraná Antarctica 1,5L',
      guarana_antarctica_1l: 'Guaraná Antarctica 1L',
      coca_1l: 'Coca-Cola 1L',
      coca_600ml: 'Coca-Cola 600ml',
    };
    return nomes[tipo];
  }

  private formatarBorda(): string {
    if (!this.orderData.borda) {
      return 'Sem borda';
    }

    let bordaTexto = '';
    switch (this.orderData.borda.tipo) {
      case 'chedar':
        bordaTexto = 'Borda de Cheddar';
        break;
      case 'catupiry':
        bordaTexto = 'Borda de Catupiry';
        break;
      case 'chocolate':
        bordaTexto = 'Borda de Chocolate';
        if (this.orderData.borda.subtipo) {
          bordaTexto += ` ${this.orderData.borda.subtipo === 'ao leite' ? 'ao Leite' : 'Branco'}`;
        }
        break;
      default:
        bordaTexto = 'Borda';
    }
    return bordaTexto;
  }

  gerarMensagemWhatsapp(): string {
    const msg = `Boa noite! Segue meu pedido realizado no site, por gentileza confirmar o valor:

${this.orderData.nome ? `Nome: ${this.orderData.nome}` : ''}
Pedido: ${this.orderData.tamanho}
Sabores: ${this.orderData.sabores.join(', ')}
Bebida: ${this.formatarBebidas()}
Observações: ${this.orderData.observacoes || 'Não possui'}
Endereço: Rua ${this.orderData.rua}, Número: ${this.orderData.number}, Complemento: ${this.orderData.complemento || 'N/A'}, Bairro: ${this.orderData.bairro}, Cidade: ${this.orderData.cidade}`;

    return encodeURIComponent(msg.trim());
  }

  // Método para limpar o pedido
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

  // Método para validar se o pedido está completo
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

  // Getters específicos para facilitar o uso no componente
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
