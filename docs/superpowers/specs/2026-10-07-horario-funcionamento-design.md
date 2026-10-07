# Horário de funcionamento (domingo, 18h–23h e datas fechadas) — Design

Data: 2026-10-07 · Etapa 1 de 5 da varredura completa do projeto.

## Contexto

A loja **não abre aos domingos** e atende de segunda a sábado, das 18h às 23h. Hoje isso existe só como texto em `src/app/data/store-info.ts` (`hours`, `closedOn`, `closedNotice`). Nenhum código consulta a data: o cliente monta o pedido, preenche tudo e abre o WhatsApp mesmo com a loja fechada. `closedOn` não é usado em lugar nenhum e o único `new Date` do app é o ano do rodapé.

## Decisões confirmadas com o dono

- **Fechado:** domingo inteiro e, de segunda a sábado, antes das 18h e a partir das 23h (23:00 em ponto já está fechado).
- **O cliente pode navegar e montar o pedido** com a loja fechada; o carrinho e o rascunho continuam salvos. **Só o envio pelo WhatsApp é bloqueado.** Sem caixa de "estou ciente" e sem pedido agendado.
- **Datas fechadas:** lista em `store-info.ts`, tratadas como domingo. A lista começa **vazia**: a loja abre normalmente em 12/10/2026 (feriado de Nossa Senhora Aparecida).
- **Avisos:** selo no cabeçalho e aviso no carrinho/checkout no lugar do botão de enviar.
- **Horário único** para todos os dias abertos (18h–23h).

## Fora do escopo

- Pedido agendado para o próximo dia aberto e mensagem de WhatsApp com data de agendamento.
- Hora do servidor (header `Date`) para corrigir relógio errado do aparelho. Se o relógio do aparelho estiver errado, a loja ainda confirma no WhatsApp.
- Horário diferente por dia da semana, janela que cruza a meia-noite, "último pedido X minutos antes de fechar".

Se algum desses entrar depois, a tabela de horários e a função pura abaixo já comportam a extensão.

## Dados (`src/app/data/store-info.ts`)

Entra um bloco `schedule` e `hours`, `closedNotice` e `closedOn` deixam de ser texto solto:

```ts
schedule: {
  timeZone: 'America/Sao_Paulo',
  openDays: [1, 2, 3, 4, 5, 6],        // 0 = domingo
  opensAt: '18:00',
  closesAt: '23:00',
  closedDates: [] as string[],          // 'AAAA-MM-DD', tratadas como domingo
},
```

Os textos exibidos ("Segunda a sábado, das 18h às 23h" e "Fechado aos domingos") passam a ser **gerados** dessa tabela, em uma função de formatação, para nunca divergirem da regra. `closedOn` e o `closedNotice` fixos são removidos.

## Serviços

### `ClockService` (`src/app/services/clock.service.ts`)
`now(): number` (epoch ms), retorna `Date.now()`. Existe para os testes fixarem o instante. O `new Date().getFullYear()` do rodapé passa a usá-lo.

### Função pura `getStoreStatus(instant, schedule)` e `StoreHoursService`

Saída (`src/app/interfaces/store-hours.interface.ts`):

```ts
interface StoreStatus {
  open: boolean;
  reason: 'open' | 'closed-day' | 'closed-date' | 'before-open' | 'after-close';
  closesAt: string | null;                      // 'HH:mm' quando aberto
  nextOpening: { date: string; weekday: number; at: string } | null;
}
```

Regras:
- Dia da semana, data e hora **sempre em `America/Sao_Paulo`**, via `Intl.DateTimeFormat(...).formatToParts`. Nunca `getDay()` nem `getHours()`: um celular em outro fuso vê a mesma regra.
- Aberto se o dia está em `openDays`, a data não está em `closedDates` e `opensAt <= hora < closesAt`. 18:00:00 abre; 22:59:59 aberto; 23:00:00 fechado.
- `nextOpening`: o próximo dia aberto (pulando domingo e `closedDates`) às `opensAt`. Antes das 18h num dia aberto, é hoje às 18h.
- `closed-date` e `closed-day` têm o mesmo tratamento visual; o `reason` só serve para texto e testes.
- `StoreHoursService.status$` (Observable) reavalia a cada 30 s e quando a aba volta ao foco (`visibilitychange`). `snapshot()` devolve o status no instante da chamada, sem cache.

## Bloqueio no envio

`CheckoutFacadeService.submit()` (`src/app/facade/checkout.facade.service.ts:129`) passa a consultar `StoreHoursService.snapshot()` **antes de validar o formulário** e devolver uma nova variante:

```ts
{ ok: false; closed: StoreStatus }
```

Como `snapshot()` é recalculado no clique, o caso de virar o dia/horário com o carrinho aberto (sábado 22h50 → domingo 00h05) é bloqueado de fato, mesmo que a tela ainda mostre "aberto". Carrinho, rascunho e formulário **não são alterados**.

O formulário (`checkout-form.component.ts`) trata a variante nova: foca/mostra o aviso de loja fechada e não abre o WhatsApp.

