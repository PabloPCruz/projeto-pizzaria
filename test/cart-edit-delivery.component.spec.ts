import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { BuilderPageComponent } from '../src/app/components/builder/builder-page.component';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { ContactSectionComponent } from '../src/app/components/home/contact-section.component';
import { HomeModule } from '../src/app/components/home/home.module';
import { STORE_INFO } from '../src/app/data/store-info';
import { MenuFacadeService } from '../src/app/facade/menu.facade.service';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';
import { CartService } from '../src/app/services/cart.service';
import { PizzaBuilderService } from '../src/app/services/pizza-builder.service';
import { DELIVERY_FEE_NOTICE } from '../src/app/services/whatsapp-message.service';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));
const [A, B, C] = ['tradicional-calabresa', 'tradicional-mussarela', 'especial-atum'];

function firstButton(el: HTMLElement, text: string, scope = 'button'): HTMLButtonElement | undefined {
  return Array.from(el.querySelectorAll<HTMLButtonElement>(scope)).find((b) => b.textContent?.trim().startsWith(text));
}

describe('Carrinho: bebidas sem duplicar', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let cart: CartService;

  const picker = () => el.querySelector('app-drink-picker') as HTMLElement | null;
  /** Nomes das linhas do carrinho (títulos), sem textos escondidos de leitor de tela. */
  const itemTitles = () =>
    Array.from(el.querySelectorAll('app-cart-items [data-line-heading]')).map((h) => h.textContent?.trim());
  /** Nomes das bebidas oferecidas no seletor. */
  const pickerRows = () =>
    Array.from(el.querySelectorAll('app-drink-picker li')).map((li) => li.querySelector('span.break-words')?.textContent?.trim());
  const inItems = (label: string) => itemTitles().filter((t) => t === label).length;
  const inPicker = (label: string) => pickerRows().filter((t) => t === label).length;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    cart = TestBed.inject(CartService);
    cart.addPizza({ size: 'grande', flavorIds: [A], crustId: null, notes: '', quantity: 1 });
    cart.addDrink('coca-2l', 2);
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('a bebida já escolhida aparece só em "Seus itens", não de novo no seletor', () => {
    expect(inItems('Coca-Cola 2L')).toBe(1);
    expect(inPicker('Coca-Cola 2L')).toBe(0);
    expect(inPicker('Fanta 2L')).toBe(1);
    expect(pickerRows().length).toBe(9);
  });

  it('o título muda para "outra bebida" quando já há bebida no pedido', () => {
    expect(el.querySelector('#bebida-title')?.textContent).toContain('outra bebida');
  });

  it('adicionar pela lista move a bebida para "Seus itens" e ela sai do seletor', () => {
    const zero = Array.from(picker()!.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.getAttribute('aria-label') === 'Adicionar Coca-Cola Zero 2L ao carrinho'
    )!;
    zero.click();
    fixture.detectChanges();

    expect(inItems('Coca-Cola Zero 2L')).toBe(1);
    expect(inPicker('Coca-Cola Zero 2L')).toBe(0);
    // Nenhuma bebida aparece duas vezes na tela (nem em "Seus itens" e no seletor ao mesmo tempo).
    for (const drink of TestBed.inject(MenuFacadeService).getDrinks()) {
      expect(inItems(drink.label) + inPicker(drink.label)).withContext(drink.label).toBeLessThanOrEqual(1);
    }
  });

  it('depois de adicionar, o foco vai para outro botão "Adicionar" (não se perde)', async () => {
    const button = Array.from(picker()!.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.getAttribute('aria-label') === 'Adicionar Fanta 2L ao carrinho'
    )!;
    button.focus();
    button.click();
    fixture.detectChanges();
    await flush();
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^Adicionar /);
  });

  it('com todas as bebidas já no pedido, a seção de adicionar some', () => {
    for (const drink of TestBed.inject(MenuFacadeService).getDrinks()) cart.addDrink(drink.id);
    fixture.detectChanges();
    expect(el.querySelector('#bebida-title')).toBeNull();
    expect(picker()).toBeNull();
  });
});

