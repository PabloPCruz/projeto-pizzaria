import { TestBed } from '@angular/core/testing';
import { MENU_PRICES, MENU_PRICE_TABLE, PRICE_TABLE } from '../src/app/data/prices';
import { CRUSTS, DRINKS, PIZZA_SIZES } from '../src/app/data/menu.data';
import { MenuPriceTable } from '../src/app/interfaces/pizza-menu.interface';
import { CartState } from '../src/app/interfaces/cart.interface';
import { PriceListService } from '../src/app/services/price-list.service';
import { PricingService } from '../src/app/services/pricing.service';

/** Moeda do Intl usa espaço sem quebra entre "R$" e o número: os testes comparam com ele normalizado. */
const plain = (text: string | null) => (text === null ? null : text.replace(/ /g, ' '));

function create(table?: MenuPriceTable): PriceListService {
  if (table) TestBed.configureTestingModule({ providers: [{ provide: MENU_PRICE_TABLE, useValue: table }] });
  return TestBed.inject(PriceListService);
}

describe('PriceListService (valores informativos do cardápio)', () => {
  describe('com a tabela real da loja', () => {
    let list: PriceListService;
    beforeEach(() => (list = create()));

    it('pizza por tamanho: tradicionais e especiais', () => {
      const expected: Record<string, [string, string]> = {
        pequena: ['R$ 34,90', 'R$ 38,90'],
        media: ['R$ 39,90', 'R$ 48,90'],
        grande: ['R$ 49,90', 'R$ 62,90'],
        big: ['R$ 57,90', 'R$ 67,90'],
        gigante: ['R$ 64,90', 'R$ 74,90'],
      };
      for (const size of PIZZA_SIZES) {
        const prices = list.pizzaPrices(size.id);
        expect([plain(prices.tradicional), plain(prices.especial)]).withContext(size.id).toEqual(expected[size.id]);
      }
    });

    it('borda Catupiry varia com o tamanho', () => {
      const bySize = PIZZA_SIZES.map((s) => plain(list.crustPrice('catupiry', s.id)));
      expect(bySize).toEqual(['R$ 11,00', 'R$ 11,50', 'R$ 12,00', 'R$ 12,50', 'R$ 13,00']);
    });

    it('cheddar, catupiry com cheddar, nutella, chocolates e bem casado têm a mesma tabela por tamanho', () => {
      const ids = ['cheddar', 'catupiry-cheddar', 'nutella', 'chocolate-ao-leite', 'chocolate-branco', 'chocolate-ao-leite-branco'] as const;
      for (const id of ids) {
        const bySize = PIZZA_SIZES.map((s) => plain(list.crustPrice(id, s.id)));
        expect(bySize).withContext(id).toEqual(['R$ 12,00', 'R$ 12,50', 'R$ 13,00', 'R$ 14,50', 'R$ 15,00']);
      }
    });

    it('resumo da borda no cardápio: faixa do menor ao maior valor', () => {
      expect(plain(list.crustPriceRange('catupiry'))).toBe('R$ 11,00 a R$ 13,00');
      expect(plain(list.crustPriceRange('nutella'))).toBe('R$ 12,00 a R$ 15,00');
    });

    it('bebidas informadas pela loja', () => {
      const expected: Record<string, string> = {
        'coca-2l': 'R$ 14,00',
        'guarana-2l': 'R$ 14,00',
        'fanta-2l': 'R$ 13,00',
        'sprite-2l': 'R$ 13,00',
        'kuat-2l': 'R$ 13,00',
        'brahma-lata': 'R$ 4,50',
        'coca-zero-2l': 'R$ 14,00',
        'coca-600ml': 'R$ 8,00',
        'coca-lata': 'R$ 6,00',
        'kuat-1-5l': 'R$ 10,00',
      };
      for (const [id, price] of Object.entries(expected)) expect(plain(list.drinkPrice(id))).withContext(id).toBe(price);
    });

    it('item que não existe no cardápio: nada é exibido (nunca inventa)', () => {
      expect(list.drinkPrice('coca-1l')).toBeNull();
      expect(list.drinkPrice('nao-existe')).toBeNull();
      expect(list.crustPrice('nao-existe', 'media')).toBeNull();
      expect(list.crustPriceRange('nao-existe')).toBeNull();
    });

    it('todo item do cardápio tem valor informado pela loja (se entrar item novo, informe o preço)', () => {
      const unpricedCrusts = CRUSTS.filter((c) => list.crustPriceRange(c.id) === null).map((c) => c.id);
      const unpricedDrinks = DRINKS.filter((d) => list.drinkPrice(d.id) === null).map((d) => d.id);
      expect(unpricedCrusts).toEqual([]);
      expect(unpricedDrinks).toEqual([]);
    });

    it('todo tamanho tem os dois valores de pizza e toda borda com preço cobre os 5 tamanhos', () => {
      for (const size of PIZZA_SIZES) {
        expect(MENU_PRICES.pizza[size.id].tradicional).withContext(size.id).toBeGreaterThan(0);
        expect(MENU_PRICES.pizza[size.id].especial).withContext(size.id).toBeGreaterThan(MENU_PRICES.pizza[size.id].tradicional);
      }
      for (const [id, bySize] of Object.entries(MENU_PRICES.crust)) {
        expect(Object.keys(bySize!).sort()).withContext(id).toEqual(PIZZA_SIZES.map((s) => s.id).sort());
      }
    });
  });

  describe('faixa da borda', () => {
    it('valor único quando não varia com o tamanho', () => {
      const flat = { pequena: 10, media: 10, grande: 10, big: 10, gigante: 10 };
      const list = create({ pizza: MENU_PRICES.pizza, crust: { catupiry: flat }, drink: {} });
      expect(plain(list.crustPriceRange('catupiry'))).toBe('R$ 10,00');
    });
  });

  describe('regra: o sabor especial vale para a pizza inteira (categoria → faixa de preço)', () => {
    let list: PriceListService;
    beforeEach(() => (list = create()));

    it('salgado tradicional e doce usam a faixa dos tradicionais; especial usa a dos especiais', () => {
      expect(list.tierOf('tradicional')).toBe('tradicional');
      expect(list.tierOf('doce')).toBe('tradicional');
      expect(list.tierOf('especial')).toBe('especial');
    });
  });

  describe('somente informativo: não altera cobrança, totais nem mensagem', () => {
    it('a tabela de cobrança continua vazia e o total do pedido segue sem valor', () => {
      expect(PRICE_TABLE).toBeDefined();
      TestBed.inject(PriceListService);
      const pricing = TestBed.inject(PricingService);
      const cart: CartState = {
        pizzas: [{ id: 'p1', size: 'grande', flavorIds: ['especial-poderosa'], crustId: 'catupiry', notes: '', quantity: 1 }],
        drinks: [{ id: 'd1', drinkId: 'coca-2l', quantity: 1 }],
      };
      expect(pricing.cartTotal(cart)).toBeNull();
      expect(pricing.pizzaUnitPrice('grande', ['especial-poderosa'], 'catupiry')).toBeNull();
      expect(pricing.drinkUnitPrice('coca-2l')).toBeNull();
    });
  });
});
