import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { ClockService } from '../../src/app/services/clock.service';
import { STORE_STATUS_TICK } from '../../src/app/services/store-hours.service';

/** Terça-feira, 19h em Brasília: loja aberta. É o "agora" padrão de todos os testes. */
export const OPEN_INSTANT = '2026-10-06T19:00:00-03:00';
/** Domingo, meio-dia em Brasília: loja fechada. */
export const SUNDAY_INSTANT = '2026-10-04T12:00:00-03:00';

export class FakeClock extends ClockService {
  private time = Date.parse(OPEN_INSTANT);

  set(iso: string): void {
    this.time = Date.parse(iso);
  }

  override now(): number {
    return this.time;
  }
}

export const fakeClock = new FakeClock();

/**
 * Reinicia o módulo de teste (para simular "recarregar a página") SEM perder o relógio falso:
 * o reset descarta os provedores de _setup.spec.ts e, sem eles, o relógio real faria dados salvos expirarem.
 */
export function resetKeepingClock(): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ClockService, useValue: fakeClock },
      { provide: STORE_STATUS_TICK, useValue: NEVER },
    ],
  });
}
