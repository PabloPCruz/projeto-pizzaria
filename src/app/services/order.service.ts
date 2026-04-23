import { Injectable } from '@angular/core';
import { OrderData } from '../interfaces/order-data.interface';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private orderData!: OrderData;

  setOrder(order: OrderData): void {
    this.orderData = { ...order };
  }

  getOrder(): OrderData {
    return { ...this.orderData };
  }
}