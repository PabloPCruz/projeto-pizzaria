import { Pipe, PipeTransform } from '@angular/core';
import { FormatService } from '../../services/format.service';

/** Formata um valor em reais via FormatService; `null` continua `null` (sem preço cadastrado). */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  constructor(private format: FormatService) {}

  transform(value: number | null | undefined): string | null {
    return value === null || value === undefined ? null : this.format.currency(value);
  }
}
