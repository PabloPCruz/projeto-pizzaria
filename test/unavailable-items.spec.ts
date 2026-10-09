import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { CrustStepComponent } from '../src/app/components/builder/crust-step.component';
import { FlavorsStepComponent } from '../src/app/components/builder/flavors-step.component';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { DrinkPickerComponent } from '../src/app/components/shared/drink-picker.component';
import { FlavorCardComponent } from '../src/app/components/shared/flavor-card.component';
import { SharedModule } from '../src/app/components/shared/shared.module';
import { UNAVAILABLE_ITEMS, UNAVAILABLE_ITEM_IDS } from '../src/app/data/availability';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { CatalogService } from '../src/app/services/catalog.service';
import { EMPTY_CHECKOUT } from '../src/app/services/checkout-draft.service';
import { CheckoutValidationService } from '../src/app/services/checkout-validation.service';
import { SizeRulesService } from '../src/app/services/size-rules.service';

const OUT = ['tradicional-calabresa', 'nutella', 'fanta-2l'];
const withOut = (ids: readonly string[] = OUT) => ({ provide: UNAVAILABLE_ITEMS, useValue: ids });
const text = (node: Element | null | undefined) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
const rowWith = (el: HTMLElement, selector: string, label: string) =>
  Array.from(el.querySelectorAll<HTMLElement>(selector)).find((n) => text(n).includes(label))!;

