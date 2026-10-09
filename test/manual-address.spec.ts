import { resetKeepingClock } from './helpers/fake-clock';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { STORE_INFO } from '../src/app/data/store-info';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { CheckoutDraftService, EMPTY_CHECKOUT } from '../src/app/services/checkout-draft.service';
import { CheckoutValidationService } from '../src/app/services/checkout-validation.service';
import { WhatsappMessageService } from '../src/app/services/whatsapp-message.service';

const STORE = STORE_INFO.freeDelivery.origin;
const MANUAL = { street: 'Rua Luiz Braille', number: '135', neighborhood: 'São Braz', city: 'Curitiba', state: 'PR' };

const CART: CartState = {
  pizzas: [{ id: '1', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 }],
  drinks: [],
};

const VALID_MANUAL: CheckoutDraft = {
  ...EMPTY_CHECKOUT,
  name: 'Maria',
  phone: '(41) 99999-1234',
  manualAddress: true,
  ...MANUAL,
  payment: 'pix',
};

describe('Endereço manual (sem CEP): validação', () => {
  let validation: CheckoutValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    validation = TestBed.inject(CheckoutValidationService);
  });

  it('pedido com endereço manual completo é válido, sem CEP e sem complemento', () => {
    const errors = validation.validate(CART, VALID_MANUAL);
    expect(validation.isValid(errors)).toBeTrue();
    expect(VALID_MANUAL.cep).toBe('');
    expect(VALID_MANUAL.complement).toBe('');
  });

  for (const [field, message] of [
    ['street', 'rua'],
    ['number', 'número'],
    ['neighborhood', 'bairro'],
    ['city', 'cidade'],
    ['state', 'estado'],
  ] as const) {
    it(`no modo manual o campo "${field}" continua obrigatório`, () => {
      const errors = validation.validate(CART, { ...VALID_MANUAL, [field]: '' });
      expect(errors[field]).withContext(message).toBeTruthy();
      expect(Object.keys(errors)).toEqual([field]);
    });
  }

  it('espaços em branco não valem como preenchidos', () => {
    const errors = validation.validate(CART, { ...VALID_MANUAL, street: '   ', neighborhood: '  ' });
    expect(errors.street).toBeTruthy();
    expect(errors.neighborhood).toBeTruthy();
  });

  it('UF precisa ter 2 letras também no modo manual', () => {
    expect(validation.validate(CART, { ...VALID_MANUAL, state: 'P' }).state).toBeTruthy();
    expect(validation.validate(CART, { ...VALID_MANUAL, state: '12' }).state).toBeTruthy();
  });

  it('no modo manual o CEP não é exigido, mas o complemento continua opcional', () => {
    const errors = validation.validate(CART, { ...VALID_MANUAL, cep: '', complement: '' });
    expect(errors.cep).toBeUndefined();
    expect(errors['complement' as keyof typeof errors]).toBeUndefined();
  });

  it('sem o modo manual, o CEP continua obrigatório', () => {
    const errors = validation.validate(CART, { ...VALID_MANUAL, manualAddress: false, cep: '' });
    expect(errors.cep).toBeTruthy();
  });

  it('todos os campos vazios no modo manual: pede tudo, menos CEP e complemento', () => {
    const errors = validation.validate(CART, { ...EMPTY_CHECKOUT, manualAddress: true, name: 'Ana', phone: '(41) 99999-1234', payment: 'pix' });
    expect(Object.keys(errors).sort()).toEqual(['city', 'neighborhood', 'number', 'state', 'street']);
  });
});

describe('Endereço manual: rascunho e mensagem', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('o modo manual é gravado e restaurado ao recarregar', () => {
    TestBed.inject(CheckoutDraftService).update({ manualAddress: true, street: 'Rua A' });
    resetKeepingClock();
    TestBed.configureTestingModule({});
    const draft = TestBed.inject(CheckoutDraftService).snapshot;
    expect(draft.manualAddress).toBeTrue();
    expect(draft.street).toBe('Rua A');
  });

  it('valor salvo com tipo errado volta para "false"', () => {
    localStorage.setItem('disk-pizza:v2:checkout', JSON.stringify({ ...EMPTY_CHECKOUT, manualAddress: 'sim' }));
    expect(TestBed.inject(CheckoutDraftService).snapshot.manualAddress).toBeFalse();
  });

  it('a mensagem do WhatsApp não tem linha de CEP quando o endereço é manual', () => {
    const msg = TestBed.inject(WhatsappMessageService).buildMessage(CART, VALID_MANUAL);
    expect(msg).toContain('Rua Luiz Braille, 135\nSão Braz — Curitiba/PR\nContato: (41) 99999-1234');
    expect(msg).not.toContain('CEP');
  });

  it('com CEP informado a linha do CEP continua na mensagem', () => {
    const msg = TestBed.inject(WhatsappMessageService).buildMessage(CART, { ...VALID_MANUAL, manualAddress: false, cep: '82015-290' });
    expect(msg).toContain('CEP 82015-290');
  });
});


