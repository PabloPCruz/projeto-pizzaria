import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

import { OrderService } from './order.service';
import { OrderComponent } from './order';

@NgModule({
    declarations: [OrderComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDialogModule,
        MatSelectModule
    ],
    providers: [
        OrderService  // Seu service
    ],
    exports: [
        OrderComponent  // Exportar para usar em outros módulos
    ]
})
export class OrderModule { }