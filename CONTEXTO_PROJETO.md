# Contexto do Projeto — Disk Pizza (pizzaria italiana premium)

> Atualizado em 2026-09-28 após a reformulação completa do front-end e da lógica de pedidos.
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md). Este arquivo descreve o **estado atual**; `README.md`, `QUICK_START.md` e `documents/*` ainda descrevem a arquitetura ANTIGA (ver seção 8).

## 1. O que é

Site de pedidos de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

## 2. Stack e comandos

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones; npm o marca como deprecated em favor de `@lucide/angular`, mas funciona com Angular 17) · `@angular/animations` só na transição de rota · ViaCEP · Karma/Jasmine. **Angular Material e CDK foram removidos.**

```
npm ci · npm run start:local · npm run build · npm test
npx ng test --watch=false --browsers=ChromeHeadless     (execução única)
```

Estado verificado: build sem erros (initial ≈ 514 kB; o **warn do budget foi para 560 kB** por causa do CSS dos efeitos, erro em 1 MB) e **359 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP). Quem **não sabe o CEP** marca "Não sei meu CEP" e preenche à mão (`draft.manualAddress`): rua, número, bairro, cidade e UF são obrigatórios; **só o complemento é opcional** e o CEP deixa de ser exigido (some do formulário e da mensagem). Desmarcar volta ao CEP e mantém o que foi digitado.
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - **Endereço manual (sem CEP): NUNCA há entrega grátis.** Com "Não sei meu CEP" ligado nada é consultado e o cartão de grátis some na hora (mesmo que o CEP tenha liberado antes); fica o aviso padrão de que a loja informa a taxa no WhatsApp. A entrega grátis só existe **com CEP, dentro das regras**. (Uma versão anterior tentava localizar o endereço digitado pelo Nominatim; foi removida por decisão do dono.)
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. **Funcionamento: segunda a sábado, 18h–23h; fechada aos domingos** (regra em `STORE_INFO.schedule`; `closedDates` lista datas fechadas, hoje vazia: 12/10/2026 abre normal). Promoção todos os dias.
- **Visual e UX:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display (títulos) + Inter (texto), mobile-first e **calmo no celular** (hero simples, 1 CTA principal, sem brilhos competindo; barra fixa discreta). Sistema de microinterações sutil em tudo (tokens de movimento em `tailwind.config.js`: 150/220/350 ms, easing suave): troca de página, botões, links, cartões, campos e rótulos, abas, passos do montador, contador do carrinho, menu do celular, revelação ao rolar (`appReveal`), foto com fade (`app-flavor-image`). Tudo respeita `prefers-reduced-motion` e usa só transform/opacity (CLS medido = 0). Tipografia/contraste: corpo 16px, `text-xs` = 13px, texto ≥ 4,5:1 (corrido ≥ 7:1), tokens `cream-muted/cream-dim` clareados; botão "Não sei meu CEP" é um cartão com interruptor (`role="switch"`).

## 4. Arquitetura

```
src/app/
  data/         menu.data.ts (cardápio transcrito), prices.ts (preços), store-info.ts (loja/redes)
  interfaces/   pizza-menu.interface.ts, cart.interface.ts
  services/     catalog · size-rules · pricing · persistence · cart · pizza-builder ·
                checkout-draft · checkout-validation · cep · format · whatsapp-message
  facade/       menu · order (montagem) · cart · checkout   ← únicas portas dos componentes
  components/   layout/ shared/ home/ menu/ builder/ cart/ (+ página 404)
test/           specs (services, facades, componentes)
```

