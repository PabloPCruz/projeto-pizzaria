import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

/**
 * Campo de texto com label real, dica e erro ligados por aria-describedby / aria-invalid.
 * É "controlado": o valor vem do pai (que grava na facade) e o DOM é sempre reescrito
 * com o valor final, o que faz máscaras (CEP, telefone) funcionarem mesmo quando o texto formatado
 * não muda entre uma tecla e outra.
 */
@Component({
  selector: 'app-text-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label [for]="fieldId" class="field-label">
      {{ label }}
      @if (optional) {
        <span class="font-normal text-cream-dim">(opcional)</span>
      }
    </label>
    <input
      #input
      class="field-input"
      [id]="fieldId"
      [type]="type"
      [attr.name]="name"
      [value]="value"
      [attr.autocomplete]="autocomplete"
      [attr.inputmode]="inputmode"
      [attr.maxlength]="maxlength"
      [attr.placeholder]="placeholder"
      [attr.autocapitalize]="autocapitalize"
      [attr.enterkeyhint]="enterkeyhint"
      [attr.spellcheck]="spellcheck"
      [attr.aria-required]="optional ? null : 'true'"
      [attr.aria-invalid]="error ? 'true' : null"
      [attr.aria-describedby]="describedBy"
      (input)="valueChange.emit(input.value)"
      (blur)="blurred.emit()"
    />
    @if (hint && !error) {
      <span class="field-hint" [id]="fieldId + '-hint'">{{ hint }}</span>
    }
    <ng-content></ng-content>
    @if (error) {
      <p class="field-error" [id]="fieldId + '-error'">
        <lucide-icon name="circle-alert" [size]="16" class="mt-0.5 shrink-0"></lucide-icon>
        <span>{{ error }}</span>
      </p>
    }
  `,
  styles: [':host{display:block}'],
})
export class TextFieldComponent implements AfterViewChecked {
  /** Chave do campo (ex.: "name" gera o id "field-name"). */
  @Input({ required: true }) name!: string;
  @Input({ required: true }) label!: string;
  @Input() value = '';
  @Input() error: string | undefined;
  @Input() hint = '';
  @Input() type = 'text';
  @Input() autocomplete: string | null = null;
  @Input() inputmode: string | null = null;
  @Input() maxlength: number | null = null;
  @Input() placeholder: string | null = null;
  /** Dicas de teclado do celular: 'words' (nomes), 'characters' (UF), 'next'/'done' na tecla de ação, spellcheck 'false'. */
  @Input() autocapitalize: string | null = null;
  @Input() enterkeyhint: string | null = null;
  @Input() spellcheck: string | null = null;
  @Input() optional = false;
  /** ids extras (ex.: região de status do CEP) somados ao aria-describedby. */
  @Input() describedByExtra = '';

  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();

  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;

  get fieldId(): string {
    return 'field-' + this.name;
  }

  get describedBy(): string | null {
    const ids = [this.error ? this.fieldId + '-error' : this.hint ? this.fieldId + '-hint' : '', this.describedByExtra]
      .filter(Boolean)
      .join(' ');
    return ids || null;
  }

  ngAfterViewChecked(): void {
    const el = this.input.nativeElement;
    if (el.value === this.value) return;
    // Reescrever o texto (máscara) manda o cursor para o fim: edição no meio do campo guarda a posição.
    const caret = document.activeElement === el ? el.selectionStart : null;
    const keep = caret !== null && caret < el.value.length ? this.significantBefore(el.value, caret) : null;
    el.value = this.value;
    if (keep !== null) {
      const position = this.positionAfter(this.value, keep);
      el.setSelectionRange(position, position);
    }
  }

  /** Quantas letras e números existem antes da posição (a máscara só mexe em símbolos e espaços). */
  private significantBefore(text: string, position: number): number {
    return (text.slice(0, position).match(/[\p{L}\p{N}]/gu) ?? []).length;
  }

  /** Posição logo depois da letra ou número de ordem `count` do texto já com máscara. */
  private positionAfter(text: string, count: number): number {
    if (count === 0) return 0;
    let seen = 0;
    for (let i = 0; i < text.length; i++) {
      if (/[\p{L}\p{N}]/u.test(text[i]) && ++seen === count) return i + 1;
    }
    return text.length;
  }
}
