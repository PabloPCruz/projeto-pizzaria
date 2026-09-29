import { TestBed } from '@angular/core/testing';
import { PizzaBuilderService } from '../src/app/services/pizza-builder.service';

const [A, B, C, D] = ['tradicional-calabresa', 'tradicional-mussarela', 'especial-atum', 'doce-banana'];
const KEY = 'disk-pizza:v2:builder';

describe('PizzaBuilderService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('bloqueia sabores acima do limite do tamanho', () => {
    const builder = TestBed.inject(PizzaBuilderService);
    builder.setSize('media');
    expect(builder.toggleFlavor(A)).toBeTrue();
    expect(builder.toggleFlavor(B)).toBeTrue();
    expect(builder.toggleFlavor(C)).toBeFalse();
    expect(builder.snapshot.flavorIds).toEqual([A, B]);
  });

  it('não aceita sabor sem tamanho escolhido', () => {
    const builder = TestBed.inject(PizzaBuilderService);
    expect(builder.toggleFlavor(A)).toBeFalse();
  });

  it('não aceita sabor que não existe no cardápio', () => {
    const builder = TestBed.inject(PizzaBuilderService);
    builder.setSize('grande');
    expect(builder.toggleFlavor('fantasma')).toBeFalse();
    expect(builder.snapshot.flavorIds).toEqual([]);
  });

  it('desmarcar um sabor libera a vaga', () => {
    const builder = TestBed.inject(PizzaBuilderService);
    builder.setSize('pequena');
    builder.toggleFlavor(A);
    builder.toggleFlavor(A);
    expect(builder.snapshot.flavorIds).toEqual([]);
    expect(builder.toggleFlavor(B)).toBeTrue();
  });

  it('ao reduzir o tamanho, mantém os primeiros sabores e informa quantos saíram', () => {
    const builder = TestBed.inject(PizzaBuilderService);
    builder.setSize('gigante');
    [A, B, C, D].forEach((id) => builder.toggleFlavor(id));
    const removed = builder.setSize('media');
    expect(removed).toBe(2);
    expect(builder.snapshot.flavorIds).toEqual([A, B]);
  });

  it('salva a montagem e restaura após recarregar', () => {
    const first = TestBed.inject(PizzaBuilderService);
    first.setSize('grande');
    first.toggleFlavor(A);
    first.setCrust('catupiry');
    first.setNotes('bem passada');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(PizzaBuilderService);

    expect(reloaded.snapshot).toEqual({ size: 'grande', flavorIds: [A], crustId: 'catupiry', notes: 'bem passada' });
  });

  it('reset volta ao estado vazio', () => {
    const builder = TestBed.inject(PizzaBuilderService);
    builder.setSize('grande');
    builder.reset();
    expect(builder.snapshot).toEqual({ size: null, flavorIds: [], crustId: null, notes: '' });
  });

  describe('restauração de dados salvos malformados', () => {
    function restoreFrom(saved: unknown) {
      localStorage.setItem(KEY, JSON.stringify(saved));
      return TestBed.inject(PizzaBuilderService).snapshot;
    }

    it('campos com tipo errado voltam ao vazio, sem quebrar', () => {
      const draft = restoreFrom({ size: 5, flavorIds: [A], crustId: { x: 1 }, notes: 5 });
      expect(draft).toEqual({ size: null, flavorIds: [], crustId: null, notes: '' });
    });

    it('descarta sabores inexistentes, não-string e repetidos', () => {
      const draft = restoreFrom({ size: 'grande', flavorIds: ['fantasma', 1, null, A, A, B], crustId: null, notes: '' });
      expect(draft.flavorIds).toEqual([A, B]);
    });

    it('corta os sabores que excedem o limite do tamanho salvo', () => {
      const draft = restoreFrom({ size: 'pequena', flavorIds: [A, B, C], crustId: null, notes: '' });
      expect(draft.flavorIds).toEqual([A]);
    });

    it('tamanho e borda desconhecidos são descartados', () => {
      const draft = restoreFrom({ size: 'xxl', flavorIds: [A], crustId: 'inexistente', notes: 'ok' });
      expect(draft.size).toBeNull();
      expect(draft.crustId).toBeNull();
      expect(draft.notes).toBe('ok');
    });
  });
});
