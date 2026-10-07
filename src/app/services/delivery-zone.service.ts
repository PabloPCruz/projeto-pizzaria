import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap, timeout } from 'rxjs/operators';
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

/**
 * `free`: dentro do raio de entrega grátis. `outside`: fora. `unknown`: não deu para localizar o endereço.
 * `key` é o CEP (só dígitos) para o qual a zona foi calculada: a zona de um CEP nunca vale para outro.
 * `addr` (cidade|UF no momento da consulta, preenchido pelo checkout) impede que a zona de um endereço valha
 * depois que cidade ou estado foram trocados.
 * A entrega grátis só existe com CEP; quem preenche o endereço à mão fica sempre em `unknown`.
 */
export type DeliveryZone =
  | { status: 'free'; distanceKm: number; key: string; addr?: string }
  | { status: 'outside'; distanceKm: number; key: string; addr?: string }
  | { status: 'unknown' };

/** Tempo máximo de cada consulta externa; passou disso, o endereço fica "não localizado". */
const REQUEST_TIMEOUT_MS = 6000;

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
      switchMap((point) =>
        point
          ? // Só a posição vinda do CEP é guardada: a localização por endereço depende do que foi digitado.
            of(this.classify(point, digits)).pipe(
              tap((zone) => {
                if (zone.status !== 'unknown') this.cache.set(digits, zone);
              })
            )
          : this.locateByAddress(address).pipe(map((byAddress) => this.classify(byAddress, digits)))
      )
    );
  }

  private classify(point: GeoPoint | null, key: string): DeliveryZone {
    if (!point) return { status: 'unknown' };
    const { origin, radiusKm } = STORE_INFO.freeDelivery;
    const km = distanceKm(origin, point);
    return { status: km <= radiusKm ? 'free' : 'outside', distanceKm: km, key };
  }

  private locateByCep(digits: string): Observable<GeoPoint | null> {
    return this.http.get<{ lat?: unknown; lng?: unknown }>(`https://cep.awesomeapi.com.br/json/${digits}`).pipe(
      timeout(REQUEST_TIMEOUT_MS),
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
      timeout(REQUEST_TIMEOUT_MS),
      map((list) => toPoint(list?.[0]?.lat, list?.[0]?.lon)),
      catchError(() => of(null))
    );
  }
}
