import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { App } from './app'; // seu componente raiz
import { Header } from './header/header';
import { FlavorsModule } from './flavors/flavors.module';

@NgModule({
  declarations: [App, Header],
  imports: [BrowserModule, FlavorsModule],
  bootstrap: [App]
})
export class AppModule {}
