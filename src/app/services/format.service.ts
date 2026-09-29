import { Injectable } from '@angular/core';

/** Formatação e máscaras de texto. Componentes e facades devem usar este serviço em vez de repetir a lógica. */
@Injectable({ providedIn: 'root' })
export class FormatService {
  private readonly currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  currency(value: number): string {
    return this.currencyFormat.format(value);
  }

  onlyDigits(text: string): string {
    return (text ?? '').replace(/\D/g, '');
  }

  /** 80010000 -> 80010-000 (parcial enquanto o cliente digita). */
  cep(text: string): string {
    const digits = this.onlyDigits(text).slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }

  /** 41997449380 -> (41) 99744-9380 (parcial enquanto o cliente digita). */
  phone(text: string): string {
    let digits = this.onlyDigits(text);
    // Número colado com o código do país (+55 41 9...): descarta o 55.
    if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
    const d = digits.slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    const area = d.slice(0, 2);
    const rest = d.slice(2);
    const split = d.length > 10 ? 5 : 4;
    return rest.length > split ? `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}` : `(${area}) ${rest}`;
  }

  /**
   * Máscara de valor em reais enquanto o cliente digita: "R$ 1.000,50".
   * Só a vírgula é decimal (até 2 casas); pontos são sempre milhar e são refeitos a cada tecla,
   * então apagar um dígito de "R$ 1.000" dá "R$ 100" e não "1,00". Até 5 dígitos inteiros.
   * Vazio (sem nenhum dígito) devolve '' para o campo opcional poder ficar em branco.
   */
  moneyMask(text: string): string {
    const raw = (text ?? '').replace(/R\$|\s/gi, '');
    const comma = raw.indexOf(',');
    const intDigits = (comma === -1 ? raw : raw.slice(0, comma)).replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 5);
    if (!intDigits && comma === -1) return '';

    const grouped = (intDigits || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (comma === -1) return `R$ ${grouped}`;
    return `R$ ${grouped},${raw.slice(comma + 1).replace(/\D/g, '').slice(0, 2)}`;
  }

  /** Valor completo com centavos, para reescrever o campo ao sair dele: 100 -> "R$ 100,00". */
  moneyField(value: number): string {
    const [reais, cents] = value.toFixed(2).split('.');
    return `R$ ${reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents}`;
  }

  /**
   * "1.234,50" | "1.000" | "50" | "50,5" | "R$ 100" -> número. `null` se não for um valor válido.
   * Ponto seguido de exatamente 3 dígitos é separador de milhar (pt-BR): "1.000" = 1000.
   */
  parseMoney(text: string): number | null {
    const raw = (text ?? '').replace(/R\$|\s/gi, '');
    if (!raw || !/^[\d.,]+$/.test(raw)) return null;
    if ((raw.match(/,/g) ?? []).length > 1) return null;

    let normalized: string;
    if (raw.includes(',')) normalized = raw.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) normalized = raw.replace(/\./g, '');
    else normalized = raw;

    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  /** ['A', 'B', 'C'] -> "A, B e C" */
  list(items: readonly string[]): string {
    if (items.length <= 1) return items.join('');
    return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
  }
}
