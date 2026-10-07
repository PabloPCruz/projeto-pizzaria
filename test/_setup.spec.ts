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