describe('Carrinho: editar pizza', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let cart: CartService;
  let navigate: jasmine.Spy;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    cart = TestBed.inject(CartService);
    cart.addPizza({ size: 'media', flavorIds: [A, B], crustId: 'cheddar', notes: 'sem cebola', quantity: 2 });
    cart.addPizza({ size: 'pequena', flavorIds: [C], crustId: null, notes: '', quantity: 1 });
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  const editButtons = () =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('app-cart-items button')).filter((b) => b.textContent?.trim().startsWith('Editar'));

  it('cada pizza tem um botão "Editar" com nome acessível (as bebidas não)', () => {
    expect(editButtons().length).toBe(2);
    expect(editButtons()[0].textContent).toContain('Pizza Média');
    expect(editButtons()[0].getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });

  it('clicar em Editar carrega a pizza no montador e abre a tela de montagem', () => {
    editButtons()[0].click();
    const draft = TestBed.inject(PizzaBuilderService).snapshot;
    expect(draft.editingId).toBe(cart.snapshot.pizzas[0].id);
    expect(draft.size).toBe('media');
    expect(draft.flavorIds).toEqual([A, B]);
    expect(draft.crustId).toBe('cheddar');
    expect(draft.notes).toBe('sem cebola');
    expect(draft.quantity).toBe(2);
    expect(TestBed.inject(OrderFacadeService).getStep()).toBe(1);
    expect(navigate).toHaveBeenCalledWith(['/montar-pizza']);
  });

  it('editar não altera o carrinho até salvar', () => {
    const before = JSON.stringify(cart.snapshot);
    editButtons()[1].click();
    expect(JSON.stringify(cart.snapshot)).toBe(before);
  });
});

