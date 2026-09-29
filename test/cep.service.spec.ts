import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CepLookupResult, CepService } from '../src/app/services/cep.service';

describe('CepService', () => {
  let service: CepService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CepService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function lookup(cep: string): CepLookupResult[] {
    const results: CepLookupResult[] = [];
    service.lookup(cep).subscribe((r) => results.push(r));
    return results;
  }

  it('CEP com menos de 8 dígitos é inválido e não chama a API', () => {
    expect(lookup('80010')).toEqual([{ status: 'invalid' }]);
    http.expectNone(() => true);
  });

  it('mapeia rua, bairro, cidade e estado do ViaCEP', () => {
    const results = lookup('80010-000');
    http.expectOne('https://viacep.com.br/ws/80010000/json/').flush({
      logradouro: 'Rua XV de Novembro',
      bairro: 'Centro',
      localidade: 'Curitiba',
      uf: 'PR',
    });
    expect(results).toEqual([
      { status: 'ok', address: { street: 'Rua XV de Novembro', neighborhood: 'Centro', city: 'Curitiba', state: 'PR' } },
    ]);
  });

  it('CEP inexistente devolve not-found', () => {
    const results = lookup('00000000');
    http.expectOne('https://viacep.com.br/ws/00000000/json/').flush({ erro: true });
    expect(results).toEqual([{ status: 'not-found' }]);
  });

  it('falha de rede devolve error em vez de lançar', () => {
    const results = lookup('80010000');
    http.expectOne('https://viacep.com.br/ws/80010000/json/').error(new ProgressEvent('error'));
    expect(results).toEqual([{ status: 'error' }]);
  });
});
