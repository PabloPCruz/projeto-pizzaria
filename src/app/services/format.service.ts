import { Injectable } from '@angular/core';
import { Borda } from '../interfaces/border.interface';
import { opcoesBebida } from '../interfaces/drinks.interface';

/**
 * Serviço centralizado para formatação de dados
 * Evita duplicação de lógica de formatação em componentes e facades
 */
@Injectable({
  providedIn: 'root'
})
export class FormatService {

  /**
   * Formata um tipo de bebida em seu nome legível
   * @param tipo - Tipo da bebida (chave do mapa)
   * @returns Nome formatado da bebida
   */
  formatarBebida(tipo: string): string {
    const bebidasMap: Record<string, string> = {
      'coca': 'Coca-Cola',
      'coca_1l': 'Coca-Cola 1L',
      'coca_600ml': 'Coca-Cola 600ml',
      'guarana_antarctica': 'Guaraná Antarctica',
      'guarana_antarctica_1l': 'Guaraná Antarctica 1L',
      'guarana_antarctica_1_5l': 'Guaraná Antarctica 1,5L',
      'fanta': 'Fanta',
      'fanta_uva': 'Fanta Uva',
      'fanta_laranja_2l': 'Fanta Laranja 2L',
      'sprite': 'Sprite',
      'agua_sem_gas': 'Água sem Gás',
      'agua_com_gas': 'Água com Gás',
      'kuat': 'Kuat'
    };
    return bebidasMap[tipo] || tipo;
  }

  /**
   * Formata múltiplas bebidas em um texto separado por vírgula
   * @param bebidas - Array de bebidas com tipo e quantidade opcional
   * @returns String formatada das bebidas
   */
  formatarBebidas(bebidas: any[]): string {
    if (!bebidas || bebidas.length === 0) {
      return 'Sem bebida';
    }

    return bebidas
      .map((bebida) => {
        const nomeBebida = this.formatarBebida(bebida.tipo);
        const quantidade = bebida.quantidade && bebida.quantidade > 1
          ? ` (${bebida.quantidade}x)`
          : '';
        return `${nomeBebida}${quantidade}`;
      })
      .join(', ');
  }

  /**
   * Formata uma borda em seu nome legível
   * @param borda - Objeto borda com tipo e subtipo opcional
   * @returns String formatada da borda
   */
  formatarBorda(borda: Borda | undefined): string {
    if (!borda) {
      return 'Sem borda';
    }

    let bordaTexto = '';
    switch (borda.tipo) {
      case 'chedar':
        bordaTexto = 'Cheddar';
        break;
      case 'catupiry':
        bordaTexto = 'Catupiry';
        break;
      case 'chocolate':
        bordaTexto = 'Chocolate';
        if (borda.subtipo) {
          bordaTexto += ` ${borda.subtipo === 'ao leite' ? 'ao Leite' : 'Branco'}`;
        }
        break;
      default:
        bordaTexto = this.capitalizarPrimeira(borda.tipo);
    }
    return bordaTexto;
  }

  /**
   * Capitaliza a primeira letra de um texto
   * @param text - Texto a ser capitalizado
   * @returns Texto com primeira letra maiúscula
   */
  capitalizarPrimeira(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Formata um tamanho de pizza
   * @param tamanho - Tamanho em minúsculas
   * @returns Tamanho com primeira letra maiúscula
   */
  formatarTamanho(tamanho: string): string {
    return this.capitalizarPrimeira(tamanho);
  }

  /**
   * Formata um array de sabores em texto separado por vírgula
   * @param sabores - Array de sabores
   * @returns String formatada dos sabores
   */
  formatarSabores(sabores: string[]): string {
    return sabores.join(', ');
  }
}
