import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { CartState } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { LastOrderService } from '../src/app/services/last-order.service';
import { SUNDAY_INSTANT, fakeClock } from './helpers/fake-clock';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

const ORDER: CartState = {
  pizzas: [{ id: 'p1', size: 'grande', flavorIds: ['tradicional-calabresa', 'especial-poderosa'], crustId: 'catupiry', notes: '', quantity: 2 }],
  drinks: [{ id: 'd1', drinkId: 'coca-2l', quantity: 1 }],
};

describe('Repetir o último pedido', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let checkout: CheckoutFacadeService;

  const offer = () => el.querySelector<HTMLElement>('#repetir-pedido');
  const repeatButton = () => offer()?.querySelector<HTMLButtonElement>('button');

  function create(): void {
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
  }

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
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    checkout = TestBed.inject(CheckoutFacadeService);
  });

  afterEach(() => {
    el?.remove();
    localStorage.clear();
  });

  describe('quando o pedido é guardado', () => {
    beforeEach(() => TestBed.inject(CartService).restore(ORDER));

    it('enviar o pedido guarda os itens para repetir depois', () => {
      fillValidForm();
      const result = checkout.submit();
      expect(result.ok).toBeTrue();
      expect(TestBed.inject(LastOrderService).snapshot?.cart.pizzas.length).toBe(1);
      expect(TestBed.inject(LastOrderService).snapshot?.cart.drinks[0].drinkId).toBe('coca-2l');
    });

    it('formulário incompleto não guarda nada (o pedido não saiu)', () => {
      const result = checkout.submit();
      expect(result.ok).toBeFalse();
      expect(TestBed.inject(LastOrderService).snapshot).toBeNull();
    });

    it('loja fechada não guarda nada (o pedido não saiu)', () => {
      fakeClock.set(SUNDAY_INSTANT);
      fillValidForm();
      const result = checkout.submit();
      expect(result.ok).toBeFalse();
      expect(TestBed.inject(LastOrderService).snapshot).toBeNull();
    });
  });

  describe('carrinho vazio', () => {
    it('sem pedido anterior, não mostra a oferta', () => {
      create();
      expect(el.textContent).toContain('Seu carrinho está vazio');
      expect(offer()).toBeNull();
    });

    it('com pedido anterior, lista os itens e oferece repetir', () => {
      TestBed.inject(LastOrderService).save(ORDER);
      create();
      const text = (offer()?.textContent ?? '').replace(/\s+/g, ' ');
      expect(text).toContain('Repetir o último pedido');
      expect(text).toContain('2× Pizza Grande: Calabresa e Poderosa');
      expect(text).toContain('borda Catupiry');
      expect(text).toContain('Coca-Cola 2L');
      expect(repeatButton()?.textContent).toContain('Repetir pedido');
    });

    it('repetir devolve os itens ao carrinho, mostra o formulário e leva o foco para "Seus itens"', async () => {
      TestBed.inject(LastOrderService).save(ORDER);
      create();
      repeatButton()!.click();
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();

      const cart = TestBed.inject(CartService).snapshot;
      expect(cart.pizzas.length).toBe(1);
      expect(cart.pizzas[0].quantity).toBe(2);
      expect(cart.drinks[0].drinkId).toBe('coca-2l');
      expect(el.querySelector('form')).not.toBeNull();
      expect(document.activeElement?.id).toBe('itens-title');
    });

    it('repetir não mexe nos dados do formulário (continuam os de antes)', () => {
      fillValidForm();
      TestBed.inject(LastOrderService).save(ORDER);
      create();
      repeatButton()!.click();
      expect(checkout.draft.name).toBe('Maria Silva');
    });

    it('avisa quando algum item do pedido antigo saiu do cardápio', () => {
      localStorage.setItem(
        'disk-pizza:v2:last-order',
        JSON.stringify({
          pizzas: [
            { id: 'a', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 },
            { id: 'b', size: 'media', flavorIds: ['sabor-que-nao-existe'], crustId: null, notes: '', quantity: 1 },
          ],
          drinks: [],
        })
      );
      TestBed.resetTestingModule();
      return TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] })
        .compileComponents()
        .then(() => {
          create();
          expect((offer()?.textContent ?? '').replace(/\s+/g, ' ')).toContain('Alguns itens não estão mais no cardápio');
        });
    });
  });

  it('fluxo completo: envia, faz novo pedido e a oferta de repetir aparece', async () => {
    TestBed.inject(CartService).addDrink('fanta-2l', 2);
    create();
    fillValidForm();
    fixture.detectChanges();
    spyOn(window, 'open').and.returnValue({} as Window);
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    fixture.detectChanges();

    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Fazer novo pedido'))!.click();
    fixture.detectChanges();
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Sim, apagar tudo'))!.click();
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();

    expect(el.textContent).toContain('Seu carrinho está vazio');
    expect((offer()?.textContent ?? '').replace(/\s+/g, ' ')).toContain('2× Fanta 2L');
  });
});
