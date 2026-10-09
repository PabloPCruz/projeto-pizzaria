import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  ArrowLeft,
  ArrowRight,
  CakeSlice,
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  Info,
  LoaderCircle,
  LucideAngularModule,
  MapPinned,
  Menu,
  Minus,
  Phone,
  Pizza,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Pencil,
  Wine,
  X,
  CalendarX,
  CupSoda,
} from 'lucide-angular';
import { BrandIconComponent } from './brand-icon.component';
import { FlavorCardComponent } from './flavor-card.component';
import { FlavorImageComponent } from './flavor-image.component';
import { RevealDirective } from './reveal.directive';
import { PriceComponent } from './price.component';
import { PriceRuleNoticeComponent } from './price-rule-notice.component';
import { LogoComponent } from './logo.component';
import { MoneyPipe } from './money.pipe';
import { QuantityStepperComponent } from './quantity-stepper.component';
import { DeliveryFreeComponent } from './delivery-free.component';
import { DrinkPickerComponent } from './drink-picker.component';
import { TextFieldComponent } from './text-field.component';

/** Somente os ícones usados: o resto do lucide fica fora do bundle. */
const ICONS = LucideAngularModule.pick({
  ArrowLeft,
  ArrowRight,
  CakeSlice,
  CalendarX,
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  CupSoda,
  Info,
  LoaderCircle,
  MapPinned,
  Menu,
  Minus,
  Phone,
  Pizza,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Pencil,
  Tag,
  Trash2,
  Truck,
  Wine,
  X,
});

const SHARED = [DeliveryFreeComponent, DrinkPickerComponent,TextFieldComponent, LogoComponent, MoneyPipe, BrandIconComponent, FlavorCardComponent, FlavorImageComponent, RevealDirective, PriceComponent, PriceRuleNoticeComponent, QuantityStepperComponent];

@NgModule({
  declarations: SHARED,
  imports: [CommonModule, ICONS],
  exports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, ...SHARED],
})
export class SharedModule {}
