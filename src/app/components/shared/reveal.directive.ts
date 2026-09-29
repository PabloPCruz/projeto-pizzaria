import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

/**
 * Revela o bloco com fade + leve subida quando ele entra na tela (IntersectionObserver, sem biblioteca).
 * Não faz nada (conteúdo já visível) se o usuário pediu menos movimento ou o navegador não tem IntersectionObserver.
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnInit, OnDestroy {
  /** Atraso em ms (escalonar itens de uma lista). */
  @Input() appReveal: number | string = '';

  private observer?: IntersectionObserver;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const el = this.host.nativeElement;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') return;

    el.classList.add('reveal');
    const delay = Number(this.appReveal);
    if (delay > 0) el.style.transitionDelay = `${delay}ms`;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.classList.add('reveal-in');
        this.observer?.disconnect();
        // Depois de revelado, o atraso não deve atrapalhar hovers do próprio elemento.
        setTimeout(() => (el.style.transitionDelay = ''), 700);
      },
      { threshold: 0.05, rootMargin: '0px 0px -6% 0px' }
    );
    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
