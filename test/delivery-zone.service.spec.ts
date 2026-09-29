import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { STORE_INFO } from '../src/app/data/store-info';
import { DeliveryZone, DeliveryZoneService, distanceKm } from '../src/app/services/delivery-zone.service';

const STORE = STORE_INFO.freeDelivery.origin;
const KM_PER_DEGREE = 111.195;

/** Ponto a `km` quilômetros ao norte da loja. */
const north = (km: number) => ({ lat: STORE.lat + km / KM_PER_DEGREE, lng: STORE.lng });
/** Ponto a `km` quilômetros a leste da loja. */
const east = (km: number) => ({
  lat: STORE.lat,
  lng: STORE.lng + km / (KM_PER_DEGREE * Math.cos((STORE.lat * Math.PI) / 180)),
});

const awesome = (cep: string) => `https://cep.awesomeapi.com.br/json/${cep}`;
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

describe('distanceKm (Haversine, em linha reta)', () => {
  it('mesmo ponto = 0', () => {
    expect(distanceKm(STORE, STORE)).toBe(0);
  });

  it('mede quilômetros ao norte e ao leste (360°, qualquer direção)', () => {
    expect(distanceKm(STORE, north(3))).toBeCloseTo(3, 1);
    expect(distanceKm(STORE, east(2))).toBeCloseTo(2, 1);
    expect(distanceKm(STORE, north(-2.5))).toBeCloseTo(2.5, 1);
  });

  it('é simétrica', () => {
    const a = north(1.7);
    expect(distanceKm(STORE, a)).toBeCloseTo(distanceKm(a, STORE), 9);
  });

  it('centro de Curitiba (Rua José Loureiro) fica a ~7 km da loja', () => {
    const d = distanceKm(STORE, { lat: -25.4320987, lng: -49.2683971 });
    expect(d).toBeGreaterThan(6.5);
    expect(d).toBeLessThan(8);
  });
});

describe('DeliveryZoneService', () => {
  let service: DeliveryZoneService;
  let http: HttpTestingController;

  const ADDRESS = { street: 'Rua Luiz Braille', number: '200', city: 'Curitiba', state: 'PR' };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DeliveryZoneService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function run(cep: string, address = ADDRESS): DeliveryZone[] {
    const results: DeliveryZone[] = [];
    service.check(cep, address).subscribe((z) => results.push(z));
    return results;
  }

  const coords = (p: { lat: number; lng: number }) => ({ lat: String(p.lat), lng: String(p.lng) });

  it('endereço dentro de 3 km da loja = entrega grátis', () => {
    const results = run('82015-290');
    http.expectOne(awesome('82015290')).flush(coords(north(2.9)));
    expect(results.length).toBe(1);
    expect(results[0].status).toBe('free');
    if (results[0].status === 'free') {
      expect(results[0].distanceKm).toBeCloseTo(2.9, 1);
      expect(results[0].key).toBe('82015290');
    }
  });

  it('o próprio endereço da loja (distância 0) é grátis', () => {
    const results = run('82015290');
    http.expectOne(awesome('82015290')).flush(coords(STORE));
    expect(results[0].status).toBe('free');
  });

  it('passou de 3 km em qualquer direção = fora da área (mensagem padrão)', () => {
    for (const [cep, point] of [
      ['80010000', north(3.2)],
      ['80020000', east(3.2)],
      ['80030000', north(-4)],
    ] as const) {
      const results = run(cep);
      http.expectOne(awesome(cep)).flush(coords(point));
      expect(results[0].status).withContext(cep).toBe('outside');
    }
  });

  it('o raio é definido pela loja: 3 km', () => {
    expect(STORE_INFO.freeDelivery.radiusKm).toBe(3);
  });

  it('CEP com menos de 8 dígitos = desconhecido, sem chamar API', () => {
    expect(run('8201')).toEqual([{ status: 'unknown' }]);
    http.expectNone(() => true);
  });

  it('AwesomeAPI fora do ar ou sem o CEP: usa o Nominatim com o endereço completo', () => {
    const results = run('82015290');
    http.expectOne(awesome('82015290')).flush({ code: 'not_found' }, { status: 404, statusText: 'Not Found' });
    const req: TestRequest = http.expectOne((r) => r.url === NOMINATIM);
    expect(req.request.params.get('street')).toBe('200 Rua Luiz Braille');
    expect(req.request.params.get('city')).toBe('Curitiba');
    expect(req.request.params.get('countrycodes')).toBe('br');
    expect(req.request.params.get('format')).toBe('jsonv2');
    const p = north(1);
    req.flush([{ lat: String(p.lat), lon: String(p.lng) }]);
    expect(results[0].status).toBe('free');
  });

  it('AwesomeAPI sem coordenadas válidas também cai no Nominatim', () => {
    const results = run('82015290');
    http.expectOne(awesome('82015290')).flush({ lat: '', lng: 'abc' });
    http.expectOne((r) => r.url === NOMINATIM).flush([{ lat: String(north(5).lat), lon: String(north(5).lng) }]);
    expect(results[0].status).toBe('outside');
  });

  it('coordenadas fora do Brasil são descartadas (nunca vira "grátis" por dado absurdo)', () => {
    const results = run('82015290');
    http.expectOne(awesome('82015290')).flush({ lat: '0', lng: '0' });
    http.expectOne((r) => r.url === NOMINATIM).flush([]);
    expect(results[0].status).toBe('unknown');
  });

  it('as duas fontes falhando = desconhecido (mantém a mensagem padrão, nunca afirma grátis)', () => {
    const results = run('82015290');
    http.expectOne(awesome('82015290')).error(new ProgressEvent('error'));
    http.expectOne((r) => r.url === NOMINATIM).error(new ProgressEvent('error'));
    expect(results).toEqual([{ status: 'unknown' }]);
  });

  it('sem rua/cidade não há como usar o Nominatim: desconhecido', () => {
    const results = run('82015290', { street: '', number: '', city: '', state: '' });
    http.expectOne(awesome('82015290')).flush({ code: 'not_found' }, { status: 404, statusText: 'Not Found' });
    http.expectNone((r) => r.url === NOMINATIM);
    expect(results[0].status).toBe('unknown');
  });

  it('guarda o resultado por CEP: consultar de novo não repete a chamada', () => {
    run('82015290');
    http.expectOne(awesome('82015290')).flush(coords(north(1)));
    const again = run('82015-290');
    http.expectNone(() => true);
    expect(again[0].status).toBe('free');
  });

  it('resultado desconhecido não fica guardado (tenta de novo na próxima)', () => {
    run('82015290');
    http.expectOne(awesome('82015290')).error(new ProgressEvent('error'));
    http.expectOne((r) => r.url === NOMINATIM).error(new ProgressEvent('error'));
    run('82015290');
    http.expectOne(awesome('82015290')).flush(coords(north(1)));
  });
});
