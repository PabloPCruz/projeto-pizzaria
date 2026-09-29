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

Estado verificado: build sem erros (initial ≈ 487 kB; **warn do budget em 500 kB, pouca folga**) e **203 testes passando**. O `npm test` estava quebrado/vazio antes (assets sem `output` e specs em `test/` fora do glob); foi corrigido em `angular.json` (`include: ../test/**/*.spec.ts`) e `tsconfig.spec.json`.

## 3. Decisões de produto (confirmadas com o dono)

- **Limite de sabores por tamanho:** pequena 1 (4 fatias), média 2 (6), grande 3 (8), big 3 (12), gigante 4 (16). Pode misturar salgado e doce.
- **Bebidas:** refrigerante 2L (Coca, Coca Zero, Fanta, Guaraná, Sprite, Kuat), Kuat 1,5L, Coca 600ml, Coca lata, Cerveja Brahma lata. Vinhos ficaram de fora.
- **Bordas (7):** Catupiry, Catupiry c/ Cheddar, Cheddar, Nutella, Chocolate ao Leite, Chocolate Branco, Chocolate ao Leite c/ Branco.
- **Pagamento:** Pix, Cartão ou Dinheiro (com "Precisa de troco para quanto?", opcional).
- **Endereço completo obrigatório**, com preenchimento por CEP (ViaCEP).
- **Taxa de entrega: o site NUNCA calcula nem exibe valor.** Regra única: **endereço a até 3 km da loja, em linha reta (360°), tem entrega grátis** e o checkout mostra o cartão "Taxa de entrega grátis para o seu endereço" (formulário + resumo) e a mensagem do WhatsApp diz "Entrega grátis (até 3 km da loja)". Fora do raio, ou quando o endereço não pôde ser localizado, mantém-se o aviso padrão de que a loja informa a taxa na confirmação pelo WhatsApp (o sistema **nunca afirma "grátis" sem certeza**).
  - Como decide (`DeliveryZoneService`): localiza o endereço pelo **CEP na AwesomeAPI** (`cep.awesomeapi.com.br`); se não achar, usa o **Nominatim/OpenStreetMap** com rua+cidade; mede a distância (Haversine) até o ponto da loja em `STORE_INFO.freeDelivery` (Rua Luiz Braille, 135, CEP 82015-290; **o endereço não é exibido no site**). Coordenada fora do Brasil é descartada. A consulta roda para todo CEP completo (o ViaCEP às vezes não conhece CEPs que a AwesomeAPI conhece, ex.: 82030-000). Editar o CEP zera a zona na hora e cancela a consulta anterior. "Grátis" só vale se a zona foi calculada para o CEP que está no formulário no envio.
  - Limites conhecidos: a posição vem do CEP (nível de rua), então casos muito perto dos 3 km podem cair para um lado ou outro; a loja confirma o pedido de qualquer forma. A **BrasilAPI foi descartada**: devolve o centro da cidade (~6 km da loja) para o CEP da loja.
  - Onde ajustar: raio e ponto da loja em `src/app/data/store-info.ts`.
- **Preços:** `src/app/data/prices.ts` está **vazio de propósito**. Sem preço, a UI e a mensagem dizem "valor confirmado pelo WhatsApp". Ao preencher, os totais aparecem sozinhos (pizza por tamanho × categoria — vale o sabor mais caro —, borda e bebida).
- **Loja:** WhatsApp (41) 99744-9380 (`5541997449380`), fone (41) 3273-2145, Facebook `facebook.com/diskpizzasandra`, Instagram `diskpizzactba`. Fechado aos domingos, promoção todos os dias.
- **Visual:** evolução da marca (carvão + dourado, vermelho da logo só em CTAs), Playfair Display + Inter, mobile-first.

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
2. **Confirmar com a loja:** o horário "Segunda a sábado, 18h–23h" (veio da página antiga) e os 3 itens `CONFERIR` acima. O endereço da loja saiu da tela de Contatos por pedido do dono.
3. O texto antigo "Entrega grátis em São Brás, Santo Inácio e Santa Felicidade" **não foi migrado** (sugere valor de entrega). Decidir se volta como texto.
4. **Fotos dos sabores (em aberto, aguardando aprovação do plano):** 64 dos 71 sabores estão sem foto (30 tradicionais, 22 especiais, 12 doces). Problemas nas 7 existentes: `chocolate-com-morango.jpg` tem **marca d'água de banco de imagens** (risco de licença) e deve ser trocada; `calabresa.jpg` é uma pizza de **pepperoni** (serve ao sabor Peperone, não à Calabresa); `4-queijos.jpg` e `siciliana.jpeg` pesam ~1,2 MB cada (comprimir). Para as novas, usar só fontes de licença livre (Unsplash/Pexels) e conferir **foto a foto** os ingredientes visíveis (a legenda do site engana: uma "chicken pizza" era BBQ com abacaxi). Sabores sem foto adequada ficam com o placeholder em vez de uma foto que não corresponde.
5. **Pedido muito grande:** a URL do wa.me chega a ~5,7 mil caracteres com 10 pizzas + 10 bebidas; o limite real do WhatsApp não foi testado. Ideia: agrupar pizzas iguais e oferecer "copiar mensagem".
6. Depois de um CEP "não encontrado", o endereço do CEP anterior permanece (o cliente pode editar).
7. Build perto do budget de 500 kB; `lucide-angular` deprecated (migrar para `@lucide/angular` no futuro).
8. Não verificado: leitor de screen real, rolagem suave real, Safari/iOS, WhatsApp de verdade, deploy na Vercel (não há `vercel.json`; output `dist/projeto-pizzaria`).

## 7. Como foi validado

Lógica (services/facades) com testes unitários; UI verificada no navegador embutido em 375px e 1280px (fluxo completo, CEP real, recarregar no meio do fluxo, dinheiro→troco, link do WhatsApp gerado com `window.open` interceptado); revisão independente (QA) com testes hostis de `localStorage`, contraste calculado (texto ≥ 5,8:1) e grep da taxa de entrega. Achados críticos/altos da revisão já foram corrigidos e cobertos por testes.

## 8. Documentação desatualizada

`README.md` (genérico do CLI), `QUICK_START.md`, `documents/*` e `AGENTS.md` (seção Architecture cita `src/assets/` e `mocks` e "FormatService/CartCalculationService") descrevem a estrutura antiga. `CartCalculationService`, `OrderService`, `mocks/` e os componentes antigos foram **removidos**. Atualizar ou apagar esses arquivos é um próximo passo.
