import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { DRINKS } from '../src/app/data/menu.data';
import { UNAVAILABLE_ITEMS } from '../src/app/data/availability';
import { CartService } from '../src/app/services/cart.service';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));
const text = (node: Element | null | undefined) => (node?.textContent ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

describe('Carrinho: bebidas em pop-up', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let cart: CartService;

  const trigger = () => el.querySelector<HTMLButtonElement>('#bebida-title')!.closest('section')!.querySelector<HTMLButtonElement>('button')!;
  const dialog = () => el.querySelector<HTMLDialogElement>('dialog')!;
  const rows = () => Array.from(dialog().querySelectorAll<HTMLElement>('app-drink-picker li'));
  const row = (label: string) => rows().find((r) => text(r).includes(label))!;
  const addButton = (label: string) => dialog().querySelector<HTMLButtonElement>(`button[aria-label="Adicionar ${label} ao carrinho"]`)!;
  const items = () => Array.from(el.querySelectorAll('app-cart-items [data-line-heading]')).map((h) => text(h));

  async function create(providers: unknown[] = []): Promise<void> {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CartModule, RouterTestingModule, HttpClientTestingModule],
      providers: providers as never[],
    }).compileComponents();
    cart = TestBed.inject(CartService);
    cart.addPizza({ size: 'grande', flavorIds: ['tradicional-mussarela'], crustId: null, notes: '', quantity: 1 });
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
  }

  /** Executa a ação que fecha o pop-up e espera o evento "close" do <dialog> (o navegador o entrega em tarefa própria). */
  const closeBy = async (action: () => void) => {
    const done = new Promise<void>((resolve) => dialog().addEventListener('close', () => resolve(), { once: true }));
    action();
    await done;
    await flush();
    fixture.detectChanges();
  };

  const open = async () => {
    trigger().focus();
    trigger().click();
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
  };

  afterEach(() => {
    if (el?.querySelector('dialog')?.open) el.querySelector('dialog')!.close();
    el?.remove();
    localStorage.clear();
    document.body.style.overflow = '';
  });

  describe('a tela do carrinho', () => {
    beforeEach(() => create());

    it('não tem mais a lista de bebidas solta: só um cartão compacto com o botão', () => {
      expect(el.querySelector('app-drink-picker')).toBeNull();
      expect(text(trigger())).toContain('Adicionar bebida');
      expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
      expect(text(el.querySelector('#bebida-title'))).toBe('Acompanha uma bebida?');
    });

    it('o título muda para "outra bebida" quando já há bebida no pedido', () => {
      cart.addDrink('coca-2l');
      fixture.detectChanges();
      expect(text(el.querySelector('#bebida-title'))).toContain('outra bebida');
    });

    it('o pop-up começa fechado e vazio (a tela não carrega a lista à toa)', () => {
      expect(dialog().open).toBeFalse();
      expect(dialog().querySelector('app-drink-picker')).toBeNull();
    });
  });

  describe('o pop-up', () => {
    beforeEach(async () => {
      await create();
      await open();
    });

    it('abre como diálogo modal, com título, e lista todas as bebidas com o valor', () => {
      expect(dialog().open).toBeTrue();
      expect(dialog().matches(':modal')).toBeTrue();
      expect(text(dialog().querySelector('#drinks-dialog-title'))).toBe('Bebidas');
      expect(dialog().getAttribute('aria-labelledby')).toBe('drinks-dialog-title');
      expect(rows().length).toBe(DRINKS.length);
      expect(text(row('Coca-Cola 2L'))).toContain('R$ 14,00');
      expect(text(row('Kuat 1,5L'))).toContain('R$ 10,00');
      expect(text(row('Cerveja Brahma lata'))).toContain('R$ 4,50');
    });

    it('as bebidas ficam em uma coluna só (lista objetiva)', () => {
      const list = dialog().querySelector('app-drink-picker ul')!;
      expect(getComputedStyle(list).gridTemplateColumns.split(' ').length).toBe(1);
    });

    it('adicionar pelo pop-up põe a bebida em "Seus itens" e mostra a quantidade no pop-up', () => {
      addButton('Fanta 2L').click();
      fixture.detectChanges();
      expect(items()).toContain('Fanta 2L');
      expect(row('Fanta 2L').querySelector('output')?.textContent?.trim()).toBe('1');
      expect(row('Fanta 2L').querySelector('button[aria-label^="Adicionar"]')).toBeNull();
    });

    it('o rodapé mostra quantas bebidas já estão no pedido', () => {
      expect(text(dialog().querySelector('footer'))).toContain('Concluir');
      addButton('Fanta 2L').click();
      fixture.detectChanges();
      expect(text(dialog().querySelector('footer'))).toContain('1 no pedido');
    });

    it('Concluir fecha, devolve o foco ao botão do carrinho e libera a rolagem da página', async () => {
      expect(document.body.style.overflow).toBe('hidden');
      const concluir = Array.from(dialog().querySelectorAll<HTMLButtonElement>('footer button')).find((b) => text(b).startsWith('Concluir'))!;
      await closeBy(() => concluir.click());
      expect(dialog().open).toBeFalse();
      expect(document.activeElement).toBe(trigger());
      expect(document.body.style.overflow).toBe('');
      expect(dialog().querySelector('app-drink-picker')).toBeNull();
    });

    it('o botão X (Fechar) também fecha', async () => {
      const close = dialog().querySelector<HTMLButtonElement>('button[aria-label="Fechar"]')!;
      expect(close).toBeTruthy();
      await closeBy(() => close.click());
      expect(dialog().open).toBeFalse();
    });

    it('clicar no fundo escuro fecha; clicar dentro não', async () => {
      row('Coca-Cola 2L').click();
      fixture.detectChanges();
      expect(dialog().open).toBeTrue();
      await closeBy(() => dialog().dispatchEvent(new MouseEvent('click', { bubbles: true })));
      expect(dialog().open).toBeFalse();
    });

    it('fechar pelo Esc (evento nativo "close") também limpa tudo', async () => {
      await closeBy(() => dialog().close());
      expect(document.body.style.overflow).toBe('');
      expect(dialog().querySelector('app-drink-picker')).toBeNull();
    });

    it('abrir de novo funciona e mostra a quantidade que já estava no pedido', async () => {
      addButton('Sprite 2L').click();
      fixture.detectChanges();
      await closeBy(() => dialog().close());
      await open();
      expect(dialog().open).toBeTrue();
      expect(row('Sprite 2L').querySelector('output')?.textContent?.trim()).toBe('1');
    });
  });

  describe('bebida esgotada hoje', () => {
    beforeEach(async () => {
      await create([{ provide: UNAVAILABLE_ITEMS, useValue: ['fanta-2l'] }]);
      await open();
    });

    it('aparece como "Indisponível hoje", sem botão de adicionar', () => {
      expect(text(row('Fanta 2L'))).toContain('Indisponível hoje');
      expect(addButton('Fanta 2L')).toBeNull();
      expect(addButton('Coca-Cola 2L')).toBeTruthy();
    });
  });
});
