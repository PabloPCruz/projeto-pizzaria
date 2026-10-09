import { TestBed } from '@angular/core/testing';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { EMPTY_CHECKOUT } from '../src/app/services/checkout-draft.service';
import { CheckoutValidationService } from '../src/app/services/checkout-validation.service';

const CART: CartState = {
  pizzas: [{ id: '1', size: 'media', flavorIds: ['tradicional-calabresa', 'especial-atum'], crustId: null, notes: '', quantity: 1 }],
  drinks: [],
};

const VALID: CheckoutDraft = {
  ...EMPTY_CHECKOUT,
  name: 'Maria',
  phone: '(41) 99999-1234',
  cep: '80010-000',
  street: 'Rua A',
  number: '10',
  neighborhood: 'Centro',
  city: 'Curitiba',
  state: 'PR',
  payment: 'pix',
};

describe('CheckoutValidationService', () => {
  let service: CheckoutValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckoutValidationService);
  });

  it('aceita pedido completo', () => {
    expect(service.isValid(service.validate(CART, VALID))).toBeTrue();
  });

  it('rua, bairro e cidade só com emoji ou marcadores do WhatsApp contam como vazios (a mensagem os apagaria)', () => {
    for (const junk of ['😀', '***', '_~`', ' * ']) {
      const errors = service.validate(CART, { ...VALID, street: junk, neighborhood: junk, city: junk });
      expect(errors.street).withContext(junk).toBeTruthy();
      expect(errors.neighborhood).withContext(junk).toBeTruthy();
      expect(errors.city).withContext(junk).toBeTruthy();
    }
  });

  it('endereço com acento e letras normais continua válido', () => {
    const errors = service.validate(CART, { ...VALID, street: 'Rua São José dos Pinhais', neighborhood: 'São Braz', city: 'Curitiba' });
    expect(service.isValid(errors)).toBeTrue();
  });

  it('exige o endereço completo e os dados do cliente', () => {
    const errors = service.validate(CART, EMPTY_CHECKOUT);
    ['name', 'phone', 'cep', 'street', 'number', 'neighborhood', 'city', 'state', 'payment'].forEach((field) =>
      expect(errors[field as keyof typeof errors]).withContext(field).toBeTruthy()
    );
  });

  it('exige carrinho com itens', () => {
    expect(service.validate({ pizzas: [], drinks: [] }, VALID).cart).toBeTruthy();
  });

  it('rejeita pizza com mais sabores do que o tamanho aceita', () => {
    const cart: CartState = { pizzas: [{ ...CART.pizzas[0], size: 'pequena' }], drinks: [] };
    expect(service.validate(cart, VALID).cart).toBeTruthy();
  });

  it('exige forma de pagamento', () => {
    expect(service.validate(CART, { ...VALID, payment: null }).payment).toBeTruthy();
  });

  it('troco é opcional, mas se informado precisa ser um valor válido', () => {
    const cash = { ...VALID, payment: 'dinheiro' as const };
    expect(service.validate(CART, { ...cash, changeFor: '' }).changeFor).toBeUndefined();
    expect(service.validate(CART, { ...cash, changeFor: '100' }).changeFor).toBeUndefined();
    expect(service.validate(CART, { ...cash, changeFor: 'abc' }).changeFor).toBeTruthy();
    expect(service.validate(CART, { ...cash, changeFor: '0' }).changeFor).toBeTruthy();
  });

  it('valida CEP e telefone', () => {
    expect(service.validate(CART, { ...VALID, cep: '800' }).cep).toBeTruthy();
    expect(service.validate(CART, { ...VALID, phone: '123' }).phone).toBeTruthy();
    expect(service.validate(CART, { ...VALID, state: 'P' }).state).toBeTruthy();
  });
});
