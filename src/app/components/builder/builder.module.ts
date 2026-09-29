import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { BuilderPageComponent } from './builder-page.component';
import { CrustStepComponent } from './crust-step.component';
import { ExtrasStepComponent } from './extras-step.component';
import { FlavorsStepComponent } from './flavors-step.component';
import { PizzaSummaryComponent } from './pizza-summary.component';
import { ReviewStepComponent } from './review-step.component';
import { SizeStepComponent } from './size-step.component';

@NgModule({
  declarations: [
    BuilderPageComponent,
    SizeStepComponent,
    FlavorsStepComponent,
    CrustStepComponent,
    ExtrasStepComponent,
    ReviewStepComponent,
    PizzaSummaryComponent,
  ],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: BuilderPageComponent }])],
})
export class BuilderModule {}