describe('Montar pizza em modo edição', () => {
  let fixture: ComponentFixture<BuilderPageComponent>;
  let el: HTMLElement;
  let cart: CartService;
  let order: OrderFacadeService;
  let navigate: jasmine.Spy;

  const next = () => {
    firstButton(el, 'Avançar')!.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] }).compileComponents();
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    cart = TestBed.inject(CartService);
    order = TestBed.inject(OrderFacadeService);
    cart.addPizza({ size: 'media', flavorIds: [A, B], crustId: null, notes: '', quantity: 2 });
    cart.addPizza({ size: 'pequena', flavorIds: [C], crustId: null, notes: '', quantity: 1 });
    order.startEdit(cart.snapshot.pizzas[0].id);
    fixture = TestBed.createComponent(BuilderPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('mostra o aviso de edição, começa em Sabores e já traz os sabores marcados', () => {
    expect(el.querySelector('#editing-banner')?.textContent).toContain('Editando uma pizza do carrinho');
    expect(el.querySelector('#step-title')?.textContent).toContain('sabores');
    expect(el.querySelector('#flavor-counter')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('2/2 sabores');
    expect(el.querySelectorAll('input[type=checkbox]:checked').length).toBe(2);
  });

  it('na revisão o botão é "Salvar alterações" e a quantidade original é mantida', () => {
    next(); // borda
    next(); // extras
    next(); // revisão
    expect(firstButton(el, 'Salvar alterações')).toBeTruthy();
    expect(firstButton(el, 'Adicionar ao carrinho')).toBeUndefined();
    expect(el.querySelector('app-review-step output')?.textContent?.trim()).toBe('2');
  });

  it('trocar um sabor e salvar substitui a pizza (sem duplicar) e mostra a confirmação', () => {
    const original = cart.snapshot.pizzas[0];
    // desmarca a mussarela e marca o atum (mesmo limite de 2 sabores da média)
    const boxes = () => Array.from(el.querySelectorAll<HTMLInputElement>('input[type=checkbox]'));
    boxes().find((b) => b.checked && b.closest('label')?.textContent?.includes('Mussarela'))!.click();
    fixture.detectChanges();
    boxes().find((b) => !b.checked && b.closest('label')?.textContent?.includes('Atum'))!.click();
    fixture.detectChanges();
    next();
    next();
    next();
    firstButton(el, 'Salvar alterações')!.click();
    fixture.detectChanges();

    expect(cart.snapshot.pizzas.length).toBe(2);
    expect(cart.snapshot.pizzas[0].id).toBe(original.id);
    expect(cart.snapshot.pizzas[0].flavorIds).toEqual([A, C]);
    expect(cart.snapshot.pizzas[0].quantity).toBe(2);
    expect(el.querySelector('#added-title')?.textContent).toContain('Alterações salvas no carrinho');
    expect(el.querySelector('#editing-banner')).toBeNull();
  });

  it('"Cancelar edição" descarta as mudanças, volta ao carrinho e não altera a pizza', () => {
    const before = JSON.stringify(cart.snapshot);
    firstButton(el, 'Cancelar edição')!.click();
    fixture.detectChanges();
    expect(JSON.stringify(cart.snapshot)).toBe(before);
    expect(order.isEditing()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/carrinho']);
  });
});

describe('Cartão "taxa de entrega grátis"', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;

  const STORE = STORE_INFO.freeDelivery.origin;
  const at = (km: number) => ({ lat: String(STORE.lat + km / 111.195), lng: String(STORE.lng) });

  function typeCep(cep: string): void {
    const input = el.querySelector<HTMLInputElement>('#field-cep')!;
    input.value = cep;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function informCep(cep: string, km: number): void {
    typeCep(cep);
    const digits = cep.replace(/\D/g, '');
    http.expectOne(`https://viacep.com.br/ws/${digits}/json/`).flush({ logradouro: 'Rua Luiz Braille', bairro: 'São Braz', localidade: 'Curitiba', uf: 'PR' });
    http.expectOne(`https://cep.awesomeapi.com.br/json/${digits}`).flush(at(km));
    fixture.detectChanges();
  }

  const inline = () => el.querySelector('#delivery-free-inline');
  const summaryNotice = () => el.querySelector('app-order-summary #delivery-fee-notice');

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(CartService).addPizza({ size: 'grande', flavorIds: [A], crustId: null, notes: '', quantity: 1 });
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.match((r) => r.url.includes('nominatim'));
    http.verify();
    localStorage.clear();
  });

  it('por padrão (sem CEP) mostra só o aviso de que a taxa será confirmada pelo WhatsApp', () => {
    expect(inline()).toBeNull();
    expect(summaryNotice()?.textContent).toContain(DELIVERY_FEE_NOTICE);
  });

  it('endereço a até 3 km: mostra o cartão bonito no formulário e no resumo, no lugar do aviso padrão', () => {
    informCep('82015-290', 2);

    const card = inline()!;
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('Taxa de entrega grátis para o seu endereço');
    expect(card.textContent).toContain('a até 3 km da loja');
    expect(card.querySelector('[role=status]')).toBeTruthy();

    expect(summaryNotice()?.textContent).toContain('Taxa de entrega grátis para o seu endereço');
    expect(summaryNotice()?.textContent).not.toContain(DELIVERY_FEE_NOTICE);
    // o botão de enviar continua ligado a um elemento existente (aria-describedby)
    const submit = el.querySelector('app-order-summary button[type=submit]')!;
    expect(el.querySelector('#' + submit.getAttribute('aria-describedby'))).toBeTruthy();
  });

  it('endereço fora dos 3 km: mantém o aviso padrão e não mostra o cartão', () => {
    informCep('80010-000', 7);
    expect(inline()).toBeNull();
    expect(summaryNotice()?.textContent).toContain(DELIVERY_FEE_NOTICE);
    expect(el.textContent).not.toContain('Taxa de entrega grátis');
  });

  it('logo depois do limite (3,2 km) já é aviso padrão', () => {
    informCep('82015-290', 3.2);
    expect(inline()).toBeNull();
  });

  it('mudar o CEP faz o cartão sumir na hora', () => {
    informCep('82015-290', 1);
    expect(inline()).toBeTruthy();
    typeCep('8201529');
    expect(inline()).toBeNull();
    expect(summaryNotice()?.textContent).toContain(DELIVERY_FEE_NOTICE);
  });

  it('nunca aparece valor de entrega (só o texto "grátis" ou o aviso)', () => {
    informCep('82015-290', 1);
    // Os valores do cardápio são só informativos (seletor de bebidas); fora dele nunca aparece valor em reais.
    const withoutDrinkPrices = el.cloneNode(true) as HTMLElement;
    withoutDrinkPrices.querySelectorAll('app-drink-picker').forEach((n) => n.remove());
    expect(withoutDrinkPrices.textContent).not.toMatch(/R\$\s*\d/);
  });
});

describe('Contatos', () => {
  it('não exibe mais o endereço da loja (a loja usa o ponto só para calcular a entrega)', async () => {
    await TestBed.configureTestingModule({ imports: [HomeModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(ContactSectionComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toMatch(/Braill?e/i);
    expect(text).not.toContain('Endereço');
    expect(text).toContain(STORE_INFO.phoneDisplay);
    expect(text).toContain(STORE_INFO.whatsappDisplay);
    expect(text).toContain('Horário');
  });
});
