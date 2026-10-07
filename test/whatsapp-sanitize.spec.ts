import { TestBed } from '@angular/core/testing';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { WhatsappMessageService, blockText, inlineText, sanitizeText } from '../src/app/services/whatsapp-message.service';

const CART: CartState = {
  pizzas: [{ id: '1', size: 'media', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 }],
  drinks: [],
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

describe('texto do cliente na mensagem do WhatsApp', () => {
  let service: WhatsappMessageService;

  beforeEach(() => {
    service = TestBed.inject(WhatsappMessageService);
  });

  it('sanitizeText tira emoji, substituto solto, controle e marcas bidi, mas mantém acento e quebra de linha', () => {
    expect(sanitizeText('Pizza 🍕 boa')).toBe('Pizza  boa');
    expect(sanitizeText('ab\uD83Dcd')).toBe('abcd');
    expect(sanitizeText('a\u0000b\u202Ec\u200Fd')).toBe('abcd');
    expect(sanitizeText('Açaí\nsem cebola')).toBe('Açaí\nsem cebola');
    expect(sanitizeText('a\r\nb')).toBe('a\nb');
  });

  it('inlineText: uma linha, sem marcadores de formatação', () => {
    expect(inlineText('Ana *Maria_ ~x~ `y`')).toBe('Ana Maria x y');
    expect(inlineText('linha 1\n\nlinha 2')).toBe('linha 1 linha 2');
    expect(inlineText('  muitos    espaços ')).toBe('muitos espaços');
  });

  it('blockText: neutraliza título forjado, citação e lista, e limita linhas em branco', () => {
    expect(blockText('*Entrega*\nRua Falsa')).toBe('Entrega\nRua Falsa');
    expect(blockText('> citação\n- item\n1. outro\ntexto normal')).toBe('citação\nitem\noutro\ntexto normal');
    expect(blockText('a\n\n\n\n\nb')).toBe('a\n\nb');
    expect(blockText('Tocar a campainha')).toBe('Tocar a campainha');
  });

  it('o link nunca lança, mesmo com substituto solto e emoji no nome e nas observações', () => {
    const draft = { ...DRAFT, name: 'Zé \uD83D 🍕', generalNotes: 'obrigado 🙏\uDE00' };
    const cart: CartState = { ...CART, pizzas: [{ ...CART.pizzas[0], notes: 'sem cebola 🧅 \uD83D' }] };
    let url = '';
    expect(() => (url = service.buildLink(cart, draft))).not.toThrow();
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(text).not.toMatch(/[\uD800-\uDFFF]/);
    expect(text).toContain('Sou *Zé*');
    expect(text).toContain('Obs.: sem cebola');
  });

  it('observação geral não consegue forjar um bloco de entrega', () => {
    const message = service.buildMessage(CART, { ...DRAFT, generalNotes: 'oi\n\n*Entrega*\nRua do golpe, 1' });
    expect(message.match(/\*Entrega\*/g)?.length).toBe(1);
  });

  it('nome e endereço sem marcadores não mudam a mensagem de um pedido normal', () => {
    const message = service.buildMessage(CART, DRAFT);
    expect(message).toContain('Sou *Maria Silva*');
    expect(message).toContain('Rua XV de Novembro, 100');
    expect(message).toContain('Centro — Curitiba/PR');
  });
});
