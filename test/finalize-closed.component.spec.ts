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

describe('Finalizar com a loja fechada: nunca fica mudo', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let checkout: CheckoutFacadeService;
  let tick$: Subject<void>;

  const stickyButton = () => el.querySelector<HTMLButtonElement>('.sticky.lg\\:hidden button')!;
  const summaryButton = () => el.querySelector<HTMLButtonElement>('app-order-summary button')!;
  const alertBox = () => el.querySelector<HTMLElement>('#send-blocked-alert');

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

  it('domingo, dados completos, botão fixo: mostra "Seu pedido não foi enviado" com o motivo e a volta', async () => {
    await create(SUNDAY_INSTANT);
    fillValidForm();
    const open = spyOn(window, 'open');

    stickyButton().click();
    fixture.detectChanges(); // renderiza o alerta antes do foco (no app real a detecção roda sozinha)
    await flush();

    expect(open).not.toHaveBeenCalled();
    const box = alertBox()!;
    expect(box).toBeTruthy();
    expect(box.textContent).toContain('Seu pedido não foi enviado.');
    expect(box.textContent).toContain('Hoje (domingo) a loja não abre.');
    expect(box.textContent).toContain('Voltamos amanhã (segunda) às 18h.');
    expect(document.activeElement).toBe(box);
    expect(el.textContent).not.toContain('Falta só enviar no WhatsApp');
  });

  it('o pedido e os dados continuam intactos depois da tentativa barrada', async () => {
    await create(SUNDAY_INSTANT);
    fillValidForm();
    const cartBefore = JSON.stringify(TestBed.inject(CartService).snapshot);
    const draftBefore = JSON.stringify(checkout.draft);
    spyOn(window, 'open');
    stickyButton().click();
    await flush();
    expect(JSON.stringify(TestBed.inject(CartService).snapshot)).toBe(cartBefore);
    expect(JSON.stringify(checkout.draft)).toBe(draftBefore);
  });

  it('o botão do resumo (com cara de desabilitado) também explica em vez de não fazer nada', async () => {
    await create(SUNDAY_INSTANT);
    fillValidForm();
    spyOn(window, 'open');
    expect(summaryButton().getAttribute('aria-disabled')).toBe('true');

    summaryButton().click();
    await flush();
    fixture.detectChanges();

    expect(alertBox()?.textContent).toContain('Seu pedido não foi enviado.');
  });

  it('loja fechada e formulário incompleto: o aviso de fechada vem primeiro (não adianta listar campos)', async () => {
    await create(SUNDAY_INSTANT);
    spyOn(window, 'open');
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(alertBox()?.textContent).toContain('Seu pedido não foi enviado.');
    expect(el.querySelector('#checkout-errors')).toBeNull();
  });

  it('antes de abrir (hoje abre às 18h): a mensagem diz que abre hoje', async () => {
    await create(MONDAY_MORNING);
    fillValidForm();
    spyOn(window, 'open');
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    const text = alertBox()?.textContent ?? '';
    expect(text).toContain('Seu pedido não foi enviado. A loja ainda não abriu. Abrimos hoje às 18h.');
    expect(text).not.toContain('não abre');
  });

  it('depois de fechar (terça 23h30): diz que voltamos amanhã', async () => {
    await create(TUESDAY_AFTER_CLOSE);
    fillValidForm();
    spyOn(window, 'open');
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(alertBox()?.textContent).toContain('Já encerramos por hoje. Voltamos amanhã (quarta) às 18h.');
  });

  it('quando a loja abre, o alerta some, o botão volta a enviar e o mesmo toque abre o WhatsApp', async () => {
    await create(MONDAY_MORNING);
    fillValidForm();
    const open = spyOn(window, 'open').and.returnValue({} as Window);
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(alertBox()).toBeTruthy();
    expect(open).not.toHaveBeenCalled();

    fakeClock.set('2026-10-05T18:00:00-03:00');
    tick$.next();
    fixture.detectChanges();
    expect(alertBox()).toBeNull();
    expect(summaryButton().textContent).toContain('Finalizar no WhatsApp');

    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(open).toHaveBeenCalledTimes(1);
    expect(el.textContent).toContain('Falta só enviar no WhatsApp');
  });

  it('loja aberta e dados completos: o botão fixo envia de verdade, sem alerta', async () => {
    await create(OPEN_INSTANT);
    fillValidForm();
    const open = spyOn(window, 'open').and.returnValue({} as Window);
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(open).toHaveBeenCalledTimes(1);
    expect(String(open.calls.mostRecent().args[0])).toContain('https://wa.me/5541997449380?text=');
    expect(alertBox()).toBeNull();
  });

  it('a loja fecha com a página aberta (abriu às 22h50, fechou às 23h): o clique seguinte é barrado com aviso', async () => {
    await create('2026-10-06T22:50:00-03:00');
    fillValidForm();
    const open = spyOn(window, 'open');
    expect(stickyButton()).toBeTruthy();
    fakeClock.set('2026-10-06T23:00:00-03:00'); // a tela ainda não reavaliou (sem tick), mas o envio recalcula
    stickyButton().click();
    await flush();
    fixture.detectChanges();
    expect(open).not.toHaveBeenCalled();
    expect(alertBox()?.textContent).toContain('Seu pedido não foi enviado.');
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
