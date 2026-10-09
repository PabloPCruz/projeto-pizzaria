import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { BuilderPageComponent } from '../src/app/components/builder/builder-page.component';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';
import { CartService } from '../src/app/services/cart.service';

const text = (node: Element | null | undefined) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('Revisão da pizza: botões "Editar"', () => {
  let fixture: ComponentFixture<BuilderPageComponent>;
  let el: HTMLElement;
  let order: OrderFacadeService;

  const button = (label: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b).startsWith(label));
  const click = (label: string) => {
    const b = button(label);
    expect(b).withContext(`botão "${label}"`).toBeTruthy();
    b!.click();
    fixture.detectChanges();
  };
  const title = () => text(el.querySelector('#step-title')).toLowerCase();
  const editButton = (section: string) => el.querySelector<HTMLButtonElement>(`app-review-step button[aria-label="Editar ${section}"]`);

  /** Abre o montador direto na revisão de uma pizza média com Mussarela e Frango Catupiry. */
  function openReview(): void {
    fixture?.destroy();
    order.setStep(4);
    fixture = TestBed.createComponent(BuilderPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] }).compileComponents();
    order = TestBed.inject(OrderFacadeService);
    order.selectSize('media');
    order.toggleFlavor('tradicional-mussarela');
    order.toggleFlavor('tradicional-frango-catupiry');
    openReview();
  });

  afterEach(() => localStorage.clear());

  it('na revisão cada parte (tamanho, sabores, borda e observações) tem o seu botão Editar', () => {
    expect(title()).toContain('revise');
    for (const section of ['tamanho', 'sabores', 'borda', 'observações']) {
      expect(editButton(section)).withContext(section).toBeTruthy();
      expect(text(editButton(section))).withContext(section).toBe('Editar');
    }
  });

  it('o resumo lateral (desktop) não tem botão Editar', () => {
    expect(el.querySelectorAll('aside button[aria-label^="Editar"]').length).toBe(0);
  });

  for (const section of ['tamanho', 'sabores', 'borda', 'observações']) {
    it(`Editar ${section} leva direto ao passo certo`, () => {
      editButton(section)!.click();
      fixture.detectChanges();
      expect(title()).toContain(section === 'observações' ? 'observações' : section);
    });
  }

  it('depois de editar, o botão vira "Voltar à revisão" e leva direto de volta, com a mudança feita', () => {
    editButton('borda')!.click();
    fixture.detectChanges();
    expect(button('Avançar')).toBeUndefined();
    expect(button('Voltar à revisão')).toBeTruthy();

    el.querySelector<HTMLInputElement>('#crust-nutella')!.click();
    fixture.detectChanges();
    click('Voltar à revisão');
    expect(title()).toContain('revise');
    expect(text(el.querySelector('app-review-step'))).toContain('Nutella');
  });

  it('editar o tamanho para um menor mantém o que cabe e volta à revisão', () => {
    editButton('tamanho')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLInputElement>('#size-pequena')!.click(); // 1 sabor: 1 sai
    fixture.detectChanges();
    click('Voltar à revisão');
    expect(title()).toContain('revise');
    expect(text(el.querySelector('app-review-step'))).toContain('Pequena');
  });

  it('a volta direta vale só uma vez: se o cliente navegar de novo pelos passos, o botão é "Avançar"', () => {
    editButton('borda')!.click();
    fixture.detectChanges();
    click('Voltar à revisão');
    click('Voltar'); // revisão -> extras
    expect(button('Voltar à revisão')).toBeUndefined();
    expect(button('Avançar')).toBeTruthy();
  });

  it('adicionar ao carrinho depois de editar continua funcionando', () => {
    editButton('borda')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLInputElement>('#crust-cheddar')!.click();
    fixture.detectChanges();
    click('Voltar à revisão');
    click('Adicionar ao carrinho');
    const cart = TestBed.inject(CartService).snapshot;
    expect(cart.pizzas.length).toBe(1);
    expect(cart.pizzas[0].crustId).toBe('cheddar');
  });
});
