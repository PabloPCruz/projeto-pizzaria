import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, ExtraOptions } from '@angular/router';

import { App } from './app'; // seu componente raiz
import { Presentation } from './presentation/presentation';
import { Contacts } from './components/contacts/contacts';
import { routes } from './app.routes';
import { Template } from './template/template';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OrderGeneralModule } from './components/order-general.module';

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
  scrollOffset: [0, 110],
  onSameUrlNavigation: 'reload',
};

@NgModule({
  declarations: [App, Presentation, Contacts, Template],
  imports: [
    BrowserModule,
    OrderGeneralModule,
    RouterModule.forRoot(routes, routerOptions),
    BrowserAnimationsModule
  ],
  bootstrap: [App]
})
export class AppModule { }
