import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { ClockService } from '../src/app/services/clock.service';
import { STORE_STATUS_TICK } from '../src/app/services/store-hours.service';
import { CartService } from '../src/app/services/cart.service';
import { CheckoutDraftService } from '../src/app/services/checkout-draft.service';
import { PersistenceService } from '../src/app/services/persistence.service';
import { PizzaBuilderService } from '../src/app/services/pizza-builder.service';
import { OPEN_INSTANT, fakeClock, resetKeepingClock } from './helpers/fake-clock';

const HOUR = 60 * 60 * 1000;
const storageEvent = (key: string | null) => window.dispatchEvent(new StorageEvent('storage', { key }));

describe('PersistenceService: validade', () => {
  let persistence: PersistenceService;

  beforeEach(() => {
    localStorage.clear();
    persistence = TestBed.inject(PersistenceService);
  });
  afterEach(() => localStorage.clear());

  it('grava a hora junto e lê normalmente antes de vencer', () => {
    persistence.write('k', { a: 1 });
    expect(localStorage.getItem('disk-pizza:v2:k:savedAt')).toBe(String(Date.parse(OPEN_INSTANT)));
    fakeClock.set(new Date(Date.parse(OPEN_INSTANT) + 47 * HOUR).toISOString());
    expect(persistence.read<{ a: number } | null>('k', null, 48 * HOUR)).toEqual({ a: 1 });
  });

  it('depois de vencer devolve o valor padrão e apaga os dois itens', () => {
    persistence.write('k', { a: 1 });
    fakeClock.set(new Date(Date.parse(OPEN_INSTANT) + 49 * HOUR).toISOString());
    expect(persistence.read('k', 'vazio', 48 * HOUR)).toBe('vazio');
    expect(localStorage.getItem('disk-pizza:v2:k')).toBeNull();
    expect(localStorage.getItem('disk-pizza:v2:k:savedAt')).toBeNull();
  });

  it('sem prazo informado nunca vence; dado antigo sem marca de tempo também não', () => {
    persistence.write('k', 1);
    fakeClock.set(new Date(Date.parse(OPEN_INSTANT) + 9999 * HOUR).toISOString());
    expect(persistence.read('k', 0)).toBe(1);
    localStorage.setItem('disk-pizza:v2:legacy', '5');
    expect(persistence.read('legacy', 0, HOUR)).toBe(5);
  });

  it('remove apaga o valor e a marca de tempo', () => {
    persistence.write('k', 1);
    persistence.remove('k');
    expect(localStorage.length).toBe(0);
  });
});

describe('Dados esquecidos expiram ao abrir o site', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  const seed = (key: string, value: unknown, ageHours: number) => {
    localStorage.setItem(`disk-pizza:v2:${key}`, JSON.stringify(value));
    localStorage.setItem(`disk-pizza:v2:${key}:savedAt`, String(Date.parse(OPEN_INSTANT) - ageHours * HOUR));
  };

  it('carrinho com mais de 3 dias volta vazio; com 2 dias continua', () => {
    seed('cart', { pizzas: [], drinks: [{ id: 'b', drinkId: 'coca-2l', quantity: 1 }] }, 73);
    expect(TestBed.inject(CartService).snapshot.drinks.length).toBe(0);
    // O reset descarta os provedores de _setup.spec.ts: sem refazê-los o relógio volta a ser o real e o teste vira bomba-relógio.
    resetKeepingClock();
    TestBed.configureTestingModule({
      providers: [
        { provide: ClockService, useValue: fakeClock },
        { provide: STORE_STATUS_TICK, useValue: NEVER },
      ],
    });
    seed('cart', { pizzas: [], drinks: [{ id: 'b', drinkId: 'coca-2l', quantity: 1 }] }, 48);
    expect(TestBed.inject(CartService).snapshot.drinks.length).toBe(1);
  });

  it('formulário com mais de 30 dias é esquecido', () => {
    seed('checkout', { name: 'Maria' }, 31 * 24);
    expect(TestBed.inject(CheckoutDraftService).snapshot.name).toBe('');
  });

  it('pizza em montagem (e edição) abandonada há mais de 3 dias é descartada', () => {
    seed('builder', { size: 'media', flavorIds: ['tradicional-calabresa'], editingId: 'abc' }, 80);
    const draft = TestBed.inject(PizzaBuilderService).snapshot;
    expect(draft.size).toBeNull();
    expect(draft.editingId).toBeNull();
  });
});

describe('Duas abas abertas', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('o carrinho acompanha o que a outra aba gravou e esvazia quando ela apaga', () => {
    const cart = TestBed.inject(CartService);
    expect(cart.snapshot.drinks.length).toBe(0);

    localStorage.setItem('disk-pizza:v2:cart', JSON.stringify({ pizzas: [], drinks: [{ id: 'b', drinkId: 'coca-2l', quantity: 2 }] }));
    storageEvent('disk-pizza:v2:cart');
    expect(cart.snapshot.drinks[0].quantity).toBe(2);

    localStorage.removeItem('disk-pizza:v2:cart');
    storageEvent('disk-pizza:v2:cart');
    expect(cart.snapshot.drinks.length).toBe(0);
  });

  it('o formulário acompanha a outra aba e "limpar tudo" (key null) também zera', () => {
    const draft = TestBed.inject(CheckoutDraftService);
    localStorage.setItem('disk-pizza:v2:checkout', JSON.stringify({ name: 'Joana' }));
    storageEvent('disk-pizza:v2:checkout');
    expect(draft.snapshot.name).toBe('Joana');

    localStorage.clear();
    storageEvent(null);
    expect(draft.snapshot.name).toBe('');
  });

  it('mudança de outra chave não mexe no carrinho', () => {
    const cart = TestBed.inject(CartService);
    cart.addDrink('coca-2l');
    localStorage.setItem('outra-coisa', '1');
    storageEvent('outra-coisa');
    expect(cart.snapshot.drinks.length).toBe(1);
  });

  it('a própria gravação não dispara recarga (o estado local não é sobrescrito)', () => {
    const cart = TestBed.inject(CartService);
    cart.addDrink('coca-2l', 3);
    expect(cart.snapshot.drinks[0].quantity).toBe(3);
  });
});
