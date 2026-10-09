import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { FlavorsStepComponent } from '../src/app/components/builder/flavors-step.component';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { OrderSentComponent } from '../src/app/components/cart/order-sent.component';
import { CheckoutFormComponent } from '../src/app/components/cart/checkout-form.component';
import { CartFacadeService } from '../src/app/facade/cart.facade.service';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';
import { CartService } from '../src/app/services/cart.service';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('Carrinho: clareza e acessibilidade', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;

  const click = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text))!.click();

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    const cart = TestBed.inject(CartFacadeService);
    cart.addDrink('coca-2l');
    TestBed.inject(OrderFacadeService); // garante o montador carregado
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    el?.remove();
    localStorage.clear();
  });

  it('o botão de envio não promete mais do que entrega', () => {
    const button = Array.from(el.querySelectorAll<HTMLButtonElement>('app-order-summary button'))[0];
    expect(button.textContent).toContain('Finalizar no WhatsApp');
    expect(el.querySelector('app-order-summary')?.textContent).toContain('Você confirma o envio dentro do WhatsApp. Nada é cobrado agora.');
  });

  it('"Valor confirmado pelo WhatsApp" aparece uma vez (no resumo), não em cada linha', () => {
    const occurrences = (el.textContent ?? '').split('Valor confirmado pelo WhatsApp').length - 1;
    expect(occurrences).toBe(1);
    expect(el.querySelector('app-cart-items')?.textContent).not.toContain('Valor confirmado');
  });

  it('botão fixo do celular mostra a quantidade e, com o formulário incompleto, mostra o que falta', async () => {
    const bar = el.querySelector<HTMLButtonElement>('.sticky.lg\\:hidden button')!;
    expect(bar.textContent).toContain('Finalizar pedido');
    expect(bar.textContent).toContain('1 item');
    // Sem aria-label próprio: o nome acessível é o texto visível (WCAG 2.5.3, comando de voz).
    expect(bar.hasAttribute('aria-label')).toBeFalse();

    const open = spyOn(window, 'open');
    bar.click();
    await flush();
    fixture.detectChanges();
    expect(open).not.toHaveBeenCalled();
    expect(el.querySelector('#checkout-errors')?.textContent).toContain('Confira estes pontos antes de enviar');
    expect(document.activeElement?.id).toBe('field-name');
  });

  it('aviso de privacidade perto do formulário diz para onde vão os dados', () => {
    const form = el.querySelector('#checkout-form')!;
    expect(form.textContent).toContain('ficam neste aparelho e só vão para a loja pelo WhatsApp');
    expect(form.textContent).toContain('ViaCEP');
  });

  describe('erros no campo ao sair dele', () => {
    const field = (name: string) => el.querySelector<HTMLInputElement>('#field-' + name)!;
    const errorOf = (name: string) => el.querySelector('#field-' + name + '-error')?.textContent?.trim();

    it('só o campo visitado mostra erro; os outros esperam o envio', () => {
      field('name').dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(errorOf('name')).toContain('Informe seu nome.');
      expect(errorOf('phone')).toBeUndefined();
      expect(errorOf('street')).toBeUndefined();
    });

    it('o erro some assim que o campo fica certo', () => {
      field('name').dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      field('name').value = 'Maria Silva';
      field('name').dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(errorOf('name')).toBeUndefined();
    });

    it('telefone inválido avisa ao sair do campo', () => {
      field('phone').value = '(10) 12345-6789';
      field('phone').dispatchEvent(new Event('input'));
      field('phone').dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(errorOf('phone')).toContain('telefone válido');
    });

    it('depois do primeiro envio todos os erros aparecem', () => {
      const form = fixture.debugElement.query(By.directive(CheckoutFormComponent)).componentInstance as CheckoutFormComponent;
      form.submit();
      fixture.detectChanges();
      expect(errorOf('name')).toBeTruthy();
      expect(errorOf('phone')).toBeTruthy();
    });
  });

  it('teclado do celular: maiúscula nos nomes, sem corretor em UF/número, tecla "próximo"/"ok"', () => {
    const attr = (name: string, a: string) => el.querySelector('#field-' + name)!.getAttribute(a);
    expect(attr('name', 'autocapitalize')).toBe('words');
    expect(attr('street', 'autocapitalize')).toBe('words');
    expect(attr('city', 'autocapitalize')).toBe('words');
    expect(attr('state', 'autocapitalize')).toBe('characters');
    expect(attr('state', 'spellcheck')).toBe('false');
    expect(attr('number', 'spellcheck')).toBe('false');
    expect(attr('name', 'enterkeyhint')).toBe('next');
    expect(attr('state', 'enterkeyhint')).toBe('done');
  });
});

