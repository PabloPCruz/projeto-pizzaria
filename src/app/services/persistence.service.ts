import { Injectable } from '@angular/core';

/**
 * Acesso seguro ao localStorage: nunca lança (modo privado, cota cheia, SSR)
 * e usa chaves versionadas para descartar dados de formatos antigos.
 */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly prefix = 'disk-pizza:v2:';

  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // Sem armazenamento disponível: o app continua funcionando, só não persiste.
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      // ver write()
    }
  }
}
