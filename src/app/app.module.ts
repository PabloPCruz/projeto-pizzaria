import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExtraOptions, PreloadAllModules, RouterModule } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';
import { LayoutModule } from './components/layout/layout.module';
import { ClockService } from './services/clock.service';

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
  // Compensa o header fixo ao rolar até uma âncora.
  scrollOffset: [0, 88],
  onSameUrlNavigation: 'reload',
  // As páginas são pequenas (2–40 kB): baixa todas em segundo plano para o clique em "Carrinho" não esperar a rede.
  preloadingStrategy: PreloadAllModules,
};

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes, routerOptions),
    LayoutModule,
  ],
  providers: [
    // Mede a diferença do relógio do aparelho para o do servidor, sem atrasar a abertura do site.
    { provide: APP_INITIALIZER, multi: true, deps: [ClockService], useFactory: (clock: ClockService) => () => void clock.sync() },
  ],
  bootstrap: [App],
})
export class AppModule {}
