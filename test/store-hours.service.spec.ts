import { NgZone } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { STORE_INFO } from '../src/app/data/store-info';
import { StoreFacadeService } from '../src/app/facade/store.facade.service';
import { StoreSchedule } from '../src/app/interfaces/store-hours.interface';
import {
  STORE_STATUS_TICK,
  StoreHoursService,
  closedDaysNotice,
  createStatusTick,
  closedNotice,
  formatClock,
  getStoreStatus,
  scheduleSummary,
  statusLabel,
} from '../src/app/services/store-hours.service';

import { SUNDAY_INSTANT, fakeClock } from './helpers/fake-clock';

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
    expect(closedDaysNotice({ ...SCHEDULE, openDays: [1, 2, 3, 4, 5] })).toBe('Fechado aos domingos e aos sábados');
    expect(closedDaysNotice({ ...SCHEDULE, openDays: [0, 1, 2, 3, 4, 5, 6] })).toBe('');
  });

  it('statusLabel (selo curto)', () => {
    expect(statusLabel(at('2026-10-05T19:00:00-03:00'))).toBe('Aberto até 23h');
    expect(statusLabel(at('2026-10-04T12:00:00-03:00'))).toBe('Fechado · abre amanhã 18h');
    expect(statusLabel(at('2026-10-10T23:30:00-03:00'))).toBe('Fechado · abre segunda 18h');
    expect(statusLabel(at('2026-10-05T10:00:00-03:00'))).toBe('Fechado · abre hoje 18h');
  });

  describe('closedNotice (aviso completo): todos os cenários', () => {
    const TAIL = 'Pode deixar o pedido pronto: o botão de enviar libera assim que abrirmos.';
    const withClosed = (closedDates: string[]): StoreSchedule => ({ ...SCHEDULE, closedDates });
    const notice = (iso: string, schedule: StoreSchedule = SCHEDULE) => closedNotice(getStoreStatus(Date.parse(iso), schedule));

    it('antes de abrir num dia de funcionamento: diz que HOJE abre e a hora (não diz que não abre hoje)', () => {
      expect(notice('2026-10-05T10:00:00-03:00')).toBe(`A loja ainda não abriu. Abrimos hoje às 18h. ${TAIL}`);
      expect(notice('2026-10-05T17:59:59-03:00')).toContain('Abrimos hoje às 18h.');
      expect(notice('2026-10-05T10:00:00-03:00')).not.toContain('não abre');
    });

    it('depois de fechar de segunda a sexta: volta amanhã, com o dia da semana', () => {
      expect(notice('2026-10-05T23:30:00-03:00')).toBe(`Já encerramos por hoje. Voltamos amanhã (terça) às 18h. ${TAIL}`);
      expect(notice('2026-10-05T23:00:00-03:00')).toContain('Voltamos amanhã (terça) às 18h.');
    });

    it('depois de fechar no sábado: volta na segunda (pula o domingo)', () => {
      expect(notice('2026-10-10T23:30:00-03:00')).toBe(`Já encerramos por hoje. Voltamos segunda às 18h. ${TAIL}`);
    });

    it('domingo: diz que hoje (domingo) não abre e que volta amanhã (segunda)', () => {
      expect(notice('2026-10-11T12:00:00-03:00')).toBe(`Hoje (domingo) a loja não abre. Voltamos amanhã (segunda) às 18h. ${TAIL}`);
      expect(notice('2026-10-11T00:00:00-03:00')).toContain('Hoje (domingo) a loja não abre.');
      expect(notice('2026-10-11T23:59:59-03:00')).toContain('Voltamos amanhã (segunda) às 18h.');
    });

    it('data fechada em dia útil: hoje não abre e volta no próximo dia aberto', () => {
      expect(notice('2026-10-07T12:00:00-03:00', withClosed(['2026-10-07']))).toBe(
        `Hoje a loja não abre. Voltamos amanhã (quinta) às 18h. ${TAIL}`
      );
      expect(notice('2026-10-07T20:00:00-03:00', withClosed(['2026-10-07']))).toContain('Hoje a loja não abre.');
    });

    it('datas fechadas seguidas: volta num dia mais adiante, sem "amanhã"', () => {
      const closed = withClosed(['2026-10-06', '2026-10-07']);
      expect(notice('2026-10-05T23:30:00-03:00', closed)).toBe(`Já encerramos por hoje. Voltamos quinta às 18h. ${TAIL}`);
      expect(notice('2026-10-06T12:00:00-03:00', closed)).toBe(`Hoje a loja não abre. Voltamos quinta às 18h. ${TAIL}`);
    });

    it('domingo que também é data fechada continua dizendo "domingo"', () => {
      expect(notice('2026-10-04T12:00:00-03:00', withClosed(['2026-10-04']))).toContain('Hoje (domingo) a loja não abre.');
    });

    it('sem nenhuma abertura prevista: só diz que está fechada, sem prometer volta', () => {
      expect(notice('2026-10-05T19:00:00-03:00', { ...SCHEDULE, openDays: [] })).toBe('Hoje (segunda) a loja não abre.');
    });

    it('nunca usa a frase antiga, que sugeria que hoje não abre quando abre às 18h', () => {
      for (const iso of ['2026-10-05T10:00:00-03:00', '2026-10-05T23:30:00-03:00', '2026-10-11T12:00:00-03:00']) {
        expect(notice(iso)).not.toContain('Ainda não abrimos hoje');
        expect(notice(iso)).not.toContain('quando abrirmos:');
      }
    });
  });
});

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
    facade.view$.subscribe((v) => (view = v)).unsubscribe();
    expect(view?.open).toBeFalse();
    expect(view?.label).toBe('Fechado · abre amanhã 18h');
    expect(view?.notice).toContain('Hoje (domingo) a loja não abre.');
  });
});
