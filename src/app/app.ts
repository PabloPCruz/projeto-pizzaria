import { Component, HostBinding } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  animations: [
    trigger('routeFadeAnimation', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('320ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class App {
  /** Quem pede menos movimento não recebe a animação de troca de página. */
  @HostBinding('@.disabled') readonly reduceMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private firstNavigation = true;

  constructor(router: Router) {
    // Acessibilidade em SPA: depois de trocar de página, leva o foco ao conteúdo (exceto em âncoras).
    router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      if (this.firstNavigation) {
        this.firstNavigation = false;
        return;
      }
      if (!e.urlAfterRedirects.includes('#')) {
        document.getElementById('main-content')?.focus({ preventScroll: true });
      }
    });
  }

  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['animation'] ?? 'default';
  }

  skipToMain(event: Event): void {
    event.preventDefault();
    const main = document.getElementById('main-content');
    main?.focus();
    main?.scrollIntoView();
  }
}
