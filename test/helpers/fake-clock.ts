import { ClockService } from '../../src/app/services/clock.service';

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
