import { Inject, Injectable } from '@angular/core';
import { MENU_PRICE_TABLE } from '../data/prices';
import { FlavorCategory, MenuPriceTable, PizzaSizeId, PriceTier } from '../interfaces/pizza-menu.interface';
import { CatalogService } from './catalog.service';
import { FormatService } from './format.service';

export interface PizzaPrices {
  tradicional: string | null;
  especial: string | null;
}

/**
 * Valores do cardápio SÓ PARA EXIBIR (já formatados). Nunca entra em total, carrinho ou mensagem:
 * quem calcula pedido é o PricingService, que usa outra tabela (hoje vazia de propósito).
 * Devolve `null` quando a loja ainda não informou o valor, para a tela não mostrar nada.
 */
@Injectable({ providedIn: 'root' })
export class PriceListService {
  constructor(
    @Inject(MENU_PRICE_TABLE) private prices: MenuPriceTable,
    private catalog: CatalogService,
    private format: FormatService
  ) {}

  /** Faixa de preço de um sabor: especial tem a sua; salgado tradicional e doce seguem a dos tradicionais. */
  tierOf(category: FlavorCategory): PriceTier {
    return category === 'especial' ? 'especial' : 'tradicional';
  }

  pizzaPrices(size: PizzaSizeId): PizzaPrices {
    const row = this.prices.pizza[size];
    return {
      tradicional: this.money(row?.tradicional),
      especial: this.money(row?.especial),
    };
  }

  /** Valor da borda para o tamanho escolhido. */
  crustPrice(crustId: string, size: PizzaSizeId): string | null {
    return this.money(this.prices.crust[crustId as keyof MenuPriceTable['crust']]?.[size]);
  }

  /** Resumo para o cardápio, onde não há tamanho escolhido: "R$ 11,00 a R$ 13,00" (ou um valor só se não variar). */
  crustPriceRange(crustId: string): string | null {
    const bySize = this.prices.crust[crustId as keyof MenuPriceTable['crust']];
    if (!bySize) return null;
    const values = this.catalog
      .getSizes()
      .map((s) => bySize[s.id])
      .filter((v): v is number => v !== undefined);
    if (values.length === 0) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? this.format.currency(min) : `${this.format.currency(min)} a ${this.format.currency(max)}`;
  }

  drinkPrice(drinkId: string): string | null {
    return this.money(this.prices.drink[drinkId]);
  }

  private money(value: number | undefined): string | null {
    return value === undefined ? null : this.format.currency(value);
  }
}
