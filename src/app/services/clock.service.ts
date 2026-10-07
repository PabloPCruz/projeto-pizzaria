import { Injectable } from '@angular/core';

/** Fonte única do "agora" (epoch ms). Existe para os testes fixarem o instante. */
@Injectable({ providedIn: 'root' })
export class ClockService {
  now(): number {
    return Date.now();
  }
}
