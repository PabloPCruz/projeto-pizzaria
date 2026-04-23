import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

@Injectable({
  providedIn: 'root'
})
export class CepService {
  private apiUrl = 'https://viacep.com.br/ws';

  constructor(private http: HttpClient) {}

  buscarCep(cep: string): Observable<CEPResponse | null> {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return of(null);
    }

    const cepFormatado = cepLimpo.substring(0, 5) + '-' + cepLimpo.substring(5);

    return this.http
      .get<any>(`${this.apiUrl}/${cepLimpo}/json`)
      .pipe(
        catchError(() => {
          return of(null);
        }),
        map((response) => {
          if (!response || response.erro) {
            return null;
          }
          return { 
            ...response, 
            cep: cepFormatado 
          };
        })
      );
  }
}