describe('Endereço manual: nunca há entrega grátis (só com CEP e dentro das regras)', () => {
  let facade: CheckoutFacadeService;
  let http: HttpTestingController;
  const decode = (url: string) => decodeURIComponent(url.split('?text=')[1]);
  const viacep = (cep: string) => `https://viacep.com.br/ws/${cep}/json/`;
  const awesome = (cep: string) => `https://cep.awesomeapi.com.br/json/${cep}`;
  const nearStore = { lat: String(STORE.lat + 1 / 111.195), lng: String(STORE.lng) };

  function fillOrder(): void {
    facade.update({ name: 'Maria', payment: 'pix' });
    facade.setPhone('41999998888');
    TestBed.inject(CartService).addPizza({ size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 });
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    facade = TestBed.inject(CheckoutFacadeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('ligar o modo manual limpa o CEP e zera a zona, sem consultar nada', () => {
    facade.setCep('82015290');
    facade.setManualAddress(true);
    expect(facade.draft.manualAddress).toBeTrue();
    expect(facade.draft.cep).toBe('');
    expect(facade.zone.status).toBe('unknown');
    http.expectNone(() => true);
  });

  it('desligar o modo manual volta a exigir o CEP e mantém o que foi digitado', () => {
    facade.setManualAddress(true);
    facade.update({ street: 'Rua A' });
    facade.setManualAddress(false);
    expect(facade.draft.manualAddress).toBeFalse();
    expect(facade.draft.street).toBe('Rua A');
    expect(facade.validate()['cep']).toBeTruthy();
  });

  it('endereço manual completo, mesmo dentro dos 3 km, NÃO recebe entrega grátis e nada é consultado', () => {
    facade.setManualAddress(true);
    facade.update({ ...MANUAL });
    fillOrder();
    http.expectNone(() => true);
    expect(facade.zone.status).toBe('unknown');

    const result = facade.submit();
    expect(result.ok).toBeTrue();
    if (!result.ok) return;
    const msg = decode(result.url);
    expect(msg).not.toContain('Entrega grátis');
    expect(msg).not.toContain('CEP');
    expect(msg).toContain('taxa de entrega'); // a loja informa a taxa na confirmação
  });

  it('ligar o modo manual DEPOIS de a entrega grátis ter sido liberada pelo CEP apaga o benefício na hora', () => {
    facade.setCep('82015290');
    facade.lookupCep().subscribe();
    http.expectOne(viacep('82015290')).flush({ logradouro: 'Rua Luiz Braille', bairro: 'São Braz', localidade: 'Curitiba', uf: 'PR' });
    http.expectOne(awesome('82015290')).flush(nearStore);
    expect(facade.zone.status).toBe('free');

    facade.setManualAddress(true);
    expect(facade.zone.status).toBe('unknown');

    facade.update({ ...MANUAL });
    fillOrder();
    const result = facade.submit();
    expect(result.ok).toBeTrue();
    if (result.ok) expect(decode(result.url)).not.toContain('Entrega grátis');
  });

  it('desligar o modo manual e informar um CEP dentro das regras libera a entrega grátis de novo', () => {
    facade.setManualAddress(true);
    facade.setManualAddress(false);
    facade.setCep('82015290');
    facade.lookupCep().subscribe();
    http.expectOne(viacep('82015290')).flush({ erro: true });
    http.expectOne(awesome('82015290')).flush(nearStore);
    expect(facade.zone.status).toBe('free');
  });

  it('CEP salvo em modo manual não dispara consulta ao abrir o checkout', () => {
    localStorage.setItem('disk-pizza:v2:checkout', JSON.stringify({ ...EMPTY_CHECKOUT, manualAddress: true, cep: '82015-290', ...MANUAL }));
    resetKeepingClock();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    http = TestBed.inject(HttpTestingController);
    facade = TestBed.inject(CheckoutFacadeService);
    http.expectNone(() => true);
    expect(facade.zone.status).toBe('unknown');
  });
});
