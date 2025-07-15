import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FlavorsCards } from './flavors-cards/flavors-cards';
import { Flavors } from './flavors';

@NgModule({
  declarations: [FlavorsCards, Flavors],
  imports: [
    CommonModule,
    MatCardModule,
  ],
  exports: [FlavorsCards, Flavors] // Exporta para outros módulos, como AppModule
})
export class FlavorsModule { }