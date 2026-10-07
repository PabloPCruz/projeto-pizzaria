import { Component, HostBinding } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

/** Erro de carregar o módulo de uma página (aba aberta antes de um novo deploy: os arquivos antigos não existem mais). */
export function isChunkLoadError(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | null;
  const text = `${e?.name ?? ''} ${e?.message ?? String(error ?? '')}`;
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|Unexpected token '<'/i.test(text);
}

const CHUNK_RELOAD_KEY = 'disk-pizza:chunk-reload';
const CHUNK_RELOAD_COOLDOWN_MS = 15_000;

/** Só recarrega uma vez por vez: se o servidor estiver fora do ar, não entra em laço de recarga. */
function reloadedRecently(): boolean {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY));
    if (last && Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return true;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    // sem sessionStorage: segue e recarrega
  }
  return false;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  animations: [
    // Troca de página: a tela nova aparece com fade + subida leve (só opacity/transform, sem salto de layout).
    trigger('routeFadeAnimation', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('280ms cubic-bezier(.22,.61,.36,1)', style({ opacity: 1, transform: 'translateY(0)' })),
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

    // Pedido de uma página cujo arquivo não existe mais (novo deploy com a aba aberta): recarrega para pegar a versão nova.
    router.events.pipe(filter((e): e is NavigationError => e instanceof NavigationError)).subscribe((e) => {
      if (isChunkLoadError(e.error) && !reloadedRecently()) window.location.assign(e.url);
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
