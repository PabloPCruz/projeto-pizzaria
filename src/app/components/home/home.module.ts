import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { ContactSectionComponent } from './contact-section.component';
import { FeaturedFlavorsComponent } from './featured-flavors.component';
import { HomePageComponent } from './home-page.component';
import { PromoCtaComponent } from './promo-cta.component';

@NgModule({
  declarations: [HomePageComponent, FeaturedFlavorsComponent, ContactSectionComponent, PromoCtaComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: HomePageComponent }])],
})
export class HomeModule {}
