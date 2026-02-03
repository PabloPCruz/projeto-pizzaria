import {Injectable } from "@angular/core";
import { ViewCart } from "../interfaces/view-cart.interface";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class ViewCartService {
    private cartItems: ViewCart[] = []
    public cartItemsSubject = new BehaviorSubject<ViewCart[]>([]);

}