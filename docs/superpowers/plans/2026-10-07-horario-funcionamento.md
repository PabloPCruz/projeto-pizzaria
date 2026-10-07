# Horário de funcionamento — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquear o envio do pedido pelo WhatsApp quando a loja está fechada (domingo, fora de 18h–23h e datas fechadas), com selo ao vivo no cabeçalho e aviso no carrinho.

**Architecture:** Uma função pura `getStoreStatus(instante, schedule)` calcula o estado no fuso `America/Sao_Paulo`. `StoreHoursService` a expõe como `snapshot()` (sem cache, usado no envio) e `status$` (reavalia a cada 30 s e ao voltar ao foco). `StoreFacadeService` entrega textos prontos aos componentes. `CheckoutFacadeService.submit()` recalcula o estado a cada clique e recusa o envio se fechado.

**Tech Stack:** Angular 17 (NgModule), RxJS, Tailwind, Karma/Jasmine. Spec: `docs/superpowers/specs/2026-10-07-horario-funcionamento-design.md`.

## Global Constraints

- Angular NgModule (não standalone). Componentes finos: regra e texto em services/facades. Facades: `*.facade.service.ts`; services: `*.service.ts`; interfaces: `*.interface.ts`.
- Horário: segunda a sábado, `18:00` a `23:00` (23:00 em ponto já está fechado); domingo fechado; `closedDates` (lista `AAAA-MM-DD`) começa **vazia**; fuso fixo `America/Sao_Paulo`, nunca `getDay()`/`getHours()`.
- Fechado: o cliente navega e monta o carrinho; **só o envio é bloqueado**. Sem caixa de "estou ciente", sem pedido agendado.
- A mensagem do WhatsApp **não muda** (nenhum pedido sai com a loja fechada).
- Texto da mensagem do WhatsApp: sem emoji nem caractere acima de U+FFFF (teste existente). Textos novos da UI em português.
- O site nunca calcula nem exibe taxa de entrega (decisão existente).
- Testes: nenhum teste pode depender do relógio real. Um `beforeEach` global fixa terça 19h (aberto).
- Comandos: build `npm run build`; testes `npx ng test --watch=false --browsers=ChromeHeadless` (subconjunto: `--include=../test/arquivo.spec.ts`).

---

### Task 1: Interfaces, relógio, dados e lógica pura do horário

**Files:**
- Create: `src/app/interfaces/store-hours.interface.ts`
- Create: `src/app/services/clock.service.ts`
- Create: `src/app/services/store-hours.service.ts` (nesta task só as funções puras; o serviço entra na Task 2)
- Modify: `src/app/data/store-info.ts`
- Test: `test/store-hours.service.spec.ts`

**Interfaces:**
- Produces: `StoreSchedule`, `StoreStatus`, `NextOpening`; `ClockService.now(): number`; `getStoreStatus(instant: number, schedule: StoreSchedule): StoreStatus`; `formatClock(hhmm): string`; `statusLabel(status): string`; `closedNotice(status): string`; `scheduleSummary(schedule): string`; `closedDaysNotice(schedule): string`; `STORE_INFO.schedule`.

- [ ] **Step 1: Criar as interfaces**

`src/app/interfaces/store-hours.interface.ts`:

```ts
/** Horário de funcionamento da loja. Dias: 0 = domingo ... 6 = sábado. */
export interface StoreSchedule {
  timeZone: string;
  openDays: readonly number[];
  /** 'HH:mm' (24 h). Abre exatamente nesse minuto. */
  opensAt: string;
  /** 'HH:mm' (24 h). Fecha exatamente nesse minuto (23:00 já está fechado). */
  closesAt: string;
  /** Datas fechadas ('AAAA-MM-DD'), tratadas como dia fechado. */
  closedDates: readonly string[];
}

export interface NextOpening {
  /** 'AAAA-MM-DD' */
  date: string;
  weekday: number;
  /** 'HH:mm' */
  at: string;
  when: 'today' | 'tomorrow' | 'later';
}

export type StoreClosedReason = 'closed-day' | 'closed-date' | 'before-open' | 'after-close';

export interface StoreStatus {
  open: boolean;
  reason: 'open' | StoreClosedReason;
  /** 'HH:mm' quando aberto. */
  closesAt: string | null;
  nextOpening: NextOpening | null;
}
```

- [ ] **Step 2: Criar o `ClockService`**

`src/app/services/clock.service.ts`:

```ts
import { Injectable } from '@angular/core';

/** Fonte única do "agora" (epoch ms). Existe para os testes fixarem o instante. */
@Injectable({ providedIn: 'root' })
export class ClockService {
  now(): number {
    return Date.now();
  }
}
```

- [ ] **Step 3: Acrescentar `schedule` em `STORE_INFO` (sem remover ainda os campos antigos)**

Em `src/app/data/store-info.ts`, logo depois de `closedNotice`, antes de `promoNotice`:

```ts
  /** Horário de funcionamento (a fonte da regra e dos textos exibidos). Datas fechadas: 'AAAA-MM-DD'. */
  schedule: {
    timeZone: 'America/Sao_Paulo',
    openDays: [1, 2, 3, 4, 5, 6],
    opensAt: '18:00',
    closesAt: '23:00',
    closedDates: [] as string[],
  },
```

