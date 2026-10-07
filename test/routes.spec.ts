import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NotFoundPageComponent } from '../src/app/components/not-found/not-found-page.component';
import { NotFoundModule } from '../src/app/components/not-found/not-found.module';
import { routes } from '../src/app/app.routes';

describe('Rotas do site', () => {
  let router: Router;
  let location: Location;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [RouterTestingModule.withRoutes(routes)] });
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  afterEach(() => localStorage.clear());

  it('endereços antigos continuam funcionando', async () => {
    await router.navigateByUrl('/menu');
    expect(location.path()).toBe('/cardapio');
    await router.navigateByUrl('/view-cart');
    expect(location.path()).toBe('/carrinho');
  });

  it('/contacts e /history viram âncoras da home', async () => {
    await router.navigateByUrl('/contacts');
    expect(location.path()).toBe('/#contatos');
    await router.navigateByUrl('/history');
    expect(location.path()).toBe('/#historia');
  });

  it('cada página tem o seu título', async () => {
    const titles: Record<string, string> = {
      '/': 'Disk Pizza — Pizzaria Italiana',
      '/cardapio': 'Cardápio — Disk Pizza',
      '/montar-pizza': 'Monte sua pizza — Disk Pizza',
      '/carrinho': 'Carrinho — Disk Pizza',
      '/qualquer-coisa': 'Página não encontrada — Disk Pizza',
    };
    for (const [url, title] of Object.entries(titles)) {
      await router.navigateByUrl(url);
      expect(document.title).withContext(url).toBe(title);
    }
  });

  it('a home só casa na raiz (pathMatch full): /cardapio não carrega o módulo da home', () => {
    const home = routes.find((r) => r.path === '' && r.loadChildren);
    expect(home?.pathMatch).toBe('full');
  });
});

describe('Página 404', () => {
  it('pede para os buscadores não indexarem e tira a marca ao sair', async () => {
    await TestBed.configureTestingModule({ imports: [NotFoundModule, RouterTestingModule] }).compileComponents();
    const meta = TestBed.inject(Meta);
    const fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();
    expect(meta.getTag('name="robots"')?.content).toBe('noindex');
    fixture.destroy();
    expect(meta.getTag('name="robots"')).toBeNull();
  });
});
