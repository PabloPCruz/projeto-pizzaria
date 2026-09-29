import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { CartFacadeService } from '../../facade/cart.facade.service';

/** Rotas em que a barra fixa some porque a própria tela já tem a ação principal. */
const HIDDEN_ON = ['/montar-pizza', '/carrinho'];

@Component({
  selector: 'app-mobile-bar',
  templateUrl: './mobile-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileBarComponent {
  readonly itemCount$: Observable<number> = this.cart.itemCount$;
  readonly visible$: Observable<boolean>;

  constructor(
    private cart: CartFacadeService,
    router: Router
  ) {
    this.visible$ = router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(router.url),
      map((url) => !HIDDEN_ON.some((path) => url.split(/[?#]/)[0].startsWith(path)))
    );
  }

  cartText(count: number): string {
    return count === 0 ? 'vazio' : `${count} ${count === 1 ? 'item' : 'itens'}`;
  }
}
