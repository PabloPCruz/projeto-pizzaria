import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartFacadeService } from '../../facade/cart.facade.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class HeaderComponent {
  menuOpen = false;
  readonly itemCount$ = this.cart.itemCount$;

  readonly links: { label: string; path: string; fragment?: string; exact: boolean }[] = [
    { label: 'Início', path: '/', exact: true },
    { label: 'Cardápio', path: '/cardapio', exact: false },
    { label: 'Como pedir', path: '/', fragment: 'como-pedir', exact: true },
    { label: 'Contato', path: '/', fragment: 'contatos', exact: true },
  ];

  @ViewChild('menuButton') menuButton?: ElementRef<HTMLButtonElement>;

  constructor(
    private cart: CartFacadeService,
    router: Router
  ) {
    router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => (this.menuOpen = false));
  }

  cartLabel(count: number): string {
    return count === 0 ? 'Carrinho vazio' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:keydown.escape')
  closeMenu(): void {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    // Fechou com Esc: devolve o foco ao botão que abriu o menu.
    this.menuButton?.nativeElement.focus();
  }
}