## Interface

- **Cabeçalho (`header.component`)**: selo discreto. Aberto: "Aberto até 23h". Fechado: "Fechado · abrimos segunda às 18h" (ou "hoje às 18h" antes de abrir). Com ícone e texto (não depende só de cor) e `role="status"` único.
- **Home (`home-page.component.html:27`)**: o badge fixo "Fechado aos domingos" vira o status ao vivo no hero. Os CTAs continuam ativos.
- **Carrinho / checkout (`order-summary.component.ts`, `checkout-form.component.html`)**: com a loja fechada, o botão de enviar fica desabilitado (`aria-disabled`) e logo acima aparece um cartão de aviso com o motivo e a próxima abertura ("Estamos fechados hoje. Você pode deixar o pedido pronto e enviar quando abrirmos, segunda às 18h"). O texto do botão não promete envio.
- **Rodapé e contato (`footer.component.html:12`, `contact-section.component.html:39`)**: mostram só o horário fixo gerado da tabela; o badge duplicado do rodapé é removido.
- Em `OrderSent` nada muda: a tela só é alcançada quando o envio foi permitido.

## Tratamento de exceções

- **Relógio do aparelho errado:** o app confia nele (convertido para Brasília). Limite documentado; a loja confirma no WhatsApp.
- **`Intl` sem suporte ao fuso:** não esperado nos navegadores-alvo. Se `formatToParts` lançar, `getStoreStatus` falha aberto (`open: true`) e registra o motivo em console. O bloqueio é conveniência, não segurança.
- **Fim de semana e feriado juntos:** domingo em `closedDates` continua `closed-day`.
- **Aba aberta por horas:** o selo se corrige sozinho pelos 30 s e pelo retorno ao foco; o envio sempre recalcula.
- **Dados persistidos:** nenhum estado de "loja fechada" é salvo em `localStorage`; sempre calculado na hora.

## Testes

`test/store-hours.service.spec.ts` (novo, relógio injetado com instantes fixos e offset explícito):
- Domingo 12h → `closed-day`, `nextOpening` segunda 18:00.
- Segunda 17:59:59 → `before-open`; 18:00:00 → aberto; 22:59:59 → aberto; 23:00:00 → `after-close`.
- Sábado 23:30 → `after-close`, `nextOpening` segunda (pula domingo).
- Virada: sábado 23:59:59 → domingo 00:00:00 e domingo 23:59:59 → segunda 00:00:00.
- Fuso: `2026-10-11T02:00:00Z` é sábado 23h00 em Brasília (`after-close`, **não** `closed-day`, embora em UTC já seja domingo); `2026-10-05T02:30:00Z` é domingo 23h30 em Brasília (fechado). Rodar o spec também com `TZ=UTC` para provar independência do fuso do navegador.
- `closedDates`: data fechada em dia útil → `closed-date`; data fechada que cai no domingo → `closed-day`; lista vazia não altera nada.
- `nextOpening` pulando uma `closedDates` consecutiva.
- `status$` muda na fronteira (`fakeAsync` + `tick`) e em `visibilitychange`.

`test/checkout.facade.service.spec.ts` (estender):
- Fechado → `{ ok: false, closed }`, mesmo com formulário válido; `window.open`/`buildLink` não são chamados.
- Aberto → resultado idêntico ao atual (snapshots da mensagem intactos).
- Carrinho montado aberto e enviado depois das 23h → bloqueado.
- Carrinho e rascunho permanecem após o bloqueio.

Componentes (estender os specs existentes): selo do cabeçalho nos três estados, botão desabilitado + aviso no carrinho fechado, aviso some quando abre.

Dados: spec que garante `hours` e o texto de fechado derivados do `schedule` e que `closedDates` aceita só `AAAA-MM-DD`.

## Arquivos

Novos: `services/clock.service.ts`, `services/store-hours.service.ts`, `interfaces/store-hours.interface.ts`, `test/store-hours.service.spec.ts`.
Alterados: `data/store-info.ts`, `facade/checkout.facade.service.ts`, `components/cart/checkout-form.component.{ts,html}`, `components/cart/order-summary.component.ts`, `components/layout/header.component.{ts,html}`, `components/layout/footer.component.{ts,html}`, `components/home/home-page.component.html`, `components/home/contact-section.component.html`, e os specs correspondentes.

Também nesta etapa (item crítico do relatório de deploy, arquivo pequeno): criar `vercel.json` com `outputDirectory: "dist/projeto-pizzaria"`, `buildCommand: "npm run build"` e rewrite de SPA que exclua `assets/` e arquivos com extensão.

## Critérios de aceite

- `npm run build` sem erros e `npm test` passando.
- Domingo, e segunda a sábado fora de 18h–23h: botão de enviar desabilitado, aviso visível, WhatsApp nunca abre.
- Aberto: fluxo idêntico ao de hoje.
- Selo do cabeçalho correto nos três estados e coerente com o aviso do carrinho.
- Atualizar `CONTEXTO_PROJETO.md` (seção 3, "Loja", e a pendência do horário) ao final.
