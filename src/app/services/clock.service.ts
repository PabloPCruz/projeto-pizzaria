import { Injectable } from '@angular/core';

/** Diferenças menores que isso (rede, arredondamento do cabeçalho Date) são ignoradas. */
const MIN_SKEW_MS = 30_000;

/**
 * Fonte única do "agora" (epoch ms). Existe para os testes fixarem o instante e para corrigir o relógio do aparelho:
 * celular com data/hora errada bloquearia ou liberaria pedidos por engano. `sync()` compara com o cabeçalho `Date`
 * do próprio site (a Vercel manda a hora atual mesmo em resposta de cache) e guarda a diferença.
 */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private skewMs = 0;

  now(): number {
    return Date.now() + this.skewMs;
  }

  /** Diferença atual entre o servidor e o aparelho (0 se não deu para medir ou se é pequena). */
  get skew(): number {
    return this.skewMs;
  }

  /** Mede a diferença com a hora do servidor. Nunca lança: sem rede ou sem cabeçalho, segue com o relógio do aparelho. */
  async sync(): Promise<void> {
    try {
      const before = Date.now();
      const response = await fetch('/', { method: 'HEAD', cache: 'no-store' });
      const after = Date.now();
      const header = response.headers.get('date');
      const stamped = header ? Date.parse(header) : NaN;
      if (!Number.isFinite(stamped)) return;
      // Resposta servida de cache: o Date é de quando ela foi gerada e o Age diz há quantos segundos ela espera.
      const age = Number(response.headers.get('age'));
      const server = stamped + (Number.isFinite(age) && age > 0 ? age * 1000 : 0);
      // O servidor carimbou no meio do caminho: compara com o ponto médio da requisição.
      const skew = server - (before + after) / 2;
      this.skewMs = Math.abs(skew) >= MIN_SKEW_MS ? Math.round(skew) : 0;
    } catch {
      // offline ou bloqueado: mantém o relógio do aparelho
    }
  }
}
