import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, ExtraOptions } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { App } from './app'; // seu componente raiz
import { HeaderModule } from './header/header.module'; // módulo do cabeçalho
import { FlavorsModule } from './flavors/flavors.module';
import { Presentation } from './presentation/presentation';
import { Contacts } from './contacts/contacts';
import { Menu } from './menu/menu';
import { routes } from './app.routes';
import { Template } from './template/template';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OrderModule } from './order/order.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
  scrollOffset: [0, 64],
};

@NgModule({
  declarations: [App, Presentation, Contacts, Menu, Template],
  imports: [
    BrowserModule,
    FlavorsModule,
    MatCardModule,
    OrderModule,
    HeaderModule,
    RouterModule.forRoot(routes, routerOptions),
    BrowserAnimationsModule,
    MatIconModule,
    MatFormFieldModule,
    MatDialogModule,
    
  ],
  bootstrap: [App]
})
export class AppModule { }
