import { TestBed } from '@angular/core/testing';
import { PRICE_TABLE } from '../src/app/data/prices';
import { PriceTable } from '../src/app/interfaces/pizza-menu.interface';
import { PricingService } from '../src/app/services/pricing.service';
import { CartState } from '../src/app/interfaces/cart.interface';

const TABLE: PriceTable = {
  pizza: { grande: { tradicional: 50, especial: 60 } },
  crust: { catupiry: 8 },
  drink: { 'coca-2l': 14 },
};

describe('PricingService', () => {
  function create(table: PriceTable): PricingService {
    TestBed.configureTestingModule({ providers: [{ provide: PRICE_TABLE, useValue: table }] });
    return TestBed.inject(PricingService);
  }

  it('sem preços cadastrados devolve null em tudo (nada é inventado)', () => {
    const service = create({ pizza: {}, crust: {}, drink: {} });
    const cart: CartState = {
      pizzas: [{ id: '1', size: 'grande', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 }],
      drinks: [{ id: '2', drinkId: 'coca-2l', quantity: 1 }],
    };
    expect(service.pizzaUnitPrice('grande', ['tradicional-calabresa'], null)).toBeNull();
    expect(service.drinkUnitPrice('coca-2l')).toBeNull();
    expect(service.cartTotal(cart)).toBeNull();
  });

  it('com vários sabores vale o preço da categoria mais cara', () => {
    const service = create(TABLE);
    expect(service.pizzaUnitPrice('grande', ['tradicional-calabresa', 'especial-atum'], null)).toBe(60);
  });

  it('soma a borda; sem borda soma zero', () => {
    const service = create(TABLE);
    expect(service.pizzaUnitPrice('grande', ['tradicional-calabresa'], 'catupiry')).toBe(58);
    expect(service.pizzaUnitPrice('grande', ['tradicional-calabresa'], null)).toBe(50);
  });

  it('borda sem preço cadastrado torna o valor desconhecido', () => {
    const service = create(TABLE);
    expect(service.pizzaUnitPrice('grande', ['tradicional-calabresa'], 'nutella')).toBeNull();
  });

  it('calcula o total do carrinho multiplicando pela quantidade, sem taxa de entrega', () => {
    const service = create(TABLE);
    const cart: CartState = {
      pizzas: [{ id: '1', size: 'grande', flavorIds: ['tradicional-calabresa'], crustId: 'catupiry', notes: '', quantity: 2 }],
      drinks: [{ id: '2', drinkId: 'coca-2l', quantity: 3 }],
    };
    expect(service.cartTotal(cart)).toBe(58 * 2 + 14 * 3);
  });

  it('carrinho vazio não tem total', () => {
    const service = create(TABLE);
    expect(service.cartTotal({ pizzas: [], drinks: [] })).toBeNull();
  });

  it('um item sem preço deixa o total desconhecido (nunca parcial)', () => {
    const service = create(TABLE);
    const cart: CartState = {
      pizzas: [{ id: '1', size: 'grande', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 }],
      drinks: [{ id: '2', drinkId: 'kuat-2l', quantity: 1 }],
    };
    expect(service.cartTotal(cart)).toBeNull();
  });
});
