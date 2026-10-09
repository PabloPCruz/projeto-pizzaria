import { resetKeepingClock } from './helpers/fake-clock';
import { TestBed } from '@angular/core/testing';
import { CheckoutDraftService, EMPTY_CHECKOUT } from '../src/app/services/checkout-draft.service';

const KEY = 'disk-pizza:v2:checkout';

describe('CheckoutDraftService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('salva a cada alteração e restaura após recarregar', () => {
    const first = TestBed.inject(CheckoutDraftService);
    first.update({ name: 'Maria', cep: '80010-000', payment: 'dinheiro', changeFor: '100' });

    resetKeepingClock();
    TestBed.configureTestingModule({});
    const draft = TestBed.inject(CheckoutDraftService).snapshot;

    expect(draft.name).toBe('Maria');
    expect(draft.cep).toBe('80010-000');
    expect(draft.payment).toBe('dinheiro');
    expect(draft.changeFor).toBe('100');
  });

  it('troco é apagado ao trocar o pagamento para outra forma', () => {
    const service = TestBed.inject(CheckoutDraftService);
    service.update({ payment: 'dinheiro', changeFor: '100' });
    service.update({ payment: 'pix' });
    expect(service.snapshot.changeFor).toBe('');
  });

  it('valores com tipo errado voltam ao vazio em vez de quebrar a validação', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ name: 123, phone: 41999998888, payment: 'bitcoin', changeFor: {}, city: 'Curitiba' })
    );
    const draft = TestBed.inject(CheckoutDraftService).snapshot;
    expect(draft.name).toBe('');
    expect(draft.phone).toBe('');
    expect(draft.payment).toBeNull();
    expect(draft.changeFor).toBe('');
    expect(draft.city).toBe('Curitiba');
  });

  it('JSON corrompido ou nulo resulta em formulário vazio', () => {
    localStorage.setItem(KEY, '{{{');
    expect(TestBed.inject(CheckoutDraftService).snapshot).toEqual(EMPTY_CHECKOUT);
  });

  it('reset limpa o formulário e o armazenamento', () => {
    const service = TestBed.inject(CheckoutDraftService);
    service.update({ name: 'Maria' });
    service.reset();
    expect(service.snapshot).toEqual(EMPTY_CHECKOUT);
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
