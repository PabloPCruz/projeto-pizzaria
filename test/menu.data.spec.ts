import { CRUSTS, DRINKS, FEATURED_FLAVOR_IDS, FLAVORS, PIZZA_SIZES } from '../src/app/data/menu.data';

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

describe('menu.data: fotos dos sabores', () => {
  const withImage = FLAVORS.filter((f) => !!f.image);
  const uniqueImages = Array.from(new Set(withImage.map((f) => f.image as string)));

  it('toda foto segue o padrão assets/img-flavors/<nome>.jpg|jpeg', () => {
    withImage.forEach((f) =>
      expect(f.image).withContext(f.id).toMatch(/^assets\/img-flavors\/[a-z0-9-]+\.(jpg|jpeg)$/)
    );
  });

  it('todo arquivo referenciado existe e é servido como JPEG', async () => {
    expect(uniqueImages.length).toBeGreaterThan(0);
    for (const image of uniqueImages) {
      const response = await fetch(image);
      expect(response.ok).withContext(image).toBeTrue();
      expect(response.headers.get('content-type') ?? '').withContext(image).toContain('image/jpeg');
    }
  });

  it('CREDITS.md lista exatamente as fotos usadas: nenhuma referenciada sem crédito, nenhuma crédito sem uso', async () => {
    const response = await fetch('assets/img-flavors/CREDITS.md');
    expect(response.ok).toBeTrue();
    const credited = Array.from((await response.text()).matchAll(/`([a-z0-9-]+\.(?:jpg|jpeg))`/g)).map((m) => m[1]);
    const used = uniqueImages.map((i) => i.split('/').pop() as string);
    expect(credited.length).toBeGreaterThan(0);
    used.forEach((file) => expect(credited).withContext('sem crédito: ' + file).toContain(file));
    credited.forEach((file) => expect(used).withContext('crédito sem uso: ' + file).toContain(file));
  });

  it('a foto de um sabor só é compartilhada por sabores da mesma família de nome', () => {
    // Guarda contra reaproveitar uma foto em sabores diferentes por engano: cada foto compartilhada
    // precisa estar em uma lista explícita e revisada de grupos.
    const groups = new Map<string, string[]>();
    withImage.forEach((f) => groups.set(f.image as string, [...(groups.get(f.image as string) ?? []), f.name]));
    const shared = Array.from(groups.entries()).filter(([, names]) => names.length > 1);
    const allowed: Record<string, string[]> = {
      'assets/img-flavors/bolonhesa.jpg': ['Bolonhesa', 'Bolonhesa Especial'],
      'assets/img-flavors/presunto.jpg': ['Romana', 'Francesa'],
      'assets/img-flavors/mussarela-tomate.jpg': ['Mussarela', 'Napolitana'],
    };
    expect(shared.map(([image]) => image).sort()).toEqual(Object.keys(allowed).sort());
    shared.forEach(([image, names]) => expect(names.sort()).withContext(image).toEqual(allowed[image].slice().sort()));
  });

  it('destaques da home existem, têm foto e são poucos', () => {
    expect(FEATURED_FLAVOR_IDS.length).toBeGreaterThan(0);
    expect(FEATURED_FLAVOR_IDS.length).toBeLessThanOrEqual(8);
    expect(new Set(FEATURED_FLAVOR_IDS).size).toBe(FEATURED_FLAVOR_IDS.length);
    FEATURED_FLAVOR_IDS.forEach((id) => {
      const flavor = FLAVORS.find((f) => f.id === id);
      expect(flavor).withContext(id).toBeDefined();
      expect(flavor?.image).withContext(id).toBeTruthy();
    });
  });
});
