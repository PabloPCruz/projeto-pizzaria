import { resetKeepingClock } from './helpers/fake-clock';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { ExtrasStepComponent } from '../src/app/components/builder/extras-step.component';
import { PizzaSummaryComponent } from '../src/app/components/builder/pizza-summary.component';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartItemsComponent } from '../src/app/components/cart/cart-items.component';
import { SharedModule } from '../src/app/components/shared/shared.module';
import { FlavorCardComponent } from '../src/app/components/shared/flavor-card.component';
import { FLAVORS } from '../src/app/data/menu.data';
import { CartFacadeService, CartView } from '../src/app/facade/cart.facade.service';
import { MenuFacadeService } from '../src/app/facade/menu.facade.service';
import { BuilderView, OrderFacadeService } from '../src/app/facade/order.facade.service';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { CatalogService } from '../src/app/services/catalog.service';
import { EMPTY_CHECKOUT } from '../src/app/services/checkout-draft.service';
import { CheckoutValidationService } from '../src/app/services/checkout-validation.service';
import { PizzaBuilderService } from '../src/app/services/pizza-builder.service';
import { SizeRulesService } from '../src/app/services/size-rules.service';
import { WhatsappMessageService } from '../src/app/services/whatsapp-message.service';

const text = (node: Element | null | undefined) => (node?.textContent ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

describe('Sabores com opção (escolha na hora de pedir)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  describe('cardápio: quais sabores têm opção (conferido no cardápio impresso)', () => {
    it('só Brócolis, Calabresa, Lombo com Milho e Chocolate têm opção, cada um com as suas', () => {
      const withOptions = FLAVORS.filter((f) => f.options?.length).map((f) => ({
        id: f.id,
        options: f.options!.map((o) => o.id),
      }));
      expect(withOptions).toEqual([
        { id: 'tradicional-brocolis', options: ['sem-opcao', 'catupiry'] },
        { id: 'tradicional-calabresa', options: ['sem-opcao', 'cebola', 'catupiry'] },
        { id: 'tradicional-lombo-com-milho', options: ['sem-opcao', 'catupiry'] },
        { id: 'doce-chocolate', options: ['ao-leite', 'branco'] },
      ]);
    });

    it('os ids das opções não se repetem dentro do mesmo sabor', () => {
      for (const f of FLAVORS.filter((x) => x.options)) {
        const ids = f.options!.map((o) => o.id);
        expect(new Set(ids).size).withContext(f.id).toBe(ids.length);
      }
    });
  });

  describe('CatalogService', () => {
    let catalog: CatalogService;
    beforeEach(() => (catalog = TestBed.inject(CatalogService)));

    it('rótulo do sabor leva a opção escolhida; "sem opção" e sabor sem opção ficam só com o nome', () => {
      expect(catalog.flavorLabel('tradicional-calabresa', 'catupiry')).toBe('Calabresa (com catupiry)');
      expect(catalog.flavorLabel('tradicional-calabresa', 'cebola')).toBe('Calabresa (com cebola)');
      expect(catalog.flavorLabel('doce-chocolate', 'branco')).toBe('Chocolate (branco)');
      expect(catalog.flavorLabel('doce-chocolate', 'ao-leite')).toBe('Chocolate (ao leite)');
      expect(catalog.flavorLabel('tradicional-calabresa', 'sem-opcao')).toBe('Calabresa');
      expect(catalog.flavorLabel('tradicional-calabresa')).toBe('Calabresa');
      expect(catalog.flavorLabel('tradicional-mussarela', 'catupiry')).toBe('Mussarela');
      expect(catalog.flavorLabel('tradicional-calabresa', 'inexistente')).toBe('Calabresa');
    });

    it('sanitizeFlavorOptions só guarda opção válida de sabor que está na pizza', () => {
      const raw = {
        'tradicional-calabresa': 'catupiry',
        'doce-chocolate': 'amargo', // opção que não existe
        'tradicional-mussarela': 'catupiry', // sabor sem opções
        'tradicional-brocolis': 'catupiry', // sabor que não está na pizza
        'sabor-fantasma': 'x',
      };
      expect(catalog.sanitizeFlavorOptions(raw, ['tradicional-calabresa', 'doce-chocolate', 'tradicional-mussarela'])).toEqual({
        'tradicional-calabresa': 'catupiry',
      });
      expect(catalog.sanitizeFlavorOptions('lixo', ['tradicional-calabresa'])).toEqual({});
      expect(catalog.sanitizeFlavorOptions(null, ['tradicional-calabresa'])).toEqual({});
      expect(catalog.sanitizeFlavorOptions([1, 2], ['tradicional-calabresa'])).toEqual({});
    });

    it('missingOptions lista os sabores com opção que ainda não foram escolhidos', () => {
      const ids = ['tradicional-calabresa', 'doce-chocolate', 'tradicional-mussarela'];
      expect(catalog.missingOptions(ids, {})).toEqual(['Calabresa', 'Chocolate']);
      expect(catalog.missingOptions(ids, { 'tradicional-calabresa': 'cebola' })).toEqual(['Chocolate']);
      expect(catalog.missingOptions(ids, { 'tradicional-calabresa': 'cebola', 'doce-chocolate': 'branco' })).toEqual([]);
    });
  });

  describe('regra de validação', () => {
    let rules: SizeRulesService;
    beforeEach(() => (rules = TestBed.inject(SizeRulesService)));

    it('pizza com sabor de opção sem a escolha não é válida e diz qual falta', () => {
      const result = rules.validate('media', ['tradicional-calabresa', 'tradicional-mussarela'], {});
      expect(result.valid).toBeFalse();
      expect(result.error).toBe('Escolha a opção de Calabresa.');
    });

    it('vários sabores pendentes aparecem juntos', () => {
      const result = rules.validate('media', ['tradicional-calabresa', 'doce-chocolate'], {});
      expect(result.error).toBe('Escolha a opção de Calabresa e Chocolate.');
    });

    it('com a escolha feita é válida; opção inexistente continua pendente', () => {
      expect(rules.validate('media', ['tradicional-calabresa'], { 'tradicional-calabresa': 'cebola' }).valid).toBeTrue();
      expect(rules.validate('media', ['tradicional-calabresa'], { 'tradicional-calabresa': 'lixo' }).valid).toBeFalse();
    });

    it('sem informar as opções (pedido antigo, salvo antes desta regra) a regra não é aplicada', () => {
      expect(rules.validate('media', ['tradicional-calabresa']).valid).toBeTrue();
    });
  });

  describe('montador (estado)', () => {
    let builder: PizzaBuilderService;
    beforeEach(() => {
      builder = TestBed.inject(PizzaBuilderService);
      builder.setSize('grande');
    });

    it('guarda a escolha e a remove junto com o sabor', () => {
      builder.toggleFlavor('tradicional-calabresa');
      builder.setFlavorOption('tradicional-calabresa', 'catupiry');
      expect(builder.snapshot.flavorOptions).toEqual({ 'tradicional-calabresa': 'catupiry' });
      builder.toggleFlavor('tradicional-calabresa');
      expect(builder.snapshot.flavorOptions).toEqual({});
    });

    it('ignora opção que não existe ou de sabor que não está na pizza', () => {
      builder.toggleFlavor('tradicional-calabresa');
      builder.setFlavorOption('tradicional-calabresa', 'amargo');
      builder.setFlavorOption('doce-chocolate', 'branco');
      expect(builder.snapshot.flavorOptions).toEqual({});
    });

    it('trocar para um tamanho menor derruba as opções dos sabores que saíram', () => {
      builder.toggleFlavor('tradicional-mussarela');
      builder.toggleFlavor('tradicional-calabresa');
      builder.setFlavorOption('tradicional-calabresa', 'cebola');
      builder.setSize('pequena'); // só 1 sabor: fica a mussarela
      expect(builder.snapshot.flavorIds).toEqual(['tradicional-mussarela']);
      expect(builder.snapshot.flavorOptions).toEqual({});
    });

    it('sobrevive a recarregar a página', () => {
      builder.toggleFlavor('doce-chocolate');
      builder.setFlavorOption('doce-chocolate', 'branco');
      resetKeepingClock();
      expect(TestBed.inject(PizzaBuilderService).snapshot.flavorOptions).toEqual({ 'doce-chocolate': 'branco' });
    });

    it('editar uma pizza do carrinho traz as opções dela de volta', () => {
      builder.load({
        id: 'x',
        size: 'grande',
        flavorIds: ['tradicional-calabresa'],
        crustId: null,
        notes: '',
        quantity: 1,
        flavorOptions: { 'tradicional-calabresa': 'catupiry' },
      });
      expect(builder.snapshot.flavorOptions).toEqual({ 'tradicional-calabresa': 'catupiry' });
    });
  });

  describe('adicionar ao carrinho', () => {
    it('só adiciona com a opção escolhida e leva a escolha para a linha do carrinho', () => {
      const order = TestBed.inject(OrderFacadeService);
      const cart = TestBed.inject(CartService);
      order.selectSize('media');
      order.toggleFlavor('tradicional-calabresa');
      expect(order.addToCart()).toBeFalse();
      expect(cart.snapshot.pizzas.length).toBe(0);

      order.selectFlavorOption('tradicional-calabresa', 'cebola');
      expect(order.addToCart()).toBeTrue();
      expect(cart.snapshot.pizzas[0].flavorOptions).toEqual({ 'tradicional-calabresa': 'cebola' });
    });

    it('pizza sem nenhum sabor de opção entra com flavorOptions vazio', () => {
      const order = TestBed.inject(OrderFacadeService);
      order.selectSize('media');
      order.toggleFlavor('tradicional-mussarela');
      expect(order.addToCart()).toBeTrue();
      expect(TestBed.inject(CartService).snapshot.pizzas[0].flavorOptions).toEqual({});
    });
  });

  describe('carrinho salvo', () => {
    it('restaurar valida as opções; linha antiga (sem o campo) continua como estava', () => {
      const cart = TestBed.inject(CartService);
      cart.restore({
        pizzas: [
          { id: 'a', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1, flavorOptions: { 'tradicional-calabresa': 'cebola', 'doce-chocolate': 'branco' } },
          { id: 'b', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 },
        ],
        drinks: [],
      });
      expect(cart.snapshot.pizzas[0].flavorOptions).toEqual({ 'tradicional-calabresa': 'cebola' });
      expect(cart.snapshot.pizzas[1].flavorOptions).toBeUndefined();
    });

    it('o envio confere a opção: linha nova sem a escolha não vai; linha antiga vai como antes', () => {
      const validation = TestBed.inject(CheckoutValidationService);
      const draft: CheckoutDraft = {
        ...EMPTY_CHECKOUT,
        name: 'Maria',
        phone: '(41) 99999-1234',
        cep: '80010-000',
        street: 'Rua A',
        number: '10',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        payment: 'pix',
      };
      const line = (flavorOptions?: Record<string, string>) => ({
        id: '1',
        size: 'media' as const,
        flavorIds: ['tradicional-calabresa'],
        crustId: null,
        notes: '',
        quantity: 1,
        ...(flavorOptions ? { flavorOptions } : {}),
      });
      const check = (l: ReturnType<typeof line>) => validation.validate({ pizzas: [l], drinks: [] }, draft);
      expect(check(line({})).cart).toContain('Escolha a opção de Calabresa');
      expect(validation.isValid(check(line({ 'tradicional-calabresa': 'catupiry' })))).toBeTrue();
      expect(validation.isValid(check(line()))).toBeTrue();
    });
  });

  describe('mensagem do WhatsApp', () => {
    const DRAFT: CheckoutDraft = {
      ...EMPTY_CHECKOUT,
      name: 'Maria Silva',
      phone: '(41) 99999-1234',
      cep: '80010-000',
      street: 'Rua XV de Novembro',
      number: '100',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
      payment: 'pix',
    };

    it('a opção escolhida vai ao lado do sabor; "sem opção" não aparece', () => {
      const cart: CartState = {
        pizzas: [
          {
            id: '1',
            size: 'grande',
            flavorIds: ['tradicional-calabresa', 'tradicional-mussarela', 'doce-chocolate'],
            crustId: null,
            notes: '',
            quantity: 1,
            flavorOptions: { 'tradicional-calabresa': 'catupiry', 'doce-chocolate': 'branco' },
          },
          { id: '2', size: 'media', flavorIds: ['tradicional-brocolis'], crustId: null, notes: '', quantity: 1, flavorOptions: { 'tradicional-brocolis': 'sem-opcao' } },
        ],
        drinks: [],
      };
      const message = TestBed.inject(WhatsappMessageService).buildMessage(cart, DRAFT);
      expect(message).toContain('Sabores: Calabresa (com catupiry), Mussarela e Chocolate (branco)');
      expect(message).toContain('Sabores: Brócolis\n');
    });
  });

  describe('telas', () => {
    it('passo de extras não pede mais para escrever a opção nas observações', async () => {
      await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] }).compileComponents();
      const order = TestBed.inject(OrderFacadeService);
      order.selectSize('grande');
      order.toggleFlavor('tradicional-calabresa');
      order.selectFlavorOption('tradicional-calabresa', 'cebola');
      const fixture = TestBed.createComponent(ExtrasStepComponent);
      fixture.detectChanges();
      expect(text(fixture.nativeElement)).not.toContain('Escreva sua escolha');
    });

    it('resumo da pizza e carrinho mostram o sabor com a opção', async () => {
      await TestBed.configureTestingModule({ imports: [BuilderModule, CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
      const order = TestBed.inject(OrderFacadeService);
      order.selectSize('grande');
      order.toggleFlavor('tradicional-calabresa');
      order.selectFlavorOption('tradicional-calabresa', 'cebola');

      let view!: BuilderView;
      const summary = TestBed.createComponent(PizzaSummaryComponent);
      order.view$.subscribe((v) => (view = v)).unsubscribe();
      summary.componentRef.setInput('view', view);
      summary.detectChanges();
      expect(text(summary.nativeElement)).toContain('Calabresa (com cebola)');

      order.addToCart();
      const items = TestBed.createComponent(CartItemsComponent);
      let cartView!: CartView;
      TestBed.inject(CartFacadeService).view$.subscribe((v) => (cartView = v)).unsubscribe();
      items.componentRef.setInput('view', cartView);
      items.detectChanges();
      expect(text(items.nativeElement)).toContain('Calabresa (com cebola)');
    });

    it('cartão do cardápio mostra as opções do sabor (e nada nos sabores sem opção)', async () => {
      await TestBed.configureTestingModule({ imports: [SharedModule] }).compileComponents();
      const catalog = TestBed.inject(CatalogService);
      const shown = (id: string) => {
        const fixture = TestBed.createComponent(FlavorCardComponent);
        fixture.componentRef.setInput('flavor', catalog.getFlavor(id));
        fixture.componentRef.setInput('compact', true);
        fixture.detectChanges();
        return text(fixture.nativeElement);
      };
      expect(shown('tradicional-calabresa')).toContain('Opção: com cebola ou com catupiry');
      expect(shown('doce-chocolate')).toContain('Opção: ao leite ou branco');
      expect(shown('tradicional-brocolis')).toContain('Opção: com catupiry');
      expect(shown('tradicional-mussarela')).not.toContain('Opção');
      expect(TestBed.inject(MenuFacadeService).optionsText(catalog.getFlavor('tradicional-mussarela')!)).toBe('');
    });
  });
});
