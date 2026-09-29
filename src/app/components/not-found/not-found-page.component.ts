import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container-page py-12 sm:py-24" aria-labelledby="nf-title">
      <div class="card enter mx-auto max-w-xl p-7 text-center sm:p-12">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold sm:h-16 sm:w-16">
          <lucide-icon name="pizza" [size]="30"></lucide-icon>
        </span>
        <p class="eyebrow mt-6">Erro 404</p>
        <h1 id="nf-title" class="section-title">Página não encontrada</h1>
        <div class="rule-gold mx-auto max-w-[8rem]" aria-hidden="true"></div>
        <p class="lead">O endereço que você tentou abrir não existe ou mudou de lugar. Que tal voltar ao início e montar sua pizza?</p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a routerLink="/" class="btn-primary">Voltar para a home</a>
          <a routerLink="/cardapio" class="btn-ghost">Ver cardápio</a>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundPageComponent {}
