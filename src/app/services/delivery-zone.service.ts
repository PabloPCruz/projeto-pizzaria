import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { STORE_INFO } from '../data/store-info';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DeliveryAddress {
  street: string;
  number: string;
  city: string;
  state: string;
}

/** Endereço digitado à mão, para quem não sabe o CEP (todos os campos são obrigatórios, menos o complemento). */
export interface ManualAddress extends DeliveryAddress {
  neighborhood: string;
}

/**
 * `free`: dentro do raio de entrega grátis. `outside`: fora. `unknown`: não deu para localizar o endereço.
 * `key` identifica para qual endereço a zona foi calculada (CEP só com dígitos, ou "addr:..." no modo manual),
 * para nunca aplicar a zona de um endereço a outro.
 */
export type DeliveryZone =
  | { status: 'free'; distanceKm: number; key: string }
  | { status: 'outside'; distanceKm: number; key: string }
  | { status: 'unknown' };

/** Minúsculas, sem acento e sem espaços repetidos: para comparar textos digitados à mão. */
export function normalizeText(text: unknown): string {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Chave de um endereço digitado (ignora acento, caixa e o complemento). */
export function addressKey(address: ManualAddress): string {
  return `addr:${[address.street, address.number, address.neighborhood, address.city, address.state]
    .map(normalizeText)
    .join('|')}`;
}

const EARTH_RADIUS_KM = 6371.0088;

/** Distância em linha reta entre dois pontos (fórmula de Haversine), em km. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Retângulo que contém o Brasil: coordenada fora dele é dado errado e nunca conta como "grátis". */
function toPoint(lat: unknown, lng: unknown): GeoPoint | null {
  const point = { lat: parseFloat(String(lat)), lng: parseFloat(String(lng)) };
  const valid =
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -34 &&
    point.lat <= 6 &&
    point.lng >= -74 &&
    point.lng <= -32;
  return valid ? point : null;
}

/**
 * Decide se o endereço do cliente está na área de entrega grátis (até 3 km da loja, em linha reta).
 * Localiza o endereço pelo CEP (AwesomeAPI) e, se não conseguir, pelo endereço completo (Nominatim/OpenStreetMap).
 * Qualquer falha resulta em `unknown`: a tela mantém a mensagem padrão e nunca afirma entrega grátis sem certeza.
 */
@Injectable({ providedIn: 'root' })
export class DeliveryZoneService {
  private readonly cache = new Map<string, DeliveryZone>();

  constructor(private http: HttpClient) {}

  check(cep: string, address: DeliveryAddress): Observable<DeliveryZone> {
    const digits = (cep ?? '').replace(/\D/g, '');
    if (digits.length !== 8) return of<DeliveryZone>({ status: 'unknown' });

    const cached = this.cache.get(digits);
    if (cached) return of(cached);

    return this.locateByCep(digits).pipe(
      switchMap((point) => (point ? of(point) : this.locateByAddress(address))),
      map((point) => this.classify(point, digits)),
      tap((zone) => {
        if (zone.status !== 'unknown') this.cache.set(digits, zone);
      })
    );
  }

  /**
   * Zona de um endereço digitado à mão (cliente sem CEP). Como não há CEP, a localização vem só do texto,
   * então o critério é mais rígido: o resultado precisa chegar ao nível de rua e conter o bairro e a cidade
   * digitados. Senão é `unknown` (mensagem padrão), para nunca conceder "grátis" por uma rua homônima de outro bairro.
   */
  checkAddress(address: ManualAddress): Observable<DeliveryZone> {
    const street = (address?.street ?? '').trim();
    const number = (address?.number ?? '').trim();
    const neighborhood = (address?.neighborhood ?? '').trim();
    const city = (address?.city ?? '').trim();
    if (!street || !number || !neighborhood || !city) return of<DeliveryZone>({ status: 'unknown' });

    const key = addressKey(address);
    const cached = this.cache.get(key);
    if (cached) return of(cached);

    return this.locateByText({ street, number, neighborhood, city, state: address.state ?? '' }).pipe(
      map((point) => this.classify(point, key)),
      tap((zone) => {
        if (zone.status !== 'unknown') this.cache.set(key, zone);
      })
    );
  }

  private classify(point: GeoPoint | null, key: string): DeliveryZone {
    if (!point) return { status: 'unknown' };
    const { origin, radiusKm } = STORE_INFO.freeDelivery;
    const km = distanceKm(origin, point);
    return { status: km <= radiusKm ? 'free' : 'outside', distanceKm: km, key };
  }

  private locateByText(address: ManualAddress): Observable<GeoPoint | null> {
    // Busca estruturada (rua com número + cidade): na API real acha o endereço da loja, o texto livre não achava.
    // O bairro não vai na busca: é conferido depois no resultado (ruas longas cruzam vários bairros).
    const params = new HttpParams()
      .set('street', `${address.number} ${address.street}`)
      .set('city', address.city)
      .set('countrycodes', 'br')
      .set('format', 'jsonv2')
      .set('addressdetails', '1')
      .set('limit', '1');

    return this.http
      .get<{ lat?: unknown; lon?: unknown; place_rank?: unknown; display_name?: unknown }[]>(
        'https://nominatim.openstreetmap.org/search',
        { params }
      )
      .pipe(
        map((list) => {
          const result = list?.[0];
          if (!result) return null;
          // place_rank >= 26: chegou a uma rua ou a um número (abaixo disso é bairro/cidade, impreciso demais).
          if (!(Number(result.place_rank) >= 26)) return null;
          const found = normalizeText(result.display_name);
          if (!found.includes(normalizeText(address.neighborhood)) || !found.includes(normalizeText(address.city))) return null;
          return toPoint(result.lat, result.lon);
        }),
        catchError(() => of(null))
      );
  }

  private locateByCep(digits: string): Observable<GeoPoint | null> {
    return this.http.get<{ lat?: unknown; lng?: unknown }>(`https://cep.awesomeapi.com.br/json/${digits}`).pipe(
      map((res) => toPoint(res?.lat, res?.lng)),
      catchError(() => of(null))
    );
  }

  private locateByAddress(address: DeliveryAddress): Observable<GeoPoint | null> {
    const street = (address?.street ?? '').trim();
    const city = (address?.city ?? '').trim();
    if (!street || !city) return of(null);

    const params = new HttpParams()
      .set('street', `${(address.number ?? '').trim()} ${street}`.trim())
      .set('city', city)
      .set('countrycodes', 'br')
      .set('format', 'jsonv2')
      .set('limit', '1');

    return this.http.get<{ lat?: unknown; lon?: unknown }[]>('https://nominatim.openstreetmap.org/search', { params }).pipe(
      map((list) => toPoint(list?.[0]?.lat, list?.[0]?.lon)),
      catchError(() => of(null))
    );
  }
}
