import { Inject, Injectable, InjectionToken, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith } from 'rxjs/operators';
import { STORE_INFO } from '../data/store-info';
import { NextOpening, StoreSchedule, StoreStatus } from '../interfaces/store-hours.interface';
import { ClockService } from './clock.service';

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const WEEKDAY_NAME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const WEEKDAY_PLURAL = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];
/** "aos domingos / aos sábados", mas "às segundas ... às sextas". */
const WEEKDAY_PREPOSITION = ['aos', 'às', 'às', 'às', 'às', 'às', 'aos'];
/** Procura a próxima abertura em até 15 dias. */
const LOOKAHEAD_DAYS = 15;

const OPEN_NOW: StoreStatus = { open: true, reason: 'open', closesAt: null, nextOpening: null };

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Dia da semana, data e minutos do dia no fuso da loja (independe do fuso do aparelho). */
function zonedParts(instant: number, timeZone: string): { weekday: number; date: string; minutes: number } {
  const parts: Record<string, string> = {};
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  for (const part of formatter.formatToParts(instant)) parts[part.type] = part.value;
  return {
    weekday: WEEKDAY_INDEX[parts['weekday']],
    date: `${parts['year']}-${parts['month']}-${parts['day']}`,
    minutes: (Number(parts['hour']) % 24) * 60 + Number(parts['minute']),
  };
}

function addDays(date: string, days: number): { date: string; weekday: number } {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return { date: t.toISOString().slice(0, 10), weekday: t.getUTCDay() };
}

function findNextOpening(today: { date: string; minutes: number }, schedule: StoreSchedule): NextOpening | null {
  const opens = toMinutes(schedule.opensAt);
  for (let i = 0; i <= LOOKAHEAD_DAYS; i++) {
    if (i === 0 && today.minutes >= opens) continue;
    const day = addDays(today.date, i);
    if (!schedule.openDays.includes(day.weekday) || schedule.closedDates.includes(day.date)) continue;
    return { date: day.date, weekday: day.weekday, at: schedule.opensAt, when: i === 0 ? 'today' : i === 1 ? 'tomorrow' : 'later' };
  }
  return null;
}

/**
 * Estado da loja num instante, sempre no fuso da loja. Se o navegador não conseguir resolver o fuso,
 * falha aberto: o bloqueio é conveniência (a loja confirma o pedido de qualquer forma).
 */
export function getStoreStatus(instant: number, schedule: StoreSchedule): StoreStatus {
  let now: { weekday: number; date: string; minutes: number };
  try {
    now = zonedParts(instant, schedule.timeZone);
  } catch (error) {
    console.warn('Não foi possível calcular o horário da loja; considerando aberta.', error);
    return OPEN_NOW;
  }
  const closed = (reason: 'closed-day' | 'closed-date' | 'before-open' | 'after-close'): StoreStatus => ({
    open: false,
    reason,
    closesAt: null,
    nextOpening: findNextOpening(now, schedule),
  });

  if (!schedule.openDays.includes(now.weekday)) return closed('closed-day');
  if (schedule.closedDates.includes(now.date)) return closed('closed-date');
  if (now.minutes < toMinutes(schedule.opensAt)) return closed('before-open');
  if (now.minutes >= toMinutes(schedule.closesAt)) return closed('after-close');
  return { open: true, reason: 'open', closesAt: schedule.closesAt, nextOpening: null };
}

/** '18:00' -> '18h'; '23:30' -> '23h30'. */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

function describeWhen(next: NextOpening, withPreposition: boolean): string {
  const day = next.when === 'today' ? 'hoje' : next.when === 'tomorrow' ? 'amanhã' : WEEKDAY_NAME[next.weekday];
  return `${day}${withPreposition ? ' às' : ''} ${formatClock(next.at)}`;
}

/** Texto curto do selo do cabeçalho. */
export function statusLabel(status: StoreStatus): string {
  if (status.open) return `Aberto até ${formatClock(status.closesAt as string)}`;
  return status.nextOpening ? `Fechado · abre ${describeWhen(status.nextOpening, false)}` : 'Fechado no momento';
}

