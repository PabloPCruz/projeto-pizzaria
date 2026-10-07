import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CheckoutFormComponent } from '../src/app/components/cart/checkout-form.component';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { CartFacadeService } from '../src/app/facade/cart.facade.service';
import { CheckoutFacadeService } from '../src/app/facade/checkout.facade.service';
import { CartService } from '../src/app/services/cart.service';
import { SUNDAY_INSTANT, fakeClock } from './helpers/fake-clock';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('CartPageComponent / checkout', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;
  let checkout: CheckoutFacadeService;

  const field = (name: string) => el.querySelector<HTMLInputElement>('#field-' + name);
  const submitButton = () =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button[type=submit]')).find((b) =>
      b.textContent?.includes('Finalizar no WhatsApp')
    )!;

  function create(withItems: boolean): void {
    if (withItems) TestBed.inject(CartFacadeService).addDrink('coca-2l');
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  const component = () => fixture.debugElement.query(By.directive(CheckoutFormComponent)).componentInstance as CheckoutFormComponent;

  function fillValidForm(): void {
    checkout.update({
      name: 'Maria Silva',
      phone: '(41) 99999-8888',
      cep: '80010-000',
      street: 'Rua José Loureiro',
      number: '123',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
      payment: 'pix',
    });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CartModule, RouterTestingModule, HttpClientTestingModule],
    }).compileComponents();
    checkout = TestBed.inject(CheckoutFacadeService);
  });

  afterEach(() => {
    el?.remove();
    localStorage.clear();
  });

  describe('carrinho vazio', () => {
    it('mostra o estado vazio com CTA para montar pizza e sem formulário', () => {
      create(false);
      expect(el.textContent).toContain('Seu carrinho está vazio');
      const cta = el.querySelector<HTMLAnchorElement>('a[href="/montar-pizza"]');
      expect(cta?.textContent).toContain('Monte sua pizza');
      expect(el.querySelector('form')).toBeNull();
      expect(el.querySelector('#delivery-fee-notice')).toBeNull();
    });
  });

  describe('com itens', () => {
    beforeEach(() => create(true));

    it('exibe o aviso da taxa de entrega (texto da facade) e nenhum valor de entrega', () => {
      const notice = el.querySelector('#delivery-fee-notice');
      expect(notice).toBeTruthy();
      expect(notice!.textContent).toContain(checkout.deliveryFeeNotice);
      // Sem preços cadastrados: nunca aparece "R$" em lugar nenhum da tela.
      expect(el.textContent).not.toContain('R$');
      expect(el.textContent).toContain('Valor confirmado pelo WhatsApp');
    });

    it('campo de troco só aparece com pagamento em Dinheiro', () => {
      expect(field('changeFor')).toBeNull();

      el.querySelector<HTMLInputElement>('#field-payment-dinheiro')!.click();
      fixture.detectChanges();
      expect(field('changeFor')).toBeTruthy();
      expect(el.textContent).toContain('Precisa de troco para quanto?');

      el.querySelector<HTMLInputElement>('#field-payment-pix')!.click();
      fixture.detectChanges();
      expect(field('changeFor')).toBeNull();
    });

    it('troco: mascara o valor ao digitar (R$ 1.000), completa os centavos ao sair e grava na facade', () => {
      el.querySelector<HTMLInputElement>('#field-payment-dinheiro')!.click();
      fixture.detectChanges();
      const troco = field('changeFor')!;

      troco.value = '1000';
      troco.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(troco.value).toBe('R$ 1.000');
      expect(checkout.draft.changeFor).toBe('R$ 1.000');

      troco.value = 'R$ 1.00'; // apagou um dígito: continua sendo cem reais, não "1,00"
      troco.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(troco.value).toBe('R$ 100');

      troco.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(troco.value).toBe('R$ 100,00');
      expect(JSON.parse(localStorage.getItem('disk-pizza:v2:checkout')!).changeFor).toBe('R$ 100,00');
    });

    it('campos de texto livre têm limite de tamanho', () => {
      const max = (name: string) => field(name)!.getAttribute('maxlength');
      expect(max('name')).toBe('60');
      expect(max('street')).toBe('80');
      expect(max('number')).toBe('10');
      expect(max('complement')).toBe('60');
      expect(max('neighborhood')).toBe('60');
      expect(max('city')).toBe('60');
      expect(max('state')).toBe('2');
      expect(max('cep')).toBe('9');
    });

    it('formulário inválido: bloqueia o envio, lista erros (role=alert), foca o 1º campo inválido e liga aria', async () => {
      const open = spyOn(window, 'open');
      submitButton().click();
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();

      expect(open).not.toHaveBeenCalled();
      expect(el.querySelector('[role=alert] #checkout-errors')?.textContent).toContain('Informe seu nome');
      expect(document.activeElement?.id).toBe('field-name');

      const name = field('name')!;
      expect(name.getAttribute('aria-invalid')).toBe('true');
      const describedBy = name.getAttribute('aria-describedby')!;
      expect(el.querySelector('#' + describedBy)?.textContent).toContain('Informe seu nome');
      expect(el.querySelector('[role=radiogroup]')?.getAttribute('aria-invalid')).toBe('true');
    });

    it('corrigir o campo remove o erro dele na hora', () => {
      submitButton().click();
      fixture.detectChanges();
      expect(field('name')!.getAttribute('aria-invalid')).toBe('true');

      const name = field('name')!;
      name.value = 'Ana';
      name.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(field('name')!.getAttribute('aria-invalid')).toBeNull();
    });

    it('formulário válido: abre o WhatsApp (nova aba), mostra o painel e NÃO limpa o carrinho', () => {
      fillValidForm();
      const open = spyOn(window, 'open').and.returnValue({} as Window);
      submitButton().click();
      fixture.detectChanges();

      expect(open).toHaveBeenCalledTimes(1);
      const [url, target] = open.calls.mostRecent().args;
      expect(String(url)).toContain('https://wa.me/5541997449380?text=');
      expect(target).toBe('_blank');
      expect(el.textContent).toContain('Falta só enviar no WhatsApp');
      expect(el.textContent).toContain('Fazer novo pedido');
      expect(TestBed.inject(CartService).snapshot.drinks.length).toBe(1);
    });

    it('se o navegador bloquear a nova aba, oferece o link para clicar', () => {
      fillValidForm();
      spyOn(window, 'open').and.returnValue(null);
      submitButton().click();
      fixture.detectChanges();

      const link = el.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]');
      expect(link).toBeTruthy();
      expect(link!.getAttribute('rel')).toContain('noopener');
      expect(el.textContent).toContain('bloqueou a nova aba');
    });

    it('"Fazer novo pedido" limpa carrinho e formulário', () => {
      fillValidForm();
      spyOn(window, 'open').and.returnValue({} as Window);
      submitButton().click();
      fixture.detectChanges();

      Array.from(el.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Fazer novo pedido'))!
        .click();
      fixture.detectChanges();
      // Ainda não apagou nada: pediu confirmação.
      expect(TestBed.inject(CartService).snapshot.drinks.length).toBe(1);
      Array.from(el.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Sim, apagar tudo'))!
        .click();
      fixture.detectChanges();

      expect(TestBed.inject(CartService).snapshot.drinks.length).toBe(0);
      expect(checkout.draft.name).toBe('');
      expect(el.textContent).toContain('Seu carrinho está vazio');
    });

    it('digitar o CEP completo busca no ViaCEP, preenche o endereço e foca o número', async () => {
      const http = TestBed.inject(HttpTestingController);
      const cep = field('cep')!;
      cep.value = '80010000';
      cep.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(cep.value).toBe('80010-000');
      expect(el.querySelector('#cep-status')?.textContent).toContain('Buscando endereço');

      http
        .expectOne('https://viacep.com.br/ws/80010000/json/')
        .flush({ logradouro: 'Rua José Loureiro', bairro: 'Centro', localidade: 'Curitiba', uf: 'PR' });
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();

      expect(field('street')!.value).toBe('Rua José Loureiro');
      expect(field('neighborhood')!.value).toBe('Centro');
      expect(field('city')!.value).toBe('Curitiba');
      expect(field('state')!.value).toBe('PR');
      expect(document.activeElement?.id).toBe('field-number');

      // Depois do ViaCEP, o sistema confere a distância até a loja (Rua José Loureiro fica a ~7 km: fora da área grátis).
      http.expectOne('https://cep.awesomeapi.com.br/json/80010000').flush({ lat: '-25.4320987', lng: '-49.2683971' });
      fixture.detectChanges();
      expect(el.querySelector('#delivery-free-inline')).toBeNull();
      http.verify();
    });

    it('CEP inexistente e erro de rede avisam (aria-live) e mantêm os campos editáveis', () => {
      const http = TestBed.inject(HttpTestingController);
      const cep = field('cep')!;
      cep.value = '99999999';
      cep.dispatchEvent(new Event('input'));
      http.expectOne('https://viacep.com.br/ws/99999999/json/').flush({ erro: true });
      fixture.detectChanges();

      const status = el.querySelector('#cep-status')!;
      expect(status.getAttribute('aria-live')).toBe('polite');
      expect(status.textContent).toContain('CEP não encontrado');
      expect(field('street')!.disabled).toBeFalse();

      cep.value = '80010000';
      cep.dispatchEvent(new Event('input'));
      http.expectOne('https://viacep.com.br/ws/80010000/json/').error(new ProgressEvent('error'));
      fixture.detectChanges();
      expect(status.textContent).toContain('Não foi possível buscar o CEP');
      expect(field('street')!.disabled).toBeFalse();
    });


    it('CEP geral (sem rua) leva o foco à Rua, não ao Número', async () => {
      const http = TestBed.inject(HttpTestingController);
      const cep = field('cep')!;
      cep.focus();
      cep.value = '80000000';
      cep.dispatchEvent(new Event('input'));
      http.expectOne('https://viacep.com.br/ws/80000000/json/').flush({ logradouro: '', bairro: '', localidade: 'Curitiba', uf: 'PR' });
      fixture.detectChanges();
      await flush();
      expect(document.activeElement?.id).toBe('field-street');
    });

    it('resposta do CEP não rouba o foco de quem já foi para outro campo', async () => {
      const http = TestBed.inject(HttpTestingController);
      const cep = field('cep')!;
      cep.value = '80010000';
      cep.dispatchEvent(new Event('input'));
      field('complement')!.focus();
      http.expectOne('https://viacep.com.br/ws/80010000/json/').flush({ logradouro: 'Rua A', bairro: 'Centro', localidade: 'Curitiba', uf: 'PR' });
      fixture.detectChanges();
      await flush();
      expect(document.activeElement?.id).toBe('field-complement');
    });

    it('resumo de erros usa botões (sem href) e o erro do carrinho leva ao bloco de itens', async () => {
      submitButton().click();
      fixture.detectChanges();
      const summary = el.querySelector('#checkout-errors')!;
      expect(summary.querySelectorAll('a').length).toBe(0);
      const nameButton = Array.from(summary.querySelectorAll('button')).find((b) => b.textContent?.includes('Nome'))!;
      nameButton.click();
      expect(document.activeElement?.id).toBe('field-name');
      component().focusField('cart');
      expect(document.activeElement?.id).toBe('itens-title');
    });

    it('remover item: foco vai para a confirmação e, depois, para o estado vazio', async () => {
      const remove = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Remover'))!;
      remove.click();
      fixture.detectChanges();
      await flush();
      expect(document.activeElement?.id).toMatch(/^confirm-drink-/);

      (document.activeElement as HTMLElement).click();
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();
      expect(document.activeElement?.id).toBe('vazio-title');
    });

    it('remover um dos itens leva o foco ao próximo item', async () => {
      TestBed.inject(CartFacadeService).addDrink('fanta-2l');
      fixture.detectChanges();
      const remove = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Remover'))!;
      remove.click();
      fixture.detectChanges();
      await flush();
      (document.activeElement as HTMLElement).click();
      fixture.detectChanges();
      await flush();
      expect(document.activeElement?.hasAttribute('data-line-heading')).toBeTrue();
      expect(document.activeElement?.textContent).toContain('Fanta 2L');
    });

    it('alterações de campo são gravadas na facade (persistência)', () => {
      const name = field('name')!;
      name.value = 'João';
      name.dispatchEvent(new Event('input'));
      const phone = field('phone')!;
      phone.value = '41988887777';
      phone.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(checkout.draft.name).toBe('João');
      expect(checkout.draft.phone).toBe('(41) 98888-7777');
      expect(phone.value).toBe('(41) 98888-7777');
      expect(JSON.parse(localStorage.getItem('disk-pizza:v2:checkout')!).name).toBe('João');
    });
  });

  describe('loja fechada', () => {
    it('enviar não abre o WhatsApp nem mostra erro de campo', async () => {
      fakeClock.set(SUNDAY_INSTANT);
      create(true);
      fillValidForm();
      const open = spyOn(window, 'open');
      component().submit();
      await flush();
      expect(open).not.toHaveBeenCalled();
      expect(component().errorList.length).toBe(0);
    });
  });
});
