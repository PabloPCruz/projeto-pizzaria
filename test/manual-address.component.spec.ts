import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { STORE_INFO } from '../src/app/data/store-info';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { CartService } from '../src/app/services/cart.service';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));
const STORE = STORE_INFO.freeDelivery.origin;
const hit = (km: number) => [
  {
    lat: String(STORE.lat + km / 111.195),
    lon: String(STORE.lng),
    place_rank: 30,
    display_name: '135, Rua Luiz Braille, São Braz, Curitiba, Paraná, Brasil',
  },
];

describe('Checkout: endereço manual ("Não sei meu CEP")', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;
  let checkout: CheckoutFacadeService;

  const field = (name: string) => el.querySelector<HTMLInputElement>('#field-' + name);
  const toggle = () => el.querySelector<HTMLInputElement>('#field-manualAddress')!;
  const submitButton = () =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button[type=submit]')).find((b) => b.textContent?.includes('Finalizar no WhatsApp'))!;

  function type(name: string, value: string): void {
    const input = field(name)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function leave(name: string): void {
    field(name)!.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function turnOnManual(): void {
    toggle().click();
    fixture.detectChanges();
  }

  function fillManualAddress(): void {
    type('street', 'Rua Luiz Braille');
    type('number', '135');
    type('neighborhood', 'São Braz');
    type('city', 'Curitiba');
    type('state', 'pr');
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    checkout = TestBed.inject(CheckoutFacadeService);
    TestBed.inject(CartService).addPizza({ size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 });
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.match(() => true);
    el?.remove();
    localStorage.clear();
  });

  it('por padrão pede o CEP e oferece "Não sei meu CEP" (alvo de toque de 44px, com rótulo)', () => {
    expect(field('cep')).toBeTruthy();
    expect(toggle().checked).toBeFalse();
    expect(toggle().closest('label')!.textContent).toContain('Não sei meu CEP');
    expect(toggle().closest('label')!.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(el.querySelector<HTMLElement>('#manual-address-hint')!.hidden).toBeTrue();
  });

  it('ligar o modo manual esconde o CEP, mostra a dica, limpa o CEP e leva o foco à Rua', async () => {
    type('cep', '82015290');
    http.match(() => true);
    turnOnManual();
    await flush();

    expect(field('cep')).toBeNull();
    expect(checkout.draft.cep).toBe('');
    expect(checkout.draft.manualAddress).toBeTrue();
    expect(el.querySelector<HTMLElement>('#manual-address-hint')!.hidden).toBeFalse();
    expect(document.activeElement?.id).toBe('field-street');
  });

  it('no modo manual a Rua ocupa a linha inteira', () => {
    turnOnManual();
    expect(field('street')!.closest('app-text-field')!.classList).toContain('sm:col-span-6');
  });

  it('enviar vazio no modo manual pede rua, número, bairro, cidade e UF, mas não CEP nem complemento', async () => {
    turnOnManual();
    submitButton().click();
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();

    const summary = el.querySelector('#checkout-errors')!.textContent!;
    for (const label of ['Rua', 'Número', 'Bairro', 'Cidade', 'Estado (UF)']) expect(summary).toContain(label);
    expect(summary).not.toContain('CEP');
    expect(summary).not.toContain('Complemento');
    for (const name of ['street', 'number', 'neighborhood', 'city', 'state']) {
      expect(field(name)!.getAttribute('aria-invalid')).withContext(name).toBe('true');
    }
    expect(field('complement')!.getAttribute('aria-invalid')).toBeNull();
    expect(el.querySelector('#field-complement')!.closest('app-text-field')!.textContent).toContain('opcional');
  });

  it('endereço manual completo (sem CEP e sem complemento) envia o pedido; a mensagem não tem linha de CEP', () => {
    const open = spyOn(window, 'open').and.returnValue({} as Window);
    turnOnManual();
    fillManualAddress();
    type('name', 'Maria Silva');
    type('phone', '41999998888');
    el.querySelector<HTMLInputElement>('#field-payment-pix')!.click();
    fixture.detectChanges();

    submitButton().click();
    fixture.detectChanges();

    expect(open).toHaveBeenCalledTimes(1);
    const message = decodeURIComponent((open.calls.mostRecent().args[0] as string).split('?text=')[1]);
    expect(message).toContain('Rua Luiz Braille, 135\nSão Braz — Curitiba/PR\nContato: (41) 99999-8888');
    expect(message).not.toContain('CEP');
  });

  it('com o modo manual desligado o CEP volta a ser obrigatório e o que foi digitado é mantido', () => {
    turnOnManual();
    type('street', 'Rua Digitada');
    toggle().click();
    fixture.detectChanges();

    expect(field('cep')).toBeTruthy();
    expect(field('street')!.value).toBe('Rua Digitada');
    expect(checkout.validate()['cep']).toBeTruthy();
  });

  it('no modo manual nunca aparece a entrega grátis e nenhuma distância é consultada, mesmo com o endereço da loja', () => {
    turnOnManual();
    fillManualAddress();
    for (const name of ['street', 'number', 'neighborhood', 'city', 'state']) leave(name);
    http.expectNone(() => true);

    expect(el.querySelector('#delivery-free-inline')).toBeNull();
    expect(el.querySelector('app-order-summary #delivery-fee-notice')?.textContent).toContain('taxa de entrega');
    expect(el.textContent).not.toContain('Taxa de entrega grátis');
  });

  it('a dica do modo manual explica que o CEP libera a conferência da entrega grátis', () => {
    turnOnManual();
    expect(el.querySelector('#manual-address-hint')!.textContent).toContain('Com o CEP conferimos se a sua entrega é grátis');
  });

  it('ligar o modo manual depois de o CEP ter liberado a entrega grátis remove o cartão na hora', () => {
    type('cep', '82015290');
    http.expectOne('https://viacep.com.br/ws/82015290/json/').flush({ logradouro: 'Rua Luiz Braille', bairro: 'São Braz', localidade: 'Curitiba', uf: 'PR' });
    http.expectOne('https://cep.awesomeapi.com.br/json/82015290').flush({ lat: String(STORE.lat), lng: String(STORE.lng) });
    fixture.detectChanges();
    expect(el.querySelector('#delivery-free-inline')).toBeTruthy();

    turnOnManual();
    expect(el.querySelector('#delivery-free-inline')).toBeNull();
    expect(el.querySelector('app-order-summary #delivery-fee-notice')?.textContent).toContain('taxa de entrega');
  });

  it('desligar o modo manual e informar um CEP dentro das regras mostra a entrega grátis de novo', () => {
    turnOnManual();
    toggle().click();
    fixture.detectChanges();
    type('cep', '82015290');
    http.expectOne('https://viacep.com.br/ws/82015290/json/').flush({ erro: true });
    http.expectOne('https://cep.awesomeapi.com.br/json/82015290').flush({ lat: String(STORE.lat), lng: String(STORE.lng) });
    fixture.detectChanges();
    expect(el.querySelector('#delivery-free-inline')).toBeTruthy();
  });

  it('o modo manual sobrevive a recarregar a página', () => {
    turnOnManual();
    fillManualAddress();
    http.match(() => true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] });
    TestBed.inject(CartService).addDrink('coca-2l');
    const again = TestBed.createComponent(CartPageComponent);
    again.detectChanges();
    const root: HTMLElement = again.nativeElement;
    expect(root.querySelector<HTMLInputElement>('#field-manualAddress')!.checked).toBeTrue();
    expect(root.querySelector('#field-cep')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('#field-street')!.value).toBe('Rua Luiz Braille');
    TestBed.inject(HttpTestingController).match(() => true);
    root.remove();
  });
});
