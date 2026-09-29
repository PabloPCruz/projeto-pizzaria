import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExtraOptions, RouterModule } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';
import { LayoutModule } from './components/layout/layout.module';

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
  // Compensa o header fixo ao rolar até uma âncora.
  scrollOffset: [0, 88],
  onSameUrlNavigation: 'reload',
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
  bootstrap: [App],
})
export class AppModule {}
