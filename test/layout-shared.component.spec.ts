import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from '../src/app/components/layout/header.component';
import { LayoutModule } from '../src/app/components/layout/layout.module';
import { SharedModule } from '../src/app/components/shared/shared.module';

@Component({
  template: `<app-quantity-stepper [value]="value" label="teste" (valueChange)="value = $event"></app-quantity-stepper>`,
})
class StepperHostComponent {
  value = 2;
}

describe('Header (menu do celular)', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [LayoutModule, RouterTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('aria-controls sempre aponta para um elemento existente, escondido quando fechado', () => {
    const button = el.querySelector<HTMLButtonElement>('button[aria-controls]')!;
    const menu = el.querySelector<HTMLElement>('#' + button.getAttribute('aria-controls'))!;
    expect(menu).toBeTruthy();
    expect(menu.hidden).toBeTrue();
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(menu.hidden).toBeFalse();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('Esc fecha o menu e devolve o foco ao botão', () => {
    const button = el.querySelector<HTMLButtonElement>('button[aria-controls]')!;
    button.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
  });
});

describe('QuantityStepperComponent', () => {
  it('no mínimo usa aria-disabled, ignora o clique e não perde o foco', () => {
    TestBed.configureTestingModule({ imports: [SharedModule], declarations: [StepperHostComponent] });
    const fixture = TestBed.createComponent(StepperHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const [minus] = Array.from(el.querySelectorAll('button'));

    minus.focus();
    minus.click(); // 2 -> 1
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(1);
    expect(minus.getAttribute('aria-disabled')).toBe('true');
    expect(minus.disabled).toBeFalse();
    expect(document.activeElement).toBe(minus);

    minus.click(); // no mínimo: nada acontece
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(1);
  });
});
