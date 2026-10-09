import { Injectable } from '@angular/core';
import { LastOrderService } from '../services/last-order.service';
import { PersistenceService } from '../services/persistence.service';
import { CheckoutFacadeService } from './checkout.facade.service';

/** Privacidade: tudo o que o site guarda fica neste aparelho, e o cliente pode apagar quando quiser. */
@Injectable({ providedIn: 'root' })
export class PrivacyFacadeService {
  constructor(
    private checkout: CheckoutFacadeService,
    private lastOrder: LastOrderService,
    private persistence: PersistenceService
  ) {}

  /** Apaga carrinho, formulário (nome, telefone, endereço), pizza em montagem e último pedido, na tela e no aparelho. */
  eraseMyData(): void {
    this.checkout.startOver();
    this.lastOrder.clear();
    // Varredura final: qualquer outra chave do site (passo do montador, versões antigas) também sai.
    this.persistence.clearAll();
  }
}
