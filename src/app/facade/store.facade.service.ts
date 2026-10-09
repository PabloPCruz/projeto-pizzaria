import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { STORE_INFO } from '../data/store-info';
import { StoreHoursService, closedNotice, statusLabel } from '../services/store-hours.service';
import { WhatsappMessageService } from '../services/whatsapp-message.service';

/** O que a tela precisa saber da loja agora. */
export interface StoreView {
  open: boolean;
  /** Selo curto: "Aberto até 23h" / "Fechado · abre segunda 18h". */
  label: string;
  /** Aviso completo quando fechada (vazio se aberta). */
  notice: string;
}

/** Estado e textos do horário de funcionamento para os componentes. */
@Injectable({ providedIn: 'root' })
export class StoreFacadeService {
  readonly view$: Observable<StoreView>;
  readonly hoursText = this.hours.hoursText;
  readonly closedDaysText = this.hours.closedDaysText;
  /** Link do WhatsApp oficial da loja (sem mensagem) e do telefone: fonte única para contatos e rodapé. */
  readonly whatsappUrl = this.whatsapp.chatUrl;
  readonly phoneUrl = `tel:+55${STORE_INFO.phoneDisplay.replace(/\D/g, '')}`;
  /** Link do WhatsApp oficial da loja com a mensagem pronta de pedido de promoções. */
  readonly promoSignupUrl = this.whatsapp.linkFromMessage(STORE_INFO.promoSignupMessage);

  constructor(
    private hours: StoreHoursService,
    private whatsapp: WhatsappMessageService
  ) {
    this.view$ = this.hours.status$.pipe(
      map((status) => ({
        open: status.open,
        label: statusLabel(status),
        notice: status.open ? '' : closedNotice(status),
      }))
    );
  }
}
