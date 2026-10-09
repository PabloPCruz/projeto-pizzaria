import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HomeModule } from '../src/app/components/home/home.module';
import { HomePageComponent } from '../src/app/components/home/home-page.component';
import { PromoCtaComponent } from '../src/app/components/home/promo-cta.component';
import { STORE_INFO } from '../src/app/data/store-info';

const MESSAGE = 'Olá! Gostaria de entrar na lista de transmissão para receber as promoções da pizzaria.';

describe('PromoCtaComponent (promoções pelo WhatsApp)', () => {
  let fixture: ComponentFixture<PromoCtaComponent>;
  let el: HTMLElement;
  let link: HTMLAnchorElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HomeModule, RouterTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(PromoCtaComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
    link = el.querySelector('a')!;
  });

  it('pergunta se o cliente quer receber as promoções', () => {
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Gostaria de receber nossas promoções?');
  });

  it('o botão abre o WhatsApp oficial da loja com a mensagem pronta', () => {
    expect(link.href).toBe(`https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(MESSAGE)}`);
    expect(decodeURIComponent(link.href.split('?text=')[1])).toBe(MESSAGE);
  });

  it('usa o número já configurado em STORE_INFO (não inventa outro)', () => {
    expect(STORE_INFO.whatsappNumber).toBe('5541997449380');
    expect(link.href).toContain(`wa.me/${STORE_INFO.whatsappNumber}?`);
  });

  it('abre em nova aba, avisa isso a quem usa leitor de tela e tem alvo de toque confortável', () => {
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
    expect(link.rel).toContain('noreferrer');
    expect(link.textContent).toContain('abre em nova aba');
    expect(link.className).toContain('btn-');
  });

  it('texto honesto: abre uma conversa e não promete inclusão automática na lista', () => {
    const body = (el.textContent ?? '').replace(/\s+/g, ' ');
    expect(body).toContain('abre uma conversa');
    expect(body).toContain('salve');
    expect(body.toLowerCase()).not.toContain('cadastrad');
    expect(body.toLowerCase()).not.toContain('automatic');
    expect(body.toLowerCase()).not.toContain('garant');
  });

  it('a seção é uma região nomeada pelo seu título', () => {
    const section = el.querySelector('section')!;
    const titleId = section.getAttribute('aria-labelledby')!;
    expect(el.querySelector(`#${titleId}`)?.textContent).toContain('promoções');
  });
});

describe('Home: seção de promoções', () => {
  it('aparece na página inicial antes dos contatos', async () => {
    await TestBed.configureTestingModule({ imports: [HomeModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const promo = el.querySelector('app-promo-cta')!;
    const contacts = el.querySelector('app-contact-section')!;
    expect(promo).toBeTruthy();
    expect(promo.compareDocumentPosition(contacts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
