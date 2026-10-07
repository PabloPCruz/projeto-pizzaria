import { TestBed } from '@angular/core/testing';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { CheckoutDraftService } from '../src/app/services/checkout-draft.service';
import { CheckoutValidationService } from '../src/app/services/checkout-validation.service';

const CART: CartState = {
  pizzas: [{ id: '1', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 }],
  drinks: [],
};

const VALID: CheckoutDraft = {
  name: 'Maria Silva',
  phone: '(41) 99999-1234',
  manualAddress: false,
  cep: '80010-000',
  street: 'Rua XV de Novembro',
  number: '100',
  complement: '',
  neighborhood: 'Centro',
  city: 'Curitiba',
  state: 'PR',
  payment: 'pix',
  changeFor: '',
  generalNotes: '',
};

describe('validação mais rígida', () => {
  let service: CheckoutValidationService;
  beforeEach(() => (service = TestBed.inject(CheckoutValidationService)));
  const phone = (value: string) => service.validate(CART, { ...VALID, phone: value }).phone;

  it('aceita celular e fixo reais', () => {
    expect(phone('(41) 99999-1234')).toBeUndefined();
    expect(phone('(11) 98888-7777')).toBeUndefined();
    expect(phone('(41) 3273-2145')).toBeUndefined();
  });

  it('recusa DDD inexistente, celular sem o 9 e fixo começando por 9', () => {
    expect(phone('(00) 00000-0000')).toBeTruthy();
    expect(phone('(10) 99999-1234')).toBeTruthy();
    expect(phone('(41) 12345-6789')).toBeTruthy();
    expect(phone('(41) 9273-2145')).toBeTruthy();
    expect(phone('(41) 99999-123')).toBeTruthy();
  });

  it('UF precisa ser uma das 27 siglas (maiúscula ou não)', () => {
    expect(service.validate(CART, { ...VALID, state: 'XX' }).state).toBeTruthy();
    expect(service.validate(CART, { ...VALID, state: 'pr' }).state).toBeUndefined();
    expect(service.validate(CART, { ...VALID, state: 'SP' }).state).toBeUndefined();
  });

  it('nome precisa ter letra e pelo menos 2 caracteres', () => {
    for (const name of ['', '.', 'A', '123', '  ']) expect(service.validate(CART, { ...VALID, name }).name).toBeTruthy();
    expect(service.validate(CART, { ...VALID, name: 'Zé' }).name).toBeUndefined();
  });

  it('número precisa de dígito ou "s/n"', () => {
    for (const number of ['abc', '-', '  ']) expect(service.validate(CART, { ...VALID, number }).number).toBeTruthy();
    for (const number of ['10', '10A', 's/n', 'S/N', 'sn']) expect(service.validate(CART, { ...VALID, number }).number).toBeUndefined();
  });
});

describe('dados salvos são limitados ao restaurar', () => {
  afterEach(() => localStorage.clear());

  it('formulário: corta nos limites dos campos e tira quebra de linha dos campos de uma linha', () => {
    localStorage.setItem(
      'disk-pizza:v2:checkout',
      JSON.stringify({
        name: 'N'.repeat(500),
        street: 'linha 1\nlinha 2',
        state: 'PRXX',
        generalNotes: 'a\nb' + 'c'.repeat(1000),
      })
    );
    const draft = TestBed.inject(CheckoutDraftService).snapshot;
    expect(draft.name.length).toBe(60);
    expect(draft.street).toBe('linha 1 linha 2');
    expect(draft.state).toBe('PR');
    expect(draft.generalNotes.length).toBe(400);
    expect(draft.generalNotes.startsWith('a\nb')).toBeTrue();
  });

  it('carrinho: bebida repetida vira uma linha, id repetido é refeito e observação é cortada', () => {
    localStorage.setItem(
      'disk-pizza:v2:cart',
      JSON.stringify({
        pizzas: [
          { id: 'x', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: 'o'.repeat(900), quantity: 1 },
          { id: 'x', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 },
        ],
        drinks: [
          { id: 'b1', drinkId: 'coca-2l', quantity: 3 },
          { id: 'b2', drinkId: 'coca-2l', quantity: 4 },
        ],
      })
    );
    const cart = TestBed.inject(CartService).snapshot;
    expect(cart.drinks.length).toBe(1);
    expect(cart.drinks[0].quantity).toBe(7);
    expect(cart.pizzas[0].notes.length).toBe(300);
    expect(new Set(cart.pizzas.map((p) => p.id)).size).toBe(2);
  });
});
