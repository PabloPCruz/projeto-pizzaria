import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { DRINKS } from '../src/app/data/menu.data';
import { CartService } from '../src/app/services/cart.service';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('Carrinho: foco ao adicionar a última bebida disponível', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    const cart = TestBed.inject(CartService);
    // Todas as bebidas já estão no pedido, menos a última da lista.
    for (const drink of DRINKS.slice(0, -1)) cart.addDrink(drink.id);
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
  });

  afterEach(() => {
    el.remove();
    localStorage.clear();
  });

  it('a seção de bebidas some e o foco vai para "Seus itens", não para o <body>', async () => {
    const add = el.querySelector<HTMLButtonElement>('app-drink-picker button[aria-label^="Adicionar"]')!;
    expect(add).withContext('só resta uma bebida para adicionar').toBeTruthy();
    add.focus();
    add.click();
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();

    expect(el.querySelector('app-drink-picker')).withContext('a seção de bebidas sumiu').toBeNull();
    expect(document.activeElement?.id).toBe('itens-title');
  });

  it('havendo outras bebidas na lista, o foco continua indo para o próximo "Adicionar"', async () => {
    TestBed.inject(CartService).clear();
    fixture.detectChanges();
    TestBed.inject(CartService).addDrink(DRINKS[0].id);
    fixture.detectChanges();
    const add = el.querySelector<HTMLButtonElement>('app-drink-picker button[aria-label^="Adicionar"]')!;
    add.focus();
    add.click();
    fixture.detectChanges();
    await flush();
    expect(document.activeElement?.getAttribute('aria-label') ?? '').toMatch(/^Adicionar/);
  });
});