/** Aviso completo exibido no carrinho quando a loja está fechada. */
export function closedNotice(status: StoreStatus): string {
  const lead =
    status.reason === 'before-open'
      ? 'Ainda não abrimos hoje.'
      : status.reason === 'after-close'
        ? 'Já encerramos o atendimento de hoje.'
        : 'Hoje a loja está fechada.';
  const tail = 'Você pode deixar o pedido pronto e enviá-lo quando abrirmos';
  return status.nextOpening ? `${lead} ${tail}: ${describeWhen(status.nextOpening, true)}.` : `${lead} ${tail}.`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function joinList(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

/** "Segunda a sábado, das 18h às 23h" (gerado da tabela). */
export function scheduleSummary(schedule: StoreSchedule): string {
  const days = [...schedule.openDays].sort((a, b) => a - b);
  const contiguous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  const dayText =
    days.length >= 3 && contiguous
      ? `${capitalize(WEEKDAY_NAME[days[0]])} a ${WEEKDAY_NAME[days[days.length - 1]]}`
      : capitalize(joinList(days.map((d) => WEEKDAY_NAME[d])));
  return `${dayText}, das ${formatClock(schedule.opensAt)} às ${formatClock(schedule.closesAt)}`;
}

/** "Fechado aos domingos" (gerado da tabela); vazio se abre todos os dias. */
export function closedDaysNotice(schedule: StoreSchedule): string {
  const closedDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !schedule.openDays.includes(d));
  if (closedDays.length === 0) return '';
  return `Fechado ${joinList(closedDays.map((d) => `${WEEKDAY_PREPOSITION[d]} ${WEEKDAY_PLURAL[d]}`))}`;
}

/** Reavalia o estado da loja a cada 30 s. */
const REFRESH_MS = 30_000;

/**
 * Sinal de "reavalie o horário": a cada 30 s e quando a aba volta ao foco. O timer roda fora do NgZone
 * (um intervalo dentro dele impede a aplicação de ficar "estável"); só a emissão volta para dentro.
 * Nos testes é substituído por `NEVER` (ver test/_setup.spec.ts).
 */
export function createStatusTick(zone: NgZone): Observable<void> {
  return new Observable<void>((subscriber) => {
    const emit = () => zone.run(() => subscriber.next());
    const onVisibility = () => {
      if (document.visibilityState === 'visible') emit();
    };
    let timer: ReturnType<typeof setInterval> | undefined;
    zone.runOutsideAngular(() => {
      timer = setInterval(emit, REFRESH_MS);
      document.addEventListener('visibilitychange', onVisibility);
    });
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });
}

export const STORE_STATUS_TICK = new InjectionToken<Observable<void>>('STORE_STATUS_TICK', {
  providedIn: 'root',
  factory: () => createStatusTick(inject(NgZone)),
});

const sameStatus = (a: StoreStatus, b: StoreStatus) => JSON.stringify(a) === JSON.stringify(b);

/** Horário de funcionamento: `snapshot()` calcula na hora (usar no envio); `status$` acompanha o relógio. */
@Injectable({ providedIn: 'root' })
export class StoreHoursService {
  readonly schedule = STORE_INFO.schedule;
  /** "Segunda a sábado, das 18h às 23h", gerado da tabela. */
  readonly hoursText = scheduleSummary(this.schedule);
  /** "Fechado aos domingos", gerado da tabela. */
  readonly closedDaysText = closedDaysNotice(this.schedule);
  readonly status$: Observable<StoreStatus>;

  constructor(
    private clock: ClockService,
    @Inject(STORE_STATUS_TICK) tick$: Observable<void>
  ) {
    this.status$ = tick$.pipe(
      startWith(undefined),
      map(() => this.snapshot()),
      distinctUntilChanged(sameStatus),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /** Estado agora, sem cache. */
  snapshot(): StoreStatus {
    return getStoreStatus(this.clock.now(), this.schedule);
  }
}
