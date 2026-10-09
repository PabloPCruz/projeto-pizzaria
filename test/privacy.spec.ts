import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FooterComponent } from '../src/app/components/layout/footer.component';
import { LayoutModule } from '../src/app/components/layout/layout.module';
import { PrivacyFacadeService } from '../src/app/facade/privacy.facade.service';
import { CartState } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { CheckoutDraftService } from '../src/app/services/checkout-draft.service';
import { LastOrderService } from '../src/app/services/last-order.service';
import { PersistenceService } from '../src/app/services/persistence.service';
import { PizzaBuilderService } from '../src/app/services/pizza-builder.service';

const ORDER: CartState = {
  pizzas: [{ id: 'p1', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 }],
  drinks: [{ id: 'd1', drinkId: 'coca-2l', quantity: 1 }],
};

const storedKeys = () => Object.keys(localStorage).filter((k) => k.startsWith('disk-pizza:'));
const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('PersistenceService.clearAll', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('apaga todas as chaves do site (e suas marcas de tempo) e só elas', () => {
    const persistence = TestBed.inject(PersistenceService);
    persistence.write('cart', { a: 1 });
    persistence.write('checkout', { b: 2 });
    localStorage.setItem('outro-site:chave', 'fica');
    persistence.clearAll();
    expect(storedKeys()).toEqual([]);
    expect(localStorage.getItem('outro-site:chave')).toBe('fica');
  });
});

describe('PrivacyFacadeService (apagar meus dados)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
  });
  afterEach(() => localStorage.clear());

  it('apaga carrinho, formulário, pizza em montagem e último pedido, na memória e no aparelho', () => {
    const cart = TestBed.inject(CartService);
    const draft = TestBed.inject(CheckoutDraftService);
    const builder = TestBed.inject(PizzaBuilderService);
    const last = TestBed.inject(LastOrderService);
    cart.restore(ORDER);
    draft.update({ name: 'Maria Silva', phone: '(41) 99999-8888', street: 'Rua A' });
    builder.setSize('grande');
    last.save(ORDER);
    localStorage.setItem('outro-site:chave', 'fica');
    expect(storedKeys().length).toBeGreaterThan(0);

    TestBed.inject(PrivacyFacadeService).eraseMyData();

    expect(cart.snapshot).toEqual({ pizzas: [], drinks: [] });
    expect(draft.snapshot.name).toBe('');
    expect(draft.snapshot.phone).toBe('');
    expect(builder.snapshot.size).toBeNull();
    expect(last.snapshot).toBeNull();
    expect(storedKeys()).toEqual([]);
    expect(localStorage.getItem('outro-site:chave')).toBe('fica');
  });

  it('depois de apagar, o site continua funcionando e voltando a salvar', () => {
    const privacy = TestBed.inject(PrivacyFacadeService);
    privacy.eraseMyData();
    TestBed.inject(CartService).addDrink('fanta-2l');
    expect(storedKeys().length).toBeGreaterThan(0);
  });
});

describe('Rodapé: botão "Apagar meus dados"', () => {
  let el: HTMLElement;
  let fixtureRef: ReturnType<typeof TestBed.createComponent<FooterComponent>>;
  const buttons = () => Array.from(el.querySelectorAll('button'));
  const byText = (text: string) => buttons().find((b) => b.textContent?.includes(text));

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [LayoutModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    fixtureRef = TestBed.createComponent(FooterComponent);
    el = fixtureRef.nativeElement;
    document.body.appendChild(el);
    fixtureRef.detectChanges();
  });

  afterEach(() => {
    el.remove();
    localStorage.clear();
  });

  it('só pede confirmação ao clicar; nada é apagado ainda, e o foco vai para "Cancelar"', async () => {
    TestBed.inject(CartService).restore(ORDER);
    byText('Apagar meus dados')!.click();
    fixtureRef.detectChanges();
    await flush();

    expect(el.textContent).toContain('carrinho, os dados do formulário e o último pedido');
    expect(TestBed.inject(CartService).snapshot.drinks.length).toBe(1);
    expect(document.activeElement?.textContent).toContain('Cancelar');
  });

  it('cancelar fecha a confirmação sem apagar nada', () => {
    TestBed.inject(CartService).restore(ORDER);
    byText('Apagar meus dados')!.click();
    fixtureRef.detectChanges();
    byText('Cancelar')!.click();
    fixtureRef.detectChanges();

    expect(byText('Sim, apagar')).toBeUndefined();
    expect(TestBed.inject(CartService).snapshot.drinks.length).toBe(1);
  });

  it('confirmar apaga tudo e avisa com role=status', async () => {
    TestBed.inject(CartService).restore(ORDER);
    TestBed.inject(LastOrderService).save(ORDER);
    byText('Apagar meus dados')!.click();
    fixtureRef.detectChanges();
    byText('Sim, apagar')!.click();
    await flush();
    fixtureRef.detectChanges();

    expect(TestBed.inject(CartService).snapshot).toEqual({ pizzas: [], drinks: [] });
    expect(TestBed.inject(LastOrderService).snapshot).toBeNull();
    expect(storedKeys()).toEqual([]);
    expect(el.querySelector('[role=status]')?.textContent).toContain('Seus dados foram apagados deste aparelho');
  });
});
