import { TestBed } from '@angular/core/testing';
import { FlavorCardComponent } from '../src/app/components/shared/flavor-card.component';
import { SharedModule } from '../src/app/components/shared/shared.module';
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

  it('TODOS os 71 sabores têm foto (própria ou ilustrativa)', () => {
    expect(FLAVORS.length).toBe(71);
    FLAVORS.forEach((f) => expect(f.image).withContext(f.name).toBeTruthy());
  });

  it('sabores com foto ilustrativa são marcados; os que têm foto própria não', () => {
    const illustrative = FLAVORS.filter((f) => f.illustrative);
    expect(illustrative.length).toBeGreaterThan(0);
    expect(illustrative.length).toBeLessThan(FLAVORS.length);
    // Sabores que têm foto própria (com sabor definido no cardápio) nunca são marcados como ilustrativos.
    ['Calabresa', 'Marguerita', 'Brócolis', 'Brigadeiro', 'Confete', 'Quatro Queijos'].forEach((name) =>
      expect(FLAVORS.find((f) => f.name === name)?.illustrative).withContext(name).toBeFalsy()
    );
    illustrative.forEach((f) => expect(f.image).withContext(f.name).toBeTruthy());
  });

  it('a foto ilustrativa vem da mesma categoria de ingredientes (nunca um doce para salgado e vice-versa)', () => {
    const isDessertPhoto = (image: string) => /brigadeiro|bem-casado|confete|chocolate-morango/.test(image);
    FLAVORS.forEach((f) =>
      expect(isDessertPhoto(f.image as string)).withContext(f.name).toBe(f.category === 'doce')
    );
  });

  it('destaques da home existem, têm foto e são poucos', () => {
    expect(FEATURED_FLAVOR_IDS.length).toBeGreaterThan(0);
    expect(FEATURED_FLAVOR_IDS.length).toBeLessThanOrEqual(8);
    expect(new Set(FEATURED_FLAVOR_IDS).size).toBe(FEATURED_FLAVOR_IDS.length);
    FEATURED_FLAVOR_IDS.forEach((id) => {
      const flavor = FLAVORS.find((f) => f.id === id);
      expect(flavor).withContext(id).toBeDefined();
      expect(flavor?.image).withContext(id).toBeTruthy();
      expect(flavor?.illustrative).withContext('destaque com foto própria: ' + id).toBeFalsy();
    });
  });
});

describe('FlavorCardComponent: aviso de foto ilustrativa', () => {
  async function render(name: string, compact: boolean): Promise<HTMLElement> {
    await TestBed.configureTestingModule({ imports: [SharedModule] }).compileComponents();
    const fixture = TestBed.createComponent(FlavorCardComponent);
    fixture.componentInstance.flavor = FLAVORS.find((f) => f.name === name)!;
    fixture.componentInstance.compact = compact;
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  for (const compact of [false, true]) {
    it(`mostra "Foto ilustrativa" quando a foto não é do sabor (${compact ? 'lista' : 'cartão'})`, async () => {
      const el = await render('Atum', compact);
      expect(el.textContent).toContain('Foto ilustrativa');
    });

    it(`não mostra o aviso quando a foto é do próprio sabor (${compact ? 'lista' : 'cartão'})`, async () => {
      const el = await render('Calabresa', compact);
      expect(el.textContent).not.toContain('Foto ilustrativa');
    });
  }
});
