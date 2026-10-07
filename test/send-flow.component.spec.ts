import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { isChunkLoadError } from '../src/app/app';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { CheckoutFormComponent } from '../src/app/components/cart/checkout-form.component';
import { STORE_INFO } from '../src/app/data/store-info';
import { CartFacadeService } from '../src/app/facade/cart.facade.service';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';
import { CartService } from '../src/app/services/cart.service';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));
const viacep = (cep: string) => `https://viacep.com.br/ws/${cep}/json/`;
const awesome = (cep: string) => `https://cep.awesomeapi.com.br/json/${cep}`;
const STORE = STORE_INFO.freeDelivery.origin;
const north = (km: number) => ({ lat: String(STORE.lat + km / 111.195), lng: String(STORE.lng) });
const VIACEP_OK = { logradouro: 'Rua Luiz Braille', bairro: 'São Braz', localidade: 'Curitiba', uf: 'PR' };

describe('Fluxo de envio do pedido', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let checkout: CheckoutFacadeService;
  let http: HttpTestingController;

  const submitButton = () =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button[type=submit]')).find((b) => b.textContent?.includes('Finalizar no WhatsApp'))!;
  const form = () => fixture.debugElement.query(By.directive(CheckoutFormComponent)).componentInstance as CheckoutFormComponent;

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
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    checkout = TestBed.inject(CheckoutFacadeService);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(CartFacadeService).addDrink('coca-2l');
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    el?.remove();
    http.match(() => true);
    localStorage.clear();
  });

  it('falha de rede no CEP oferece "Tentar de novo", que consulta outra vez', async () => {
    const cep = el.querySelector<HTMLInputElement>('#field-cep')!;
    cep.value = '80010000';
    cep.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    http.expectOne(viacep('80010000')).error(new ProgressEvent('error'));
    http.match((r) => r.url.includes('awesomeapi')).forEach((r) => r.error(new ProgressEvent('error')));
    await flush();
    fixture.detectChanges();

    const retry = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Tentar de novo'))!;
    expect(retry).toBeTruthy();
    retry.click();
    fixture.detectChanges();
    http.expectOne(viacep('80010000')).flush(VIACEP_OK);
    http.match((r) => r.url.includes('awesomeapi'));
    fixture.detectChanges();
    expect(el.querySelector('#cep-status')?.textContent).toContain('Endereço preenchido');
  });

  it('sair do campo do CEP depois de uma falha de rede também tenta de novo', async () => {
    const cep = el.querySelector<HTMLInputElement>('#field-cep')!;
    cep.value = '80010000';
    cep.dispatchEvent(new Event('input'));
    http.expectOne(viacep('80010000')).error(new ProgressEvent('error'));
    http.match((r) => r.url.includes('awesomeapi'));
    await flush();

    cep.dispatchEvent(new Event('blur'));
    http.expectOne(viacep('80010000'));
  });

  it('com a consulta de entrega ainda em andamento, o envio espera o resultado e a mensagem já sai com "grátis"', async () => {
    fillValidForm();
    checkout.setCep('82015-290');
    checkout.lookupCep().subscribe();
    http.expectOne(viacep('82015290')).flush(VIACEP_OK);
    const pending = http.expectOne(awesome('82015290'));
    expect(checkout.zoneLoading).toBeTrue();

    const open = spyOn(window, 'open').and.returnValue({} as Window);
    form().submit();
    expect(open).not.toHaveBeenCalled();

    pending.flush(north(1));
    await flush();
    expect(open).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(String(open.calls.mostRecent().args[0]))).toContain('Entrega grátis');
  });

  it('um segundo clique enquanto espera a entrega não envia duas vezes', async () => {
    fillValidForm();
    checkout.setCep('82015-290');
    checkout.lookupCep().subscribe();
    http.expectOne(viacep('82015290')).flush(VIACEP_OK);
    const pending = http.expectOne(awesome('82015290'));

    const open = spyOn(window, 'open').and.returnValue({} as Window);
    form().submit();
    form().submit();
    pending.flush(north(1));
    await flush();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('falha ao montar a mensagem mostra erro em vez de um botão que não faz nada', () => {
    fillValidForm();
    spyOn(checkout, 'submit').and.throwError('boom');
    const open = spyOn(window, 'open');
    submitButton().click();
    fixture.detectChanges();
    expect(open).not.toHaveBeenCalled();
    expect(el.querySelector('p[role=alert]')?.textContent).toContain('Não foi possível montar a mensagem');
  });

  describe('navegador embutido (Instagram, Facebook)', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'userAgent');
    afterEach(() => {
      if (original) Object.defineProperty(navigator, 'userAgent', original);
      else delete (navigator as unknown as Record<string, unknown>)['userAgent'];
    });

    it('não tenta abrir outra aba: mostra o botão para abrir o WhatsApp', () => {
      Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (Linux; Android 13) Instagram 300.0.0', configurable: true });
      fillValidForm();
      const open = spyOn(window, 'open');
      submitButton().click();
      fixture.detectChanges();
      expect(open).not.toHaveBeenCalled();
      expect(el.textContent).toContain('Toque no botão abaixo para abrir o WhatsApp.');
      expect(el.querySelector('a[href^="https://wa.me/"]')).toBeTruthy();
    });
  });

  it('"Copiar mensagem do pedido" copia o texto exato do pedido', async () => {
    fillValidForm();
    spyOn(window, 'open').and.returnValue({} as Window);
    const write = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    submitButton().click();
    fixture.detectChanges();

    const copy = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Copiar mensagem do pedido'))!;
    copy.click();
    await flush();
    fixture.detectChanges();

    expect(write).toHaveBeenCalledTimes(1);
    expect(write.calls.mostRecent().args[0]).toContain('Olá, Disk Pizza! Sou *Maria Silva*');
    expect(el.textContent).toContain('Mensagem copiada');
  });
});

