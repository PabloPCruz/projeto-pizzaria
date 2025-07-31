import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { RouterModule, ExtraOptions } from '@angular/router';

import { App } from './app'; // seu componente raiz
import { Header } from './header/header';
import { FlavorsModule } from './flavors/flavors.module';
import { Presentation } from './presentation/presentation';
import { Contacts } from './contacts/contacts';
import { Menu } from './menu/menu';
import { routes } from './app.routes';
import { Template } from './template/template';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
};

@NgModule({
  declarations: [App, Header, Presentation, Contacts, Menu, Template],
  imports: [
    BrowserModule,
    FlavorsModule,
    MatCardModule,
    RouterModule.forRoot(routes, routerOptions),
    BrowserAnimationsModule,
    
  ],
  bootstrap: [App]
})
export class AppModule { }