describe('Item esgotado hoje', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  describe('configuração', () => {
    it('por padrão nada está esgotado (a loja edita a lista em data/availability.ts e publica)', () => {
      expect(UNAVAILABLE_ITEM_IDS.length).toBe(0);
      const catalog = TestBed.inject(CatalogService);
      expect(catalog.isAvailable('tradicional-calabresa')).toBeTrue();
      expect(catalog.isAvailable('nutella')).toBeTrue();
      expect(catalog.isAvailable('fanta-2l')).toBeTrue();
    });

    it('todo id esgotado precisa existir no cardápio (erro de digitação não passa batido)', () => {
      const catalog = TestBed.inject(CatalogService);
      for (const id of UNAVAILABLE_ITEM_IDS) {
        const known = catalog.getFlavor(id) || catalog.getCrust(id) || catalog.getDrink(id);
        expect(known).withContext(id).toBeTruthy();
      }
    });

    it('com a lista preenchida, sabor, borda e bebida ficam indisponíveis e o resto não', () => {
      TestBed.configureTestingModule({ providers: [withOut()] });
      const catalog = TestBed.inject(CatalogService);
      expect(catalog.isAvailable('tradicional-calabresa')).toBeFalse();
      expect(catalog.isAvailable('nutella')).toBeFalse();
      expect(catalog.isAvailable('fanta-2l')).toBeFalse();
      expect(catalog.isAvailable('tradicional-mussarela')).toBeTrue();
      expect(catalog.isAvailable('cheddar')).toBeTrue();
    });
  });

  describe('regras', () => {
    beforeEach(() => TestBed.configureTestingModule({ providers: [withOut()] }));

    it('pizza com sabor esgotado não é válida e diz qual', () => {
      const rules = TestBed.inject(SizeRulesService);
      const result = rules.validate('media', ['tradicional-calabresa', 'tradicional-mussarela']);
      expect(result.valid).toBeFalse();
      expect(result.error).toContain('Calabresa');
      expect(result.error).toContain('não está disponível hoje');
      expect(rules.validate('media', ['tradicional-mussarela']).valid).toBeTrue();
    });

    it('não dá para adicionar ao carrinho a pizza com sabor esgotado', () => {
      const order = TestBed.inject(OrderFacadeService);
      order.selectSize('media');
      order.toggleFlavor('tradicional-calabresa');
      expect(order.addToCart()).toBeFalse();
      expect(TestBed.inject(CartService).snapshot.pizzas.length).toBe(0);
    });

    describe('envio do pedido', () => {
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
      const cart = (over: Partial<CartState>): CartState => ({ pizzas: [], drinks: [], ...over });
      const pizza = (flavorIds: string[], crustId: string | null = null) => ({ id: '1', size: 'media' as const, flavorIds, crustId, notes: '', quantity: 1 });

      it('carrinho restaurado com sabor, borda ou bebida esgotados bloqueia o envio e lista o que falta', () => {
        const v = TestBed.inject(CheckoutValidationService);
        const errors = v.validate(
          cart({ pizzas: [pizza(['tradicional-calabresa'], 'nutella')], drinks: [{ id: '2', drinkId: 'fanta-2l', quantity: 1 }] }),
          draft
        );
        expect(v.isValid(errors)).toBeFalse();
        expect(errors.cart).toContain('Hoje não temos');
        expect(errors.cart).toContain('Calabresa');
        expect(errors.cart).toContain('Nutella');
        expect(errors.cart).toContain('Fanta 2L');
      });

      it('carrinho só com itens disponíveis envia normalmente', () => {
        const v = TestBed.inject(CheckoutValidationService);
        expect(v.isValid(v.validate(cart({ pizzas: [pizza(['tradicional-mussarela'], 'cheddar')] }), draft))).toBeTrue();
      });
    });
  });

  describe('telas', () => {
    it('lista de sabores do montador: o esgotado fica desabilitado e marcado "Indisponível hoje"', async () => {
      await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule], providers: [withOut()] }).compileComponents();
      TestBed.inject(OrderFacadeService).selectSize('media');
      const fixture = TestBed.createComponent(FlavorsStepComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;

      const calabresa = el.querySelector<HTMLInputElement>('#flavor-tradicional-calabresa')!;
      expect(calabresa.disabled).toBeTrue();
      expect(text(calabresa.closest('label'))).toContain('Indisponível hoje');
      const mussarela = el.querySelector<HTMLInputElement>('#flavor-tradicional-mussarela')!;
      expect(mussarela.disabled).toBeFalse();
      expect(text(mussarela.closest('label'))).not.toContain('Indisponível');
    });

    it('cartão de sabor do cardápio mostra "Indisponível hoje" só no esgotado', async () => {
      await TestBed.configureTestingModule({ imports: [SharedModule], providers: [withOut()] }).compileComponents();
      const catalog = TestBed.inject(CatalogService);
      const make = (id: string) => {
        const fixture = TestBed.createComponent(FlavorCardComponent);
        fixture.componentRef.setInput('flavor', catalog.getFlavor(id));
        fixture.componentRef.setInput('compact', true);
        fixture.detectChanges();
        return text(fixture.nativeElement);
      };
      expect(make('tradicional-calabresa')).toContain('Indisponível hoje');
      expect(make('tradicional-mussarela')).not.toContain('Indisponível hoje');
    });

    it('passo da borda: a borda esgotada fica desabilitada e marcada', async () => {
      await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule], providers: [withOut()] }).compileComponents();
      TestBed.inject(OrderFacadeService).selectSize('grande');
      const fixture = TestBed.createComponent(CrustStepComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const nutella = el.querySelector<HTMLInputElement>('#crust-nutella')!;
      expect(nutella.disabled).toBeTrue();
      expect(text(nutella.closest('label'))).toContain('Indisponível hoje');
      expect(el.querySelector<HTMLInputElement>('#crust-cheddar')!.disabled).toBeFalse();
    });

    it('seletor de bebidas: a esgotada não tem "Adicionar" e mostra o motivo', async () => {
      await TestBed.configureTestingModule({ imports: [SharedModule, HttpClientTestingModule], providers: [withOut()] }).compileComponents();
      const fixture = TestBed.createComponent(DrinkPickerComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const fanta = rowWith(el, 'li', 'Fanta 2L');
      expect(fanta.querySelector('button[aria-label^="Adicionar"]')).toBeNull();
      expect(text(fanta)).toContain('Indisponível hoje');
      expect(rowWith(el, 'li', 'Coca-Cola 2L').querySelector('button[aria-label^="Adicionar"]')).toBeTruthy();
    });

    it('carrinho com item esgotado: ao tentar enviar aparece o aviso e nada abre', async () => {
      await TestBed.configureTestingModule({
        imports: [CartModule, RouterTestingModule, HttpClientTestingModule],
        providers: [withOut()],
      }).compileComponents();
      TestBed.inject(CartService).restore({
        pizzas: [{ id: '1', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 }],
        drinks: [],
      });
      const fixture = TestBed.createComponent(CartPageComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const open = spyOn(window, 'open');
      el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
      fixture.detectChanges();
      expect(open).not.toHaveBeenCalled();
      expect(text(el.querySelector('#checkout-errors'))).toContain('Hoje não temos: Calabresa');
    });
  });
});
