# Massa da pizza (fina, média ou grossa) — desenho

Data: 2026-10-22. Status: implementado.

## Objetivo

Na montagem, o cliente escolhe a massa da pizza (fina, média ou grossa) e a escolha segue na mensagem do WhatsApp.

## Decisões (confirmadas com o dono)

- **Opcional e sem pré-marcar.** Quem não escolhe fica em "Sem preferência de massa" e a mensagem não menciona massa (a loja usa a massa padrão).
- **Passo próprio "Massa"**, entre Sabores e Borda. O montador passa de 5 para 6 passos.
- **Uma massa por pizza**, não por sabor.
- **Sem efeito no preço.** `PRICES` continua vazio; a massa não entra em total nenhum.

## Dados e estado

- `DOUGHS` (`data/menu.data.ts`): `fina` "Massa fina", `media` "Massa média", `grossa` "Massa grossa". Tipos `Dough`/`DoughId` em `interfaces/pizza-menu.interface.ts`.
- `CatalogService`: `getDoughs`, `getDough`, `sanitizeDoughId` (qualquer valor que não seja id de massa vira `null`). `MenuFacadeService` repassa `getDoughs`/`getDough`.
- `PizzaBuilderDraft.doughId: string | null` e `PizzaLine.doughId?: string | null` (ausente em pedido salvo antes desta mudança, que continua válido).
- `PizzaBuilderService.setDough`; `restore` e `load` validam o id. `CartService.sanitize` valida o id e mantém o campo ausente quando a linha antiga não o tinha.
- `OrderFacadeService.selectDough` e `addToCart` levam a massa ao carrinho. `getStep` aceita até o passo 5.

## Telas

- `DoughStepComponent` (`components/builder/dough-step.component.ts`): grupo de rádios no mesmo estilo do passo da borda.
- `BUILDER_STEPS` ganha "Massa" na posição 2; `builder-page.component.html` desloca Borda (3), Extras (4) e Revisão (5).
- `PizzaSummaryComponent`: linha "Massa" com "Editar" (índice 2); borda passa a 3 e observações a 4.
- Carrinho: `PizzaLineView.dough` e linha "Massa média" em `cart-items.component.html` (só quando escolhida); a descrição de "Repetir o último pedido" também a inclui.

## WhatsApp

`WhatsappMessageService.pizzaLines` inclui `Massa: fina|média|grossa` logo depois dos sabores e antes da borda, só quando há massa escolhida. Sem emoji, como o resto da mensagem.

## Testes

`test/dough.spec.ts` (cardápio, builder, restauração com dado inválido/antigo, carrinho, mensagem com e sem massa, passo no montador). Ajustados os testes que dependiam do número e da ordem dos passos (`review-edit`, `cart-edit-delivery`, `responsive-assets`, `pizza-builder`, `pizza-edit`).
