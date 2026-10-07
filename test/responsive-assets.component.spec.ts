import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { BuilderPageComponent } from '../src/app/components/builder/builder-page.component';
import { FlavorImageComponent } from '../src/app/components/shared/flavor-image.component';
import { LogoComponent } from '../src/app/components/shared/logo.component';
import { SharedModule } from '../src/app/components/shared/shared.module';
import { FLAVORS } from '../src/app/data/menu.data';
import { PizzaFlavor } from '../src/app/interfaces/pizza-menu.interface';

describe('Logo leve', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SharedModule] }));

  it('usa a versão recortada em WebP (320/640 px) com PNG de reserva, nunca o arquivo original de 1080 px', () => {
    const fixture = TestBed.createComponent(LogoComponent);
    fixture.componentInstance.height = 40;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const source = el.querySelector('source')!;
    expect(source.getAttribute('type')).toBe('image/webp');
    expect(source.getAttribute('srcset')).toBe('assets/img/logo-crop-320.webp 320w, assets/img/logo-crop-640.webp 640w');
    expect(source.getAttribute('sizes')).toBe('49px');
    const img = el.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('assets/img/logo-crop-640.png');
    expect(img.getAttribute('src')).not.toContain('logo-pizzaria');
    expect(img.style.height).toBe('40px');
    expect(img.style.width).toBe('49px');
  });

  it('prioridade alta só quando pedida (cabeçalho e topo da home)', () => {
    const fixture = TestBed.createComponent(LogoComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('fetchpriority')).toBeNull();
    const priority = TestBed.createComponent(LogoComponent);
    priority.componentRef.setInput('priority', true);
    priority.detectChanges();
    expect(priority.nativeElement.querySelector('img').getAttribute('fetchpriority')).toBe('high');
  });
});

describe('Foto do sabor leve', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SharedModule] }));

  const flavor = (image: string): PizzaFlavor => ({ ...FLAVORS[0], image });

  it('oferece WebP de 192 e 640 px e mantém a foto original como reserva', () => {
    const fixture = TestBed.createComponent(FlavorImageComponent);
    fixture.componentRef.setInput('flavor', flavor('assets/img-flavors/calabresa.jpg'));
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('source')!.getAttribute('srcset')).toBe(
      'assets/img-flavors/calabresa-192.webp 192w, assets/img-flavors/calabresa-640.webp 640w'
    );
    expect(el.querySelector('img')!.getAttribute('src')).toBe('assets/img-flavors/calabresa.jpg');
  });

  it('extensão .jpeg também gera o nome das variantes', () => {
    const fixture = TestBed.createComponent(FlavorImageComponent);
    fixture.componentRef.setInput('flavor', flavor('assets/img-flavors/portuguesa.jpeg'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('source').getAttribute('srcset')).toContain('portuguesa-192.webp 192w');
  });

  it('miniatura declara o próprio tamanho; cartão grande declara a largura da coluna', () => {
    const thumb = TestBed.createComponent(FlavorImageComponent);
    thumb.componentRef.setInput('flavor', flavor('assets/img-flavors/calabresa.jpg'));
    thumb.componentRef.setInput('small', true);
    thumb.componentRef.setInput('width', 72);
    thumb.detectChanges();
    expect(thumb.nativeElement.querySelector('source').getAttribute('sizes')).toBe('72px');

    const card = TestBed.createComponent(FlavorImageComponent);
    card.componentRef.setInput('flavor', flavor('assets/img-flavors/calabresa.jpg'));
    card.detectChanges();
    expect(card.nativeElement.querySelector('source').getAttribute('sizes')).toBe('(min-width: 768px) 360px, 100vw');
  });

  it('toda foto usada tem as duas variantes WebP geradas (sem 404 no celular)', async () => {
    const images = Array.from(new Set(FLAVORS.filter((f) => !!f.image).map((f) => f.image as string)));
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      const base = image.replace(/\.jpe?g$/i, '');
      for (const width of [192, 640]) {
        const response = await fetch(`${base}-${width}.webp`);
        expect(response.ok).withContext(`${base}-${width}.webp`).toBeTrue();
        expect(response.headers.get('content-type') ?? '').withContext(base).toContain('image/webp');
      }
    }
  });
});

describe('Passos do montador (leitor de tela)', () => {
  it('todo botão de passo tem nome acessível "Passo N: rótulo", inclusive os que mostram só o número', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(BuilderPageComponent);
    fixture.detectChanges();
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav[aria-label="Passos da montagem"] button'));
    expect(buttons.length).toBe(5);
    ['Passo 1: Tamanho', 'Passo 2: Sabores', 'Passo 3: Borda', 'Passo 4: Extras', 'Passo 5: Revisão'].forEach((name, i) =>
      expect(buttons[i].textContent).toContain(name)
    );
    // O rótulo visual (que muda com a largura) fica fora da árvore de acessibilidade, para não ser lido duas vezes.
    buttons.forEach((b) => expect(b.querySelector('span[aria-hidden=true]:not(:first-child)')).toBeTruthy());
    fixture.nativeElement.remove();
    localStorage.clear();
  });
});
