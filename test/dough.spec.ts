import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { BuilderPageComponent } from '../src/app/components/builder/builder-page.component';
import { CartFacadeService } from '../src/app/facade/cart.facade.service';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { CatalogService } from '../src/app/services/catalog.service';
import { PizzaBuilderService } from '../src/app/services/pizza-builder.service';
import { WhatsappMessageService } from '../src/app/services/whatsapp-message.service';
import { resetKeepingClock } from './helpers/fake-clock';

const A = 'tradicional-mussarela';
const BUILDER_KEY = 'disk-pizza:v2:builder';
const CART_KEY = 'disk-pizza:v2:cart';

const DRAFT: CheckoutDraft = {
  name: 'Maria Silva',
  phone: '(41) 99999-1234',
  manualAddress: false,
  cep: '80010-000',
  street: 'Rua XV de Novembro',
  number: '100',
  complement: '',
  neighborhood: 'Centro',
  city: 'Curitiba',
  state: 'PR',
  payment: 'pix',
  changeFor: '',
  generalNotes: '',
};

describe('Massa da pizza (fina, média ou grossa)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  describe('cardápio', () => {
    it('tem exatamente as massas fina, média e grossa', () => {
      const catalog = TestBed.inject(CatalogService);
      expect(catalog.getDoughs().map((d) => d.id)).toEqual(['fina', 'media', 'grossa']);
      expect(catalog.getDough('grossa')?.label).toBe('Massa grossa');
    });

    it('sanitizeDoughId só aceita massa que existe', () => {
      const catalog = TestBed.inject(CatalogService);
      expect(catalog.sanitizeDoughId('fina')).toBe('fina');
      for (const bad of ['xxl', '', 5, null, undefined, { a: 1 }]) expect(catalog.sanitizeDoughId(bad)).toBeNull();
    });
  });

  describe('PizzaBuilderService', () => {
    it('começa sem massa, guarda a escolha, volta a "sem preferência" e ignora massa inexistente', () => {
      const builder = TestBed.inject(PizzaBuilderService);
      expect(builder.snapshot.doughId).toBeNull();
      builder.setDough('media');
      expect(builder.snapshot.doughId).toBe('media');
      builder.setDough('inexistente');
      expect(builder.snapshot.doughId).toBeNull();
      builder.setDough('fina');
      builder.setDough(null);
      expect(builder.snapshot.doughId).toBeNull();
    });

    it('restaura a massa salva e descarta valor inválido', () => {
      localStorage.setItem(BUILDER_KEY, JSON.stringify({ size: 'grande', flavorIds: [A], crustId: null, doughId: 'grossa', notes: '' }));
      resetKeepingClock();
      TestBed.configureTestingModule({});
      expect(TestBed.inject(PizzaBuilderService).snapshot.doughId).toBe('grossa');

      localStorage.setItem(BUILDER_KEY, JSON.stringify({ size: 'grande', flavorIds: [A], crustId: null, doughId: { x: 1 }, notes: '' }));
      resetKeepingClock();
      TestBed.configureTestingModule({});
      expect(TestBed.inject(PizzaBuilderService).snapshot.doughId).toBeNull();
    });

    it('rascunho salvo antes da massa existir volta sem massa', () => {
      localStorage.setItem(BUILDER_KEY, JSON.stringify({ size: 'grande', flavorIds: [A], crustId: null, notes: '' }));
      resetKeepingClock();
      TestBed.configureTestingModule({});
      expect(TestBed.inject(PizzaBuilderService).snapshot.doughId).toBeNull();
    });

    it('editar uma pizza do carrinho carrega a massa dela', () => {
      const cart = TestBed.inject(CartService);
      cart.addPizza({ size: 'grande', flavorIds: [A], crustId: null, doughId: 'fina', notes: '', quantity: 1 });
      const builder = TestBed.inject(PizzaBuilderService);
      builder.load(cart.snapshot.pizzas[0]);
      expect(builder.snapshot.doughId).toBe('fina');
    });
  });

  describe('OrderFacadeService e carrinho', () => {
    it('a massa escolhida vai para a pizza do carrinho e o montador zera', () => {
      const order = TestBed.inject(OrderFacadeService);
      order.selectSize('grande');
      order.toggleFlavor(A);
      order.selectDough('grossa');
      expect(order.addToCart()).toBeTrue();
      expect(TestBed.inject(CartService).snapshot.pizzas[0].doughId).toBe('grossa');
      expect(TestBed.inject(PizzaBuilderService).snapshot.doughId).toBeNull();
    });

    it('carrinho restaurado descarta massa inválida e aceita linha antiga sem o campo', () => {
      const line = { size: 'grande', flavorIds: [A], crustId: null, notes: '', quantity: 1 };
      localStorage.setItem(
        CART_KEY,
        JSON.stringify({ pizzas: [{ id: 'a', ...line, doughId: 'grossa' }, { id: 'b', ...line, doughId: 'xxl' }, { id: 'c', ...line }], drinks: [] })
      );
      resetKeepingClock();
      TestBed.configureTestingModule({});
      const pizzas = TestBed.inject(CartService).snapshot.pizzas;
      expect(pizzas.map((p) => p.doughId)).toEqual(['grossa', null, undefined]);
    });

    it('o carrinho mostra a massa só quando foi escolhida', async () => {
      const cart = TestBed.inject(CartService);
      cart.addPizza({ size: 'grande', flavorIds: [A], crustId: null, doughId: 'media', notes: '', quantity: 1 });
      cart.addPizza({ size: 'grande', flavorIds: [A], crustId: null, notes: '', quantity: 1 });
      const view = await firstValueFrom(TestBed.inject(CartFacadeService).view$);
      expect(view.pizzas.map((p) => p.dough)).toEqual(['Massa média', null]);
    });
  });

  describe('mensagem do WhatsApp', () => {
    const cartWith = (doughId: string | null | undefined): CartState => ({
      pizzas: [{ id: '1', size: 'grande', flavorIds: [A], crustId: 'catupiry', doughId, notes: '', quantity: 1 }],
      drinks: [],
    });

    it('envia "Massa: ..." depois dos sabores e antes da borda', () => {
      const msg = TestBed.inject(WhatsappMessageService).buildMessage(cartWith('grossa'), DRAFT);
      expect(msg).toContain('Sabores: Mussarela\nMassa: grossa\nBorda: Catupiry');
    });

    it('cada massa aparece com o seu nome', () => {
      const service = TestBed.inject(WhatsappMessageService);
      expect(service.buildMessage(cartWith('fina'), DRAFT)).toContain('Massa: fina');
      expect(service.buildMessage(cartWith('media'), DRAFT)).toContain('Massa: média');
    });

    it('sem massa escolhida a linha é omitida', () => {
      const service = TestBed.inject(WhatsappMessageService);
      for (const none of [null, undefined]) expect(service.buildMessage(cartWith(none), DRAFT)).not.toContain('Massa');
    });

    it('o link do WhatsApp leva a massa', () => {
      const url = TestBed.inject(WhatsappMessageService).buildLink(cartWith('fina'), DRAFT);
      expect(decodeURIComponent(url.split('?text=')[1])).toContain('Massa: fina');
    });
  });
});

