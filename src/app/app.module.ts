import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';

import { App } from './app'; // seu componente raiz
import { Header } from './header/header';
import { FlavorsModule } from './flavors/flavors.module';
import { Presentation } from './presentation/presentation';
import { Contacts } from './contacts/contacts';
import { Menu } from './menu/menu';

@NgModule({
  declarations: [App, Header, Presentation, Contacts, Menu],
  imports: [BrowserModule, FlavorsModule, MatCardModule],
  bootstrap: [App]
})
export class AppModule { }
