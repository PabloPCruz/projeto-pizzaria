import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export type CepLookupResult =
  | { status: 'ok'; address: CepAddress }
  | { status: 'invalid' }
  | { status: 'not-found' }
  | { status: 'error' };

interface ViaCepResponse {
  erro?: boolean | string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

/** Consulta de endereço pela API pública ViaCEP. Nunca lança: o resultado diz o que aconteceu. */
@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly apiUrl = 'https://viacep.com.br/ws';

  constructor(private http: HttpClient) {}

  lookup(cep: string): Observable<CepLookupResult> {
    const digits = (cep ?? '').replace(/\D/g, '');
    if (digits.length !== 8) return of<CepLookupResult>({ status: 'invalid' });

    return this.http.get<ViaCepResponse>(`${this.apiUrl}/${digits}/json/`).pipe(
      map((res): CepLookupResult => {
        if (!res || res.erro) return { status: 'not-found' };
        return {
          status: 'ok',
          address: {
            street: res.logradouro ?? '',
            neighborhood: res.bairro ?? '',
            city: res.localidade ?? '',
            state: res.uf ?? '',
          },
        };
      }),
      catchError(() => of<CepLookupResult>({ status: 'error' }))
    );
  }
}
