import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoreHoursService, closedNotice, statusLabel } from '../services/store-hours.service';

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

  constructor(private hours: StoreHoursService) {
    this.view$ = this.hours.status$.pipe(
      map((status) => ({
        open: status.open,
        label: statusLabel(status),
        notice: status.open ? '' : closedNotice(status),
      }))
    );
  }
}
