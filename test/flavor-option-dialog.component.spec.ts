import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { FlavorsStepComponent } from '../src/app/components/builder/flavors-step.component';
import { UNAVAILABLE_ITEMS } from '../src/app/data/availability';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';
import { PizzaBuilderService } from '../src/app/services/pizza-builder.service';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));
const text = (node: Element | null | undefined) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('Sabor com opção: pop-up de escolha', () => {
  let fixture: ComponentFixture<FlavorsStepComponent>;
  let el: HTMLElement;
  let order: OrderFacadeService;

  const dialog = () => el.querySelector<HTMLDialogElement>('dialog')!;
  const optionButton = (id: string) => dialog().querySelector<HTMLButtonElement>(`button[data-option="${id}"]`)!;
  const options = () => Array.from(dialog().querySelectorAll<HTMLButtonElement>('button[data-option]'));
  const flavorBox = (id: string) => el.querySelector<HTMLInputElement>('#flavor-' + id)!;
  const chips = () => text(el.querySelector('ul[aria-label="Sabores escolhidos"]'));
  const selected = () => TestBed.inject(PizzaBuilderService).snapshot;

  /** Executa a ação que fecha o pop-up e espera o evento "close" do <dialog> (o navegador o entrega em tarefa própria). */
  const closeBy = async (action: () => void) => {
    const done = new Promise<void>((resolve) => dialog().addEventListener('close', () => resolve(), { once: true }));
    action();
    await done;
    await flush();
    fixture.detectChanges();
  };

  async function create(providers: unknown[] = [], before?: () => void): Promise<void> {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule], providers: providers as never[] }).compileComponents();
    order = TestBed.inject(OrderFacadeService);
    order.selectSize('grande');
    before?.();
    fixture = TestBed.createComponent(FlavorsStepComponent);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
  }

  const pick = async (id: string) => {
    flavorBox(id).click();
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

  describe('ao escolher o sabor', () => {
    beforeEach(() => create());

    it('sabor sem opção não abre o pop-up', async () => {
      await pick('tradicional-mussarela');
      expect(dialog().open).toBeFalse();
      expect(selected().flavorIds).toEqual(['tradicional-mussarela']);
    });

    it('sabor com opção abre um pop-up modal com o nome, o pedido de escolha e um botão por opção (nenhum marcado)', async () => {
      await pick('tradicional-calabresa');
      expect(dialog().open).toBeTrue();
      expect(dialog().matches(':modal')).toBeTrue();
      expect(text(dialog().querySelector('h2'))).toBe('Calabresa');
      expect(text(dialog())).toContain('Escolha a opção');
      expect(dialog().getAttribute('aria-labelledby')).toBe(dialog().querySelector('h2')!.id);
      expect(options().map((b) => text(b))).toEqual(['Sem opção', 'Com cebola', 'Com catupiry']);
      expect(options().every((b) => b.getAttribute('aria-pressed') === 'false')).toBeTrue();
    });

    it('o Chocolate (doce) oferece ao leite ou branco, sem "sem opção"', async () => {
      await pick('doce-chocolate');
      expect(options().map((b) => text(b))).toEqual(['Ao leite', 'Branco']);
    });

    it('tocar numa opção escolhe, fecha o pop-up e mostra a escolha na lista e nos sabores escolhidos', async () => {
      await pick('tradicional-calabresa');
      await closeBy(() => optionButton('cebola').click());

      expect(dialog().open).toBeFalse();
      expect(selected().flavorOptions).toEqual({ 'tradicional-calabresa': 'cebola' });
      expect(chips()).toContain('Calabresa (com cebola)');
      const row = text(flavorBox('tradicional-calabresa').closest('label'));
      expect(row).toContain('Opção: com cebola');
      expect(text(el)).not.toContain('Escolha a opção de Calabresa');
    });

    it('"Sem opção" é uma escolha válida: registra e libera o avançar', async () => {
      await pick('tradicional-calabresa');
      await closeBy(() => optionButton('sem-opcao').click());
      expect(selected().flavorOptions).toEqual({ 'tradicional-calabresa': 'sem-opcao' });
      expect(chips()).toContain('Calabresa');
      expect(chips()).not.toContain('Calabresa (');
      let error: string | undefined = 'x';
      order.view$.subscribe((v) => (error = v.validation.error)).unsubscribe();
      expect(error).toBeUndefined();
    });

    it('fechar sem escolher (Cancelar) tira o sabor: a opção é obrigatória', async () => {
      await pick('tradicional-calabresa');
      const cancel = Array.from(dialog().querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b) === 'Cancelar')!;
      await closeBy(() => cancel.click());
      expect(selected().flavorIds).toEqual([]);
      expect(flavorBox('tradicional-calabresa').checked).toBeFalse();
      expect(text(el.querySelector('#flavor-counter'))).toContain('0/3');
    });

    it('fechar pelo X, pelo fundo ou pelo Esc também tira o sabor que ainda não tem opção', async () => {
      await pick('tradicional-calabresa');
      await closeBy(() => dialog().querySelector<HTMLButtonElement>('button[aria-label="Fechar"]')!.click());
      expect(selected().flavorIds).toEqual([]);

      await pick('tradicional-brocolis');
      await closeBy(() => dialog().dispatchEvent(new MouseEvent('click', { bubbles: true })));
      expect(selected().flavorIds).toEqual([]);

      await pick('doce-chocolate');
      await closeBy(() => dialog().close());
      expect(selected().flavorIds).toEqual([]);
    });

    it('dentro do limite de sabores: a opção só é pedida para o sabor que entrou', async () => {
      order.selectSize('pequena'); // 1 sabor
      fixture.detectChanges();
      await pick('tradicional-mussarela');
      flavorBox('tradicional-calabresa').click(); // bloqueado pelo limite
      fixture.detectChanges();
      await flush();
      expect(dialog().open).toBeFalse();
    });
  });

  describe('depois de escolhida', () => {
    beforeEach(async () => {
      await create();
      await pick('tradicional-calabresa');
      await closeBy(() => optionButton('cebola').click());
    });

    it('o lápis ao lado do sabor reabre o pop-up com a opção atual marcada', async () => {
      const edit = el.querySelector<HTMLButtonElement>('button[aria-label="Alterar a opção de Calabresa"]')!;
      expect(edit).toBeTruthy();
      edit.click();
      fixture.detectChanges();
      await flush();
      expect(dialog().open).toBeTrue();
      expect(optionButton('cebola').getAttribute('aria-pressed')).toBe('true');
      expect(optionButton('catupiry').getAttribute('aria-pressed')).toBe('false');
    });

    it('trocar a opção troca a escolha e continua com o sabor', async () => {
      el.querySelector<HTMLButtonElement>('button[aria-label="Alterar a opção de Calabresa"]')!.click();
      fixture.detectChanges();
      await flush();
      await closeBy(() => optionButton('catupiry').click());
      expect(selected().flavorOptions).toEqual({ 'tradicional-calabresa': 'catupiry' });
      expect(chips()).toContain('Calabresa (com catupiry)');
    });

    it('fechar sem trocar mantém o sabor e a opção', async () => {
      el.querySelector<HTMLButtonElement>('button[aria-label="Alterar a opção de Calabresa"]')!.click();
      fixture.detectChanges();
      await flush();
      await closeBy(() => dialog().close());
      expect(selected().flavorIds).toEqual(['tradicional-calabresa']);
      expect(selected().flavorOptions).toEqual({ 'tradicional-calabresa': 'cebola' });
    });

    it('tirar o sabor apaga a opção', () => {
      el.querySelector<HTMLButtonElement>('button[aria-label="Remover Calabresa (com cebola)"]')!.click();
      fixture.detectChanges();
      expect(selected().flavorOptions).toEqual({});
    });

    it('sabor sem opção não tem lápis', async () => {
      await pick('tradicional-mussarela');
      expect(el.querySelector('button[aria-label="Alterar a opção de Mussarela"]')).toBeNull();
    });
  });

  describe('pedido restaurado com a opção pendente', () => {
    beforeEach(() => create([], () => order.toggleFlavor('tradicional-calabresa')));

    it('mostra o aviso fixo com o botão "Escolher", que abre o pop-up', async () => {
      expect(dialog().open).toBeFalse();
      const notice = el.querySelector('.sticky')!;
      expect(text(notice)).toContain('Escolha a opção de Calabresa');
      const choose = Array.from(notice.querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b) === 'Escolher')!;
      choose.click();
      fixture.detectChanges();
      await flush();
      expect(dialog().open).toBeTrue();
      expect(text(dialog().querySelector('h2'))).toBe('Calabresa');
    });

    it('a linha do sabor avisa que falta escolher', () => {
      expect(text(flavorBox('tradicional-calabresa').closest('label'))).toContain('Escolha a opção');
    });
  });

  describe('lista de sabores', () => {
    beforeEach(() => create());

    it('antes de escolher a linha mostra as opções do sabor como dica', () => {
      expect(text(flavorBox('tradicional-calabresa').closest('label'))).toContain('Opção: com cebola ou com catupiry');
      expect(text(flavorBox('tradicional-mussarela').closest('label'))).not.toContain('Opção');
    });

    it('escolher um sabor com opção não muda o tamanho do cartão nem sobrepõe nada (nada é inserido na lista)', async () => {
      const li = flavorBox('tradicional-calabresa').closest('li')!;
      const before = li.getBoundingClientRect().height;
      await pick('tradicional-calabresa');
      await closeBy(() => optionButton('catupiry').click());
      const label = flavorBox('tradicional-calabresa').closest('label')!;
      expect(li.querySelectorAll('[role=radiogroup]').length).toBe(0);
      // O cartão ocupa o item inteiro (sem painel extra); só pode crescer por causa da linha "Opção: ..." de uma linha.
      expect(Math.abs(label.getBoundingClientRect().height - li.getBoundingClientRect().height)).toBeLessThan(1);
      expect(li.getBoundingClientRect().height - before).toBeLessThan(40);
    });
  });

  describe('sabor esgotado', () => {
    beforeEach(() => create([{ provide: UNAVAILABLE_ITEMS, useValue: ['tradicional-calabresa'] }]));

    it('não dá para escolher, então o pop-up nunca abre', async () => {
      flavorBox('tradicional-calabresa').click();
      fixture.detectChanges();
      await flush();
      expect(dialog().open).toBeFalse();
      expect(selected().flavorIds).toEqual([]);
    });
  });
});
