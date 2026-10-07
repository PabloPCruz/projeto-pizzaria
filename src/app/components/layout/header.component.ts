import { ChangeDetectionStrategy, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartFacadeService } from '../../facade/cart.facade.service';
import { StoreFacadeService } from '../../facade/store.facade.service';

/** Duração da animação de fechar o painel do celular (igual ao keyframe sheet-out). */
const CLOSE_MS = 180;
/** Rolagem a partir da qual o cabeçalho ganha sombra e borda dourada. */
const SCROLLED_AFTER_PX = 8;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class HeaderComponent implements OnInit, OnDestroy {
  /** Fonte da verdade do estado do menu (aria-expanded). */
  menuOpen = false;
  /** Fechando: o painel continua no DOM só até a animação de saída terminar. */
  closing = false;
  readonly itemCount$ = this.cart.itemCount$;
  readonly store$ = this.storeFacade.view$;

  readonly links: { label: string; path: string; fragment?: string; exact: boolean }[] = [
    { label: 'Início', path: '/', exact: true },
    { label: 'Cardápio', path: '/cardapio', exact: false },
    { label: 'Como pedir', path: '/', fragment: 'como-pedir', exact: true },
    { label: 'Contato', path: '/', fragment: 'contatos', exact: true },
  ];

  @ViewChild('menuButton') menuButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('bar', { static: true }) bar!: ElementRef<HTMLElement>;

  private closeTimer?: ReturnType<typeof setTimeout>;
  private ticking = false;

  constructor(
    private cart: CartFacadeService,
    private storeFacade: StoreFacadeService,
    router: Router,
    private zone: NgZone
  ) {
    router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.close());
  }

  ngOnInit(): void {
    // Fora do Angular: rolar não dispara detecção de mudanças; só alterna um atributo (sombra) no cabeçalho.
    this.zone.runOutsideAngular(() => window.addEventListener('scroll', this.onScroll, { passive: true }));
    this.updateScrolled();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    clearTimeout(this.closeTimer);
  }

  cartLabel(count: number): string {
    return count === 0 ? 'Carrinho vazio' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`;
  }

  toggleMenu(): void {
    if (this.menuOpen) this.close();
    else this.open();
  }

  @HostListener('document:keydown.escape')
  closeMenu(): void {
    if (!this.menuOpen) return;
    this.close();
    // Fechou com Esc: devolve o foco ao botão que abriu o menu.
    this.menuButton?.nativeElement.focus();
  }

  /** Fundo escurecido: fechar tocando fora do painel. */
  closeFromScrim(): void {
    this.close();
  }

  private open(): void {
    clearTimeout(this.closeTimer);
    this.closing = false;
    this.menuOpen = true;
  }

  private close(): void {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    this.closing = true;
    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => (this.closing = false), CLOSE_MS);
  }

  private readonly onScroll = (): void => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.updateScrolled();
    });
  };

  private updateScrolled(): void {
    this.bar.nativeElement.toggleAttribute('data-scrolled', window.scrollY > SCROLLED_AFTER_PX);
  }
}