- **Componentes finos:** usam facades. Não duplicar formatação/cálculo (`FormatService`, `PricingService`).
- **Persistência (`localStorage`, chaves `disk-pizza:v2:*`):** carrinho, pizza em montagem, passo do assistente e formulário do checkout são salvos a cada alteração. Ao restaurar, tudo é validado campo a campo (tipos errados, sabores inexistentes, tamanho desconhecido, excesso de sabores são descartados/cortados; nunca quebra a tela).
- **Horário de funcionamento (loja fechada = só o envio é bloqueado):** o cliente navega, monta pizza e deixa o carrinho pronto; o carrinho, o rascunho e o formulário continuam salvos. `getStoreStatus(instante, schedule)` (função pura em `services/store-hours.service.ts`) calcula o estado **sempre no fuso America/Sao_Paulo via `Intl`**, nunca no fuso do aparelho (18:00 abre, 23:00 em ponto já fecha; domingo e `closedDates` fecham o dia). `StoreHoursService.snapshot()` não tem cache e é chamado no clique de enviar: `CheckoutFacadeService.submit()` devolve `{ ok:false, errors:{}, closed }` e nada abre o WhatsApp (cobre a virada de horário com a página aberta); `status# Contexto do Projeto — Disk Pizza (pizzaria italiana premium)

> Atualizado em 2026-09-28 após a reformulação completa do front-end e da lógica de pedidos.
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md). Este arquivo descreve o **estado atual**; `README.md`, `QUICK_START.md` e `documents/*` ainda descrevem a arquitetura ANTIGA (ver seção 8).

## 1. O que é

Site de pedidos de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

## 2. Stack e comandos

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones; npm o marca como deprecated em favor de `@lucide/angular`, mas funciona com Angular 17) · `@angular/animations` só na transição de rota · ViaCEP · Karma/Jasmine. **Angular Material e CDK foram removidos.**

```
npm ci · npm run start:local · npm run build · npm test
npx ng test --watch=false --browsers=ChromeHeadless     (execução única)
```

Estado verificado: build sem erros (initial ≈ 514 kB; o **warn do budget foi para 560 kB** por causa do CSS dos efeitos, erro em 1 MB) e **258 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP). Quem **não sabe o CEP** marca "Não sei meu CEP" e preenche à mão (`draft.manualAddress`): rua, número, bairro, cidade e UF são obrigatórios; **só o complemento é opcional** e o CEP deixa de ser exigido (some do formulário e da mensagem). Desmarcar volta ao CEP e mantém o que foi digitado.
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - **Endereço manual (sem CEP): NUNCA há entrega grátis.** Com "Não sei meu CEP" ligado nada é consultado e o cartão de grátis some na hora (mesmo que o CEP tenha liberado antes); fica o aviso padrão de que a loja informa a taxa no WhatsApp. A entrega grátis só existe **com CEP, dentro das regras**. (Uma versão anterior tentava localizar o endereço digitado pelo Nominatim; foi removida por decisão do dono.)
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. **Funcionamento: segunda a sábado, 18h–23h; fechada aos domingos** (regra em `STORE_INFO.schedule`; `closedDates` lista datas fechadas, hoje vazia: 12/10/2026 abre normal). Promoção todos os dias.
- **Visual e UX:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display (títulos) + Inter (texto), mobile-first e **calmo no celular** (hero simples, 1 CTA principal, sem brilhos competindo; barra fixa discreta). Sistema de microinterações sutil em tudo (tokens de movimento em `tailwind.config.js`: 150/220/350 ms, easing suave): troca de página, botões, links, cartões, campos e rótulos, abas, passos do montador, contador do carrinho, menu do celular, revelação ao rolar (`appReveal`), foto com fade (`app-flavor-image`). Tudo respeita `prefers-reduced-motion` e usa só transform/opacity (CLS medido = 0). Tipografia/contraste: corpo 16px, `text-xs` = 13px, texto ≥ 4,5:1 (corrido ≥ 7:1), tokens `cream-muted/cream-dim` clareados; botão "Não sei meu CEP" é um cartão com interruptor (`role="switch"`).

## 4. Arquitetura

```
src/app/
  data/         menu.data.ts (cardápio transcrito), prices.ts (preços), store-info.ts (loja/redes)
  interfaces/   pizza-menu.interface.ts, cart.interface.ts
  services/     catalog · size-rules · pricing · persistence · cart · pizza-builder ·
                checkout-draft · checkout-validation · cep · format · whatsapp-message
  facade/       menu · order (montagem) · cart · checkout   ← únicas portas dos componentes
  components/   layout/ shared/ home/ menu/ builder/ cart/ (+ página 404)
test/           specs (services, facades, componentes)
```

- **Componentes finos:** usam facades. Não duplicar formatação/cálculo (`FormatService`, `PricingService`).
- **Persistência (`localStorage`, chaves `disk-pizza:v2:*`):** carrinho, pizza em montagem, passo do assistente e formulário do checkout são salvos a cada alteração. Ao restaurar, tudo é validado campo a campo (tipos errados, sabores inexistentes, tamanho desconhecido, excesso de sabores são descartados/cortados; nunca quebra a tela).
 reavalia a cada 30 s e ao voltar ao foco (o timer roda fora do NgZone; token `STORE_STATUS_TICK`). `StoreFacadeService` entrega `view# Contexto do Projeto — Disk Pizza (pizzaria italiana premium)

> Atualizado em 2026-09-28 após a reformulação completa do front-end e da lógica de pedidos.
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md). Este arquivo descreve o **estado atual**; `README.md`, `QUICK_START.md` e `documents/*` ainda descrevem a arquitetura ANTIGA (ver seção 8).

## 1. O que é

Site de pedidos de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

## 2. Stack e comandos

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones; npm o marca como deprecated em favor de `@lucide/angular`, mas funciona com Angular 17) · `@angular/animations` só na transição de rota · ViaCEP · Karma/Jasmine. **Angular Material e CDK foram removidos.**

```
npm ci · npm run start:local · npm run build · npm test
npx ng test --watch=false --browsers=ChromeHeadless     (execução única)
```

Estado verificado: build sem erros (initial ≈ 514 kB; o **warn do budget foi para 560 kB** por causa do CSS dos efeitos, erro em 1 MB) e **258 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP). Quem **não sabe o CEP** marca "Não sei meu CEP" e preenche à mão (`draft.manualAddress`): rua, número, bairro, cidade e UF são obrigatórios; **só o complemento é opcional** e o CEP deixa de ser exigido (some do formulário e da mensagem). Desmarcar volta ao CEP e mantém o que foi digitado.
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - **Endereço manual (sem CEP): NUNCA há entrega grátis.** Com "Não sei meu CEP" ligado nada é consultado e o cartão de grátis some na hora (mesmo que o CEP tenha liberado antes); fica o aviso padrão de que a loja informa a taxa no WhatsApp. A entrega grátis só existe **com CEP, dentro das regras**. (Uma versão anterior tentava localizar o endereço digitado pelo Nominatim; foi removida por decisão do dono.)
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. **Funcionamento: segunda a sábado, 18h–23h; fechada aos domingos** (regra em `STORE_INFO.schedule`; `closedDates` lista datas fechadas, hoje vazia: 12/10/2026 abre normal). Promoção todos os dias.
- **Visual e UX:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display (títulos) + Inter (texto), mobile-first e **calmo no celular** (hero simples, 1 CTA principal, sem brilhos competindo; barra fixa discreta). Sistema de microinterações sutil em tudo (tokens de movimento em `tailwind.config.js`: 150/220/350 ms, easing suave): troca de página, botões, links, cartões, campos e rótulos, abas, passos do montador, contador do carrinho, menu do celular, revelação ao rolar (`appReveal`), foto com fade (`app-flavor-image`). Tudo respeita `prefers-reduced-motion` e usa só transform/opacity (CLS medido = 0). Tipografia/contraste: corpo 16px, `text-xs` = 13px, texto ≥ 4,5:1 (corrido ≥ 7:1), tokens `cream-muted/cream-dim` clareados; botão "Não sei meu CEP" é um cartão com interruptor (`role="switch"`).

## 4. Arquitetura

```
src/app/
  data/         menu.data.ts (cardápio transcrito), prices.ts (preços), store-info.ts (loja/redes)
  interfaces/   pizza-menu.interface.ts, cart.interface.ts
  services/     catalog · size-rules · pricing · persistence · cart · pizza-builder ·
                checkout-draft · checkout-validation · cep · format · whatsapp-message
  facade/       menu · order (montagem) · cart · checkout   ← únicas portas dos componentes
  components/   layout/ shared/ home/ menu/ builder/ cart/ (+ página 404)
test/           specs (services, facades, componentes)
```

- **Componentes finos:** usam facades. Não duplicar formatação/cálculo (`FormatService`, `PricingService`).
- **Persistência (`localStorage`, chaves `disk-pizza:v2:*`):** carrinho, pizza em montagem, passo do assistente e formulário do checkout são salvos a cada alteração. Ao restaurar, tudo é validado campo a campo (tipos errados, sabores inexistentes, tamanho desconhecido, excesso de sabores são descartados/cortados; nunca quebra a tela).
 (`open`, `label`, `notice`) e os textos "Segunda a sábado, das 18h às 23h" / "Fechado aos domingos", gerados da tabela. Telas: selo `role="status"` no cabeçalho ("Aberto até 23h" / "Fechado · abre amanhã 18h"), status no hero da home, aviso no topo do carrinho e no resumo (`app-store-closed-notice`) com o botão desabilitado ("Loja fechada no momento"). A mensagem do WhatsApp não muda. Limite conhecido: confia no relógio do aparelho (convertido para Brasília); se estiver errado, a loja confirma no WhatsApp. **Testes:** `test/_setup.spec.ts` fixa o relógio em terça 19h (aberto) e desliga o timer; use `fakeClock.set(iso)` de `test/helpers/fake-clock.ts` (`SUNDAY_INSTANT` = domingo 12h).
- **Robustez (auditoria de 2026-10-07, etapa 2):**
  - **Texto do cliente na mensagem:** `sanitizeText/inlineText/blockText` (em `whatsapp-message.service.ts`) tiram emoji, substitutos soltos (que faziam `encodeURIComponent` lançar), controles e marcas bidi, e os marcadores `* _ ~` e crase; observações gerais perdem marcador de citação/lista e não forjam blocos ("*Entrega*"). O envio tem `try/catch` e mostra erro em vez de um botão mudo.
  - **Entrega grátis só para o endereço certo:** a zona carrega `addr` (cidade|UF); `CheckoutFacadeService.effectiveZone` só a aceita com CEP, mesmo CEP, mesma cidade/UF e CEP que trouxe rua (CEP geral de cidade nunca é grátis); `zone# Contexto do Projeto — Disk Pizza (pizzaria italiana premium)

> Atualizado em 2026-09-28 após a reformulação completa do front-end e da lógica de pedidos.
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md). Este arquivo descreve o **estado atual**; `README.md`, `QUICK_START.md` e `documents/*` ainda descrevem a arquitetura ANTIGA (ver seção 8).

## 1. O que é

Site de pedidos de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

## 2. Stack e comandos

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones; npm o marca como deprecated em favor de `@lucide/angular`, mas funciona com Angular 17) · `@angular/animations` só na transição de rota · ViaCEP · Karma/Jasmine. **Angular Material e CDK foram removidos.**

```
npm ci · npm run start:local · npm run build · npm test
npx ng test --watch=false --browsers=ChromeHeadless     (execução única)
```

Estado verificado: build sem erros (initial ≈ 514 kB; o **warn do budget foi para 560 kB** por causa do CSS dos efeitos, erro em 1 MB) e **258 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP). Quem **não sabe o CEP** marca "Não sei meu CEP" e preenche à mão (`draft.manualAddress`): rua, número, bairro, cidade e UF são obrigatórios; **só o complemento é opcional** e o CEP deixa de ser exigido (some do formulário e da mensagem). Desmarcar volta ao CEP e mantém o que foi digitado.
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - **Endereço manual (sem CEP): NUNCA há entrega grátis.** Com "Não sei meu CEP" ligado nada é consultado e o cartão de grátis some na hora (mesmo que o CEP tenha liberado antes); fica o aviso padrão de que a loja informa a taxa no WhatsApp. A entrega grátis só existe **com CEP, dentro das regras**. (Uma versão anterior tentava localizar o endereço digitado pelo Nominatim; foi removida por decisão do dono.)
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. **Funcionamento: segunda a sábado, 18h–23h; fechada aos domingos** (regra em `STORE_INFO.schedule`; `closedDates` lista datas fechadas, hoje vazia: 12/10/2026 abre normal). Promoção todos os dias.
- **Visual e UX:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display (títulos) + Inter (texto), mobile-first e **calmo no celular** (hero simples, 1 CTA principal, sem brilhos competindo; barra fixa discreta). Sistema de microinterações sutil em tudo (tokens de movimento em `tailwind.config.js`: 150/220/350 ms, easing suave): troca de página, botões, links, cartões, campos e rótulos, abas, passos do montador, contador do carrinho, menu do celular, revelação ao rolar (`appReveal`), foto com fade (`app-flavor-image`). Tudo respeita `prefers-reduced-motion` e usa só transform/opacity (CLS medido = 0). Tipografia/contraste: corpo 16px, `text-xs` = 13px, texto ≥ 4,5:1 (corrido ≥ 7:1), tokens `cream-muted/cream-dim` clareados; botão "Não sei meu CEP" é um cartão com interruptor (`role="switch"`).

## 4. Arquitetura

```
src/app/
  data/         menu.data.ts (cardápio transcrito), prices.ts (preços), store-info.ts (loja/redes)
  interfaces/   pizza-menu.interface.ts, cart.interface.ts
  services/     catalog · size-rules · pricing · persistence · cart · pizza-builder ·
                checkout-draft · checkout-validation · cep · format · whatsapp-message
  facade/       menu · order (montagem) · cart · checkout   ← únicas portas dos componentes
  components/   layout/ shared/ home/ menu/ builder/ cart/ (+ página 404)
test/           specs (services, facades, componentes)
```

- **Componentes finos:** usam facades. Não duplicar formatação/cálculo (`FormatService`, `PricingService`).
- **Persistência (`localStorage`, chaves `disk-pizza:v2:*`):** carrinho, pizza em montagem, passo do assistente e formulário do checkout são salvos a cada alteração. Ao restaurar, tudo é validado campo a campo (tipos errados, sabores inexistentes, tamanho desconhecido, excesso de sabores são descartados/cortados; nunca quebra a tela).
- **Horário de funcionamento (loja fechada = só o envio é bloqueado):** o cliente navega, monta pizza e deixa o carrinho pronto; o carrinho, o rascunho e o formulário continuam salvos. `getStoreStatus(instante, schedule)` (função pura em `services/store-hours.service.ts`) calcula o estado **sempre no fuso America/Sao_Paulo via `Intl`**, nunca no fuso do aparelho (18:00 abre, 23:00 em ponto já fecha; domingo e `closedDates` fecham o dia). `StoreHoursService.snapshot()` não tem cache e é chamado no clique de enviar: `CheckoutFacadeService.submit()` devolve `{ ok:false, errors:{}, closed }` e nada abre o WhatsApp (cobre a virada de horário com a página aberta); `status# Contexto do Projeto — Disk Pizza (pizzaria italiana premium)

> Atualizado em 2026-09-28 após a reformulação completa do front-end e da lógica de pedidos.
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md). Este arquivo descreve o **estado atual**; `README.md`, `QUICK_START.md` e `documents/*` ainda descrevem a arquitetura ANTIGA (ver seção 8).

## 1. O que é

Site de pedidos de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

## 2. Stack e comandos

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones; npm o marca como deprecated em favor de `@lucide/angular`, mas funciona com Angular 17) · `@angular/animations` só na transição de rota · ViaCEP · Karma/Jasmine. **Angular Material e CDK foram removidos.**

```
npm ci · npm run start:local · npm run build · npm test
npx ng test --watch=false --browsers=ChromeHeadless     (execução única)
```

Estado verificado: build sem erros (initial ≈ 514 kB; o **warn do budget foi para 560 kB** por causa do CSS dos efeitos, erro em 1 MB) e **258 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP). Quem **não sabe o CEP** marca "Não sei meu CEP" e preenche à mão (`draft.manualAddress`): rua, número, bairro, cidade e UF são obrigatórios; **só o complemento é opcional** e o CEP deixa de ser exigido (some do formulário e da mensagem). Desmarcar volta ao CEP e mantém o que foi digitado.
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - **Endereço manual (sem CEP): NUNCA há entrega grátis.** Com "Não sei meu CEP" ligado nada é consultado e o cartão de grátis some na hora (mesmo que o CEP tenha liberado antes); fica o aviso padrão de que a loja informa a taxa no WhatsApp. A entrega grátis só existe **com CEP, dentro das regras**. (Uma versão anterior tentava localizar o endereço digitado pelo Nominatim; foi removida por decisão do dono.)
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. **Funcionamento: segunda a sábado, 18h–23h; fechada aos domingos** (regra em `STORE_INFO.schedule`; `closedDates` lista datas fechadas, hoje vazia: 12/10/2026 abre normal). Promoção todos os dias.
- **Visual e UX:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display (títulos) + Inter (texto), mobile-first e **calmo no celular** (hero simples, 1 CTA principal, sem brilhos competindo; barra fixa discreta). Sistema de microinterações sutil em tudo (tokens de movimento em `tailwind.config.js`: 150/220/350 ms, easing suave): troca de página, botões, links, cartões, campos e rótulos, abas, passos do montador, contador do carrinho, menu do celular, revelação ao rolar (`appReveal`), foto com fade (`app-flavor-image`). Tudo respeita `prefers-reduced-motion` e usa só transform/opacity (CLS medido = 0). Tipografia/contraste: corpo 16px, `text-xs` = 13px, texto ≥ 4,5:1 (corrido ≥ 7:1), tokens `cream-muted/cream-dim` clareados; botão "Não sei meu CEP" é um cartão com interruptor (`role="switch"`).

## 4. Arquitetura

```
src/app/
  data/         menu.data.ts (cardápio transcrito), prices.ts (preços), store-info.ts (loja/redes)
  interfaces/   pizza-menu.interface.ts, cart.interface.ts
  services/     catalog · size-rules · pricing · persistence · cart · pizza-builder ·
                checkout-draft · checkout-validation · cep · format · whatsapp-message
  facade/       menu · order (montagem) · cart · checkout   ← únicas portas dos componentes
  components/   layout/ shared/ home/ menu/ builder/ cart/ (+ página 404)
test/           specs (services, facades, componentes)
```

- **Componentes finos:** usam facades. Não duplicar formatação/cálculo (`FormatService`, `PricingService`).
- **Persistência (`localStorage`, chaves `disk-pizza:v2:*`):** carrinho, pizza em montagem, passo do assistente e formulário do checkout são salvos a cada alteração. Ao restaurar, tudo é validado campo a campo (tipos errados, sabores inexistentes, tamanho desconhecido, excesso de sabores são descartados/cortados; nunca quebra a tela).
 reavalia a cada 30 s e ao voltar ao foco (o timer roda fora do NgZone; token `STORE_STATUS_TICK`). `StoreFacadeService` entrega `view# Contexto do Projeto — Disk Pizza (pizzaria italiana premium)

> Atualizado em 2026-09-28 após a reformulação completa do front-end e da lógica de pedidos.
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md). Este arquivo descreve o **estado atual**; `README.md`, `QUICK_START.md` e `documents/*` ainda descrevem a arquitetura ANTIGA (ver seção 8).

## 1. O que é

Site de pedidos de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

## 2. Stack e comandos

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones; npm o marca como deprecated em favor de `@lucide/angular`, mas funciona com Angular 17) · `@angular/animations` só na transição de rota · ViaCEP · Karma/Jasmine. **Angular Material e CDK foram removidos.**

```
npm ci · npm run start:local · npm run build · npm test
npx ng test --watch=false --browsers=ChromeHeadless     (execução única)
```

Estado verificado: build sem erros (initial ≈ 514 kB; o **warn do budget foi para 560 kB** por causa do CSS dos efeitos, erro em 1 MB) e **258 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP). Quem **não sabe o CEP** marca "Não sei meu CEP" e preenche à mão (`draft.manualAddress`): rua, número, bairro, cidade e UF são obrigatórios; **só o complemento é opcional** e o CEP deixa de ser exigido (some do formulário e da mensagem). Desmarcar volta ao CEP e mantém o que foi digitado.
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - **Endereço manual (sem CEP): NUNCA há entrega grátis.** Com "Não sei meu CEP" ligado nada é consultado e o cartão de grátis some na hora (mesmo que o CEP tenha liberado antes); fica o aviso padrão de que a loja informa a taxa no WhatsApp. A entrega grátis só existe **com CEP, dentro das regras**. (Uma versão anterior tentava localizar o endereço digitado pelo Nominatim; foi removida por decisão do dono.)
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. **Funcionamento: segunda a sábado, 18h–23h; fechada aos domingos** (regra em `STORE_INFO.schedule`; `closedDates` lista datas fechadas, hoje vazia: 12/10/2026 abre normal). Promoção todos os dias.
- **Visual e UX:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display (títulos) + Inter (texto), mobile-first e **calmo no celular** (hero simples, 1 CTA principal, sem brilhos competindo; barra fixa discreta). Sistema de microinterações sutil em tudo (tokens de movimento em `tailwind.config.js`: 150/220/350 ms, easing suave): troca de página, botões, links, cartões, campos e rótulos, abas, passos do montador, contador do carrinho, menu do celular, revelação ao rolar (`appReveal`), foto com fade (`app-flavor-image`). Tudo respeita `prefers-reduced-motion` e usa só transform/opacity (CLS medido = 0). Tipografia/contraste: corpo 16px, `text-xs` = 13px, texto ≥ 4,5:1 (corrido ≥ 7:1), tokens `cream-muted/cream-dim` clareados; botão "Não sei meu CEP" é um cartão com interruptor (`role="switch"`).

## 4. Arquitetura

```
src/app/
  data/         menu.data.ts (cardápio transcrito), prices.ts (preços), store-info.ts (loja/redes)
  interfaces/   pizza-menu.interface.ts, cart.interface.ts
  services/     catalog · size-rules · pricing · persistence · cart · pizza-builder ·
                checkout-draft · checkout-validation · cep · format · whatsapp-message
  facade/       menu · order (montagem) · cart · checkout   ← únicas portas dos componentes
  components/   layout/ shared/ home/ menu/ builder/ cart/ (+ página 404)
test/           specs (services, facades, componentes)
```

- **Componentes finos:** usam facades. Não duplicar formatação/cálculo (`FormatService`, `PricingService`).
- **Persistência (`localStorage`, chaves `disk-pizza:v2:*`):** carrinho, pizza em montagem, passo do assistente e formulário do checkout são salvos a cada alteração. Ao restaurar, tudo é validado campo a campo (tipos errados, sabores inexistentes, tamanho desconhecido, excesso de sabores são descartados/cortados; nunca quebra a tela).
 (`open`, `label`, `notice`) e os textos "Segunda a sábado, das 18h às 23h" / "Fechado aos domingos", gerados da tabela. Telas: selo `role="status"` no cabeçalho ("Aberto até 23h" / "Fechado · abre amanhã 18h"), status no hero da home, aviso no topo do carrinho e no resumo (`app-store-closed-notice`) com o botão desabilitado ("Loja fechada no momento"). A mensagem do WhatsApp não muda. Limite conhecido: confia no relógio do aparelho (convertido para Brasília); se estiver errado, a loja confirma no WhatsApp. **Testes:** `test/_setup.spec.ts` fixa o relógio em terça 19h (aberto) e desliga o timer; use `fakeClock.set(iso)` de `test/helpers/fake-clock.ts` (`SUNDAY_INSTANT` = domingo 12h).
 recalcula quando o formulário muda. Só a posição vinda do CEP entra no cache (o fallback por endereço não). Trocar o CEP limpa o que o CEP anterior preencheu sozinho (e o cliente não editou). Timeout de 6 s em ViaCEP, AwesomeAPI e Nominatim.
  - **Persistência:** cada gravação guarda `…:savedAt`; carrinho e montador expiram em 3 dias, formulário em 30 (dado sem marca de tempo não expira); carrinho, formulário e montador acompanham outras abas pelo evento `storage` (`PersistenceService.changes# Contexto do Projeto — Disk Pizza (pizzaria italiana premium)

> Atualizado em 2026-09-28 após a reformulação completa do front-end e da lógica de pedidos.
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md). Este arquivo descreve o **estado atual**; `README.md`, `QUICK_START.md` e `documents/*` ainda descrevem a arquitetura ANTIGA (ver seção 8).

## 1. O que é

Site de pedidos de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

## 2. Stack e comandos

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones; npm o marca como deprecated em favor de `@lucide/angular`, mas funciona com Angular 17) · `@angular/animations` só na transição de rota · ViaCEP · Karma/Jasmine. **Angular Material e CDK foram removidos.**

```
npm ci · npm run start:local · npm run build · npm test
npx ng test --watch=false --browsers=ChromeHeadless     (execução única)
```

Estado verificado: build sem erros (initial ≈ 514 kB; o **warn do budget foi para 560 kB** por causa do CSS dos efeitos, erro em 1 MB) e **258 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP). Quem **não sabe o CEP** marca "Não sei meu CEP" e preenche à mão (`draft.manualAddress`): rua, número, bairro, cidade e UF são obrigatórios; **só o complemento é opcional** e o CEP deixa de ser exigido (some do formulário e da mensagem). Desmarcar volta ao CEP e mantém o que foi digitado.
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - **Endereço manual (sem CEP): NUNCA há entrega grátis.** Com "Não sei meu CEP" ligado nada é consultado e o cartão de grátis some na hora (mesmo que o CEP tenha liberado antes); fica o aviso padrão de que a loja informa a taxa no WhatsApp. A entrega grátis só existe **com CEP, dentro das regras**. (Uma versão anterior tentava localizar o endereço digitado pelo Nominatim; foi removida por decisão do dono.)
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. **Funcionamento: segunda a sábado, 18h–23h; fechada aos domingos** (regra em `STORE_INFO.schedule`; `closedDates` lista datas fechadas, hoje vazia: 12/10/2026 abre normal). Promoção todos os dias.
- **Visual e UX:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display (títulos) + Inter (texto), mobile-first e **calmo no celular** (hero simples, 1 CTA principal, sem brilhos competindo; barra fixa discreta). Sistema de microinterações sutil em tudo (tokens de movimento em `tailwind.config.js`: 150/220/350 ms, easing suave): troca de página, botões, links, cartões, campos e rótulos, abas, passos do montador, contador do carrinho, menu do celular, revelação ao rolar (`appReveal`), foto com fade (`app-flavor-image`). Tudo respeita `prefers-reduced-motion` e usa só transform/opacity (CLS medido = 0). Tipografia/contraste: corpo 16px, `text-xs` = 13px, texto ≥ 4,5:1 (corrido ≥ 7:1), tokens `cream-muted/cream-dim` clareados; botão "Não sei meu CEP" é um cartão com interruptor (`role="switch"`).

## 4. Arquitetura

```
src/app/
  data/         menu.data.ts (cardápio transcrito), prices.ts (preços), store-info.ts (loja/redes)
  interfaces/   pizza-menu.interface.ts, cart.interface.ts
  services/     catalog · size-rules · pricing · persistence · cart · pizza-builder ·
                checkout-draft · checkout-validation · cep · format · whatsapp-message
  facade/       menu · order (montagem) · cart · checkout   ← únicas portas dos componentes
  components/   layout/ shared/ home/ menu/ builder/ cart/ (+ página 404)
test/           specs (services, facades, componentes)
```

- **Componentes finos:** usam facades. Não duplicar formatação/cálculo (`FormatService`, `PricingService`).
- **Persistência (`localStorage`, chaves `disk-pizza:v2:*`):** carrinho, pizza em montagem, passo do assistente e formulário do checkout são salvos a cada alteração. Ao restaurar, tudo é validado campo a campo (tipos errados, sabores inexistentes, tamanho desconhecido, excesso de sabores são descartados/cortados; nunca quebra a tela).
- **Horário de funcionamento (loja fechada = só o envio é bloqueado):** o cliente navega, monta pizza e deixa o carrinho pronto; o carrinho, o rascunho e o formulário continuam salvos. `getStoreStatus(instante, schedule)` (função pura em `services/store-hours.service.ts`) calcula o estado **sempre no fuso America/Sao_Paulo via `Intl`**, nunca no fuso do aparelho (18:00 abre, 23:00 em ponto já fecha; domingo e `closedDates` fecham o dia). `StoreHoursService.snapshot()` não tem cache e é chamado no clique de enviar: `CheckoutFacadeService.submit()` devolve `{ ok:false, errors:{}, closed }` e nada abre o WhatsApp (cobre a virada de horário com a página aberta); `status# Contexto do Projeto — Disk Pizza (pizzaria italiana premium)

> Atualizado em 2026-09-28 após a reformulação completa do front-end e da lógica de pedidos.
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md). Este arquivo descreve o **estado atual**; `README.md`, `QUICK_START.md` e `documents/*` ainda descrevem a arquitetura ANTIGA (ver seção 8).

## 1. O que é

Site de pedidos de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

## 2. Stack e comandos

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones; npm o marca como deprecated em favor de `@lucide/angular`, mas funciona com Angular 17) · `@angular/animations` só na transição de rota · ViaCEP · Karma/Jasmine. **Angular Material e CDK foram removidos.**

```
npm ci · npm run start:local · npm run build · npm test
npx ng test --watch=false --browsers=ChromeHeadless     (execução única)
```

Estado verificado: build sem erros (initial ≈ 514 kB; o **warn do budget foi para 560 kB** por causa do CSS dos efeitos, erro em 1 MB) e **258 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP). Quem **não sabe o CEP** marca "Não sei meu CEP" e preenche à mão (`draft.manualAddress`): rua, número, bairro, cidade e UF são obrigatórios; **só o complemento é opcional** e o CEP deixa de ser exigido (some do formulário e da mensagem). Desmarcar volta ao CEP e mantém o que foi digitado.
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - **Endereço manual (sem CEP): NUNCA há entrega grátis.** Com "Não sei meu CEP" ligado nada é consultado e o cartão de grátis some na hora (mesmo que o CEP tenha liberado antes); fica o aviso padrão de que a loja informa a taxa no WhatsApp. A entrega grátis só existe **com CEP, dentro das regras**. (Uma versão anterior tentava localizar o endereço digitado pelo Nominatim; foi removida por decisão do dono.)
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. **Funcionamento: segunda a sábado, 18h–23h; fechada aos domingos** (regra em `STORE_INFO.schedule`; `closedDates` lista datas fechadas, hoje vazia: 12/10/2026 abre normal). Promoção todos os dias.
- **Visual e UX:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display (títulos) + Inter (texto), mobile-first e **calmo no celular** (hero simples, 1 CTA principal, sem brilhos competindo; barra fixa discreta). Sistema de microinterações sutil em tudo (tokens de movimento em `tailwind.config.js`: 150/220/350 ms, easing suave): troca de página, botões, links, cartões, campos e rótulos, abas, passos do montador, contador do carrinho, menu do celular, revelação ao rolar (`appReveal`), foto com fade (`app-flavor-image`). Tudo respeita `prefers-reduced-motion` e usa só transform/opacity (CLS medido = 0). Tipografia/contraste: corpo 16px, `text-xs` = 13px, texto ≥ 4,5:1 (corrido ≥ 7:1), tokens `cream-muted/cream-dim` clareados; botão "Não sei meu CEP" é um cartão com interruptor (`role="switch"`).

## 4. Arquitetura

```
src/app/
  data/         menu.data.ts (cardápio transcrito), prices.ts (preços), store-info.ts (loja/redes)
  interfaces/   pizza-menu.interface.ts, cart.interface.ts
  services/     catalog · size-rules · pricing · persistence · cart · pizza-builder ·
                checkout-draft · checkout-validation · cep · format · whatsapp-message
  facade/       menu · order (montagem) · cart · checkout   ← únicas portas dos componentes
  components/   layout/ shared/ home/ menu/ builder/ cart/ (+ página 404)
test/           specs (services, facades, componentes)
```

- **Componentes finos:** usam facades. Não duplicar formatação/cálculo (`FormatService`, `PricingService`).
- **Persistência (`localStorage`, chaves `disk-pizza:v2:*`):** carrinho, pizza em montagem, passo do assistente e formulário do checkout são salvos a cada alteração. Ao restaurar, tudo é validado campo a campo (tipos errados, sabores inexistentes, tamanho desconhecido, excesso de sabores são descartados/cortados; nunca quebra a tela).
 reavalia a cada 30 s e ao voltar ao foco (o timer roda fora do NgZone; token `STORE_STATUS_TICK`). `StoreFacadeService` entrega `view# Contexto do Projeto — Disk Pizza (pizzaria italiana premium)

> Atualizado em 2026-09-28 após a reformulação completa do front-end e da lógica de pedidos.
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md). Este arquivo descreve o **estado atual**; `README.md`, `QUICK_START.md` e `documents/*` ainda descrevem a arquitetura ANTIGA (ver seção 8).

## 1. O que é

Site de pedidos de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

## 2. Stack e comandos

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones; npm o marca como deprecated em favor de `@lucide/angular`, mas funciona com Angular 17) · `@angular/animations` só na transição de rota · ViaCEP · Karma/Jasmine. **Angular Material e CDK foram removidos.**

```
npm ci · npm run start:local · npm run build · npm test
npx ng test --watch=false --browsers=ChromeHeadless     (execução única)
```

Estado verificado: build sem erros (initial ≈ 514 kB; o **warn do budget foi para 560 kB** por causa do CSS dos efeitos, erro em 1 MB) e **258 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP). Quem **não sabe o CEP** marca "Não sei meu CEP" e preenche à mão (`draft.manualAddress`): rua, número, bairro, cidade e UF são obrigatórios; **só o complemento é opcional** e o CEP deixa de ser exigido (some do formulário e da mensagem). Desmarcar volta ao CEP e mantém o que foi digitado.
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - **Endereço manual (sem CEP): NUNCA há entrega grátis.** Com "Não sei meu CEP" ligado nada é consultado e o cartão de grátis some na hora (mesmo que o CEP tenha liberado antes); fica o aviso padrão de que a loja informa a taxa no WhatsApp. A entrega grátis só existe **com CEP, dentro das regras**. (Uma versão anterior tentava localizar o endereço digitado pelo Nominatim; foi removida por decisão do dono.)
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. **Funcionamento: segunda a sábado, 18h–23h; fechada aos domingos** (regra em `STORE_INFO.schedule`; `closedDates` lista datas fechadas, hoje vazia: 12/10/2026 abre normal). Promoção todos os dias.
- **Visual e UX:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display (títulos) + Inter (texto), mobile-first e **calmo no celular** (hero simples, 1 CTA principal, sem brilhos competindo; barra fixa discreta). Sistema de microinterações sutil em tudo (tokens de movimento em `tailwind.config.js`: 150/220/350 ms, easing suave): troca de página, botões, links, cartões, campos e rótulos, abas, passos do montador, contador do carrinho, menu do celular, revelação ao rolar (`appReveal`), foto com fade (`app-flavor-image`). Tudo respeita `prefers-reduced-motion` e usa só transform/opacity (CLS medido = 0). Tipografia/contraste: corpo 16px, `text-xs` = 13px, texto ≥ 4,5:1 (corrido ≥ 7:1), tokens `cream-muted/cream-dim` clareados; botão "Não sei meu CEP" é um cartão com interruptor (`role="switch"`).

## 4. Arquitetura

```
src/app/
  data/         menu.data.ts (cardápio transcrito), prices.ts (preços), store-info.ts (loja/redes)
  interfaces/   pizza-menu.interface.ts, cart.interface.ts
  services/     catalog · size-rules · pricing · persistence · cart · pizza-builder ·
                checkout-draft · checkout-validation · cep · format · whatsapp-message
  facade/       menu · order (montagem) · cart · checkout   ← únicas portas dos componentes
  components/   layout/ shared/ home/ menu/ builder/ cart/ (+ página 404)
test/           specs (services, facades, componentes)
```

- **Componentes finos:** usam facades. Não duplicar formatação/cálculo (`FormatService`, `PricingService`).
- **Persistência (`localStorage`, chaves `disk-pizza:v2:*`):** carrinho, pizza em montagem, passo do assistente e formulário do checkout são salvos a cada alteração. Ao restaurar, tudo é validado campo a campo (tipos errados, sabores inexistentes, tamanho desconhecido, excesso de sabores são descartados/cortados; nunca quebra a tela).
 (`open`, `label`, `notice`) e os textos "Segunda a sábado, das 18h às 23h" / "Fechado aos domingos", gerados da tabela. Telas: selo `role="status"` no cabeçalho ("Aberto até 23h" / "Fechado · abre amanhã 18h"), status no hero da home, aviso no topo do carrinho e no resumo (`app-store-closed-notice`) com o botão desabilitado ("Loja fechada no momento"). A mensagem do WhatsApp não muda. Limite conhecido: confia no relógio do aparelho (convertido para Brasília); se estiver errado, a loja confirma no WhatsApp. **Testes:** `test/_setup.spec.ts` fixa o relógio em terça 19h (aberto) e desliga o timer; use `fakeClock.set(iso)` de `test/helpers/fake-clock.ts` (`SUNDAY_INSTANT` = domingo 12h).
, assinaturas presas ao ciclo de vida do serviço).
  - **Validação:** DDD real e 9º dígito (celular) / 2–5 (fixo), 27 UFs, nome com letra, número com dígito ou "s/n"; dado restaurado respeita os limites dos campos; carrinho restaurado mescla bebida repetida e refaz ids repetidos.
  - **Envio:** "Tentar de novo" se o CEP falhar por rede; o envio espera até 3 s a consulta de entrega em andamento (`zoneLoading/zoneSettled`); em navegador embutido (Instagram/Facebook) não usa `window.open` e mostra o botão; "Copiar mensagem do pedido" na tela de pedido pronto; "Fazer novo pedido" encerra a edição em andamento e, ao abrir o montador, edição de pizza que já saiu do carrinho vira pizza nova (`reconcileEdit`); falha de carregar módulo após novo deploy recarrega a página uma vez (`isChunkLoadError`).
- **UX do fluxo e acessibilidade (etapa 3):**
  - **Textos honestos:** o botão do resumo é "Finalizar no WhatsApp" (com "Você confirma o envio dentro do WhatsApp. Nada é cobrado agora."); a tela depois do envio diz "Falta só enviar no WhatsApp" e "Seu pedido ainda não foi enviado para a loja."; "Fazer novo pedido" pede confirmação ("Sim, apagar tudo"/"Cancelar"). CTA único "Monte sua pizza" (home, cardápio, cabeçalho) e "Passo" no lugar de "Etapa"; linha de confiança no hero ("Sem cadastro. Você confirma o pedido no WhatsApp."). "Valor confirmado pelo WhatsApp" aparece uma vez (resumo): `app-price [quiet]` nas linhas.
  - **Sabores:** o contador "2/3 sabores" e o aviso de limite ficam fixos (`sticky`) abaixo do cabeçalho enquanto a lista de 71 sabores rola; tocar num sabor bloqueado (limite) explica o motivo; os sabores escolhidos (chips) ficam num cartão logo abaixo.
  - **Carrinho:** botão fixo no celular/tablet ("Preencher dados e finalizar · N itens", `sticky` no fim da página, não `fixed`: o `<main>` tem transform da animação de rota e quebraria `fixed`) leva ao formulário (`goToCheckout`); campos validam ao sair (só os visitados mostram erro antes do 1º envio; `onBlur`); dicas de teclado (`autocapitalize`, `enterkeyhint`, `spellcheck` no `app-text-field`); aviso de privacidade sob o título do formulário (dados ficam no aparelho; CEP consultado em ViaCEP, AwesomeAPI e OpenStreetMap).
  - **Acessibilidade:** o título da página nova é anunciado por `<p role="status">` no `App` (`announcement`); rótulos de pizzas do carrinho incluem os sabores (`PizzaLineView.ariaLabel`); `scroll-padding` (topo 5,5rem, base 6rem) mantém o foco fora das barras fixas.
- **Responsividade, fontes e imagens (etapa 4):**
  - **Fontes auto-hospedadas** (`src/fonts.css`, gerado por `tools/gerar-fontes.js` a partir de `@fontsource-variable/inter` e `@fontsource-variable/playfair-display`; entra em `angular.json` → build `styles`): só os subconjuntos `latin` e `latin-ext`, `font-display: swap`, sem Google Fonts (menos requisições, sem IP do cliente indo ao Google, funciona offline). Sem itálico (nunca foi usado). Números dos títulos em `lining-nums`.
  - **Menu completo a partir de 1024 px** (`lg`): cabeçalho (links, CTA, hambúrguer), `.menu-sheet`/`.menu-scrim` e barra inferior do celular (`mobile-bar`) trocaram `md` por `lg`; em 768–1023 px (iPad em pé) o cabeçalho tem hambúrguer e não estoura. O menu aberto rola dentro dele em celular deitado (`max-height: 100dvh - 4rem`); cabeçalho e contador de sabores não ficam fixos com altura útil ≤ 480 px.
  - **320 px sem corte:** passos do montador (rótulo visual do passo atual só a partir de 640 px; **nome acessível "Passo N: rótulo" sempre presente**, antes ficava escondido junto com o rótulo), nome da bebida quebra linha em vez de cortar o volume, tabela de tamanhos com `overflow-x-auto`, abas do cardápio (contador some abaixo de 360 px), barra inferior e botão "Monte sua pizza" sem quebrar texto. Lista de sabores em 1 coluna entre 1024 e 1279 px (o resumo ocupa 320 px). Bairro/Cidade/UF com colunas melhores (3/2/1).
  - **Imagens leves:** logo já recortada em WebP 320/640 px + PNG de reserva (`assets/img/logo-crop-*`; o original de 1080 px/300 KB não é mais baixado; `app-logo [priority]` no cabeçalho e no topo da home); fotos dos sabores em `<picture>` com `nome-192.webp` e `nome-640.webp` (`srcset`/`sizes`; a foto original continua como reserva). **Ao trocar ou incluir uma foto em `src/assets/img-flavors/`, gere as duas variantes com `tools/gerar-imagens.js`** (requer `npm i --no-save sharp`); um teste confere que toda foto usada tem as duas.
  - Outros: `color-scheme: dark`, `interactive-widget=resizes-content`, `100dvh` com rodapé no fim da tela em páginas curtas, área de texto menor no celular, botões do resumo de erros com alvo de 44 px, banner de entrega grátis sem sobrepor o ícone.
- **Mensagem do WhatsApp:** `WhatsappMessageService.buildMessage/buildLink`. Escrita em **1ª pessoa, como o cliente** ("Olá, Disk Pizza! Sou *Nome* e gostaria de fazer um pedido"), enxuta, com negrito do WhatsApp. **Sem emojis nem qualquer caractere acima de U+FFFF:** eles chegam como "�" no WhatsApp Desktop (há teste que trava isso e um snapshot literal do formato). O fecho pede a confirmação do valor total e da **taxa de entrega**. O total só aparece quando todos os preços existem. O carrinho não é limpo após enviar: só com "Fazer novo pedido".
- **Máscaras/limites do checkout:** telefone `(41) 99999-9999` (descarta +55 colado), CEP `00000-000`, UF (2 letras maiúsculas), **troco `R$ 1.000,50`** (`FormatService.moneyMask`: ponto é sempre milhar, só a vírgula é decimal, até 5 dígitos inteiros; completa `,00` ao sair do campo). Nome 60, rua 80, número 10, complemento/bairro/cidade 60 caracteres; observações da pizza 300 e do pedido 400 (áreas de texto de altura fixa, sem redimensionar).
- **Bebidas (`DrinkPickerComponent`):** a quantidade mostrada é a do carrinho (`−`/`+`; `−` na quantidade 1 remove). A revisão do builder lista "Bebidas no pedido". No carrinho o seletor usa `onlyAvailable`: lista só as bebidas que ainda não estão no pedido (as escolhidas aparecem apenas em "Seus itens"), e a seção some quando todas já foram adicionadas.
- **Editar pizza do carrinho:** botão "Editar" em cada pizza → `OrderFacadeService.startEdit(id)` carrega a pizza no montador (rascunho com `editingId` e `quantity`, persistido) e abre em "Sabores" com aviso e "Cancelar edição". Salvar (`addToCart`) **substitui a linha original** (mesmo id e posição, via `CartService.replacePizza`); se a linha foi removida no meio do caminho, entra como nova. Cancelar não altera o carrinho.

Rotas: `''` home · `cardapio` · `montar-pizza` (5 passos) · `carrinho` (itens + checkout) · `**` 404. Redirects: `menu`→`cardapio`, `view-cart`→`carrinho`, `contacts`/`history`→âncoras da home.

## 5. Dados: origem e pontos a conferir com a loja

O cardápio foi **transcrito por leitura visual** das 7 imagens em `src/assets/sabores-whats/` (não é enviado no deploy: `ignore` no `angular.json`). Itens marcados `CONFERIR` em `menu.data.ts`:
- **Presunto Misto:** ingredientes ocultos por tarja no cardápio impresso (a UI mostra "Ingredientes a confirmar com a loja").
- **Calabresa com Tomate:** o impresso traz "Mussarela e lombo defumado" (provável erro do cardápio).
- **Mista:** o impresso lista "ninho" (provavelmente "milho").
- Foram corrigidos na transcrição: "barata palha"→batata palha, "Romeu e Julieta" duplicado, "catupiy/chaddar".
- Sabores com "opção catupiry/cebola" mostram a dica; o cliente detalha nas observações.

## 6. Pendências e decisões em aberto

1. **Preencher `prices.ts`** (maior pendência de produto).
2. **Confirmar com a loja:** os 3 itens `CONFERIR` acima (o horário 18h–23h e o domingo fechado foram confirmados pelo dono em 2026-10-07; feriados entram em `schedule.closedDates`). O endereço da loja saiu da tela de Contatos por pedido do dono.
3. O texto antigo "Entrega grátis em São Brás, Santo Inácio e Santa Felicidade" **não foi migrado** (sugere valor de entrega). Decidir se volta como texto.
4. **Fotos dos sabores (71/71, sendo 23 próprias e 48 ilustrativas):** todo sabor tem foto, por pedido do dono. **23** têm foto do próprio sabor (Pexels e Unsplash, licenças que **não exigem crédito visível**; fotógrafo, link e licença em `src/assets/img-flavors/CREDITS.md`, e um teste garante que `CREDITS.md` e o uso batem). Os outros **48** usam a **foto mais parecida** (mesmo grupo de ingredientes; doce só recebe foto de doce): mapeamento em `ILLUSTRATIVE_PHOTOS` no `src/app/data/menu.data.ts`, e a tela mostra **"Foto ilustrativa"** nesses cartões (cardápio, cartão e lista). Os destaques da home usam só foto própria. **Para trocar por foto real de um sabor:** ponha o arquivo em `src/assets/img-flavors/`, passe o caminho no 5º argumento de `flavor(...)` (a foto própria vale sobre a ilustrativa e o aviso some) e registre no `CREDITS.md`. Ressalvas: `frango-com-catupiry`, `portuguesa`, `peperone` e `mexicana` são fotos antigas **sem origem/licença documentada**; `mussarela-tomate.jpg` é um close; `chocolate-morango.jpg` é em formato de coração. O melhor resultado é trocar tudo por fotos reais da pizzaria.
5. **Pedido muito grande:** a URL do wa.me chega a ~5,7 mil caracteres com 10 pizzas + 10 bebidas; o limite real do WhatsApp não foi testado. Ideia: agrupar pizzas iguais e oferecer "copiar mensagem".
6. Depois de um CEP "não encontrado", o endereço do CEP anterior permanece (o cliente pode editar).
7. Build perto do budget de 500 kB; `lucide-angular` deprecated (migrar para `@lucide/angular` no futuro).
8. Não verificado: leitor de screen real, rolagem suave real, Safari/iOS, WhatsApp de verdade, deploy na Vercel (há `vercel.json` com rewrite de SPA e output `dist/projeto-pizzaria`, mas o deploy real ainda não foi conferido).

## 7. Como foi validado

Lógica (services/facades) com testes unitários; UI verificada no navegador embutido em 375px e 1280px (fluxo completo, CEP real, recarregar no meio do fluxo, dinheiro→troco, link do WhatsApp gerado com `window.open` interceptado); revisão independente (QA) com testes hostis de `localStorage`, contraste calculado (texto ≥ 5,8:1) e grep da taxa de entrega. Achados críticos/altos da revisão já foram corrigidos e cobertos por testes.

## 8. Documentação desatualizada

`README.md` (genérico do CLI), `QUICK_START.md`, `documents/*` e `AGENTS.md` (seção Architecture cita `src/assets/` e `mocks` e "FormatService/CartCalculationService") descrevem a estrutura antiga. `CartCalculationService`, `OrderService`, `mocks/` e os componentes antigos foram **removidos**. Atualizar ou apagar esses arquivos é um próximo passo.
