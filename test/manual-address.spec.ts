import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { STORE_INFO } from '../src/app/data/store-info';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { CheckoutDraftService, EMPTY_CHECKOUT } from '../src/app/services/checkout-draft.service';
import { CheckoutValidationService } from '../src/app/services/checkout-validation.service';
import { DeliveryZoneService } from '../src/app/services/delivery-zone.service';
import { WhatsappMessageService } from '../src/app/services/whatsapp-message.service';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const STORE = STORE_INFO.freeDelivery.origin;
const point = (km: number) => ({ lat: String(STORE.lat + km / 111.195), lon: String(STORE.lng) });
const hit = (km: number, overrides: Record<string, unknown> = {}) => [
  {
    ...point(km),
    place_rank: 30,
    display_name: '135, Rua Luiz Braille, São Braz, Curitiba, Paraná, Região Sul, 82015-646, Brasil',
    ...overrides,
  },
];

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
    TestBed.resetTestingModule();
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

describe('DeliveryZoneService.checkAddress (endereço digitado)', () => {
  let service: DeliveryZoneService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DeliveryZoneService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function run(address = MANUAL) {
    const results: ReturnType<typeof Object>[] = [];
    service.checkAddress(address).subscribe((z) => results.push(z));
    return results as { status: string; distanceKm?: number; key?: string }[];
  }

  const search = () => http.expectOne((r) => r.url === NOMINATIM);

  it('endereço confiável a até 3 km: entrega grátis', () => {
    const results = run();
    search().flush(hit(2.5));
    expect(results[0].status).toBe('free');
    expect(results[0].distanceKm).toBeCloseTo(2.5, 1);
    expect(results[0].key).toContain('addr:');
  });

  it('endereço confiável a mais de 3 km: fora da área', () => {
    const results = run();
    search().flush(hit(4.5));
    expect(results[0].status).toBe('outside');
  });

  it('consulta de forma estruturada (número + rua, cidade), só no Brasil; o bairro é conferido no resultado', () => {
    run();
    const req = search();
    expect(req.request.params.get('street')).toBe('135 Rua Luiz Braille');
    expect(req.request.params.get('city')).toBe('Curitiba');
    expect(req.request.params.has('q')).toBeFalse();
    expect(req.request.params.get('countrycodes')).toBe('br');
    expect(req.request.params.get('addressdetails')).toBe('1');
    expect(req.request.params.get('limit')).toBe('1');
    req.flush([]);
  });

  it('bairro digitado diferente do encontrado: desconhecido (nunca concede grátis por rua homônima)', () => {
    const results = run({ ...MANUAL, neighborhood: 'Centro' });
    search().flush(hit(1));
    expect(results[0].status).toBe('unknown');
  });

  it('a comparação de bairro ignora acento e maiúsculas', () => {
    const results = run({ ...MANUAL, neighborhood: 'SAO BRAZ', city: 'curitiba' });
    search().flush(hit(1));
    expect(results[0].status).toBe('free');
  });

  it('resultado só de cidade/bairro (sem chegar à rua) não vale', () => {
    const results = run();
    search().flush(hit(1, { place_rank: 16, display_name: 'São Braz, Curitiba, Paraná, Brasil' }));
    expect(results[0].status).toBe('unknown');
  });

  it('cidade diferente da digitada não vale', () => {
    const results = run({ ...MANUAL, city: 'Colombo' });
    search().flush(hit(1));
    expect(results[0].status).toBe('unknown');
  });

  for (const missing of ['street', 'number', 'neighborhood', 'city'] as const) {
    it(`sem "${missing}" não consulta nada e devolve desconhecido`, () => {
      const results = run({ ...MANUAL, [missing]: '  ' });
      http.expectNone(() => true);
      expect(results[0].status).toBe('unknown');
    });
  }

  it('sem resultado, com erro de rede ou coordenada fora do Brasil: desconhecido', () => {
    let results = run();
    search().flush([]);
    expect(results[0].status).toBe('unknown');

    results = run();
    search().error(new ProgressEvent('error'));
    expect(results[0].status).toBe('unknown');

    results = run();
    search().flush(hit(0, { lat: '0', lon: '0' }));
    expect(results[0].status).toBe('unknown');
  });

  it('guarda o resultado por endereço (mesmo com acento/caixa diferentes) e não guarda "desconhecido"', () => {
    run();
    search().flush(hit(1));
    const again = run({ ...MANUAL, street: 'RUA LUIZ BRAILLE', neighborhood: 'sao braz' });
    http.expectNone(() => true);
    expect(again[0].status).toBe('free');

    run({ ...MANUAL, number: '999' });
    search().flush([]);
    run({ ...MANUAL, number: '999' });
    search().flush(hit(1)); // desconhecido não foi guardado: consultou de novo
  });
});