- [ ] **Step 4: Escrever o teste que falha**

`test/store-hours.service.spec.ts`:

```ts
import { STORE_INFO } from '../src/app/data/store-info';
import { StoreSchedule } from '../src/app/interfaces/store-hours.interface';
import {
  closedDaysNotice,
  closedNotice,
  formatClock,
  getStoreStatus,
  scheduleSummary,
  statusLabel,
} from '../src/app/services/store-hours.service';

const SCHEDULE: StoreSchedule = STORE_INFO.schedule;
const at = (iso: string) => getStoreStatus(Date.parse(iso), SCHEDULE);

describe('getStoreStatus (horário de Brasília)', () => {
  it('domingo ao meio-dia: fechado, abre segunda 18h', () => {
    const s = at('2026-10-04T12:00:00-03:00');
    expect(s.open).toBeFalse();
    expect(s.reason).toBe('closed-day');
    expect(s.nextOpening).toEqual({ date: '2026-10-05', weekday: 1, at: '18:00', when: 'tomorrow' });
  });

  it('fronteiras de segunda: 17:59:59 fechado, 18:00:00 aberto, 22:59:59 aberto, 23:00:00 fechado', () => {
    const before = at('2026-10-05T17:59:59-03:00');
    expect(before.reason).toBe('before-open');
    expect(before.nextOpening).toEqual({ date: '2026-10-05', weekday: 1, at: '18:00', when: 'today' });

    const opens = at('2026-10-05T18:00:00-03:00');
    expect(opens.open).toBeTrue();
    expect(opens.closesAt).toBe('23:00');
    expect(opens.nextOpening).toBeNull();

    expect(at('2026-10-05T22:59:59-03:00').open).toBeTrue();

    const closes = at('2026-10-05T23:00:00-03:00');
    expect(closes.open).toBeFalse();
    expect(closes.reason).toBe('after-close');
    expect(closes.nextOpening).toEqual({ date: '2026-10-06', weekday: 2, at: '18:00', when: 'tomorrow' });
  });

  it('sábado depois das 23h: a próxima abertura pula o domingo', () => {
    const s = at('2026-10-10T23:30:00-03:00');
    expect(s.reason).toBe('after-close');
    expect(s.nextOpening).toEqual({ date: '2026-10-12', weekday: 1, at: '18:00', when: 'later' });
  });

  it('virada sábado -> domingo -> segunda', () => {
    expect(at('2026-10-10T23:59:59-03:00').reason).toBe('after-close');
    expect(at('2026-10-11T00:00:00-03:00').reason).toBe('closed-day');
    expect(at('2026-10-11T23:59:59-03:00').reason).toBe('closed-day');
    const monday = at('2026-10-12T00:00:00-03:00');
    expect(monday.reason).toBe('before-open');
    expect(monday.nextOpening?.when).toBe('today');
  });

  it('usa o fuso de Brasília, não o do aparelho: 02:00Z de domingo ainda é sábado 23h em Brasília', () => {
    expect(at('2026-10-11T02:00:00Z').reason).toBe('after-close');
  });

  it('usa o fuso de Brasília: 02:30Z de segunda ainda é domingo 23h30 em Brasília', () => {
    expect(at('2026-10-05T02:30:00Z').reason).toBe('closed-day');
  });

  describe('datas fechadas', () => {
    const withClosed = (closedDates: string[]): StoreSchedule => ({ ...SCHEDULE, closedDates });

    it('data fechada em dia útil vira closed-date e a próxima abertura é o dia seguinte', () => {
      const s = getStoreStatus(Date.parse('2026-10-07T12:00:00-03:00'), withClosed(['2026-10-07']));
      expect(s.reason).toBe('closed-date');
      expect(s.nextOpening).toEqual({ date: '2026-10-08', weekday: 4, at: '18:00', when: 'tomorrow' });
    });

    it('data fechada que cai no domingo continua closed-day', () => {
      const s = getStoreStatus(Date.parse('2026-10-04T12:00:00-03:00'), withClosed(['2026-10-04']));
      expect(s.reason).toBe('closed-day');
    });

    it('a próxima abertura pula datas fechadas consecutivas', () => {
      const s = getStoreStatus(Date.parse('2026-10-05T23:30:00-03:00'), withClosed(['2026-10-06', '2026-10-07']));
      expect(s.nextOpening).toEqual({ date: '2026-10-08', weekday: 4, at: '18:00', when: 'later' });
    });

    it('lista vazia não muda nada', () => {
      expect(getStoreStatus(Date.parse('2026-10-12T19:00:00-03:00'), withClosed([])).open).toBeTrue();
    });
  });

  it('sem nenhuma abertura em 15 dias, nextOpening é null', () => {
    const never: StoreSchedule = { ...SCHEDULE, openDays: [] };
    const s = getStoreStatus(Date.parse('2026-10-05T19:00:00-03:00'), never);
    expect(s.open).toBeFalse();
    expect(s.nextOpening).toBeNull();
  });

  it('fuso inválido falha aberto (o bloqueio é conveniência, não segurança)', () => {
    spyOn(console, 'warn');
    const s = getStoreStatus(Date.now(), { ...SCHEDULE, timeZone: 'Marte/Olympus' });
    expect(s.open).toBeTrue();
  });
});

describe('textos do horário', () => {
  it('formatClock', () => {
    expect(formatClock('18:00')).toBe('18h');
    expect(formatClock('23:30')).toBe('23h30');
    expect(formatClock('09:05')).toBe('9h05');
  });

  it('scheduleSummary e closedDaysNotice vêm da tabela', () => {
    expect(scheduleSummary(SCHEDULE)).toBe('Segunda a sábado, das 18h às 23h');
    expect(closedDaysNotice(SCHEDULE)).toBe('Fechado aos domingos');
    expect(closedDaysNotice({ ...SCHEDULE, openDays: [1, 2, 3, 4, 5] })).toBe('Fechado aos sábados e aos domingos');
    expect(closedDaysNotice({ ...SCHEDULE, openDays: [0, 1, 2, 3, 4, 5, 6] })).toBe('');
  });

  it('statusLabel (selo curto)', () => {
    expect(statusLabel(at('2026-10-05T19:00:00-03:00'))).toBe('Aberto até 23h');
    expect(statusLabel(at('2026-10-04T12:00:00-03:00'))).toBe('Fechado · abre amanhã 18h');
    expect(statusLabel(at('2026-10-10T23:30:00-03:00'))).toBe('Fechado · abre segunda 18h');
    expect(statusLabel(at('2026-10-05T10:00:00-03:00'))).toBe('Fechado · abre hoje 18h');
  });

  it('closedNotice (aviso completo)', () => {
    expect(closedNotice(at('2026-10-11T12:00:00-03:00'))).toBe(
      'Hoje a loja está fechada. Você pode deixar o pedido pronto e enviá-lo quando abrirmos: amanhã às 18h.'
    );
    expect(closedNotice(at('2026-10-10T23:30:00-03:00'))).toBe(
      'Já encerramos o atendimento de hoje. Você pode deixar o pedido pronto e enviá-lo quando abrirmos: segunda às 18h.'
    );
    expect(closedNotice(at('2026-10-05T10:00:00-03:00'))).toBe(
      'Ainda não abrimos hoje. Você pode deixar o pedido pronto e enviá-lo quando abrirmos: hoje às 18h.'
    );
  });
});
```

