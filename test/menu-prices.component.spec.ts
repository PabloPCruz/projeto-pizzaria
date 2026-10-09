import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { CrustStepComponent } from '../src/app/components/builder/crust-step.component';
import { SizeStepComponent } from '../src/app/components/builder/size-step.component';
import { DrinkPickerComponent } from '../src/app/components/shared/drink-picker.component';
import { MenuExtrasComponent } from '../src/app/components/menu/menu-extras.component';
import { MenuModule } from '../src/app/components/menu/menu.module';
import { MenuSizesComponent } from '../src/app/components/menu/menu-sizes.component';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { WhatsappMessageService } from '../src/app/services/whatsapp-message.service';

const NOTICE = 'Pizza com sabor especial: vale o valor dos especiais para a pizza inteira';

/** Texto da tela com espaços normais (o Intl usa espaço sem quebra entre "R$" e o valor). */
const text = (node: Element | null | undefined): string =>
  (node?.textContent ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

const rowWith = (el: HTMLElement, selector: string, label: string): HTMLElement =>
  Array.from(el.querySelectorAll<HTMLElement>(selector)).find((n) => text(n).includes(label))!;

describe('Preços informativos no cardápio', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [MenuModule, BuilderModule, RouterTestingModule] }).compileComponents();
  });
  afterEach(() => localStorage.clear());

  describe('tabela de tamanhos', () => {
    let el: HTMLElement;
    beforeEach(() => {
      const fixture = TestBed.createComponent(MenuSizesComponent);
      fixture.detectChanges();
      el = fixture.nativeElement;
    });

    it('mostra fatias, sabores e os valores de tradicionais e especiais de cada tamanho', () => {
      const expected: [string, string, string, string, string][] = [
        ['Pequena', '4 fatias', '1 sabor', 'R$ 34,90', 'R$ 38,90'],
        ['Média', '6 fatias', '2 sabores', 'R$ 39,90', 'R$ 48,90'],
        ['Grande', '8 fatias', '3 sabores', 'R$ 49,90', 'R$ 62,90'],
        ['Big', '12 fatias', '3 sabores', 'R$ 57,90', 'R$ 67,90'],
        ['Gigante', '16 fatias', '4 sabores', 'R$ 64,90', 'R$ 74,90'],
      ];
      for (const [name, slices, flavors, traditional, special] of expected) {
        const row = rowWith(el, 'tbody tr', name);
        const cells = Array.from(row.querySelectorAll('td, th')).map((c) => text(c));
        expect(cells.join(' | ')).withContext(name).toContain(slices);
        expect(cells.join(' | ')).withContext(name).toContain(flavors);
        expect(cells).withContext(name).toContain(traditional);
        expect(cells).withContext(name).toContain(special);
      }
    });

    it('colunas com nome claro e o aviso de que o sabor especial vale para a pizza inteira', () => {
      const headers = Array.from(el.querySelectorAll('thead th')).map((h) => text(h));
      expect(headers.join(' ')).toContain('Tradicionais');
      expect(headers.join(' ')).toContain('Especiais');
      expect(text(el)).toContain(NOTICE);
    });

    it('explica que doces seguem o valor dos tradicionais e que o total é confirmado pela loja', () => {
      expect(text(el)).toContain('doces');
      expect(text(el)).not.toContain('Os valores são confirmados pelo WhatsApp');
      expect(text(el)).toContain('confirmados pela loja');
    });
  });

  describe('bordas e bebidas no cardápio', () => {
    let el: HTMLElement;
    beforeEach(() => {
      const fixture = TestBed.createComponent(MenuExtrasComponent);
      fixture.detectChanges();
      el = fixture.nativeElement;
    });

    it('cada borda mostra a faixa de valor; sem preço informado não mostra nada', () => {
      expect(text(rowWith(el, '#bordas-title ~ ul li', 'Catupiry'))).toContain('R$ 11,00 a R$ 13,00');
      expect(text(rowWith(el, '#bordas-title ~ ul li', 'Nutella'))).toContain('R$ 12,00 a R$ 15,00');
      expect(text(rowWith(el, '#bordas-title ~ ul li', 'Catupiry com Cheddar'))).toContain('R$ 12,00 a R$ 15,00');
      expect(text(el.querySelector('#bordas-title')!.parentElement)).toContain('varia conforme o tamanho');
    });

    it('cada bebida mostra o valor; sem preço informado não mostra nada', () => {
      expect(text(rowWith(el, '#bebidas-title ~ ul li', 'Coca-Cola 2L'))).toContain('R$ 14,00');
      expect(text(rowWith(el, '#bebidas-title ~ ul li', 'Fanta 2L'))).toContain('R$ 13,00');
      expect(text(rowWith(el, '#bebidas-title ~ ul li', 'Cerveja Brahma lata'))).toContain('R$ 4,50');
      expect(text(rowWith(el, '#bebidas-title ~ ul li', 'Coca-Cola Zero 2L'))).toContain('R$ 14,00');
      expect(text(rowWith(el, '#bebidas-title ~ ul li', 'Coca-Cola 600ml'))).toContain('R$ 8,00');
      expect(text(rowWith(el, '#bebidas-title ~ ul li', 'Coca-Cola lata'))).toContain('R$ 6,00');
      expect(text(rowWith(el, '#bebidas-title ~ ul li', 'Kuat 1,5L'))).toContain('R$ 10,00');
    });
  });

  describe('montador: passo do tamanho', () => {
    it('cada tamanho mostra os valores e o aviso do sabor especial aparece uma vez', () => {
      const fixture = TestBed.createComponent(SizeStepComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const pequena = text(rowWith(el, 'label.choice', 'Pequena'));
      expect(pequena).toContain('4 fatias');
      expect(pequena).toContain('Tradicional R$ 34,90');
      expect(pequena).toContain('Especial R$ 38,90');
      expect(text(rowWith(el, 'label.choice', 'Gigante'))).toContain('Especial R$ 74,90');
      expect(text(el).split(NOTICE).length - 1).toBe(1);
    });

    it('escolher o tamanho continua funcionando como antes', () => {
      const fixture = TestBed.createComponent(SizeStepComponent);
      fixture.detectChanges();
      const order = TestBed.inject(OrderFacadeService);
      const radio = fixture.nativeElement.querySelector('#size-media') as HTMLInputElement;
      radio.click();
      fixture.detectChanges();
      let size = null as string | null;
      order.view$.subscribe((v) => (size = v.draft.size)).unsubscribe();
      expect(size).toBe('media');
    });
  });

  describe('montador: passo da borda', () => {
    let fixture: ComponentFixture<CrustStepComponent>;
    let el: HTMLElement;
    const create = (size: 'pequena' | 'grande' | 'gigante') => {
      TestBed.inject(OrderFacadeService).selectSize(size);
      fixture = TestBed.createComponent(CrustStepComponent);
      fixture.detectChanges();
      el = fixture.nativeElement;
    };

    it('mostra o valor da borda do tamanho escolhido', () => {
      create('grande');
      expect(text(rowWith(el, 'label.choice', 'Catupiry'))).toContain('R$ 12,00');
      expect(text(rowWith(el, 'label.choice', 'Nutella'))).toContain('R$ 13,00');
    });

    it('o valor muda com o tamanho', () => {
      create('gigante');
      expect(text(rowWith(el, 'label.choice', 'Catupiry'))).toContain('R$ 13,00');
      expect(text(rowWith(el, 'label.choice', 'Nutella'))).toContain('R$ 15,00');
    });

    it('sem borda não mostra valor; catupiry com cheddar tem o valor das demais bordas', () => {
      create('grande');
      expect(text(rowWith(el, 'label.choice', 'Sem borda recheada'))).not.toContain('R$');
      expect(text(rowWith(el, 'label.choice', 'Catupiry com Cheddar'))).toContain('R$ 13,00');
    });

    it('selecionar uma borda continua gravando no pedido', () => {
      create('grande');
      const order = TestBed.inject(OrderFacadeService);
      (el.querySelector('#crust-nutella') as HTMLInputElement).click();
      fixture.detectChanges();
      let crust = null as string | null;
      order.view$.subscribe((v) => (crust = v.draft.crustId)).unsubscribe();
      expect(crust).toBe('nutella');
    });
  });

  describe('seletor de bebidas', () => {
    it('mostra o valor de cada bebida, sem esconder o botão de adicionar', () => {
      const fixture = TestBed.createComponent(DrinkPickerComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const coca = rowWith(el, 'li', 'Coca-Cola 2L');
      expect(text(coca)).toContain('R$ 14,00');
      expect(coca.querySelector('button[aria-label^="Adicionar"]')).toBeTruthy();
      expect(text(rowWith(el, 'li', 'Kuat 1,5L'))).toContain('R$ 10,00');
    });
  });

  describe('somente informativo: o pedido não muda', () => {
    const CART: CartState = {
      pizzas: [
        { id: '1', size: 'grande', flavorIds: ['especial-poderosa'], crustId: 'catupiry', notes: '', quantity: 1 },
      ],
      drinks: [{ id: '2', drinkId: 'coca-2l', quantity: 1 }],
    };
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

    it('a mensagem do WhatsApp não leva nenhum valor em reais', () => {
      const message = TestBed.inject(WhatsappMessageService).buildMessage(CART, DRAFT);
      expect(message).not.toContain('R$');
      expect(message).not.toContain('Valor:');
      expect(message).not.toContain('Total dos itens');
      expect(message).toContain('Aguardo a confirmação do valor total e da taxa de entrega');
    });
  });
});
