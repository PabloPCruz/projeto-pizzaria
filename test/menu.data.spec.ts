import { CRUSTS, DRINKS, FLAVORS, PIZZA_SIZES } from '../src/app/data/menu.data';

describe('menu.data', () => {
  it('sabores têm ids únicos', () => {
    const ids = FLAVORS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cardápio tem as 3 categorias, cada uma com sabores', () => {
    (['tradicional', 'especial', 'doce'] as const).forEach((c) =>
      expect(FLAVORS.filter((f) => f.category === c).length).withContext(c).toBeGreaterThan(0)
    );
  });

  it('tem 5 tamanhos, 7 bordas e as bebidas combinadas com a loja', () => {
    expect(PIZZA_SIZES.length).toBe(5);
    expect(CRUSTS.length).toBe(7);
    expect(DRINKS.map((d) => d.id)).toEqual([
      'coca-2l', 'coca-zero-2l', 'fanta-2l', 'guarana-2l', 'sprite-2l', 'kuat-2l',
      'kuat-1-5l', 'coca-600ml', 'coca-lata', 'brahma-lata',
    ]);
  });

  it('bebidas e bordas têm ids únicos', () => {
    expect(new Set(DRINKS.map((d) => d.id)).size).toBe(DRINKS.length);
    expect(new Set(CRUSTS.map((c) => c.id)).size).toBe(CRUSTS.length);
  });
});