describe('Passo "Massa" no montador', () => {
  let fixture: ComponentFixture<BuilderPageComponent>;
  let el: HTMLElement;
  let order: OrderFacadeService;

  const title = () => (el.querySelector('#step-title')?.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const nav = (label: string) => {
    const b = Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((x) => x.textContent?.trim().startsWith(label));
    expect(b).withContext(label).toBeTruthy();
    b!.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] }).compileComponents();
    order = TestBed.inject(OrderFacadeService);
    order.selectSize('media');
    order.toggleFlavor(A);
    order.setStep(2);
    fixture = TestBed.createComponent(BuilderPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('o montador tem 6 passos e a massa é o terceiro, entre sabores e borda', () => {
    const labels = Array.from(el.querySelectorAll('nav[aria-label="Passos da montagem"] li .sr-only')).map((n) => n.textContent?.trim());
    expect(labels).toEqual(['Passo 1: Tamanho', 'Passo 2: Sabores', 'Passo 3: Massa', 'Passo 4: Borda', 'Passo 5: Extras', 'Passo 6: Revisão']);
    expect(title()).toContain('massa');
  });

  it('mostra fina, média e grossa mais "sem preferência", que vem marcada', () => {
    const labels = Array.from(el.querySelectorAll('app-dough-step label')).map((l) => l.textContent?.replace(/\s+/g, ' ').trim());
    expect(labels).toEqual(['Sem preferência de massa', 'Massa fina', 'Massa média', 'Massa grossa']);
    expect(el.querySelector<HTMLInputElement>('#dough-none')!.checked).toBeTrue();
  });

  it('escolher uma massa grava no rascunho e dá para voltar a "sem preferência"', () => {
    el.querySelector<HTMLInputElement>('#dough-grossa')!.click();
    fixture.detectChanges();
    expect(TestBed.inject(PizzaBuilderService).snapshot.doughId).toBe('grossa');
    expect(el.querySelector<HTMLInputElement>('#dough-grossa')!.checked).toBeTrue();

    el.querySelector<HTMLInputElement>('#dough-none')!.click();
    fixture.detectChanges();
    expect(TestBed.inject(PizzaBuilderService).snapshot.doughId).toBeNull();
  });

  it('é opcional: dá para avançar sem escolher e o passo seguinte é a borda', () => {
    nav('Avançar');
    expect(title()).toContain('borda');
  });

  it('a revisão mostra a massa escolhida e ela vai ao carrinho', () => {
    el.querySelector<HTMLInputElement>('#dough-fina')!.click();
    fixture.detectChanges();
    nav('Avançar'); // borda
    nav('Avançar'); // extras
    nav('Avançar'); // revisão
    expect(title()).toContain('revise');
    expect((el.querySelector('app-review-step')?.textContent ?? '').replace(/\s+/g, ' ')).toContain('Massa fina');
    nav('Adicionar ao carrinho');
    expect(TestBed.inject(CartService).snapshot.pizzas[0].doughId).toBe('fina');
  });
});