describe('Edição de pizza que saiu do carrinho', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
  });
  afterEach(() => localStorage.clear());

  const A = 'tradicional-calabresa';

  it('"Fazer novo pedido" também encerra uma edição em andamento', () => {
    const cart = TestBed.inject(CartService);
    cart.addPizza({ size: 'media', flavorIds: [A], crustId: null, notes: '', quantity: 1 });
    const order = TestBed.inject(OrderFacadeService);
    order.startEdit(cart.snapshot.pizzas[0].id);
    expect(order.isEditing()).toBeTrue();

    TestBed.inject(CheckoutFacadeService).startOver();

    expect(order.isEditing()).toBeFalse();
    expect(cart.snapshot.pizzas.length).toBe(0);
  });

  it('ao abrir o montador, a edição de uma pizza removida vira pizza nova (sem "Editando" fantasma)', () => {
    const cart = TestBed.inject(CartService);
    cart.addPizza({ size: 'media', flavorIds: [A], crustId: null, notes: '', quantity: 1 });
    const id = cart.snapshot.pizzas[0].id;
    const order = TestBed.inject(OrderFacadeService);
    order.startEdit(id);
    cart.removePizza(id);

    order.reconcileEdit();

    expect(order.isEditing()).toBeFalse();
    let flavors: string[] = [];
    order.view$.subscribe((v) => (flavors = v.draft.flavorIds)).unsubscribe();
    expect(flavors).toEqual([A]);
  });

  it('edição de uma pizza que continua no carrinho é mantida', () => {
    const cart = TestBed.inject(CartService);
    cart.addPizza({ size: 'media', flavorIds: [A], crustId: null, notes: '', quantity: 1 });
    const order = TestBed.inject(OrderFacadeService);
    order.startEdit(cart.snapshot.pizzas[0].id);
    order.reconcileEdit();
    expect(order.isEditing()).toBeTrue();
  });
});

describe('isChunkLoadError', () => {
  it('reconhece falha de carregar o módulo de uma página', () => {
    expect(isChunkLoadError(new Error('Loading chunk 91 failed.'))).toBeTrue();
    expect(isChunkLoadError({ name: 'ChunkLoadError', message: 'x' })).toBeTrue();
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/91.js'))).toBeTrue();
    expect(isChunkLoadError(new SyntaxError("Unexpected token '<'"))).toBeTrue();
  });

  it('não confunde com outros erros', () => {
    expect(isChunkLoadError(new Error('Cannot match any routes'))).toBeFalse();
    expect(isChunkLoadError(null)).toBeFalse();
    expect(isChunkLoadError(undefined)).toBeFalse();
  });
});
