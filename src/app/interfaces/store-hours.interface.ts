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