- [ ] **Step 5: Rodar o teste e ver falhar**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include=../test/store-hours.service.spec.ts`
Expected: FAIL (erro de compilação: `store-hours.service` não exporta `getStoreStatus` etc.).

- [ ] **Step 6: Implementar as funções puras**

`src/app/services/store-hours.service.ts`:

```ts
import { NextOpening, StoreSchedule, StoreStatus } from '../interfaces/store-hours.interface';

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
```

- [ ] **Step 7: Rodar o teste e ver passar**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include=../test/store-hours.service.spec.ts`
Expected: PASS (todos os testes de `getStoreStatus` e de textos).

> Se a asserção de `closedDaysNotice` com `[1,2,3,4,5]` falhar por ordem ("aos sábados e aos domingos"), os dias fechados saem em ordem 0..6 ("aos domingos e aos sábados"); ajuste a expectativa do teste para essa ordem, que é a do código.

- [ ] **Step 8: Commit**

```bash
git add src/app/interfaces/store-hours.interface.ts src/app/services/clock.service.ts src/app/services/store-hours.service.ts src/app/data/store-info.ts test/store-hours.service.spec.ts
git commit -m "feat: logica pura do horario de funcionamento (fuso de Brasilia)"
```

---

### Task 2: `StoreHoursService`, ticker, relógio fixo nos testes e `StoreFacadeService`

**Files:**
- Modify: `src/app/services/store-hours.service.ts` (acrescentar token, ticker e serviço)
- Create: `src/app/facade/store.facade.service.ts`
- Create: `test/helpers/fake-clock.ts`
- Create: `test/_setup.spec.ts`
- Test: `test/store-hours.service.spec.ts` (estender)

**Interfaces:**
- Consumes: `getStoreStatus`, `statusLabel`, `closedNotice`, `scheduleSummary`, `closedDaysNotice`, `ClockService`, `STORE_INFO.schedule` (Task 1).
- Produces: `STORE_STATUS_TICK: InjectionToken<Observable<void>>`; `createStatusTick(zone: NgZone): Observable<void>`; `StoreHoursService { snapshot(): StoreStatus; status$: Observable<StoreStatus>; hoursText: string; closedDaysText: string }`; `StoreFacadeService { view$: Observable<StoreView>; hoursText: string; closedDaysText: string }`; `StoreView { open: boolean; label: string; notice: string }`; testes: `fakeClock.set(iso)`, `OPEN_INSTANT`.

- [ ] **Step 1: Relógio falso e setup global**

`test/helpers/fake-clock.ts`:

```ts
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
```

`test/_setup.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { ClockService } from '../src/app/services/clock.service';
import { STORE_STATUS_TICK } from '../src/app/services/store-hours.service';
import { OPEN_INSTANT, fakeClock } from './helpers/fake-clock';

/** Nenhum teste depende do relógio real: todo teste começa "terça 19h" (aberto) e sem timers de reavaliação. */
beforeEach(() => {
  fakeClock.set(OPEN_INSTANT);
  TestBed.configureTestingModule({
    providers: [
      { provide: ClockService, useValue: fakeClock },
      { provide: STORE_STATUS_TICK, useValue: NEVER },
    ],
  });
});
```

