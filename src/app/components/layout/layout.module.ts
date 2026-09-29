import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { FooterComponent } from './footer.component';
import { HeaderComponent } from './header.component';
import { MobileBarComponent } from './mobile-bar.component';

@NgModule({
  declarations: [HeaderComponent, FooterComponent, MobileBarComponent],
  imports: [SharedModule],
  exports: [HeaderComponent, FooterComponent, MobileBarComponent],
})
export class LayoutModule {}