describe('Pizzas iguais no carrinho (leitor de tela)', () => {
  it('rótulos incluem os sabores, para diferenciar duas pizzas do mesmo tamanho', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    const cartService = TestBed.inject(CartService);
    cartService.addPizza({ size: 'grande', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 });
    cartService.addPizza({ size: 'grande', flavorIds: ['especial-atum'], crustId: null, notes: '', quantity: 1 });
    const fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();

    const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('app-cart-items li[aria-label]')).map((li) =>
      li.getAttribute('aria-label')
    );
    expect(labels.length).toBe(2);
    expect(labels[0]).not.toBe(labels[1]);
    expect(labels[0]).toContain('Calabresa');
    expect(labels[1]).toContain('Atum');
    fixture.nativeElement.remove();
    localStorage.clear();
  });
});

describe('Lista de sabores: limite à vista', () => {
  let fixture: ComponentFixture<FlavorsStepComponent>;
  let el: HTMLElement;
  let order: OrderFacadeService;

  const [A, B, C] = ['tradicional-calabresa', 'tradicional-mussarela', 'especial-atum'];

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] }).compileComponents();
    order = TestBed.inject(OrderFacadeService);
    order.selectSize('media'); // até 2 sabores
    order.toggleFlavor(A);
    order.toggleFlavor(B);
    fixture = TestBed.createComponent(FlavorsStepComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    el?.remove();
    localStorage.clear();
  });

  it('o contador fica fixo no topo da lista e mostra o limite', () => {
    const counter = el.querySelector('#flavor-counter')!;
    expect(counter.textContent).toContain('2/2');
    expect(counter.closest('.sticky')).toBeTruthy();
    expect(el.querySelector('.sticky')?.textContent).toContain('Limite atingido.');
  });

  it('tocar num sabor bloqueado explica por que não dá para escolher', () => {
    const label = el.querySelector<HTMLLabelElement>(`label[for="flavor-${C}"]`)!;
    expect((el.querySelector(`#flavor-${C}`) as HTMLInputElement).disabled).toBeTrue();
    label.click();
    fixture.detectChanges();
    expect(el.querySelector('[role=status]')?.textContent).toContain('Limite de 2 sabores atingido. Remova um sabor para escolher outro.');
  });

  it('os sabores escolhidos continuam removíveis pelos botões', () => {
    const remove = el.querySelector<HTMLButtonElement>('button[aria-label^="Remover "]')!;
    remove.click();
    fixture.detectChanges();
    expect(el.querySelector('#flavor-counter')?.textContent).toContain('1/2');
  });
});

describe('Pedido pronto: confirmar antes de apagar', () => {
  it('"Fazer novo pedido" pede confirmação e "Cancelar" mantém o pedido', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    TestBed.inject(CartFacadeService).addDrink('coca-2l');
    
    const fixture = TestBed.createComponent(OrderSentComponent);
    fixture.componentInstance.sent = { url: 'https://wa.me/x', blocked: false, message: 'oi' };
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const button = (text: string) => Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text));

    expect(el.textContent).toContain('Seu pedido ainda não foi enviado para a loja.');
    button('Fazer novo pedido')!.click();
    fixture.detectChanges();
    expect(button('Sim, apagar tudo')).toBeTruthy();

    button('Cancelar')!.click();
    fixture.detectChanges();
    expect(button('Fazer novo pedido')).toBeTruthy();
    expect(TestBed.inject(CartService).snapshot.drinks.length).toBe(1);
    localStorage.clear();
  });
});

describe('Aviso de limite de sabores: dentro do cartão e temporário', () => {
  const [A, B, C] = ['tradicional-calabresa', 'tradicional-mussarela', 'especial-atum'];

  it('aparece dentro do cartão do contador (não solto sobre a lista) e some sozinho', async () => {
    jasmine.clock().install();
    try {
      localStorage.clear();
      await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] }).compileComponents();
      const order = TestBed.inject(OrderFacadeService);
      order.selectSize('media');
      order.toggleFlavor(A);
      order.toggleFlavor(B);
      const fixture = TestBed.createComponent(FlavorsStepComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;

      el.querySelector<HTMLLabelElement>(`label[for="flavor-${C}"]`)!.click();
      fixture.detectChanges();
      const message = el.querySelector('.sticky .card [role=status] p');
      expect(message?.textContent).toContain('Limite de 2 sabores atingido');
      expect(el.querySelector('.sticky')?.className).not.toContain('/95');

      jasmine.clock().tick(6001);
      fixture.detectChanges();
      expect(el.querySelector('.sticky .card [role=status] p')).toBeNull();
      el.remove();
    } finally {
      jasmine.clock().uninstall();
      localStorage.clear();
    }
  });
});

describe('Layout do app: cabeçalho fixo', () => {
  it('o elemento do cabeçalho não vira um bloco próprio (senão o "sticky" para de acompanhar a rolagem)', () => {
    const root = document.createElement('app-root');
    root.innerHTML = '<app-header></app-header><main></main>';
    document.body.appendChild(root);
    try {
      expect(getComputedStyle(root).display).toBe('flex');
      expect(getComputedStyle(root.querySelector('app-header')!).display).toBe('contents');
    } finally {
      root.remove();
    }
  });
});
