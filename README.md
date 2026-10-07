# Disk Pizza — site de pedidos

Site de uma pizzaria de Curitiba (Instagram `@diskpizzactba`). O cliente vê o cardápio, monta a pizza em passos, adiciona ao carrinho, preenche endereço e pagamento e **finaliza abrindo o WhatsApp da loja** com a mensagem do pedido pronta. Não há back-end: tudo roda no navegador.

> **Estado atual do projeto, decisões de produto e pendências:** [CONTEXTO_PROJETO.md](CONTEXTO_PROJETO.md).
> Regras de trabalho do repositório: [AGENTS.md](AGENTS.md).

## Stack

Angular 17 (NgModule, rotas lazy) · Tailwind CSS 3 · `lucide-angular` (ícones) · fontes Inter e Playfair Display auto-hospedadas · ViaCEP, AwesomeAPI e OpenStreetMap (só para o CEP e a distância da entrega) · Karma/Jasmine.

## Comandos

```bash
npm ci                 # instala as dependências (Node 20 recomendado, ver .nvmrc)
npm run start:local    # servidor de desenvolvimento em http://localhost:4200 (abre o navegador)
npm run build          # build de produção em dist/projeto-pizzaria
npm test               # testes no Chrome (modo observação)
npm run test:ci        # testes uma vez, Chrome sem interface (o que o CI roda)
```

## Estrutura

```
src/app/
  data/         cardápio (menu.data.ts), preços (prices.ts, vazio de propósito), loja e horário (store-info.ts)
  interfaces/   contratos (carrinho, cardápio, horário)
  services/     regras: catálogo, carrinho, montador, checkout, CEP, entrega, horário, mensagem do WhatsApp...
  facade/       única porta dos componentes para as regras
  components/   telas (home, cardápio, montador, carrinho) e peças compartilhadas
test/           testes (services, facades, componentes)
tools/          scripts de geração (fontes e variantes de imagem)
docs/superpowers/   especificações e planos de cada melhoria
```

Regra de ouro: componentes finos. Formatação e conta ficam em `FormatService` e `PricingService`; horário de funcionamento em `StoreHoursService`; o site **nunca calcula a taxa de entrega** (a loja informa no WhatsApp).

## Loja aberta/fechada

A loja atende de segunda a sábado, das 18h às 23h (horário de Brasília). Fora disso, e nas datas listadas em `STORE_INFO.schedule.closedDates` (`src/app/data/store-info.ts`), o cliente pode montar o pedido, mas o envio pelo WhatsApp fica bloqueado. Para fechar num feriado, acrescente a data (`'AAAA-MM-DD'`) a essa lista.

## Preços

`src/app/data/prices.ts` está vazio de propósito: sem preço, a tela e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos.

## Fotos dos sabores

Coloque a foto em `src/assets/img-flavors/`, informe o caminho no cardápio (`menu.data.ts`), registre a origem em `CREDITS.md` e gere as variantes leves:

```bash
npm i --no-save sharp
node tools/gerar-imagens.js
```

## Deploy (Vercel)

`vercel.json` define o comando de build, a pasta de saída (`dist/projeto-pizzaria`) e o redirecionamento das rotas para o `index.html` (recarregar `/carrinho` não dá 404). O GitHub Actions (`.github/workflows/ci.yml`) compila e testa a cada push e pull request.
