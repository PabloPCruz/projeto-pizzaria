import { Injectable } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ClockService } from './clock.service';

/** Toda chave do site começa assim (qualquer versão do formato). */
const SITE_PREFIX = 'disk-pizza:';

/**
 * Acesso seguro ao localStorage: nunca lança (modo privado, cota cheia, SSR)
 * e usa chaves versionadas para descartar dados de formatos antigos.
 * Cada gravação guarda também quando foi feita (chave irmã `:savedAt`) para o dado poder expirar.
 */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly prefix = `${SITE_PREFIX}v2:`;

  constructor(private clock: ClockService) {}

  /**
   * Lê o valor salvo. Com `maxAgeMs`, dado mais velho que isso é apagado e vale o `fallback`;
   * dado sem marca de tempo (gravado antes desta regra) nunca expira.
   */
  read<T>(key: string, fallback: T, maxAgeMs?: number): T {
    try {
      if (maxAgeMs !== undefined && this.isExpired(key, maxAgeMs)) {
        this.remove(key);
        return fallback;
      }
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      localStorage.setItem(this.savedAtKey(key), String(this.clock.now()));
    } catch {
      // Sem armazenamento disponível: o app continua funcionando, só não persiste.
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
      localStorage.removeItem(this.savedAtKey(key));
    } catch {
      // ver write()
    }
  }

  /** Apaga tudo o que o site guardou neste aparelho (qualquer versão do formato), sem tocar em dados de outros sites. */
  clearAll(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null && key.startsWith(SITE_PREFIX)) keys.push(key);
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // ver write()
    }
  }

  /** Emite quando OUTRA aba altera ou apaga essa chave (o evento `storage` não dispara na aba que gravou). */
  changes$(key: string): Observable<void> {
    return fromEvent<StorageEvent>(window, 'storage').pipe(
      filter((event) => event.key === null || event.key === this.prefix + key),
      map(() => undefined)
    );
  }

  private savedAtKey(key: string): string {
    return `${this.prefix}${key}:savedAt`;
  }

  private isExpired(key: string, maxAgeMs: number): boolean {
    const raw = localStorage.getItem(this.savedAtKey(key));
    if (raw === null) return false;
    const savedAt = Number(raw);
    return Number.isFinite(savedAt) && this.clock.now() - savedAt > maxAgeMs;
  }
}