- [ ] **Step 2: Escrever os testes do serviço (falham)**

Acrescentar ao final de `test/store-hours.service.spec.ts` (e ao topo os imports `fakeAsync`, `TestBed`, `tick`, `NgZone`, `Subject`, `StoreHoursService`, `STORE_STATUS_TICK`, `createStatusTick`, `StoreFacadeService`, `fakeClock`):

```ts
import { NgZone } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { StoreFacadeService } from '../src/app/facade/store.facade.service';
import { STORE_STATUS_TICK, StoreHoursService, createStatusTick } from '../src/app/services/store-hours.service';
import { SUNDAY_INSTANT, fakeClock } from './helpers/fake-clock';

describe('StoreHoursService', () => {
  it('snapshot lê o relógio no instante da chamada (sem cache)', () => {
    const hours = TestBed.inject(StoreHoursService);
    expect(hours.snapshot().open).toBeTrue();
    fakeClock.set(SUNDAY_INSTANT);
    expect(hours.snapshot().open).toBeFalse();
    fakeClock.set('2026-10-05T23:00:00-03:00');
    expect(hours.snapshot().reason).toBe('after-close');
  });

  it('status$ emite na assinatura e a cada tick, sem repetir estados iguais', () => {
    const tick$ = new Subject<void>();
    TestBed.overrideProvider(STORE_STATUS_TICK, { useValue: tick$ });
    const hours = TestBed.inject(StoreHoursService);
    const seen: string[] = [];
    const sub = hours.status$.subscribe((s) => seen.push(s.reason));

    tick$.next(); // nada mudou
    fakeClock.set('2026-10-06T23:00:00-03:00');
    tick$.next(); // fechou
    tick$.next(); // continua fechado
    fakeClock.set('2026-10-07T18:00:00-03:00');
    tick$.next(); // abriu
    sub.unsubscribe();

    expect(seen).toEqual(['open', 'after-close', 'open']);
  });

  it('expõe os textos gerados da tabela', () => {
    const hours = TestBed.inject(StoreHoursService);
    expect(hours.hoursText).toBe('Segunda a sábado, das 18h às 23h');
    expect(hours.closedDaysText).toBe('Fechado aos domingos');
  });
});

describe('createStatusTick', () => {
  it('emite a cada 30 s e ao voltar ao foco, e limpa tudo ao cancelar', fakeAsync(() => {
    spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');
    const zone = new NgZone({ enableLongStackTrace: false });
    let count = 0;
    const sub = createStatusTick(zone).subscribe(() => count++);

    tick(30_000);
    expect(count).toBe(1);
    tick(30_000);
    expect(count).toBe(2);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(count).toBe(3);

    sub.unsubscribe();
    tick(60_000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(count).toBe(3);
  }));
});

describe('StoreFacadeService', () => {
  it('view$ traz rótulo e aviso prontos', () => {
    const facade = TestBed.inject(StoreFacadeService);
    let view: { open: boolean; label: string; notice: string } | undefined;
    facade.view$.subscribe((v) => (view = v)).unsubscribe();
    expect(view).toEqual({ open: true, label: 'Aberto até 23h', notice: '' });

    fakeClock.set(SUNDAY_INSTANT);
    const closed = TestBed.inject(StoreFacadeService);
    closed.view$.subscribe((v) => (view = v)).unsubscribe();
    expect(view?.open).toBeFalse();
    expect(view?.label).toBe('Fechado · abre amanhã 18h');
    expect(view?.notice).toContain('Hoje a loja está fechada.');
  });
});
```

