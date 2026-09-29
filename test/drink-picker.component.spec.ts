import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { ReviewStepComponent } from '../src/app/components/builder/review-step.component';
import { DrinkPickerComponent } from '../src/app/components/shared/drink-picker.component';
import { SharedModule } from '../src/app/components/shared/shared.module';
import { CartService } from '../src/app/services/cart.service';
import { PizzaBuilderService } from '../src/app/services/pizza-builder.service';

describe('DrinkPickerComponent (bebidas)', () => {
  let fixture: ComponentFixture<DrinkPickerComponent>;
  let el: HTMLElement;
  let cart: CartService;

  /** Linha da bebida pelo nome (ex.: "Coca-Cola 2L"). */
  const row = (label: string): HTMLElement =>
    Array.from(el.querySelectorAll<HTMLElement>('li')).find((li) => li.textContent?.includes(label))!;
  const button = (r: HTMLElement, ariaStart: string): HTMLButtonElement =>
    Array.from(r.querySelectorAll('button')).find((b) => b.getAttribute('aria-label')?.startsWith(ariaStart))!;
  const quantityOf = (r: HTMLElement): string | undefined => r.querySelector('output')?.textContent?.trim();
  const drinkQty = (drinkId: string): number =>
    cart.snapshot.drinks.find((d) => d.drinkId === drinkId)?.quantity ?? 0;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [SharedModule] }).compileComponents();
    cart = TestBed.inject(CartService);
    fixture = TestBed.createComponent(DrinkPickerComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('adicionar mostra a quantidade e ela NÃO some sozinha depois de alguns segundos', fakeAsync(() => {
    button(row('Coca-Cola 2L'), 'Adicionar').click();
    fixture.detectChanges();
    expect(drinkQty('coca-2l')).toBe(1);
    expect(quantityOf(row('Coca-Cola 2L'))).toBe('1');

    tick(10_000);
    fixture.detectChanges();
    expect(quantityOf(row('Coca-Cola 2L'))).withContext('continua marcada após 10 s').toBe('1');
    expect(drinkQty('coca-2l')).toBe(1);
  }));

  it('"+" e "−" ajustam a quantidade no carrinho', () => {
    button(row('Fanta 2L'), 'Adicionar').click();
    fixture.detectChanges();
    button(row('Fanta 2L'), 'Aumentar').click();
    fixture.detectChanges();
    expect(drinkQty('fanta-2l')).toBe(2);
    expect(quantityOf(row('Fanta 2L'))).toBe('2');

    button(row('Fanta 2L'), 'Diminuir').click();
    fixture.detectChanges();
    expect(drinkQty('fanta-2l')).toBe(1);
    expect(quantityOf(row('Fanta 2L'))).toBe('1');
  });

  it('"−" na quantidade 1 remove a bebida do carrinho e volta o botão "Adicionar"', () => {
    button(row('Sprite 2L'), 'Adicionar').click();
    fixture.detectChanges();
    button(row('Sprite 2L'), 'Diminuir').click();
    fixture.detectChanges();
    expect(drinkQty('sprite-2l')).toBe(0);
    expect(cart.snapshot.drinks.length).toBe(0);
    expect(button(row('Sprite 2L'), 'Adicionar')).toBeTruthy();
    expect(quantityOf(row('Sprite 2L'))).toBeUndefined();
  });

  it('mostra as bebidas que já estão no carrinho (ex.: ao recarregar ou voltar ao passo)', () => {
    cart.addDrink('kuat-2l', 3);
    fixture.detectChanges();
    expect(quantityOf(row('Kuat 2L'))).toBe('3');
    expect(quantityOf(row('Guaraná 2L'))).toBeUndefined();
  });

  it('bebida removida em outro lugar (carrinho) some do seletor', () => {
    cart.addDrink('coca-lata');
    fixture.detectChanges();
    expect(quantityOf(row('Coca-Cola lata'))).toBe('1');
    cart.removeDrink(cart.snapshot.drinks[0].id);
    fixture.detectChanges();
    expect(quantityOf(row('Coca-Cola lata'))).toBeUndefined();
  });

  it('anuncia adição e remoção para leitor de tela em uma única região', () => {
    button(row('Coca-Cola 2L'), 'Adicionar').click();
    fixture.detectChanges();
    const live = el.querySelector('[role=status]')!;
    expect(live.textContent).toContain('Coca-Cola 2L');
    expect(live.textContent).toContain('1');
    button(row('Coca-Cola 2L'), 'Diminuir').click();
    fixture.detectChanges();
    expect(live.textContent).toContain('removida');
  });
});

describe('Passo de revisão mostra as bebidas do pedido', () => {
  let fixture: ComponentFixture<ReviewStepComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] }).compileComponents();
    const builder = TestBed.inject(PizzaBuilderService);
    builder.setSize('grande');
    builder.toggleFlavor('tradicional-calabresa');
    fixture = TestBed.createComponent(ReviewStepComponent);
    el = fixture.nativeElement;
  });

  afterEach(() => localStorage.clear());

  it('sem bebida no carrinho não mostra a seção', () => {
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Bebidas no pedido');
  });

  it('com bebidas no carrinho lista nome e quantidade', () => {
    const cart = TestBed.inject(CartService);
    cart.addDrink('coca-2l', 2);
    cart.addDrink('brahma-lata');
    fixture.detectChanges();
    const text = el.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('Bebidas no pedido');
    expect(text).toMatch(/2\s*×\s*Coca-Cola 2L/);
    expect(text).toMatch(/1\s*×\s*Cerveja Brahma lata/);
  });
});
