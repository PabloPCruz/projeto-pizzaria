import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CartModule } from '../src/app/components/cart/cart.module';
import { HomeModule } from '../src/app/components/home/home.module';
import { ContactSectionComponent } from '../src/app/components/home/contact-section.component';
import { HomePageComponent } from '../src/app/components/home/home-page.component';
import { HeaderComponent } from '../src/app/components/layout/header.component';
import { LayoutModule } from '../src/app/components/layout/layout.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { CartFacadeService } from '../src/app/facade/cart.facade.service';
import { SUNDAY_INSTANT, fakeClock } from './helpers/fake-clock';

describe('Carrinho com a loja fechada', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;

  async function create(): Promise<void> {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    TestBed.inject(CartFacadeService).addDrink('coca-2l');
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  const summaryButton = () => el.querySelector<HTMLButtonElement>('app-order-summary button')!;

  afterEach(() => {
    el?.remove();
    localStorage.clear();
  });

  it('aberta: botão de envio ativo e nenhum aviso de loja fechada', async () => {
    await create();
    expect(summaryButton().disabled).toBeFalse();
    expect(summaryButton().textContent).toContain('Enviar pedido pelo WhatsApp');
    expect(el.querySelector('#store-closed-notice')).toBeNull();
    expect(el.querySelector('#store-closed-top')).toBeNull();
  });

  it('fechada: botão desabilitado, sem prometer envio, e aviso com a próxima abertura', async () => {
    fakeClock.set(SUNDAY_INSTANT);
    await create();
    const button = summaryButton();
    expect(button.disabled).toBeTrue();
    expect(button.textContent).toContain('Loja fechada no momento');
    expect(button.textContent).not.toContain('Enviar pedido');
    expect(button.getAttribute('aria-describedby')).toBe('store-closed-notice');
    const notice = el.querySelector('#store-closed-notice');
    expect(notice?.textContent).toContain('Hoje a loja está fechada.');
    expect(notice?.textContent).toContain('amanhã às 18h');
  });

  it('fechada: o aviso também aparece no topo do carrinho (sem repetir o id)', async () => {
    fakeClock.set(SUNDAY_INSTANT);
    await create();
    expect(el.querySelector('#store-closed-top')?.textContent).toContain('Hoje a loja está fechada.');
    expect(el.querySelectorAll('#store-closed-notice').length).toBe(1);
  });
});

describe('Selo de horário no cabeçalho, home e contato', () => {
  const statusText = (el: HTMLElement) => el.querySelector('[role=status]')?.textContent?.trim();

  it('cabeçalho aberto: "Aberto até 23h"', async () => {
    await TestBed.configureTestingModule({ imports: [LayoutModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(statusText(fixture.nativeElement)).toBe('Aberto até 23h');
  });

  it('cabeçalho fechado: mostra quando abre', async () => {
    fakeClock.set(SUNDAY_INSTANT);
    await TestBed.configureTestingModule({ imports: [LayoutModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(statusText(fixture.nativeElement)).toBe('Fechado · abre amanhã 18h');
  });

  it('home: o hero mostra o status ao vivo e não o texto fixo', async () => {
    fakeClock.set(SUNDAY_INSTANT);
    await TestBed.configureTestingModule({ imports: [HomeModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const notices = (fixture.nativeElement as HTMLElement).querySelector('ul[aria-label="Avisos da loja"]')?.textContent ?? '';
    expect(notices).toContain('Fechado · abre amanhã 18h');
    expect(notices).not.toContain('Fechado aos domingos');
  });

  it('contato: horário e dias fechados vêm da tabela', async () => {
    await TestBed.configureTestingModule({ imports: [HomeModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(ContactSectionComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Segunda a sábado, das 18h às 23h');
    expect(text).toContain('Fechado aos domingos');
  });
});
