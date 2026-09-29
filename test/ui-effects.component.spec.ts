import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { HeaderComponent } from '../src/app/components/layout/header.component';
import { LayoutModule } from '../src/app/components/layout/layout.module';
import { MobileBarComponent } from '../src/app/components/layout/mobile-bar.component';
import { SharedModule } from '../src/app/components/shared/shared.module';
import { PizzaFlavor } from '../src/app/interfaces/pizza-menu.interface';
import { CartService } from '../src/app/services/cart.service';

@Component({
  template: `
    <div id="host-a" appReveal></div>
    <app-flavor-image id="img-photo" [flavor]="photo"></app-flavor-image>
    <app-flavor-image id="img-deco" [flavor]="photo" [decorative]="true"></app-flavor-image>
    <app-flavor-image id="img-none" [flavor]="none"></app-flavor-image>
    <app-flavor-image id="img-sweet" [flavor]="sweet"></app-flavor-image>
  `,
})
class EffectsHostComponent {
  photo: PizzaFlavor = { id: 'a', name: 'Calabresa', category: 'tradicional', ingredients: 'x', image: 'assets/x.jpg' };
  none: PizzaFlavor = { id: 'b', name: 'Presunto', category: 'especial', ingredients: '' };
  sweet: PizzaFlavor = { id: 'c', name: 'Banana', category: 'doce', ingredients: '' };
}

describe('Efeitos de interface: revelar ao rolar', () => {
  const realMatchMedia = window.matchMedia;
  const RealIO = (window as any).IntersectionObserver;

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    (window as any).IntersectionObserver = RealIO;
  });

  function create(reduce: boolean): { el: HTMLElement; trigger: () => void } {
    window.matchMedia = ((q: string) => ({ matches: reduce && q.includes('reduce'), media: q })) as any;
    let callback: IntersectionObserverCallback = () => undefined;
    (window as any).IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe(): void {}
      disconnect(): void {}
    };
    TestBed.configureTestingModule({ imports: [SharedModule], declarations: [EffectsHostComponent] });
    const fixture = TestBed.createComponent(EffectsHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('#host-a') as HTMLElement;
    return { el, trigger: () => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver) };
  }

  it('esconde o bloco até ele entrar na tela e depois o revela', () => {
    const { el, trigger } = create(false);
    expect(el.classList).toContain('reveal');
    expect(el.classList).not.toContain('reveal-in');
    trigger();
    expect(el.classList).toContain('reveal-in');
  });

  it('com "reduzir movimento" o conteúdo fica sempre visível (sem classe de ocultação)', () => {
    const { el } = create(true);
    expect(el.classList).not.toContain('reveal');
  });
});

describe('FlavorImageComponent', () => {
  let root: HTMLElement;
  let fixture: ComponentFixture<EffectsHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SharedModule], declarations: [EffectsHostComponent] });
    fixture = TestBed.createComponent(EffectsHostComponent);
    fixture.detectChanges();
    root = fixture.nativeElement;
  });

  it('com foto: <img> lazy/async com alt do sabor e fade-in só depois de carregar', () => {
    const img = root.querySelector<HTMLImageElement>('#img-photo img')!;
    expect(img.getAttribute('alt')).toBe('Pizza de Calabresa');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.classList).not.toContain('is-loaded');
    img.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(img.classList).toContain('is-loaded');
  });

  it('foto decorativa (nome já está no texto) tem alt vazio', () => {
    expect(root.querySelector('#img-deco img')!.getAttribute('alt')).toBe('');
  });

  it('se a foto falhar, cai no placeholder (nunca imagem quebrada)', () => {
    root.querySelector('#img-photo img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(root.querySelector('#img-photo img')).toBeNull();
    expect(root.querySelector('#img-photo .flavor-ph')).toBeTruthy();
  });

  it('sem foto: placeholder por categoria, escondido dos leitores de tela', () => {
    const ph = root.querySelector<HTMLElement>('#img-none .flavor-ph')!;
    expect(ph.getAttribute('data-cat')).toBe('especial');
    expect(ph.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('#img-none img')).toBeNull();
    expect(root.querySelector('#img-sweet .flavor-ph')!.getAttribute('data-cat')).toBe('doce');
  });
});

describe('Header: painel do celular com animação de saída', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [LayoutModule, RouterTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.clear();
  });

  it('ao fechar, o painel sai com animação e só depois recebe [hidden]; o aria-expanded muda na hora', fakeAsync(() => {
    const button = el.querySelector<HTMLButtonElement>('button[aria-controls]')!;
    const menu = el.querySelector<HTMLElement>('#menu-mobile')!;
    button.click();
    fixture.detectChanges();
    expect(menu.hidden).toBeFalse();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(menu.hidden).toBeFalse();
    expect(menu.classList).toContain('is-closing');

    tick(250);
    fixture.detectChanges();
    expect(menu.hidden).toBeTrue();
  }));

  it('o fundo escurecido acompanha o painel e fechar por ele funciona', fakeAsync(() => {
    const button = el.querySelector<HTMLButtonElement>('button[aria-controls]')!;
    const scrim = el.querySelector<HTMLElement>('.menu-scrim')!;
    expect(scrim.hidden).toBeTrue();
    button.click();
    fixture.detectChanges();
    expect(scrim.hidden).toBeFalse();
    scrim.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    tick(250);
  }));

  it('marca o cabeçalho como "rolado" quando a página desce', () => {
    const header = el.querySelector('header')!;
    expect(header.hasAttribute('data-scrolled')).toBe(window.scrollY > 8);
  });
});

describe('Barra do celular', () => {
  it('na home a barra começa recolhida (data-quiet) para não repetir o CTA do hero', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [LayoutModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(MobileBarComponent);
    fixture.detectChanges();
    const scrolled = window.scrollY >= 360;
    expect(fixture.nativeElement.hasAttribute('data-quiet')).toBe(!scrolled);
    fixture.destroy();
  });
});

describe('Checkout: interruptor "Não sei meu CEP"', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, SharedModule, HttpClientTestingModule] }).compileComponents();
    TestBed.inject(CartService).addPizza({ size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 });
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).match(() => true);
    el.remove();
    localStorage.clear();
  });

  it('é um interruptor real (checkbox role=switch) dentro do cartão-rótulo, com dica ligada por aria-describedby', () => {
    const input = el.querySelector<HTMLInputElement>('#field-manualAddress')!;
    expect(input.type).toBe('checkbox');
    expect(input.getAttribute('role')).toBe('switch');
    const label = input.closest('label')!;
    expect(label.classList).toContain('switch-card');
    expect(label.textContent).toContain('Não sei meu CEP');
    expect(el.querySelector('#' + input.getAttribute('aria-describedby'))).toBeTruthy();
  });

  it('ligar o interruptor mostra a dica (atributo hidden reflete o estado)', () => {
    const input = el.querySelector<HTMLInputElement>('#field-manualAddress')!;
    const hint = el.querySelector<HTMLElement>('#manual-address-hint')!;
    expect(hint.hidden).toBeTrue();
    input.click();
    fixture.detectChanges();
    expect(input.checked).toBeTrue();
    expect(hint.hidden).toBeFalse();
    input.click();
    fixture.detectChanges();
    expect(hint.hidden).toBeTrue();
  });
});
