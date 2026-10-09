# Preços informativos e seção de promoções (2026-10-09)

## Objetivo
Mostrar os valores do cardápio ao cliente (só informativos) e convidar para as promoções pelo WhatsApp, sem mudar cálculo, carrinho nem mensagem do pedido.

## Decisões do dono
- Valores só exibidos: não entram em total, carrinho nem mensagem.
- Doce segue o valor dos tradicionais; pizza com sabor especial vale o valor dos especiais para a pizza inteira.
- Texto do aviso: "Pizza com sabor especial: vale o valor dos especiais para a pizza inteira."
- Botão de promoções com a mensagem "Olá! Gostaria de entrar na lista de transmissão para receber as promoções da pizzaria."

## Desenho
- `MENU_PRICES` (`data/prices.ts`) é a única fonte dos valores exibidos. `PRICES` (cobrança) segue vazia; assim o `PricingService`, o carrinho e a mensagem não mudam por construção.
- `PriceListService` devolve textos já formatados (`null` = a loja não informou; a tela não mostra nada). `MenuFacadeService` expõe para os componentes.
- Telas: tabela de tamanhos (Tradicionais × Especiais) e bordas/bebidas no cardápio; valores por tamanho no passo 1; valor da borda no tamanho escolhido no passo 3; valor nas bebidas (cardápio, montador, carrinho). `app-price-rule-notice` mostra o aviso do sabor especial.
- Home: `app-promo-cta` com link `wa.me/<número de STORE_INFO>?text=...` gerado por `StoreFacadeService.promoSignupUrl` (reaproveita `WhatsappMessageService.linkFromMessage`).

## Confirmado pela loja
Catupiry com Cheddar tem o valor das demais bordas; Coca Zero 2L = Coca 2L (14,00), Coca 600ml 8,00, Coca lata 6,00, Kuat 1,5L 10,00 (o mesmo valor da "Coca 1L" citada); "bem casado" = Chocolate ao Leite com Chocolate Branco; todos os doces são tradicionais.

## Pendências com a loja
Nenhuma de preço: todo item do cardápio tem valor.

## Testes
`price-list.service.spec.ts` (valores, regras, lacunas e garantia de que a cobrança segue vazia), `menu-prices.component.spec.ts` (telas e mensagem sem "R$"), `promo-cta.component.spec.ts` (link, acessibilidade, texto honesto).