describe('Endereço manual: checkout (facade)', () => {
  let facade: CheckoutFacadeService;
  let http: HttpTestingController;
  const decode = (url: string) => decodeURIComponent(url.split('?text=')[1]);

  function fillManual(): void {
    facade.update({ name: 'Maria', payment: 'pix', ...MANUAL });
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

  it('ligar o modo manual limpa o CEP e zera a zona', () => {
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

  it('endereço manual completo na área grátis: cartão liberado e mensagem sem CEP com "Entrega grátis"', () => {
    facade.setManualAddress(true);
    fillManual();
    facade.refreshAddressZone();
    http.expectOne((r) => r.url === NOMINATIM).flush(hit(2));
    expect(facade.zone.status).toBe('free');

    const result = facade.submit();
    expect(result.ok).toBeTrue();
    if (!result.ok) return;
    const msg = decode(result.url);
    expect(msg).toContain('Entrega grátis (até 3 km da loja)');
    expect(msg).not.toContain('CEP');
  });

  it('endereço manual fora da área: mensagem padrão', () => {
    facade.setManualAddress(true);
    fillManual();
    facade.refreshAddressZone();
    http.expectOne((r) => r.url === NOMINATIM).flush(hit(6));
    const result = facade.submit();
    expect(result.ok).toBeTrue();
    if (!result.ok) return;
    expect(decode(result.url)).not.toContain('Entrega grátis');
    expect(decode(result.url)).toContain('taxa de entrega');
  });

  it('editar qualquer campo do endereço depois de "grátis" zera a zona (não vale para outro endereço)', () => {
    facade.setManualAddress(true);
    fillManual();
    facade.refreshAddressZone();
    http.expectOne((r) => r.url === NOMINATIM).flush(hit(1));
    expect(facade.zone.status).toBe('free');

    facade.update({ street: 'Rua Outra' });
    expect(facade.zone.status).toBe('unknown');
    const result = facade.submit();
    expect(result.ok).toBeTrue();
    if (result.ok) expect(decode(result.url)).not.toContain('Entrega grátis');
  });

  it('editar o nome ou o complemento não zera a zona', () => {
    facade.setManualAddress(true);
    fillManual();
    facade.refreshAddressZone();
    http.expectOne((r) => r.url === NOMINATIM).flush(hit(1));
    facade.update({ name: 'Outra Pessoa', complement: 'Casa' });
    expect(facade.zone.status).toBe('free');
  });

  it('consulta incompleta (falta bairro) não chama nada', () => {
    facade.setManualAddress(true);
    facade.update({ street: 'Rua A', number: '1', city: 'Curitiba' });
    facade.refreshAddressZone();
    http.expectNone(() => true);
    expect(facade.zone.status).toBe('unknown');
  });

  it('a resposta atrasada de um endereço antigo é descartada quando o endereço muda', () => {
    facade.setManualAddress(true);
    fillManual();
    facade.refreshAddressZone();
    const pending = http.expectOne((r) => r.url === NOMINATIM);
    facade.update({ number: '999' });
    expect(pending.cancelled).toBeTrue();
    expect(facade.zone.status).toBe('unknown');
  });

  it('endereço manual completo salvo de uma visita anterior recalcula a zona ao abrir', () => {
    localStorage.setItem('disk-pizza:v2:checkout', JSON.stringify({ ...EMPTY_CHECKOUT, manualAddress: true, ...MANUAL }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    http = TestBed.inject(HttpTestingController);
    facade = TestBed.inject(CheckoutFacadeService);
    http.expectOne((r) => r.url === NOMINATIM).flush(hit(1));
    expect(facade.zone.status).toBe('free');
  });

  it('modo com CEP continua igual: CEP completo consulta a AwesomeAPI e não o Nominatim', () => {
    facade.setCep('82015290');
    facade.lookupCep().subscribe();
    http.expectOne('https://viacep.com.br/ws/82015290/json/').flush({ erro: true });
    http.expectOne('https://cep.awesomeapi.com.br/json/82015290').flush({ lat: String(STORE.lat), lng: String(STORE.lng) });
    expect(facade.zone.status).toBe('free');
  });
});
