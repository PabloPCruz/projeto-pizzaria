import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { OrderComponent } from '../order/order';
import { MatDialog } from '@angular/material/dialog';
import { CartFacadeService } from '../../facade/cart.facade.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.css',
  animations: [
    trigger('routeFadeAnimation', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class Header implements OnInit {
  cartItemsCount$: Observable<number>;

  constructor(
    private dialogBox: MatDialog,
    private cartFacade: CartFacadeService,
    private router: Router
  ) {
    this.cartItemsCount$ = this.cartFacade.getCartItems$().pipe(
      map(items => this.cartFacade.getCartItemsCount())
    );
  }

  ngOnInit(): void {
    // Observable é inicializado no constructor
  }

  openPedidoDialog() {
    this.dialogBox.open(OrderComponent, {
      width: 'min(600px, 95vw)',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'order-dialog-panel',
      autoFocus: false
    });
  }

  navigateToSection(sectionId: 'contacts' | 'history', event?: Event): void {
    event?.preventDefault();

    const currentPath = this.router.url.split('#')[0];
    const navigateToHome = currentPath === '/' ? Promise.resolve(true) : this.router.navigate(['/']);

    navigateToHome.then(() => {
      this.trySmoothScroll(sectionId, 0);
    });
  }

  private trySmoothScroll(sectionId: string, attempt: number): void {
    const section = document.getElementById(sectionId);

    if (!section) {
      if (attempt >= 40) {
        return;
      }

      window.setTimeout(() => this.trySmoothScroll(sectionId, attempt + 1), 70);
      return;
    }

    const headerOffset = this.getHeaderOffset();
    const targetTop = Math.max(0, section.getBoundingClientRect().top + window.scrollY - headerOffset);

    history.replaceState(null, '', `/#${sectionId}`);

    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });

    window.setTimeout(() => {
      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    }, 60);
  }

  private getHeaderOffset(): number {
    const headerElement = document.querySelector('.header-toolbar') as HTMLElement | null;
    if (headerElement?.offsetHeight) {
      return headerElement.offsetHeight + 8;
    }

    const value = getComputedStyle(document.documentElement).getPropertyValue('--header-offset').trim();
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 110;
  }
}
