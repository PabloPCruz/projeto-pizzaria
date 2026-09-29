import { TestBed } from '@angular/core/testing';
import { FormatService } from '../src/app/services/format.service';

describe('FormatService', () => {
  let service: FormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormatService);
  });

  it('aplica máscara de CEP enquanto digita', () => {
    expect(service.cep('80010')).toBe('80010');
    expect(service.cep('80010000')).toBe('80010-000');
    expect(service.cep('80.010-000999')).toBe('80010-000');
  });

  it('aplica máscara de telefone fixo e celular', () => {
    expect(service.phone('4')).toBe('(4');
    expect(service.phone('41997449380')).toBe('(41) 99744-9380');
    expect(service.phone('4132732145')).toBe('(41) 3273-2145');
  });

  it('interpreta valores em reais', () => {
    expect(service.parseMoney('100')).toBe(100);
    expect(service.parseMoney('R$ 50,50')).toBe(50.5);
    expect(service.parseMoney('1.234,50')).toBe(1234.5);
    expect(service.parseMoney('abc')).toBeNull();
    expect(service.parseMoney('')).toBeNull();
  });

  it('trata ponto seguido de 3 dígitos como milhar (troco "1.000" = mil reais)', () => {
    expect(service.parseMoney('1.000')).toBe(1000);
    expect(service.parseMoney('R$ 1.000')).toBe(1000);
    expect(service.parseMoney('2.500.000')).toBe(2500000);
    expect(service.parseMoney('1.000,50')).toBe(1000.5);
    expect(service.parseMoney('50.5')).toBe(50.5);
  });

  it('rejeita valores com letras, notação científica ou vírgulas repetidas', () => {
    expect(service.parseMoney('1e3')).toBeNull();
    expect(service.parseMoney('10 reais')).toBeNull();
    expect(service.parseMoney('1,0,0')).toBeNull();
    expect(service.parseMoney('--')).toBeNull();
  });

  it('telefone colado com +55 mantém o número certo', () => {
    expect(service.phone('+55 (41) 99744-9380')).toBe('(41) 99744-9380');
    expect(service.phone('5541997449380')).toBe('(41) 99744-9380');
    expect(service.phone('554132732145')).toBe('(41) 3273-2145');
  });

  it('DDD 55 digitado à mão não é confundido com código do país', () => {
    expect(service.phone('55999998888')).toBe('(55) 99999-8888');
  });

  describe('moneyMask (campo de troco)', () => {
    it('formata enquanto digita: prefixo R$, milhar com ponto e vírgula para centavos', () => {
      expect(service.moneyMask('1')).toBe('R$ 1');
      expect(service.moneyMask('100')).toBe('R$ 100');
      expect(service.moneyMask('1000')).toBe('R$ 1.000');
      expect(service.moneyMask('12345')).toBe('R$ 12.345');
      expect(service.moneyMask('1000,5')).toBe('R$ 1.000,5');
      expect(service.moneyMask('1000,50')).toBe('R$ 1.000,50');
    });

    it('campo vazio ou sem dígitos fica vazio (troco é opcional)', () => {
      expect(service.moneyMask('')).toBe('');
      expect(service.moneyMask('abc')).toBe('');
      expect(service.moneyMask('R$ ')).toBe('');
    });

    it('apagar um dígito de "R$ 1.000" não vira centavos ("R$ 1.00" => "R$ 100")', () => {
      expect(service.moneyMask('R$ 1.00')).toBe('R$ 100');
      expect(service.moneyMask('R$ 1.0')).toBe('R$ 10');
    });

    it('limita a 2 casas decimais, 5 dígitos inteiros e ignora letras e símbolos', () => {
      expect(service.moneyMask('10,999')).toBe('R$ 10,99');
      expect(service.moneyMask('1234567')).toBe('R$ 12.345');
      expect(service.moneyMask('1a0b0')).toBe('R$ 100');
      expect(service.moneyMask('10,5,3')).toBe('R$ 10,53');
    });

    it('vírgula sozinha começa com zero e zeros à esquerda são removidos', () => {
      expect(service.moneyMask(',')).toBe('R$ 0,');
      expect(service.moneyMask('0050')).toBe('R$ 50');
    });

    it('é idempotente: reaplicar sobre o resultado não muda nada', () => {
      ['R$ 1.000,50', 'R$ 100', 'R$ 0,', 'R$ 12.345,6'].forEach((v) => expect(service.moneyMask(v)).toBe(v));
    });

    it('o valor mascarado é lido corretamente por parseMoney', () => {
      expect(service.parseMoney(service.moneyMask('1000,5'))).toBe(1000.5);
      expect(service.parseMoney(service.moneyMask('100'))).toBe(100);
    });
  });

  it('moneyField completa os centavos ao sair do campo', () => {
    expect(service.moneyField(100)).toBe('R$ 100,00');
    expect(service.moneyField(1000.5)).toBe('R$ 1.000,50');
    expect(service.moneyField(12345.67)).toBe('R$ 12.345,67');
  });

  it('junta listas em português', () => {
    expect(service.list([])).toBe('');
    expect(service.list(['A'])).toBe('A');
    expect(service.list(['A', 'B'])).toBe('A e B');
    expect(service.list(['A', 'B', 'C'])).toBe('A, B e C');
  });

  it('formata moeda em real', () => {
    expect(service.currency(59.9).replace(/\s/g, ' ')).toBe('R$ 59,90');
  });
});