> Nota: no último teste, `StoreFacadeService` é singleton `providedIn: 'root'`; o `view$` é `defer`/cold por assinatura, então reassinar após `fakeClock.set(...)` recalcula. Implemente `view$` como `status$.pipe(map(...))` (cold por assinatura, com `shareReplay(refCount)` no `status$`, que se desfaz ao cancelar a última assinatura).

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include=../test/store-hours.service.spec.ts`
Expected: FAIL (compilação: `STORE_STATUS_TICK`, `StoreHoursService`, `createStatusTick`, `StoreFacadeService` não existem).

- [ ] **Step 4: Implementar token, ticker e serviço**

Em `src/app/services/store-hours.service.ts`, trocar o import do topo e acrescentar no fim:

```ts
import { Inject, Injectable, InjectionToken, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith } from 'rxjs/operators';
import { STORE_INFO } from '../data/store-info';
import { NextOpening, StoreSchedule, StoreStatus } from '../interfaces/store-hours.interface';
import { ClockService } from './clock.service';
```

```ts
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
```

- [ ] **Step 5: Implementar a facade**

`src/app/facade/store.facade.service.ts`:

```ts
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
```

- [ ] **Step 6: Rodar o teste e a suíte inteira**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS (suíte toda: os 258 antigos + os novos). Se algum teste antigo falhar por causa do setup global (por exemplo, um que chama `TestBed.resetTestingModule()` e depois `submit()`), registre qual é e corrija na Task 3.

- [ ] **Step 7: Commit**

```bash
git add src/app/services/store-hours.service.ts src/app/facade/store.facade.service.ts test/helpers/fake-clock.ts test/_setup.spec.ts test/store-hours.service.spec.ts
git commit -m "feat: StoreHoursService, ticker e StoreFacadeService; relogio fixo nos testes"
```

---

### Task 3: Bloqueio do envio na facade e no formulário

**Files:**
- Modify: `src/app/facade/checkout.facade.service.ts:14-16, 38-47 (construtor), 128-137 (submit)`
- Modify: `src/app/components/cart/checkout-form.component.ts:132-150 (submit)`
- Test: `test/checkout.facade.service.spec.ts` (estender)
- Test: `test/cart-page.component.spec.ts` (estender)

**Interfaces:**
- Consumes: `StoreHoursService.snapshot()`, `StoreStatus`, `fakeClock`, `SUNDAY_INSTANT` (Tasks 1–2).
- Produces: `CheckoutResult = { ok: true; url: string } | { ok: false; errors: CheckoutErrors; closed?: StoreStatus }`.

- [ ] **Step 1: Escrever os testes que falham**

Em `test/checkout.facade.service.spec.ts`, importar `fakeClock, SUNDAY_INSTANT` de `./helpers/fake-clock` e acrescentar dentro do `describe` (reaproveite o corpo de preenchimento do teste "submit devolve o link do WhatsApp quando tudo está preenchido", linhas 80-99, extraindo-o para uma função `fillValidOrder()` local; o corpo exato é o do teste existente):

```ts
  describe('loja fechada', () => {
    it('recusa o envio mesmo com tudo preenchido e não gera link', () => {
      fillValidOrder();
      fakeClock.set(SUNDAY_INSTANT);
      const result = facade.submit();
      expect(result.ok).toBeFalse();
      if (!result.ok) {
        expect(result.closed?.open).toBeFalse();
        expect(result.closed?.reason).toBe('closed-day');
        expect(result.errors).toEqual({});
      }
    });

    it('o horário é reavaliado no clique: aberto às 22h59, fechado às 23h00', () => {
      fillValidOrder();
      fakeClock.set('2026-10-05T22:59:59-03:00');
      expect(facade.submit().ok).toBeTrue();
      fakeClock.set('2026-10-05T23:00:00-03:00');
      expect(facade.submit().ok).toBeFalse();
    });

    it('carrinho e formulário continuam intactos depois da recusa', () => {
      fillValidOrder();
      const draftBefore = JSON.stringify(facade.draft);
      fakeClock.set(SUNDAY_INSTANT);
      facade.submit();
      expect(JSON.stringify(facade.draft)).toBe(draftBefore);
      expect(TestBed.inject(CartService).snapshot.pizzas.length + TestBed.inject(CartService).snapshot.drinks.length).toBeGreaterThan(0);
    });

    it('aberto: o link é idêntico ao de sempre', () => {
      fillValidOrder();
      const result = facade.submit();
      expect(result.ok).toBeTrue();
      if (result.ok) expect(result.url).toContain('https://wa.me/5541997449380?text=');
    });
  });
