import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { STORE_INFO } from '../src/app/data/store-info';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { CartService } from '../src/app/services/cart.service';
import { CepService } from '../src/app/services/cep.service';
import { DeliveryZoneService } from '../src/app/services/delivery-zone.service';

const STORE = STORE_INFO.freeDelivery.origin;
const north = (km: number) => ({ lat: String(STORE.lat + km / 111.195), lng: String(STORE.lng) });
const viacep = (cep: string) => `https://viacep.com.br/ws/${cep}/json/`;
const awesome = (cep: string) => `https://cep.awesomeapi.com.br/json/${cep}`;
const NOMINATIM = (r: { url: string }) => r.url === 'https://nominatim.openstreetmap.org/search';
const VIACEP_OK = { logradouro: 'Rua Luiz Braille', bairro: 'São Braz', localidade: 'Curitiba', uf: 'PR' };

describe('Entrega grátis: só para o endereço certo', () => {
  let facade: CheckoutFacadeService;
  let http: HttpTestingController;

  function lookup(cep: string, viaCepBody: object, coords: object | null): void {
    facade.setCep(cep);
    facade.lookupCep().subscribe();
    http.expectOne(viacep(cep.replace(/\D/g, ''))).flush(viaCepBody);
    if (coords) http.expectOne(awesome(cep.replace(/\D/g, ''))).flush(coords);
  }

  function fillValidOrder(): void {
    TestBed.inject(CartService).addPizza({ size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 });
    facade.update({ name: 'Maria', number: '10', payment: 'pix' });
    facade.setPhone('41999998888');
  }

  const message = () => {
    const result = facade.submit();
    expect(result.ok).toBeTrue();
    return result.ok ? decodeURIComponent(result.url.split('?text=')[1]) : '';
  };

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

  it('trocar a cidade depois de "grátis" tira o cartão e a mensagem não afirma entrega grátis', () => {
    fillValidOrder();
    lookup('82015-290', VIACEP_OK, north(1));
    expect(facade.zone.status).toBe('free');

    facade.update({ city: 'Londrina' });
    expect(facade.zone.status).toBe('unknown');
    let streamed = '';
    facade.zone$.subscribe((z) => (streamed = z.status)).unsubscribe();
    expect(streamed).toBe('unknown');
    expect(message()).not.toContain('Entrega grátis');
  });

  it('trocar o estado também invalida; voltar ao valor original traz a zona de volta', () => {
    lookup('82015-290', VIACEP_OK, north(1));
    facade.update({ state: 'SP' });
    expect(facade.zone.status).toBe('unknown');
    facade.update({ state: 'PR' });
    expect(facade.zone.status).toBe('free');
  });

  it('acento e caixa na cidade não invalidam ("sao jose" = "São José")', () => {
    lookup('82015-290', { ...VIACEP_OK, localidade: 'São José dos Pinhais' }, north(1));
    facade.update({ city: 'sao jose dos pinhais' });
    expect(facade.zone.status).toBe('free');
  });

  it('CEP geral de cidade (ViaCEP sem rua) nunca é entrega grátis, mesmo com a posição perto', () => {
    fillValidOrder();
    lookup('82015-290', { logradouro: '', bairro: '', localidade: 'Curitiba', uf: 'PR' }, north(1));
    facade.update({ street: 'Rua que o cliente digitou', neighborhood: 'Centro' });
    expect(facade.zone.status).toBe('unknown');
    expect(message()).not.toContain('Entrega grátis');
  });

  it('o endereço que o CEP anterior preencheu sai quando o CEP muda, e o novo CEP sem rua não herda a rua antiga', () => {
    lookup('82015-290', VIACEP_OK, north(1));
    expect(facade.draft.street).toBe('Rua Luiz Braille');

    facade.setCep('80010-000');
    expect(facade.draft.street).toBe('');
    expect(facade.draft.neighborhood).toBe('');
    expect(facade.draft.city).toBe('');
    expect(facade.draft.state).toBe('');

    facade.lookupCep().subscribe();
    http.expectOne(viacep('80010000')).flush({ erro: true });
    http.expectOne(awesome('80010000')).flush({ code: 'not_found' }, { status: 404, statusText: 'Not Found' });
    // Sem rua digitada, a consulta por endereço nem acontece.
    http.expectNone(NOMINATIM);
    expect(facade.zone.status).toBe('unknown');
  });

  it('o que o cliente mexeu à mão não é apagado quando o CEP muda', () => {
    lookup('82015-290', VIACEP_OK, north(1));
    facade.update({ street: 'Rua que o cliente corrigiu' });
    facade.setCep('80010-000');
    expect(facade.draft.street).toBe('Rua que o cliente corrigiu');
    expect(facade.draft.neighborhood).toBe('');
  });

  it('repetir a consulta do mesmo CEP não apaga o endereço', () => {
    lookup('82015-290', VIACEP_OK, north(1));
    facade.setCep('82015290');
    expect(facade.draft.street).toBe('Rua Luiz Braille');
  });
});

describe('DeliveryZoneService: cache e tempo limite', () => {
  let service: DeliveryZoneService;
  let http: HttpTestingController;
  const ADDRESS = { street: 'Rua Luiz Braille', number: '135', city: 'Curitiba', state: 'PR' };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DeliveryZoneService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('posição vinda do CEP é guardada: a segunda consulta não vai à rede', () => {
    let first = '';
    service.check('82015290', ADDRESS).subscribe((z) => (first = z.status));
    http.expectOne(awesome('82015290')).flush(north(1));
    expect(first).toBe('free');

    let second = '';
    service.check('82015290', ADDRESS).subscribe((z) => (second = z.status));
    http.expectNone(awesome('82015290'));
    expect(second).toBe('free');
  });

  it('posição vinda do endereço digitado NÃO é guardada (outro endereço, outra resposta)', () => {
    service.check('82030000', ADDRESS).subscribe();
    http.expectOne(awesome('82030000')).flush({}, { status: 404, statusText: 'Not Found' });
    http.expectOne(NOMINATIM).flush([{ lat: String(STORE.lat), lon: String(STORE.lng) }]);

    service.check('82030000', { ...ADDRESS, street: 'Outra Rua' }).subscribe();
    http.expectOne(awesome('82030000')).flush({}, { status: 404, statusText: 'Not Found' });
    http.expectOne(NOMINATIM).flush([]);
  });

  it('consulta que não responde em 6 s vira "não localizado" (nunca grátis)', fakeAsync(() => {
    let status = '';
    service.check('82015290', ADDRESS).subscribe((z) => (status = z.status));
    http.expectOne(awesome('82015290'));
    tick(6000);
    // O fallback por endereço também precisa responder; sem resposta, cai de novo.
    http.expectOne(NOMINATIM);
    tick(6000);
    expect(status).toBe('unknown');
  }));
});

describe('CepService: tempo limite', () => {
  it('ViaCEP que não responde em 6 s vira "error"', fakeAsync(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    const cep = TestBed.inject(CepService);
    const http = TestBed.inject(HttpTestingController);
    let status = '';
    cep.lookup('80010000').subscribe((r) => (status = r.status));
    http.expectOne(viacep('80010000'));
    tick(5999);
    expect(status).toBe('');
    tick(1);
    expect(status).toBe('error');
    http.verify();
  }));
});
