import { TestBed } from '@angular/core/testing';
import { PRICE_TABLE } from '../src/app/data/prices';
import { STORE_INFO } from '../src/app/data/store-info';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { PriceTable } from '../src/app/interfaces/pizza-menu.interface';
import { WhatsappMessageService } from '../src/app/services/whatsapp-message.service';

const CART: CartState = {
  pizzas: [
    {
      id: '1',
      size: 'grande',
      flavorIds: ['tradicional-calabresa', 'especial-atum', 'doce-banana'],
      crustId: 'catupiry',
      notes: 'sem cebola',
      quantity: 2,
    },
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
  complement: 'ap 12',
  neighborhood: 'Centro',
  city: 'Curitiba',
  state: 'PR',
  payment: 'dinheiro',
  changeFor: '100',
  generalNotes: 'Tocar a campainha',
};

/** Pedido típico: 2 pizzas médias (uma delas com borda), 1 bebida, dinheiro com troco. */
const TYPICAL_CART: CartState = {
  pizzas: [
    {
      id: '1',
      size: 'media',
      flavorIds: ['doce-banana', 'doce-choconana'],
      crustId: 'chocolate-ao-leite-branco',
      notes: '',
      quantity: 1,
    },
    {
      id: '2',
      size: 'media',
      flavorIds: ['tradicional-frango-com-cheddar', 'tradicional-frango-catupiry'],
      crustId: 'chocolate-ao-leite',
      notes: '',
      quantity: 1,
    },
  ],
  drinks: [{ id: '3', drinkId: 'coca-2l', quantity: 2 }],
};

const TYPICAL_DRAFT: CheckoutDraft = {
  name: 'Pablo Pereira',
  phone: '41998853289',
  manualAddress: false,
  cep: '82015290',
  street: 'Rua Luiz Braille',
  number: '135',
  complement: 'Casa',
  neighborhood: 'São Braz',
  city: 'Curitiba',
  state: 'PR',
  payment: 'dinheiro',
  changeFor: '100',
  generalNotes: '',
};

const PRICES: PriceTable = {
  pizza: {
    grande: { tradicional: 50, especial: 60, doce: 55 },
    media: { tradicional: 40, doce: 45 },
  },
  crust: { catupiry: 8, 'chocolate-ao-leite': 6, 'chocolate-ao-leite-branco': 7 },
  drink: { 'coca-2l': 14 },
};

function hasAstralChars(text: string): boolean {
  return Array.from(text).some((ch) => ch.codePointAt(0)! > 0xffff);
}

describe('WhatsappMessageService', () => {
  describe('sem preços cadastrados', () => {
    let service: WhatsappMessageService;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      service = TestBed.inject(WhatsappMessageService);
    });

    it('inclui itens, endereço, contato, pagamento e observações', () => {
      const msg = service.buildMessage(CART, DRAFT);
      expect(msg).toContain('*Maria Silva*');
      expect(msg).toContain('*1. Pizza Grande* · 8 fatias · 2x');
      expect(msg).toContain('Sabores: Calabresa, Atum e Banana');
      expect(msg).toContain('Borda: Catupiry');
      expect(msg).toContain('Obs.: sem cebola');
      expect(msg).toContain('*2. Coca-Cola 2L*');
      expect(msg).toContain('Rua XV de Novembro, 100 — ap 12');
      expect(msg).toContain('Centro — Curitiba/PR');
      expect(msg).toContain('CEP 80010-000');
      expect(msg).toContain('Contato: (41) 99999-1234');
      expect(msg).toMatch(/Dinheiro · troco para R\$ 100,00/);
      expect(msg).toContain('*Observações*\nTocar a campainha');
    });

    it('não usa emojis nem qualquer caractere acima de U+FFFF em vários cenários', () => {
      const cenarios: [CartState, CheckoutDraft][] = [
        [CART, DRAFT],
        [TYPICAL_CART, TYPICAL_DRAFT],
        [CART, { ...DRAFT, payment: 'pix', changeFor: '', generalNotes: '' }],
        [CART, { ...DRAFT, payment: 'cartao', complement: '' }],
        [{ pizzas: [], drinks: CART.drinks }, DRAFT],
      ];
      for (const [cart, draft] of cenarios) {
        expect(hasAstralChars(service.buildMessage(cart, draft))).toBeFalse();
      }
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: PRICE_TABLE, useValue: PRICES }] });
      const priced = TestBed.inject(WhatsappMessageService);
      expect(hasAstralChars(priced.buildMessage(TYPICAL_CART, TYPICAL_DRAFT))).toBeFalse();
    });

    it('fala em primeira pessoa e pede a confirmação da taxa de entrega', () => {
      const msg = service.buildMessage(CART, DRAFT);
      expect(msg.startsWith(`Olá, ${STORE_INFO.name}! Sou *Maria Silva* e gostaria de fazer um pedido:`)).toBeTrue();
      expect(msg).toContain('taxa de entrega');
      expect(msg).toContain('Aguardo a confirmação');
      expect(msg).not.toContain('calculada e informada pela loja');
    });

    it('sem preços não mostra valores em reais nem "confirmado pela loja"', () => {
      // sem troco informado, o único "R$" possível viria de preços dos itens
      const msg = service.buildMessage(CART, { ...DRAFT, changeFor: '' });
      expect(msg).not.toContain('R$');
      expect(msg).not.toContain('Total dos itens');
      expect(msg).not.toContain('Valor:');
      expect(msg).not.toMatch(/confirmad[oa] pela loja/);
      expect(msg).toContain('valor total e da taxa de entrega');
    });

    it('com troco informado, o único R$ da mensagem é o do troco', () => {
      const msg = service.buildMessage(CART, DRAFT);
      const matches = msg.match(/R\$/g) ?? [];
      expect(matches.length).toBe(1);
      expect(msg).toContain('troco para R$ 100,00');
    });

    it('gera link wa.me para o número da loja com a mensagem codificada', () => {
      const url = service.buildLink(CART, DRAFT);
      expect(url.startsWith(`https://wa.me/${STORE_INFO.whatsappNumber}?text=`)).toBeTrue();
      const text = decodeURIComponent(url.split('?text=')[1]);
      expect(text).toBe(service.buildMessage(CART, DRAFT));
    });

    it('sem borda a linha de borda é omitida; pagamento por Pix', () => {
      const cart: CartState = { ...CART, pizzas: [{ ...CART.pizzas[0], crustId: null, notes: '' }] };
      const msg = service.buildMessage(cart, { ...DRAFT, payment: 'pix', changeFor: '', generalNotes: '' });
      expect(msg).not.toContain('Borda');
      expect(msg).not.toContain('Sem borda');
      expect(msg).not.toContain('Obs.:');
      expect(msg).toContain('*Pagamento*\nPix');
      expect(msg).not.toContain('*Observações*');
    });

    it('complemento só aparece quando existe', () => {
      const msg = service.buildMessage(CART, { ...DRAFT, complement: '  ' });
      expect(msg).toContain('Rua XV de Novembro, 100\n');
      expect(msg).not.toContain('Rua XV de Novembro, 100 —');
    });

    it('quantidade só aparece quando maior que 1; bebidas e quantidades', () => {
      const cart: CartState = {
        pizzas: [{ ...CART.pizzas[0], quantity: 1 }],
        drinks: [
          { id: 'd1', drinkId: 'coca-2l', quantity: 3 },
          { id: 'd2', drinkId: 'guarana-2l', quantity: 1 },
        ],
      };
      const msg = service.buildMessage(cart, DRAFT);
      expect(msg).toContain('*1. Pizza Grande* · 8 fatias\n');
      expect(msg).toContain('*2. Coca-Cola 2L* · 3x');
      expect(msg).toContain('*3. Guaraná 2L*\n');
      expect(msg).not.toContain('Guaraná 2L* · 1x');
    });

    it('observações com quebra de linha ficam em uma linha só', () => {
      const cart: CartState = { ...CART, pizzas: [{ ...CART.pizzas[0], notes: 'sem cebola\n\nbem passada' }] };
      const msg = service.buildMessage(cart, DRAFT);
      expect(msg).toContain('Obs.: sem cebola / bem passada');
    });

    it('caracteres especiais (& # + % acentos) sobrevivem ao link', () => {
      const draft = { ...DRAFT, name: 'Zé & João #1 +50% ç', generalNotes: 'Tocar 2x "interfone" 100% ✓' };
      const url = service.buildLink(CART, draft);
      const query = url.split('?text=')[1];
      expect(query).not.toMatch(/[&# +]/); // nada cru que corte ou altere o parâmetro
      const text = decodeURIComponent(query);
      expect(text).toContain('Zé & João #1 +50% ç');
      expect(text).toContain('Tocar 2x "interfone" 100% ✓');
    });

    it('troco de mil reais escrito "1.000" vira R$ 1.000,00, nunca R$ 1,00', () => {
      const msg = service.buildMessage(CART, { ...DRAFT, changeFor: '1.000' });
      expect(msg).toContain('troco para R$ 1.000,00');
    });

    it('dinheiro sem troco informado, dito pelo cliente', () => {
      const msg = service.buildMessage(CART, { ...DRAFT, changeFor: '' });
      expect(msg).toContain('Dinheiro · não preciso de troco');
    });

    it('snapshot: pedido típico sem preços (duas pizzas, uma bebida, dinheiro com troco)', () => {
      expect(service.buildMessage(TYPICAL_CART, TYPICAL_DRAFT)).toBe(
        [
          'Olá, Disk Pizza! Sou *Pablo Pereira* e gostaria de fazer um pedido:',
          '',
          '*1. Pizza Média* · 6 fatias',
          'Sabores: Banana e Choconana',
          'Borda: Chocolate ao Leite com Chocolate Branco',
          '',
          '*2. Pizza Média* · 6 fatias',
          'Sabores: Frango com Cheddar e Frango Catupiry',
          'Borda: Chocolate ao Leite',
          '',
          '*3. Coca-Cola 2L* · 2x',
          '',
          '*Entrega*',
          'Rua Luiz Braille, 135 — Casa',
          'São Braz — Curitiba/PR',
          'CEP 82015-290',
          'Contato: (41) 99885-3289',
          '',
          '*Pagamento*',
          'Dinheiro · troco para R$ 100,00',
          '',
          'Aguardo a confirmação do valor total e da taxa de entrega. Obrigado!',
        ].join('\n')
      );
    });
  });

  describe('com preços cadastrados', () => {
    let service: WhatsappMessageService;

    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [{ provide: PRICE_TABLE, useValue: PRICES }] });
      service = TestBed.inject(WhatsappMessageService);
    });

    it('mostra valores por item e o total dos itens, avisando que a entrega não está inclusa', () => {
      const msg = service.buildMessage(CART, DRAFT);
      expect(msg).toContain('Valor: R$ 136,00'); // 2 x (60 + 8)
      expect(msg).toContain('Valor: R$ 14,00');
      expect(msg).toContain('*Total dos itens:* R$ 150,00 (entrega não inclusa)'); // 136 + 14
      expect(msg).toContain('taxa de entrega');
      expect(msg).not.toMatch(/confirmad[oa] pela loja/);
      expect(hasAstralChars(msg)).toBeFalse();
    });

    it('não usa espaço sem quebra nos valores', () => {
      expect(service.buildMessage(CART, DRAFT)).not.toContain(' ');
    });

    it('snapshot: pedido típico com preços fictícios', () => {
      expect(service.buildMessage(TYPICAL_CART, TYPICAL_DRAFT)).toBe(
        [
          'Olá, Disk Pizza! Sou *Pablo Pereira* e gostaria de fazer um pedido:',
          '',
          '*1. Pizza Média* · 6 fatias',
          'Sabores: Banana e Choconana',
          'Borda: Chocolate ao Leite com Chocolate Branco',
          'Valor: R$ 52,00',
          '',
          '*2. Pizza Média* · 6 fatias',
          'Sabores: Frango com Cheddar e Frango Catupiry',
          'Borda: Chocolate ao Leite',
          'Valor: R$ 46,00',
          '',
          '*3. Coca-Cola 2L* · 2x',
          'Valor: R$ 28,00',
          '',
          '*Total dos itens:* R$ 126,00 (entrega não inclusa)',
          '',
          '*Entrega*',
          'Rua Luiz Braille, 135 — Casa',
          'São Braz — Curitiba/PR',
          'CEP 82015-290',
          'Contato: (41) 99885-3289',
          '',
          '*Pagamento*',
          'Dinheiro · troco para R$ 100,00',
          '',
          'Aguardo a confirmação da taxa de entrega e do valor final. Obrigado!',
        ].join('\n')
      );
    });
  });
});
