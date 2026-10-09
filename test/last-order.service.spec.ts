import { TestBed } from '@angular/core/testing';
import { CartState } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { LastOrderService } from '../src/app/services/last-order.service';
import { PersistenceService } from '../src/app/services/persistence.service';
import { OPEN_INSTANT, fakeClock, resetKeepingClock } from './helpers/fake-clock';

const DAY = 24 * 60 * 60 * 1000;

const CART: CartState = {
  pizzas: [
    { id: 'p1', size: 'grande', flavorIds: ['tradicional-calabresa', 'especial-poderosa'], crustId: 'catupiry', notes: 'bem assada', quantity: 2 },
  ],
  drinks: [{ id: 'd1', drinkId: 'coca-2l', quantity: 1 }],
};

describe('LastOrderService (repetir o último pedido)', () => {
  let last: LastOrderService;

  beforeEach(() => {
    localStorage.clear();
    last = TestBed.inject(LastOrderService);
  });
  afterEach(() => localStorage.clear());

  it('sem pedido anterior não há nada para repetir', () => {
    expect(last.snapshot).toBeNull();
  });

  it('guarda o pedido enviado e o devolve igual (pizzas, borda, observação, quantidade e bebidas)', () => {
    last.save(CART);
    expect(last.snapshot?.cart).toEqual(CART);
    expect(last.snapshot?.dropped).toBeFalse();
  });

  it('o pedido sobrevive a recarregar a página', () => {
    last.save(CART);
    resetKeepingClock();
    TestBed.configureTestingModule({ providers: [{ provide: PersistenceService, useValue: new PersistenceService(fakeClock) }] });
    expect(TestBed.inject(LastOrderService).snapshot?.cart).toEqual(CART);
  });

  it('carrinho vazio não apaga o último pedido guardado', () => {
    last.save(CART);
    last.save({ pizzas: [], drinks: [] });
    expect(last.snapshot?.cart).toEqual(CART);
  });

  it('guardar de novo troca o pedido anterior', () => {
    last.save(CART);
    const other: CartState = { pizzas: [], drinks: [{ id: 'd2', drinkId: 'fanta-2l', quantity: 3 }] };
    last.save(other);
    expect(last.snapshot?.cart).toEqual(other);
  });

  it('o pedido guardado fica no aparelho por 30 dias e depois é esquecido', () => {
    last.save(CART);
    fakeClock.set(new Date(Date.parse(OPEN_INSTANT) + 29 * DAY).toISOString());
    expect(TestBed.inject(PersistenceService).read<unknown>('last-order', null, 30 * DAY)).not.toBeNull();
    fakeClock.set(new Date(Date.parse(OPEN_INSTANT) + 31 * DAY).toISOString());
    resetKeepingClock();
    TestBed.configureTestingModule({ providers: [{ provide: PersistenceService, useValue: new PersistenceService(fakeClock) }] });
    expect(TestBed.inject(LastOrderService).snapshot).toBeNull();
  });

  it('item que saiu do cardápio fica de fora e o aviso "dropped" liga', () => {
    localStorage.setItem(
      'disk-pizza:v2:last-order',
      JSON.stringify({
        pizzas: [
          { id: 'a', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 },
          { id: 'b', size: 'media', flavorIds: ['sabor-que-nao-existe'], crustId: null, notes: '', quantity: 1 },
        ],
        drinks: [{ id: 'c', drinkId: 'bebida-que-nao-existe', quantity: 1 }],
      })
    );
    resetKeepingClock();
    TestBed.configureTestingModule({ providers: [{ provide: PersistenceService, useValue: new PersistenceService(fakeClock) }] });
    const restored = TestBed.inject(LastOrderService).snapshot!;
    expect(restored.cart.pizzas.map((p) => p.id)).toEqual(['a']);
    expect(restored.cart.drinks.length).toBe(0);
    expect(restored.dropped).toBeTrue();
  });

  it('dado corrompido não quebra: simplesmente não há pedido para repetir', () => {
    for (const bad of ['{', '"texto"', '[]', '{"pizzas":1,"drinks":2}', 'null']) {
      localStorage.setItem('disk-pizza:v2:last-order', bad);
      resetKeepingClock();
      TestBed.configureTestingModule({ providers: [{ provide: PersistenceService, useValue: new PersistenceService(fakeClock) }] });
      expect(TestBed.inject(LastOrderService).snapshot).withContext(bad).toBeNull();
    }
  });

  it('clear() esquece o pedido', () => {
    last.save(CART);
    last.clear();
    expect(last.snapshot).toBeNull();
    expect(localStorage.getItem('disk-pizza:v2:last-order')).toBeNull();
  });

  it('repetir (CartService.restore) coloca as mesmas linhas no carrinho', () => {
    last.save(CART);
    const cart = TestBed.inject(CartService);
    cart.restore(last.snapshot!.cart);
    expect(cart.snapshot.pizzas.length).toBe(1);
    expect(cart.snapshot.pizzas[0]).toEqual(CART.pizzas[0]);
    expect(cart.snapshot.drinks[0].drinkId).toBe('coca-2l');
  });
});
