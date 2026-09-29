import { TestBed } from '@angular/core/testing';
import { SizeRulesService } from '../src/app/services/size-rules.service';
import { PIZZA_SIZES } from '../src/app/data/menu.data';

describe('SizeRulesService', () => {
  let service: SizeRulesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SizeRulesService);
  });

  it('respeita o limite de sabores de cada tamanho', () => {
    expect(service.maxFlavors('pequena')).toBe(1);
    expect(service.maxFlavors('media')).toBe(2);
    expect(service.maxFlavors('grande')).toBe(3);
    expect(service.maxFlavors('big')).toBe(3);
    expect(service.maxFlavors('gigante')).toBe(4);
    expect(service.maxFlavors(null)).toBe(0);
  });

  it('informa as fatias de cada tamanho', () => {
    const slices = Object.fromEntries(PIZZA_SIZES.map((s) => [s.id, s.slices]));
    expect(slices).toEqual({ pequena: 4, media: 6, grande: 8, big: 12, gigante: 16 });
  });

  it('só permite adicionar sabor enquanto houver vaga', () => {
    expect(service.canAddFlavor('media', ['a'])).toBeTrue();
    expect(service.canAddFlavor('media', ['a', 'b'])).toBeFalse();
    expect(service.canAddFlavor(null, [])).toBeFalse();
  });

  it('corta os sabores excedentes ao reduzir o tamanho', () => {
    expect(service.trimToSize('pequena', ['a', 'b', 'c'])).toEqual(['a']);
    expect(service.trimToSize('gigante', ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('valida tamanho e quantidade de sabores', () => {
    const [a, b, c] = ['tradicional-calabresa', 'tradicional-mussarela', 'especial-atum'];
    expect(service.validate(null, [a]).valid).toBeFalse();
    expect(service.validate('grande', []).valid).toBeFalse();
    expect(service.validate('grande', [a, b, c]).valid).toBeTrue();
    const tooMany = service.validate('pequena', [a, b]);
    expect(tooMany.valid).toBeFalse();
    expect(tooMany.error).toContain('1 sabor');
  });

  it('rejeita sabor que não existe no cardápio', () => {
    expect(service.validate('media', ['tradicional-calabresa', 'fantasma']).valid).toBeFalse();
  });
});
