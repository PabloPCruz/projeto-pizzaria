import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderModule } from '../src/app/components/builder/builder.module';
import { BuilderPageComponent } from '../src/app/components/builder/builder-page.component';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';

describe('BuilderPageComponent (montar pizza)', () => {
  let fixture: ComponentFixture<BuilderPageComponent>;
  let el: HTMLElement;

  const click = (selector: string): void => {
    (el.querySelector(selector) as HTMLElement).click();
    fixture.detectChanges();
  };

  const clickButton = (text: string): void => {
    const button = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim().startsWith(text));
    expect(button).withContext(`botão "${text}"`).toBeTruthy();
    button!.click();
    fixture.detectChanges();
  };

  const flavorBoxes = (): HTMLInputElement[] => Array.from(el.querySelectorAll('input[type=checkbox]'));
  const statusText = (): string =>
    Array.from(el.querySelectorAll('[role=status]'))
      .map((n) => n.textContent?.replace(/\s+/g, ' ').trim())
      .join(' | ');

  function create(): void {
    fixture = TestBed.createComponent(BuilderPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('não avança do passo 1 sem escolher o tamanho e explica o motivo', () => {
    create();
    clickButton('Avançar');
    expect(el.querySelector('#step-title')?.textContent).toContain('tamanho');
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Escolha o tamanho');
  });

  it('respeita o limite de sabores do tamanho: contador, desabilitação dos demais e aviso', () => {
    create();
    click('#size-media'); // média = 2 sabores
    clickButton('Avançar');
    expect(el.querySelector('#step-title')?.textContent).toContain('sabores');
    expect(el.querySelector('#flavor-counter')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('0/2 sabores');

    const boxes = flavorBoxes();
    expect(boxes.length).toBeGreaterThan(10);
    boxes[0].click();
    fixture.detectChanges();
    expect(flavorBoxes().filter((b) => b.disabled).length).withContext('abaixo do limite nada é desabilitado').toBe(0);

    flavorBoxes()[1].click();
    fixture.detectChanges();

    expect(el.querySelector('#flavor-counter')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('2/2 sabores');
    const boxesAtLimit = flavorBoxes();
    const disabled = boxesAtLimit.filter((b) => b.disabled);
    // Só os 2 selecionados continuam habilitados (para poderem ser desmarcados).
    expect(disabled.length).toBe(boxesAtLimit.length - 2);
    expect(boxesAtLimit.filter((b) => b.checked && b.disabled).length).toBe(0);
    expect(statusText()).toContain('Limite de 2 sabores atingido');
  });

  it('desmarcar um sabor libera os demais', () => {
    create();
    click('#size-pequena'); // 1 sabor
    clickButton('Avançar');
    flavorBoxes()[0].click();
    fixture.detectChanges();
    expect(flavorBoxes().filter((b) => b.disabled).length).toBeGreaterThan(0);

    flavorBoxes()[0].click(); // desmarca
    fixture.detectChanges();
    expect(flavorBoxes().filter((b) => b.disabled).length).toBe(0);
  });

  it('trocar para um tamanho menor remove os excedentes e AVISA quantos saíram', () => {
    const order = TestBed.inject(OrderFacadeService);
    order.selectSize('grande'); // 3 sabores
    ['tradicional-calabresa', 'tradicional-mussarela', 'especial-atum'].forEach((id) => order.toggleFlavor(id));
    order.setStep(0);
    create();

    click('#size-media'); // 2 sabores: 1 sai
    expect(statusText()).toContain('1 sabor foi removido');
    order.view$.subscribe((v) => expect(v.draft.flavorIds.length).toBe(2)).unsubscribe();

    click('#size-pequena'); // 1 sabor: mais 1 sai
    expect(statusText()).toContain('1 sabor foi removido');

    click('#size-gigante'); // maior: nada sai, aviso some
    expect(statusText()).not.toContain('removido');
  });

  it('recarregar no meio do fluxo volta ao mesmo passo e aos mesmos sabores (rascunho persistido)', () => {
    create();
    click('#size-media');
    clickButton('Avançar');
    flavorBoxes()[0].click();
    fixture.detectChanges();
    fixture.destroy();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [BuilderModule, RouterTestingModule] });
    create();

    expect(el.querySelector('#step-title')?.textContent).toContain('sabores');
    expect(el.querySelector('#flavor-counter')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('1/2 sabores');
    expect(flavorBoxes().filter((b) => b.checked).length).toBe(1);
  });
});
