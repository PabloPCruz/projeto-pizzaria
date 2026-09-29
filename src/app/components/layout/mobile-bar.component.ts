import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { CartFacadeService } from '../../facade/cart.facade.service';

/** Rotas em que a barra fixa some porque a própria tela já tem a ação principal. */
const HIDDEN_ON = ['/montar-pizza', '/carrinho'];
/** Na home o CTA do hero já está na tela: a barra só entra depois desta rolagem. */
const HOME_SHOW_AFTER_PX = 360;

@Component({
  selector: 'app-mobile-bar',
  templateUrl: './mobile-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileBarComponent implements OnInit, OnDestroy {
  readonly itemCount$: Observable<number> = this.cart.itemCount$;
  readonly visible$: Observable<boolean>;

  /** Atributo lido pelo CSS: barra recolhida (invisível e fora da ordem de foco) enquanto o hero da home está à vista. */
  @HostBinding('attr.data-quiet') quiet: '' | null = null;

  private onHome = false;
  private ticking = false;

  constructor(
    private cart: CartFacadeService,
    router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    const urls$ = router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(router.url)
    );
    this.visible$ = urls$.pipe(map((url) => !HIDDEN_ON.some((path) => url.split(/[?#]/)[0].startsWith(path))));
    urls$.subscribe((url) => {
      this.onHome = url.split(/[?#]/)[0] === '/';
      this.update();
    });
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => window.addEventListener('scroll', this.onScroll, { passive: true }));
    this.update();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  cartText(count: number): string {
    return count === 0 ? 'vazio' : `${count} ${count === 1 ? 'item' : 'itens'}`;
  }

  private readonly onScroll = (): void => {
    if (!this.onHome || this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.zone.run(() => this.update());
    });
  };

  private update(): void {
    const next = this.onHome && window.scrollY < HOME_SHOW_AFTER_PX ? '' : null;
    if (next === this.quiet) return;
    this.quiet = next;
    this.cdr.markForCheck();
  }
}
