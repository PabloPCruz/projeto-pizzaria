import { TestBed } from '@angular/core/testing';
import { CartService } from '../src/app/services/cart.service';

const PIZZA = { size: 'grande' as const, flavorIds: ['tradicional-calabresa'], crustId: 'catupiry', notes: 'sem cebola', quantity: 1 };

describe('CartService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('adiciona pizzas e bebidas', () => {
    const cart = TestBed.inject(CartService);
    cart.addPizza(PIZZA);
    cart.addDrink('coca-2l');
    expect(cart.snapshot.pizzas.length).toBe(1);
    expect(cart.snapshot.pizzas[0].notes).toBe('sem cebola');
    expect(cart.snapshot.drinks.length).toBe(1);
  });

  it('repetir a mesma bebida soma a quantidade', () => {
    const cart = TestBed.inject(CartService);
    cart.addDrink('coca-2l');
    cart.addDrink('coca-2l', 2);
    expect(cart.snapshot.drinks.length).toBe(1);
    expect(cart.snapshot.drinks[0].quantity).toBe(3);
  });

  it('altera e remove quantidades; quantidade menor que 1 remove a linha', () => {
    const cart = TestBed.inject(CartService);
    cart.addPizza(PIZZA);
    const id = cart.snapshot.pizzas[0].id;
    cart.setPizzaQuantity(id, 3);
    expect(cart.snapshot.pizzas[0].quantity).toBe(3);
    cart.setPizzaQuantity(id, 0);
    expect(cart.snapshot.pizzas.length).toBe(0);
  });

  it('limita a quantidade máxima por item', () => {
    const cart = TestBed.inject(CartService);
    cart.addDrink('coca-2l', 999);
    expect(cart.snapshot.drinks[0].quantity).toBe(20);
  });

  it('persiste a cada alteração e restaura após recarregar a página', () => {
    const first = TestBed.inject(CartService);
    first.addPizza(PIZZA);
    first.addDrink('kuat-2l', 2);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(CartService);

    expect(reloaded.snapshot.pizzas.length).toBe(1);
    expect(reloaded.snapshot.pizzas[0].flavorIds).toEqual(['tradicional-calabresa']);
    expect(reloaded.snapshot.drinks[0].quantity).toBe(2);
  });

  it('ignora dados salvos em formato inválido', () => {
    localStorage.setItem('disk-pizza:v2:cart', '{"pizzas": "quebrado"}');
    const cart = TestBed.inject(CartService);
    expect(cart.snapshot).toEqual({ pizzas: [], drinks: [] });
  });

  it('não quebra com JSON corrompido', () => {
    localStorage.setItem('disk-pizza:v2:cart', '{{{');
    const cart = TestBed.inject(CartService);
    expect(cart.snapshot).toEqual({ pizzas: [], drinks: [] });
  });

  describe('restauração de carrinho salvo malformado', () => {
    function restoreFrom(saved: unknown): CartService {
      localStorage.setItem('disk-pizza:v2:cart', JSON.stringify(saved));
      return TestBed.inject(CartService);
    }

    it('corta sabores acima do limite do tamanho', () => {
      const cart = restoreFrom({
        pizzas: [{ id: 'p1', size: 'pequena', flavorIds: ['tradicional-calabresa', 'especial-atum', 'doce-banana'], quantity: 1 }],
        drinks: [],
      });
      expect(cart.snapshot.pizzas[0].flavorIds).toEqual(['tradicional-calabresa']);
    });

    it('descarta pizza com tamanho desconhecido ou sem nenhum sabor válido', () => {
      const cart = restoreFrom({
        pizzas: [
          { id: 'p1', size: 'xxl', flavorIds: ['tradicional-calabresa'], quantity: 1 },
          { id: 'p2', size: 'grande', flavorIds: ['fantasma', 1, { a: 1 }, null], quantity: 1 },
        ],
        drinks: [],
      });
      expect(cart.snapshot.pizzas).toEqual([]);
    });

    it('descarta bebida desconhecida e normaliza quantidade e tipos errados', () => {
      const cart = restoreFrom({
        pizzas: [{ id: 'p1', size: 'grande', flavorIds: ['tradicional-calabresa'], crustId: 42, notes: 7, quantity: -3 }],
        drinks: [
          { id: 'd1', drinkId: 'bebida-fantasma', quantity: 1 },
          { id: 'd2', drinkId: 'coca-2l', quantity: 'muitas' },
        ],
      });
      expect(cart.snapshot.pizzas[0].crustId).toBeNull();
      expect(cart.snapshot.pizzas[0].notes).toBe('');
      expect(cart.snapshot.pizzas[0].quantity).toBe(1);
      expect(cart.snapshot.drinks.length).toBe(1);
      expect(cart.snapshot.drinks[0].drinkId).toBe('coca-2l');
      expect(cart.snapshot.drinks[0].quantity).toBe(1);
    });

    it('linhas nulas ou que não são objetos não quebram a restauração', () => {
      const cart = restoreFrom({ pizzas: [null, 3, 'x'], drinks: [null, []] });
      expect(cart.snapshot).toEqual({ pizzas: [], drinks: [] });
    });
  });

  it('conta os itens somando as quantidades', (done) => {
    const cart = TestBed.inject(CartService);
    cart.addPizza({ ...PIZZA, quantity: 2 });
    cart.addDrink('coca-2l', 3);
    cart.itemCount$.subscribe((count) => {
      expect(count).toBe(5);
      done();
    });
  });
});
