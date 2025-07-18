import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { App } from './app'; // seu componente raiz
import { Header } from './header/header';
import { FlavorsModule } from './flavors/flavors.module';
import { Presentation } from './presentation/presentation';
import { Contacts } from './contacts/contacts';

@NgModule({
  declarations: [App, Header, Presentation, Contacts],
  imports: [BrowserModule, FlavorsModule],
  bootstrap: [App]
})
export class AppModule {}
