import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Header } from "./header";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule
    ],
    declarations: [Header],
    exports: [Header]
})

export class HeaderModule { }