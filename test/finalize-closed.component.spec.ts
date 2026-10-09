import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject } from 'rxjs';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { STORE_STATUS_TICK } from '../src/app/services/store-hours.service';
import { CartService } from '../src/app/services/cart.service';
import { OPEN_INSTANT, SUNDAY_INSTANT, fakeClock } from './helpers/fake-clock';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));
const MONDAY_MORNING = '2026-10-05T10:00:00-03:00';
const TUESDAY_AFTER_CLOSE = '2026-10-06T23:30:00-03:00';

describe('Finalizar fora do horário: o pedido nunca é barrado', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let checkout: CheckoutFacadeService;
  let tick$: Subject<void>;

  const stickyButton = () => el.querySelector<HTMLButtonElement>('.sticky.lg\\:hidden button')!;
  const summaryButton = () => el.querySelector<HTMLButtonElement>('app-order-summary button')!;
  const alertBox = () => el.querySelector<HTMLElement>('#send-blocked-alert');
  const stores = () => el.querySelectorAll('#store-closed-notice, #store-closed-top, #send-blocked-alert');

  function fillValidForm(): void {
    checkout.update({
      name: 'Maria Silva',
      phone: '(41) 99999-8888',
      cep: '80010-000',
      street: 'Rua José Loureiro',
      number: '123',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
      payment: 'pix',
    });
    fixture.detectChanges();
  }

  async function create(now: string): Promise<void> {
    fakeClock.set(now);
    localStorage.clear();
    tick$ = new Subject<void>();
    TestBed.overrideProvider(STORE_STATUS_TICK, { useValue: tick$ });
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    checkout = TestBed.inject(CheckoutFacadeService);
    TestBed.inject(CartService).addDrink('coca-2l', 2);
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  afterEach(() => {
    el?.remove();
    localStorage.clear();
  });

  it('botão fixo do celular: o nome acessível começa pelo texto visível (comando de voz) e inclui a quantidade', async () => {
    await create(OPEN_INSTANT);
    const button = stickyButton();
    expect(button.hasAttribute('aria-label')).toBeFalse();
    const name = (button.textContent ?? '').replace(/\s+/g, ' ').trim();
    expect(name).toBe('Finalizar pedido 2 itens');
  });

  const ANYTIME: [string, string][] = [
    ['domingo (fechada pelo horário)', SUNDAY_INSTANT],
    ['antes de abrir (segunda 10h)', MONDAY_MORNING],
    ['depois de fechar (terça 23h30)', TUESDAY_AFTER_CLOSE],
    ['madrugada de uma sexta (relógio do aparelho adiantado meses)', '2026-12-25T03:00:00-03:00'],
  ];

  for (const [label, instant] of ANYTIME) {
    it(`${label}: o botão fixo envia o pedido de verdade`, async () => {
      await create(instant);
      fillValidForm();
      const open = spyOn(window, 'open').and.returnValue({} as Window);
      stickyButton().click();
      await flush();
      fixture.detectChanges();
      expect(open).toHaveBeenCalledTimes(1);
      expect(String(open.calls.mostRecent().args[0])).toContain('https://wa.me/5541997449380?text=');
      expect(el.textContent).toContain('Falta só enviar no WhatsApp');
      expect(alertBox()).toBeNull();
    });
  }

  it('fora do horário o botão do resumo é o de sempre ("Finalizar no WhatsApp"), sem aviso de loja fechada', async () => {
    await create(SUNDAY_INSTANT);
    expect(summaryButton().textContent).toContain('Finalizar no WhatsApp');
    expect(summaryButton().textContent).not.toContain('Loja fechada');
    expect(summaryButton().getAttribute('aria-disabled')).toBeNull();
    expect(summaryButton().disabled).toBeFalse();
    expect(stores().length).toBe(0);
    expect(el.textContent).not.toContain('Seu pedido não foi enviado');
  });

  it('fora do horário o botão do resumo também envia', async () => {
    await create(SUNDAY_INSTANT);
    fillValidForm();
    const open = spyOn(window, 'open').and.returnValue({} as Window);
    summaryButton().click();
    await flush();
    fixture.detectChanges();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('formulário incompleto continua mostrando o que falta (e nada de "loja fechada")', async () => {
    await create(SUNDAY_INSTANT);
    const open = spyOn(window, 'open');
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(open).not.toHaveBeenCalled();
    expect(el.querySelector('#checkout-errors')?.textContent).toContain('Confira estes pontos antes de enviar');
    expect(stores().length).toBe(0);
  });

  it('a loja fecha com a página aberta (abriu às 22h50, fechou às 23h): o pedido ainda sai', async () => {
    await create('2026-10-06T22:50:00-03:00');
    fillValidForm();
    const open = spyOn(window, 'open').and.returnValue({} as Window);
    fakeClock.set('2026-10-06T23:00:00-03:00');
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(open).toHaveBeenCalledTimes(1);
    expect(alertBox()).toBeNull();
  });
});

describe('Finalizar: outros cenários que podem dar errado', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let checkout: CheckoutFacadeService;

  const stickyButton = () => el.querySelector<HTMLButtonElement>('.sticky.lg\\:hidden button')!;
  const summaryButton = () => el.querySelector<HTMLButtonElement>('app-order-summary button')!;

  function fillValidForm(): void {
    checkout.update({
      name: 'Maria Silva',
      phone: '(41) 99999-8888',
      cep: '80010-000',
      street: 'Rua José Loureiro',
      number: '123',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
      payment: 'pix',
    });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    fakeClock.set(OPEN_INSTANT);
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    checkout = TestBed.inject(CheckoutFacadeService);
    TestBed.inject(CartService).addDrink('coca-2l', 2);
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    el?.remove();
    localStorage.clear();
  });

  it('enquanto espera a consulta de entrega, os dois botões mostram "Verificando entrega…" (não ficam parados)', async () => {
    const http = TestBed.inject(HttpTestingController);
    fillValidForm();
    checkout.setCep('82015-290');
    checkout.lookupCep().subscribe();
    http.expectOne('https://viacep.com.br/ws/82015290/json/').flush({ logradouro: 'Rua Luiz Braille', bairro: 'São Braz', localidade: 'Curitiba', uf: 'PR' });
    const pending = http.expectOne('https://cep.awesomeapi.com.br/json/82015290');
    const open = spyOn(window, 'open').and.returnValue({} as Window);

    stickyButton().click();
    fixture.detectChanges();
    expect(stickyButton().textContent).toContain('Verificando entrega…');
    expect(summaryButton().textContent).toContain('Verificando entrega…');
    expect(summaryButton().getAttribute('aria-busy')).toBe('true');
    expect(stickyButton().getAttribute('aria-busy')).toBe('true');
    expect(open).not.toHaveBeenCalled();

    pending.flush({ lat: '-25.4112', lng: '-49.3374' });
    await flush();
    expect(open).toHaveBeenCalledTimes(1);
    let busy = true;
    checkout.busy$.subscribe((b) => (busy = b)).unsubscribe();
    expect(busy).toBeFalse();
  });

  it('erro ao montar a mensagem: o alerta aparece e recebe o foco (mesmo tocando no botão fixo)', async () => {
    fillValidForm();
    spyOn(checkout, 'submit').and.throwError('boom');
    const open = spyOn(window, 'open');
    stickyButton().click();
    fixture.detectChanges();
    await flush();
    const alert = el.querySelector<HTMLElement>('#send-error-alert')!;
    expect(alert.textContent).toContain('Não foi possível montar a mensagem');
    expect(document.activeElement).toBe(alert);
    expect(open).not.toHaveBeenCalled();
  });

  it('sem internet: a tela de pedido pronto avisa que o WhatsApp só abre com conexão', async () => {
    fillValidForm();
    spyOnProperty(navigator, 'onLine').and.returnValue(false);
    spyOn(window, 'open').and.returnValue({} as Window);
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(el.querySelector('#sent-offline')?.textContent).toContain('sem internet');
    expect(el.querySelector('#sent-too-long')).toBeNull();
  });

  it('com internet e pedido normal: nenhum dos dois avisos aparece', async () => {
    fillValidForm();
    spyOn(window, 'open').and.returnValue({} as Window);
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(el.querySelector('#sent-offline')).toBeNull();
    expect(el.querySelector('#sent-too-long')).toBeNull();
  });

  it('pedido muito grande: avisa que o WhatsApp pode cortar o texto e aponta o botão de copiar', async () => {
    const cart = TestBed.inject(CartService);
    for (let i = 0; i < 6; i++) {
      cart.addPizza({ size: 'grande', flavorIds: ['tradicional-calabresa'], crustId: null, notes: 'ç'.repeat(300), quantity: 1 });
    }
    fillValidForm();
    checkout.update({ generalNotes: 'ç'.repeat(400) });
    spyOn(window, 'open').and.returnValue({} as Window);
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(el.querySelector('#sent-too-long')?.textContent).toContain('Copiar mensagem do pedido');
    expect(Array.from(el.querySelectorAll('button')).some((b) => b.textContent?.includes('Copiar mensagem do pedido'))).toBeTrue();
  });
});
