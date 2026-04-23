import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { OrderData } from '../interfaces/order-data.interface';
import { Address } from '../interfaces/address.interface';

export interface CartItem extends OrderData {
  id: string;
  quantidade: number;
  valor: number;
  data: Date;
  endereco: Address;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('carrinho');
    if (savedCart) {
      try {
        this.cartItems.next(JSON.parse(savedCart));
      } catch (e) {
        this.cartItems.next([]);
      }
    }
  }

  private saveCartToStorage(): void {
    localStorage.setItem('carrinho', JSON.stringify(this.cartItems.value));
  }

  addToCart(item: CartItem): void {
    const currentItems = this.cartItems.value;
    item.id = Date.now().toString();
    item.data = new Date();
    currentItems.push(item);
    this.cartItems.next(currentItems);
    this.saveCartToStorage();
  }

  removeFromCart(id: string): void {
    const updatedItems = this.cartItems.value.filter(item => item.id !== id);
    this.cartItems.next(updatedItems);
    this.saveCartToStorage();
  }

  updateQuantity(id: string, quantidade: number): void {
    const items = this.cartItems.value;
    const item = items.find(i => i.id === id);
    if (item) {
      item.quantidade = quantidade;
      this.cartItems.next([...items]);
      this.saveCartToStorage();
    }
  }

  getCartItems(): CartItem[] {
    return this.cartItems.value;
  }

  getCartTotal(): number {
    return this.cartItems.value.reduce((total, item) => total + (item.valor * item.quantidade), 0);
  }

  getCartItemsCount(): number {
    return this.cartItems.value.reduce((total, item) => total + item.quantidade, 0);
  }

  clearCart(): void {
    this.cartItems.next([]);
    this.saveCartToStorage();
  }
}
