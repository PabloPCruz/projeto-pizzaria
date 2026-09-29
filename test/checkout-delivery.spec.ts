import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { STORE_INFO } from '../src/app/data/store-info';
import { CartState, CheckoutDraft } from '../src/app/interfaces/cart.interface';
import { CartService } from '../src/app/services/cart.service';
import { EMPTY_CHECKOUT } from '../src/app/services/checkout-draft.service';
import { DELIVERY_FEE_NOTICE, WhatsappMessageService } from '../src/app/services/whatsapp-message.service';

const STORE = STORE_INFO.freeDelivery.origin;
const north = (km: number) => ({ lat: String(STORE.lat + km / 111.195), lng: String(STORE.lng) });
const viacep = (cep: string) => `https://viacep.com.br/ws/${cep}/json/`;
const awesome = (cep: string) => `https://cep.awesomeapi.com.br/json/${cep}`;
const VIACEP_OK = { logradouro: 'Rua Luiz Braille', bairro: 'São Braz', localidade: 'Curitiba', uf: 'PR' };

describe('Entrega grátis (checkout)', () => {
  let facade: CheckoutFacadeService;
  let http: HttpTestingController;

  function lookup(cep: string, coords: { lat: string; lng: string } | null): void {
    facade.setCep(cep);
    facade.lookupCep().subscribe();
    http.expectOne(viacep(cep.replace(/\D/g, ''))).flush(VIACEP_OK);
    if (coords) http.expectOne(awesome(cep.replace(/\D/g, ''))).flush(coords);
  }

  function fillValidOrder(): void {
    TestBed.inject(CartService).addPizza({
      size: 'media',
      flavorIds: ['tradicional-calabresa'],
      crustId: null,
      notes: '',
      quantity: 1,
    });
    facade.update({ name: 'Maria', number: '10', payment: 'pix' });
    facade.setPhone('41999998888');
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    facade = TestBed.inject(CheckoutFacadeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('começa sem zona definida (mensagem padrão)', () => {
    expect(facade.zone).toEqual({ status: 'unknown' });
  });

  it('CEP encontrado a até 3 km: a zona vira "free"', () => {
    lookup('82015-290', north(2));
    expect(facade.zone.status).toBe('free');
  });

  it('CEP encontrado a mais de 3 km: a zona vira "outside"', () => {
    lookup('80010-000', north(7));
    expect(facade.zone.status).toBe('outside');
  });

  it('a zona é publicada em zone$', (done) => {
    lookup('82015-290', north(1));
    facade.zone$.subscribe((zone) => {
      expect(zone.status).toBe('free');
      done();
    });
  });

  it('CEP inexistente em todas as fontes: continua sem zona (mensagem padrão)', () => {
    facade.setCep('00000000');
    facade.lookupCep().subscribe();
    http.expectOne(viacep('00000000')).flush({ erro: true });
    http.expectOne(awesome('00000000')).flush({ code: 'not_found' }, { status: 404, statusText: 'Not Found' });
    expect(facade.zone.status).toBe('unknown');
  });

  it('CEP que o ViaCEP não conhece, mas a localização conhece: também recebe a entrega grátis', () => {
    facade.setCep('82030000');
    facade.lookupCep().subscribe();
    http.expectOne(viacep('82030000')).flush({ erro: true });
    http.expectOne(awesome('82030000')).flush(north(2.8));
    expect(facade.zone.status).toBe('free');
  });

  it('falha de rede no ViaCEP não impede a consulta da distância', () => {
    facade.setCep('82030000');
    facade.lookupCep().subscribe();
    http.expectOne(viacep('82030000')).error(new ProgressEvent('error'));
    http.expectOne(awesome('82030000')).flush(north(1));
    expect(facade.zone.status).toBe('free');
  });

  it('CEP com menos de 8 dígitos não consulta nada', () => {
    facade.setCep('8203');
    facade.lookupCep().subscribe();
    http.expectNone(() => true);
    expect(facade.zone.status).toBe('unknown');
  });

  it('editar o CEP zera a zona na hora (nunca vale a zona do CEP antigo)', () => {
    lookup('82015-290', north(1));
    expect(facade.zone.status).toBe('free');
    facade.setCep('8201529');
    expect(facade.zone.status).toBe('unknown');
  });

  it('resposta atrasada de um CEP antigo não sobrescreve a zona depois que o CEP mudou', () => {
    facade.setCep('82015290');
    facade.lookupCep().subscribe();
    http.expectOne(viacep('82015290')).flush(VIACEP_OK);
    const pending = http.expectOne(awesome('82015290'));

    facade.setCep('8001000'); // cliente apagou um dígito enquanto a consulta estava em andamento

    expect(pending.cancelled).withContext('a consulta antiga é cancelada').toBeTrue();
    expect(facade.zone.status).toBe('unknown');
  });

  it('falha na localização mantém a zona desconhecida (nunca afirma grátis)', () => {
    facade.setCep('82015290');
    facade.lookupCep().subscribe();
    http.expectOne(viacep('82015290')).flush(VIACEP_OK);
    http.expectOne(awesome('82015290')).error(new ProgressEvent('error'));
    http.expectOne((r) => r.url === 'https://nominatim.openstreetmap.org/search').error(new ProgressEvent('error'));
    expect(facade.zone.status).toBe('unknown');
  });

  describe('link do WhatsApp', () => {
    const decode = (url: string) => decodeURIComponent(url.split('?text=')[1]);

    it('endereço na área grátis: a mensagem informa entrega grátis e não pede a taxa', () => {
      fillValidOrder();
      lookup('82015-290', north(2));
      const result = facade.submit();
      expect(result.ok).toBeTrue();
      if (!result.ok) return;
      const msg = decode(result.url);
      expect(msg).toContain('Entrega grátis (até 3 km da loja)');
      expect(msg).not.toContain('taxa de entrega');
    });

    it('endereço fora da área: mensagem padrão, pedindo a confirmação da taxa', () => {
      fillValidOrder();
      lookup('80010-000', north(7));
      const result = facade.submit();
      expect(result.ok).toBeTrue();
      if (!result.ok) return;
      const msg = decode(result.url);
      expect(msg).toContain('taxa de entrega');
      expect(msg).not.toContain('Entrega grátis');
    });

    it('sem zona definida: mensagem padrão', () => {
      fillValidOrder();
      facade.setCep('82015290');
      facade.update({ street: 'Rua A', neighborhood: 'Centro', city: 'Curitiba', state: 'PR' });
      const result = facade.submit();
      expect(result.ok).toBeTrue();
      if (!result.ok) return;
      expect(decode(result.url)).not.toContain('Entrega grátis');
    });

    it('a zona só vale para o CEP consultado: trocar o CEP depois de "free" volta ao padrão', () => {
      fillValidOrder();
      lookup('82015-290', north(2));
      facade.setCep('80010000');
      facade.update({ street: 'Rua B', neighborhood: 'Centro', city: 'Curitiba', state: 'PR' });
      const result = facade.submit();
      expect(result.ok).toBeTrue();
      if (!result.ok) return;
      expect(decode(result.url)).not.toContain('Entrega grátis');
    });
  });

  it('CEP completo salvo de uma visita anterior recalcula a zona ao abrir o checkout', () => {
    localStorage.setItem('disk-pizza:v2:checkout', JSON.stringify({ ...EMPTY_CHECKOUT, cep: '82015-290', city: 'Curitiba', street: 'Rua Luiz Braille' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    http = TestBed.inject(HttpTestingController);
    facade = TestBed.inject(CheckoutFacadeService);
    http.expectOne(awesome('82015290')).flush(north(1));
    expect(facade.zone.status).toBe('free');
  });
});

describe('WhatsappMessageService com entrega grátis', () => {
  const CART: CartState = {
    pizzas: [{ id: '1', size: 'grande', flavorIds: ['tradicional-calabresa'], crustId: null, notes: '', quantity: 1 }],
    drinks: [],
  };
  const DRAFT: CheckoutDraft = {
    ...EMPTY_CHECKOUT,
    name: 'Maria Silva',
    phone: '(41) 99999-1234',
    cep: '82015-290',
    street: 'Rua Luiz Braille',
    number: '200',
    neighborhood: 'São Braz',
    city: 'Curitiba',
    state: 'PR',
    payment: 'pix',
  };
  let service: WhatsappMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WhatsappMessageService);
  });

  it('sem a opção, a mensagem continua a padrão (com a taxa a confirmar)', () => {
    const msg = service.buildMessage(CART, DRAFT);
    expect(msg).toContain('Aguardo a confirmação do valor total e da taxa de entrega. Obrigado!');
    expect(msg).not.toContain('grátis');
  });

  it('com entrega grátis: linha no bloco de entrega e fecho sem pedir taxa', () => {
    const msg = service.buildMessage(CART, DRAFT, { freeDelivery: true });
    expect(msg).toContain('CEP 82015-290\nContato: (41) 99999-1234\nEntrega grátis (até 3 km da loja)');
    expect(msg.endsWith('Aguardo a confirmação do valor total. Obrigado!')).toBeTrue();
    expect(msg).not.toContain('taxa de entrega');
  });

  it('a mensagem de entrega grátis não usa emojis nem caracteres acima de U+FFFF', () => {
    const msg = service.buildMessage(CART, DRAFT, { freeDelivery: true });
    expect([...msg].every((c) => c.codePointAt(0)! <= 0xffff)).toBeTrue();
  });

  it('buildLink repassa a opção', () => {
    const url = service.buildLink(CART, DRAFT, { freeDelivery: true });
    expect(decodeURIComponent(url.split('?text=')[1])).toContain('Entrega grátis');
  });

  it('o aviso da tela continua sendo o da taxa a confirmar (voz da loja)', () => {
    expect(DELIVERY_FEE_NOTICE).toContain('taxa de entrega');
  });
});
