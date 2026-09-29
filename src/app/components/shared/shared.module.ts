import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Flame,
  Info,
  LoaderCircle,
  LucideAngularModule,
  MapPin,
  Menu,
  Minus,
  Phone,
  Pizza,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  Wine,
  X,
  CalendarX,
  CupSoda,
  ExternalLink,
  Utensils,
} from 'lucide-angular';
import { BrandIconComponent } from './brand-icon.component';
import { FlavorCardComponent } from './flavor-card.component';
import { PriceComponent } from './price.component';
import { LogoComponent } from './logo.component';
import { MoneyPipe } from './money.pipe';
import { QuantityStepperComponent } from './quantity-stepper.component';
import { DrinkPickerComponent } from './drink-picker.component';
import { TextFieldComponent } from './text-field.component';

/** Somente os ícones usados: o resto do lucide fica fora do bundle. */
const ICONS = LucideAngularModule.pick({
  ArrowLeft,
  ArrowRight,
  CalendarX,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  CupSoda,
  ExternalLink,
  Flame,
  Info,
  LoaderCircle,
  MapPin,
  Menu,
  Minus,
  Phone,
  Pizza,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  Utensils,
  Wine,
  X,
});

const SHARED = [DrinkPickerComponent, TextFieldComponent, LogoComponent, MoneyPipe, BrandIconComponent, FlavorCardComponent, PriceComponent, QuantityStepperComponent];

@NgModule({
  declarations: SHARED,
  imports: [CommonModule, ICONS],
  exports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, ...SHARED],
})
export class SharedModule {}
