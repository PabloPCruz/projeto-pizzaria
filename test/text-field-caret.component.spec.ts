import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../src/app/components/shared/shared.module';
import { FormatService } from '../src/app/services/format.service';

@Component({
  template: `<app-text-field name="phone" label="Telefone" [value]="value" (valueChange)="onChange($event)"></app-text-field>`,
})
class PhoneHostComponent {
  value = '';
  constructor(private format: FormatService) {}
  onChange(raw: string): void {
    this.value = this.format.phone(raw);
  }
}

describe('TextFieldComponent: cursor em campo com máscara', () => {
  let fixture: ComponentFixture<PhoneHostComponent>;
  let input: HTMLInputElement;

  /** O cliente edita o texto e o cursor fica em `caret` (como o navegador deixa depois de apagar/digitar). */
  function userEdits(text: string, caret: number): void {
    input.focus();
    input.value = text;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SharedModule], declarations: [PhoneHostComponent] });
    fixture = TestBed.createComponent(PhoneHostComponent);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => fixture.nativeElement.remove());

  it('apagar o hífen no meio do telefone reformata sem mandar o cursor para o fim', () => {
    userEdits('(41) 99999-9999', 15);
    // Apaga o hífen: o texto cru fica "(41) 999999999" e a máscara o devolve como "(41) 99999-9999".
    userEdits('(41) 999999999', 10);
    expect(input.value).toBe('(41) 99999-9999');
    expect(input.selectionStart).toBe(10);
  });

  it('digitar no fim continua com o cursor no fim', () => {
    userEdits('41', 2);
    userEdits('(41', 3);
    userEdits('419', 3);
    expect(input.value).toBe('(41) 9');
    expect(input.selectionStart).toBe(input.value.length);
  });

  it('apagar um dígito do meio mantém o cursor junto do que foi apagado', () => {
    userEdits('(41) 99999-9999', 15);
    // Apaga o 1º "9" depois do DDD (cursor em 5): o resto sobe e a máscara troca para o formato de 10 dígitos.
    userEdits('(41) 9999-9999', 5);
    expect(input.value).toBe('(41) 9999-9999');
    expect(input.selectionStart).toBe(5);
  });
});
