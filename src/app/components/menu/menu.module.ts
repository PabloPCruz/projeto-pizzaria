import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { MenuExtrasComponent } from './menu-extras.component';
import { MenuPageComponent } from './menu-page.component';
import { MenuSizesComponent } from './menu-sizes.component';

@NgModule({
  declarations: [MenuPageComponent, MenuSizesComponent, MenuExtrasComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: MenuPageComponent }])],
})
export class MenuModule {}