```

> Se `CartService` não expõe `snapshot.pizzas/drinks` com esses nomes, use o mesmo acesso que o teste existente de `submit` usa para montar o carrinho (linhas 80-99 do spec).

Em `test/cart-page.component.spec.ts`, importar `fakeClock, SUNDAY_INSTANT` e acrescentar no `describe` principal:

```ts
  describe('loja fechada', () => {
    it('Enter no formulário não abre o WhatsApp e leva o foco ao aviso', async () => {
      fakeClock.set(SUNDAY_INSTANT);
      create(true);
      fillValidForm();
      const open = spyOn(window, 'open');
      component().submit();
      await flush();
      expect(open).not.toHaveBeenCalled();
      expect(component().errorList.length).toBe(0);
    });
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include=../test/checkout.facade.service.spec.ts --include=../test/cart-page.component.spec.ts`
Expected: FAIL (`closed` não existe em `CheckoutResult`; `submit()` ainda gera link).

- [ ] **Step 3: Implementar na facade**

Em `src/app/facade/checkout.facade.service.ts`:

```ts
import { StoreStatus } from '../interfaces/store-hours.interface';
import { StoreHoursService } from '../services/store-hours.service';
```

Trocar o tipo:

```ts
export type CheckoutResult =
  | { ok: true; url: string }
  /** `closed` presente = a loja está fechada agora; `errors` vem vazio. */
  | { ok: false; errors: CheckoutErrors; closed?: StoreStatus };
```

Acrescentar ao construtor (último parâmetro): `private storeHours: StoreHoursService`. E no início de `submit()`:

```ts
  /** Valida e, estando tudo certo, devolve o link wa.me com a mensagem do pedido. Loja fechada: recusa antes de tudo. */
  submit(): CheckoutResult {
    // Sempre recalculado no clique: cobre a virada de horário/dia com a página aberta.
    const status = this.storeHours.snapshot();
    if (!status.open) return { ok: false, errors: {}, closed: status };
    const errors = this.validate();
    ...
```

- [ ] **Step 4: Implementar no formulário**

Em `src/app/components/cart/checkout-form.component.ts`, em `submit()`:

```ts
    const result = this.checkout.submit();
    if (!result.ok) {
      if (result.closed) {
        // Fechou com a página aberta: o aviso (no resumo) já está/ficará visível; leva o foco até ele.
        this.errors = {};
        setTimeout(() => document.getElementById('store-closed-notice')?.focus());
        return;
      }
      this.errors = result.errors;
      setTimeout(() => this.focusFirstInvalid());
      return;
    }
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS (suíte inteira).

- [ ] **Step 6: Commit**

```bash
git add src/app/facade/checkout.facade.service.ts src/app/components/cart/checkout-form.component.ts test/checkout.facade.service.spec.ts test/cart-page.component.spec.ts
git commit -m "feat: bloqueia o envio do pedido com a loja fechada (recalculado no clique)"
```

---

### Task 4: Aviso e botão desabilitado no carrinho

**Files:**
- Create: `src/app/components/shared/store-closed-notice.component.ts`
- Modify: `src/app/components/shared/shared.module.ts` (declarar o componente)
- Modify: `src/app/components/cart/order-summary.component.ts`
- Modify: `src/app/components/cart/cart-page.component.html`, `cart-page.component.ts`
- Test: `test/store-closed.component.spec.ts`

**Interfaces:**
- Consumes: `StoreFacadeService.view$` / `StoreView` (Task 2).
- Produces: `<app-store-closed-notice [message]="..." [noticeId]="'store-closed-notice'" [live]="true">`.

- [ ] **Step 1: Escrever os testes que falham**

`test/store-closed.component.spec.ts`:

```ts
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { CartFacadeService } from '../src/app/facade/cart.facade.service';
import { SUNDAY_INSTANT, fakeClock } from './helpers/fake-clock';

describe('Carrinho com a loja fechada', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let el: HTMLElement;

  async function create(): Promise<void> {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    TestBed.inject(CartFacadeService).addDrink('coca-2l');
    fixture = TestBed.createComponent(CartPageComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  const summaryButton = () => el.querySelector<HTMLButtonElement>('app-order-summary button')!;

  afterEach(() => {
    el?.remove();
    localStorage.clear();
  });

  it('aberta: botão de envio ativo e nenhum aviso de loja fechada', async () => {
    await create();
    expect(summaryButton().disabled).toBeFalse();
    expect(summaryButton().textContent).toContain('Enviar pedido pelo WhatsApp');
    expect(el.querySelector('#store-closed-notice')).toBeNull();
    expect(el.querySelector('#store-closed-top')).toBeNull();
  });

  it('fechada: botão desabilitado, sem prometer envio, e aviso com a próxima abertura', async () => {
    fakeClock.set(SUNDAY_INSTANT);
    await create();
    const button = summaryButton();
    expect(button.disabled).toBeTrue();
    expect(button.textContent).toContain('Loja fechada no momento');
    expect(button.textContent).not.toContain('Enviar pedido');
    expect(button.getAttribute('aria-describedby')).toBe('store-closed-notice');
    const notice = el.querySelector('#store-closed-notice');
    expect(notice?.textContent).toContain('Hoje a loja está fechada.');
    expect(notice?.textContent).toContain('amanhã às 18h');
  });

  it('fechada: o aviso também aparece no topo do carrinho (sem repetir o id)', async () => {
    fakeClock.set(SUNDAY_INSTANT);
    await create();
    expect(el.querySelector('#store-closed-top')?.textContent).toContain('Hoje a loja está fechada.');
    expect(el.querySelectorAll('#store-closed-notice').length).toBe(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include=../test/store-closed.component.spec.ts`
Expected: FAIL (botão não desabilita; avisos inexistentes).

- [ ] **Step 3: Criar o componente do aviso**

`src/app/components/shared/store-closed-notice.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Aviso "loja fechada" (com a próxima abertura). O foco pode ser levado a ele (tabindex -1). */
@Component({
  selector: 'app-store-closed-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [attr.id]="noticeId"
      tabindex="-1"
      [attr.role]="live ? 'status' : 'note'"
      class="flex items-start gap-3 rounded-xl border border-gold/60 bg-gold/10 p-4 text-sm leading-relaxed text-cream outline-none"
    >
      <lucide-icon name="calendar-x" [size]="20" class="mt-0.5 shrink-0 text-gold"></lucide-icon>
      <p>{{ message }}</p>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class StoreClosedNoticeComponent {
  @Input({ required: true }) message = '';
  @Input() noticeId = 'store-closed-notice';
  /** `false` evita um segundo anúncio quando há dois avisos na página. */
  @Input() live = true;
}
```

Em `shared.module.ts`: `import { StoreClosedNoticeComponent } from './store-closed-notice.component';` e incluir `StoreClosedNoticeComponent` na constante `SHARED`.

- [ ] **Step 4: Resumo do pedido**

Em `src/app/components/cart/order-summary.component.ts`: importar `StoreFacadeService`; no construtor `private checkout: CheckoutFacadeService, store: StoreFacadeService`; propriedade `readonly store$ = store.view$;`. Substituir o `<button ...>` do template por:

```html
      @if (store$ | async; as store) {
        @if (store.open) {
          <button type="submit" form="checkout-form" class="btn-primary mt-5 w-full py-4 text-base" aria-describedby="delivery-fee-notice">
            <lucide-icon name="send" [size]="20"></lucide-icon>
            Enviar pedido pelo WhatsApp
          </button>
        } @else {
          <app-store-closed-notice class="mt-5" [message]="store.notice"></app-store-closed-notice>
          <button type="button" disabled class="btn-primary mt-3 w-full py-4 text-base" aria-describedby="store-closed-notice">
            <lucide-icon name="calendar-x" [size]="20"></lucide-icon>
            Loja fechada no momento
          </button>
        }
      }
```

- [ ] **Step 5: Aviso no topo do carrinho**

Em `cart-page.component.ts`: importar `StoreFacadeService`, adicionar ao construtor `store: StoreFacadeService` e `readonly store$ = store.view$;`. Em `cart-page.component.html`, dentro do bloco `@else {` do carrinho não vazio, logo após a abertura de `<div class="min-w-0 space-y-10 sm:space-y-12">`:

```html
          @if (store$ | async; as store) {
            @if (!store.open) {
              <app-store-closed-notice noticeId="store-closed-top" [live]="false" [message]="store.notice"></app-store-closed-notice>
            }
          }
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS (suíte inteira).

- [ ] **Step 7: Commit**

```bash
git add src/app/components/shared/store-closed-notice.component.ts src/app/components/shared/shared.module.ts src/app/components/cart/order-summary.component.ts src/app/components/cart/cart-page.component.ts src/app/components/cart/cart-page.component.html test/store-closed.component.spec.ts
git commit -m "feat: aviso de loja fechada e botao de envio desabilitado no carrinho"
```

---

### Task 5: Selo no cabeçalho, home, rodapé e contato; remover textos fixos

**Files:**
- Modify: `src/app/components/layout/header.component.ts`, `header.component.html`
- Modify: `src/app/components/home/home-page.component.ts`, `home-page.component.html:25-28`
- Modify: `src/app/components/layout/footer.component.ts`, `footer.component.html:12`
- Modify: `src/app/components/home/contact-section.component.ts`, `contact-section.component.html:39-40`
- Modify: `src/app/data/store-info.ts` (remover `hours`, `closedOn`, `closedNotice`)
- Test: `test/store-closed.component.spec.ts` (estender)

**Interfaces:**
- Consumes: `StoreFacadeService.view$`, `.hoursText`, `.closedDaysText`; `ClockService`.

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar a `test/store-closed.component.spec.ts` (importar `HeaderComponent`, `LayoutModule`, `HomeModule`, `ContactSectionComponent`, `HomePageComponent`):

```ts
describe('Selo de horário no cabeçalho, home e contato', () => {
  const statusText = (el: HTMLElement) => el.querySelector('[role=status]')?.textContent?.trim();

  it('cabeçalho aberto: "Aberto até 23h"', async () => {
    await TestBed.configureTestingModule({ imports: [LayoutModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(statusText(fixture.nativeElement)).toBe('Aberto até 23h');
  });

  it('cabeçalho fechado: mostra quando abre', async () => {
    fakeClock.set(SUNDAY_INSTANT);
    await TestBed.configureTestingModule({ imports: [LayoutModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(statusText(fixture.nativeElement)).toBe('Fechado · abre amanhã 18h');
  });

  it('home: o hero mostra o status ao vivo e não o texto fixo', async () => {
    fakeClock.set(SUNDAY_INSTANT);
    await TestBed.configureTestingModule({ imports: [HomeModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Fechado · abre amanhã 18h');
    expect(text).not.toContain('Fechado aos domingos');
  });

  it('contato: horário e dias fechados vêm da tabela', async () => {
    await TestBed.configureTestingModule({ imports: [HomeModule, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(ContactSectionComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Segunda a sábado, das 18h às 23h');
    expect(text).toContain('Fechado aos domingos');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include=../test/store-closed.component.spec.ts`
Expected: FAIL (cabeçalho sem selo; home ainda mostra o texto fixo).

- [ ] **Step 3: Cabeçalho**

`header.component.ts`: importar `StoreFacadeService`; no construtor acrescentar `store: StoreFacadeService` (antes de `router`, mantendo a ordem dos parâmetros existentes ao final) e `readonly store$ = this.store.view$;` — como o construtor usa `private cart`, declare `private store: StoreFacadeService` e a propriedade `readonly store$ = this.store.view$;` junto de `itemCount$`.

`header.component.html`: substituir o `<a routerLink="/" class="flex min-h-[44px] ...">...</a>` do topo por:

```html
    <div class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3">
      <a routerLink="/" class="row-span-2 flex min-h-[44px] items-center rounded-lg" aria-label="Disk Pizza — página inicial">
        <app-logo [height]="40" [decorative]="true"></app-logo>
      </a>
      <a routerLink="/" tabindex="-1" aria-hidden="true" class="self-end font-display text-xl font-semibold leading-tight tracking-wide text-cream sm:text-2xl">Disk Pizza</a>
      @if (store$ | async; as store) {
        <p role="status" class="flex min-w-0 items-center gap-1.5 self-start text-xs leading-tight text-cream-muted">
          <span class="h-1.5 w-1.5 shrink-0 rounded-full" [ngClass]="store.open ? 'bg-ok' : 'bg-gold'" aria-hidden="true"></span>
          <span class="truncate">{{ store.label }}</span>
        </p>
      }
    </div>
```

- [ ] **Step 4: Home, rodapé e contato**

`home-page.component.ts`: importar `StoreFacadeService`; no construtor acrescentar `store: StoreFacadeService` e `readonly status$ = this.storeFacade.view$` (declare o parâmetro como `private storeFacade: StoreFacadeService`). `home-page.component.html`, trocar o primeiro `<li>` do hero:

```html
        @if (status$ | async; as status) {
          <li class="badge gap-1.5">
            <lucide-icon [name]="status.open ? 'clock' : 'calendar-x'" [size]="14"></lucide-icon>{{ status.label }}
          </li>
        }
```

`footer.component.ts`: injetar `ClockService` e trocar o ano por `readonly year = new Date(this.clock.now()).getFullYear();` (parâmetro `private clock: ClockService` no construtor). `footer.component.html:12`: remover o `<span class="badge ...">{{ store.closedNotice }}</span>` (o rodapé mantém só o selo da promoção).

`contact-section.component.ts`: injetar `StoreFacadeService` como `private storeFacade`, e `readonly hoursText = this.storeFacade.hoursText; readonly closedDaysText = this.storeFacade.closedDaysText;`. `contact-section.component.html:39-40`:

```html
          <dd class="mt-1 text-lg text-cream">{{ hoursText }}</dd>
          <dd class="mt-1 text-sm text-cream-muted">{{ closedDaysText }} · {{ store.promoNotice }}</dd>
```

- [ ] **Step 5: Remover os textos fixos**

Em `src/app/data/store-info.ts`, remover as linhas `hours`, `closedOn` e `closedNotice` e o comentário de `hours`.

- [ ] **Step 6: Rodar tudo e fazer o build**

Run: `npx ng test --watch=false --browsers=ChromeHeadless` → Expected: PASS.
Run: `npm run build` → Expected: build sem erros (initial ≈ 515 kB; só o warning de budget existente, se houver).

- [ ] **Step 7: Commit**

```bash
git add src/app test
git commit -m "feat: selo de horario no cabecalho e textos de horario gerados da tabela"
```

---

### Task 6: `vercel.json`, documentação e verificação no navegador

**Files:**
- Create: `vercel.json`
- Modify: `CONTEXTO_PROJETO.md` (seção 3 "Loja", seção 4 "Arquitetura", seção 6 pendência 2)

- [ ] **Step 1: Criar `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/projeto-pizzaria",
  "rewrites": [{ "source": "/((?!assets/|.*\\..*).*)", "destination": "/index.html" }]
}
```

O rewrite manda para `index.html` só as rotas sem extensão e fora de `assets/` (arquivo inexistente continua dando 404 em vez de devolver HTML).

- [ ] **Step 2: Atualizar `CONTEXTO_PROJETO.md`**

- Seção 3, item "Loja": trocar "Fechado aos domingos, promoção todos os dias" por "**Fechada aos domingos e fora de segunda a sábado, 18h–23h** (regra em `STORE_INFO.schedule`; `closedDates` = datas fechadas, hoje vazia; 12/10/2026 abre normal); promoção todos os dias".
- Seção 4: acrescentar parágrafo **Horário de funcionamento**: `getStoreStatus` (função pura, fuso `America/Sao_Paulo` via `Intl`, nunca o fuso do aparelho), `StoreHoursService` (`snapshot()` sem cache usado no envio; `status$` reavalia a cada 30 s e ao voltar ao foco), `StoreFacadeService` (textos prontos), `CheckoutFacadeService.submit()` recusa com `{ ok:false, errors:{}, closed }`, selo no cabeçalho (`role=status`), aviso e botão desabilitado no carrinho; testes usam `test/_setup.spec.ts` + `test/helpers/fake-clock.ts` (terça 19h por padrão). Limite conhecido: confia no relógio do aparelho (convertido para Brasília).
- Seção 6, pendência 2: remover a confirmação do horário (confirmado: 18h–23h) e manter só os 3 itens `CONFERIR`.
- Seção 6, pendência 8: retirar "não há vercel.json" (agora existe; deploy ainda não verificado de fato).

- [ ] **Step 3: Verificar no navegador (servidor de desenvolvimento)**

Rodar `npm run start:local` pelo `preview_start` (configurar `.claude/launch.json` se faltar). Verificar em 375px e 1280px:
1. Cabeçalho mostra o selo (aberto ou fechado, conforme o relógio real do dia).
2. Para forçar "fechado": no console do navegador não há como trocar o relógio do app; usar `javascript_tool` para sobrescrever `Date.now` (`Date.now = () => Date.parse('2026-10-04T12:00:00-03:00')`) **antes** de recarregar não persiste; em vez disso, abrir `/carrinho` com um item e conferir os dois estados mudando o relógio do sistema não é viável. Alternativa: confirmar o estado real do momento e conferir o outro estado pelos testes de componente (Task 4/5), que já cobrem aberto e fechado.
3. Sem erros no console; sem overflow horizontal em 375px.

- [ ] **Step 4: Build e testes finais**

Run: `npm run build` e `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: ambos passam.

- [ ] **Step 5: Commit**

```bash
git add vercel.json CONTEXTO_PROJETO.md
git commit -m "chore: vercel.json com rewrite de SPA e contexto do projeto atualizado"
```
