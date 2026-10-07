import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { CartService } from '../src/app/services/cart.service';
import { SUNDAY_INSTANT, fakeClock } from './helpers/fake-clock';

describe('CheckoutFacadeService', () => {
  let facade: CheckoutFacadeService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    facade = TestBed.inject(CheckoutFacadeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // As consultas de zona de entrega (AwesomeAPI/Nominatim) têm spec próprio: checkout-delivery.spec.ts.
    http.match((r) => r.url.includes('awesomeapi') || r.url.includes('nominatim'));
    http.verify();
    localStorage.clear();
  });

  it('CEP encontrado preenche rua, bairro, cidade e UF sem tocar em número e complemento', () => {
    facade.update({ number: '42', complement: 'ap 3' });
    facade.setCep('80010000');
    facade.lookupCep().subscribe();
    http.expectOne('https://viacep.com.br/ws/80010000/json/').flush({
      logradouro: 'Rua XV de Novembro',
      bairro: 'Centro',
      localidade: 'Curitiba',
      uf: 'PR',
    });
    expect(facade.draft).toEqual(
      jasmine.objectContaining({
        cep: '80010-000',
        street: 'Rua XV de Novembro',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        number: '42',
        complement: 'ap 3',
      })
    );
  });

  it('CEP geral de cidade (sem rua/bairro) não apaga a rua digitada pelo cliente', () => {
    facade.update({ street: 'Rua que o cliente digitou', neighborhood: 'Meu bairro' });
    facade.setCep('83900000');
    facade.lookupCep().subscribe();
    http.expectOne('https://viacep.com.br/ws/83900000/json/').flush({
      logradouro: '',
      bairro: '',
      localidade: 'Exemplo',
      uf: 'PR',
    });
    expect(facade.draft.street).toBe('Rua que o cliente digitou');
    expect(facade.draft.neighborhood).toBe('Meu bairro');
    expect(facade.draft.city).toBe('Exemplo');
  });

  it('CEP inexistente não altera o endereço', () => {
    facade.update({ street: 'Rua A' });
    facade.setCep('00000000');
    facade.lookupCep().subscribe();
    http.expectOne('https://viacep.com.br/ws/00000000/json/').flush({ erro: true });
    expect(facade.draft.street).toBe('Rua A');
  });

  it('submit devolve erros por campo quando o pedido está incompleto', () => {
    const result = facade.submit();
    expect(result.ok).toBeFalse();
    if (!result.ok) {
      expect(result.errors.cart).toBeTruthy();
      expect(result.errors.name).toBeTruthy();
      expect(result.errors.payment).toBeTruthy();
    }
  });

  it('submit devolve o link do WhatsApp quando tudo está preenchido', () => {
    TestBed.inject(CartService).addPizza({
      size: 'media',
      flavorIds: ['tradicional-calabresa'],
      crustId: null,
      notes: '',
      quantity: 1,
    });
    facade.update({
      name: 'Maria',
      cep: '80010-000',
      street: 'Rua A',
      number: '10',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
      payment: 'pix',
    });
    facade.setPhone('41999998888');
    const result = facade.submit();
    expect(result.ok).toBeTrue();
    if (result.ok) expect(result.url).toContain('https://wa.me/5541997449380?text=');
  });

  it('troco: máscara ao digitar e centavos completados ao sair do campo', () => {
    facade.update({ payment: 'dinheiro' });
    facade.setChangeFor('1000');
    expect(facade.draft.changeFor).toBe('R$ 1.000');
    facade.normalizeChangeFor();
    expect(facade.draft.changeFor).toBe('R$ 1.000,00');
  });

  it('troco: valor inválido ou zero não é reescrito ao sair do campo', () => {
    facade.update({ payment: 'dinheiro' });
    facade.setChangeFor('0');
    facade.normalizeChangeFor();
    expect(facade.draft.changeFor).toBe('R$ 0');
    facade.setChangeFor('');
    facade.normalizeChangeFor();
    expect(facade.draft.changeFor).toBe('');
  });

  it('startOver limpa carrinho e formulário', () => {
    TestBed.inject(CartService).addDrink('coca-2l');
    facade.update({ name: 'Maria' });
    facade.startOver();
    expect(TestBed.inject(CartService).snapshot).toEqual({ pizzas: [], drinks: [] });
    expect(facade.draft.name).toBe('');
  });

describe('loja fechada', () => {
    function fillValidOrder(): void {
      TestBed.inject(CartService).addPizza({
        size: 'media',
        flavorIds: ['tradicional-calabresa'],
        crustId: null,
        notes: '',
        quantity: 1,
      });
      facade.update({
        name: 'Maria',
        cep: '80010-000',
        street: 'Rua A',
        number: '10',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        payment: 'pix',
      });
      facade.setPhone('41999998888');
    }

    it('recusa o envio mesmo com tudo preenchido e não gera link', () => {
      fillValidOrder();
      fakeClock.set(SUNDAY_INSTANT);
      const result = facade.submit();
      expect(result.ok).toBeFalse();
      if (!result.ok) {
        expect(result.closed?.open).toBeFalse();
        expect(result.closed?.reason).toBe('closed-day');
        expect(result.errors).toEqual({});
      }
    });

    it('o horário é reavaliado no clique: aberto às 22h59, fechado às 23h00', () => {
      fillValidOrder();
      fakeClock.set('2026-10-05T22:59:59-03:00');
      expect(facade.submit().ok).toBeTrue();
      fakeClock.set('2026-10-05T23:00:00-03:00');
      expect(facade.submit().ok).toBeFalse();
    });

    it('carrinho e formulário continuam intactos depois da recusa', () => {
      fillValidOrder();
      const draftBefore = JSON.stringify(facade.draft);
      const cart = TestBed.inject(CartService);
      const cartBefore = JSON.stringify(cart.snapshot);
      fakeClock.set(SUNDAY_INSTANT);
      facade.submit();
      expect(JSON.stringify(facade.draft)).toBe(draftBefore);
      expect(JSON.stringify(cart.snapshot)).toBe(cartBefore);
    });

    it('aberto: o link é o de sempre', () => {
      fillValidOrder();
      const result = facade.submit();
      expect(result.ok).toBeTrue();
      if (result.ok) expect(result.url).toContain('https://wa.me/5541997449380?text=');
    });
  });
});
