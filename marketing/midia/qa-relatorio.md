# QA visual e de texto: artes P03 a P54

Data: 26/10/2026. Escopo: 111 imagens (feed, slides e cenas) e 7 Reels de P03 a P54, abertos em resolução cheia. X01, X02, P01 e P02 já estavam publicados e ficaram de fora.

Checklist usado em cada peça: colisões e cortes, logo legível (com placa em fundo claro ou vermelho), selo "Foto ilustrativa", texto exato do CTA, português e fatos (conferidos com `src/app/data/menu.data.ts`), coerência entre texto e foto, acabamento visual, zona segura dos Reels (250 a 1580 px) e variedade entre posts vizinhos.

## Problemas encontrados e correções

| Post | Peça | Problema | Correção | Status |
|---|---|---|---|---|
| P09 | slide-03 | A etiqueta do CTA ("Peça agora pelo Disk Pizza") cobria o último item da lista ("Ao Leite com Branco"). O título e os 4 itens não cabiam no quadro. | `quadro-cardapio`: novo ajuste automático (`QC_FIT`) que reduz as fontes aos poucos até título, itens e CTA caberem na área livre. O espaçamento das linhas passou a ser em `em`. | Corrigido |
| P36 | feed | Mesmo defeito do layout: o CTA suave "Monte a sua pelo link na bio" saía cortado pela borda de baixo do quadro. | Mesmo ajuste do `quadro-cardapio`. P04 s1 e P09 s2 foram re-renderizados e não mudaram. | Corrigido |
| P07 | feed | O carimbo sangrava pela borda direita e cortava o texto do anel ("PIZZA", "FERIADO"). A linha "Monte a sua pizza pelo site" repetia o CTA suave logo abaixo. | `selo-carimbo`: o selo agora fica inteiro dentro do quadro (D 500/460, right 44). Em `conteudo.js`, a linha repetida saiu. | Corrigido |
| P33 | slide-01 | Mesmo corte do carimbo. "Clássicos" aparecia 3 vezes (eyebrow, título e anel). | Layout corrigido como em P07. O eyebrow passou a ser "Tradicionais", categoria do cardápio desses 3 sabores. | Corrigido |
| P08, P52 | feed | O caça-palavras mostrava só a 1ª linha. O convite "Comente quantos você achou", que é o gatilho de engajamento, não aparecia. | `caca-palavras`: a partir da 2ª linha, o texto aparece na coluna da lista com um ícone de balão. | Corrigido |
| P24, P45 | feed | A assinatura manuscrita quebrava em 2 linhas alinhadas à direita, e o traço decorativo ficava solto à esquerda. | `frase-de-efeito`: a assinatura ganhou fonte proporcional ao tamanho do texto (42, 37 ou 33 px) e largura total, e agora cabe numa linha. P14, P22, P39 e P40 foram re-renderizados e continuam certos. | Corrigido |
| P25 | slide-02 | Os itens da comanda quebravam cedo ("Pizza 2: massa / média"), a lista encostava na linha picotada e chegava perto do carimbo. | `bilhete-pedido`: a lista ficou mais larga (480 px), com 34 px e sem quebra. Cada item agora ocupa uma linha só. | Corrigido |
| P27 | cena-01, cena-06 | A descendente do "q" de "quer um" encostava em "SABOR?". O "4" de "até 4" invadia "SABORES". | `story-tipografico`: entrelinha maior (caixa alta 1,0 e itálico 1,18) e cálculo de altura ajustado. Os 7 Reels foram re-renderizados. | Corrigido |
| P43 | cena-06 | "nos" colado em "COMENTÁRIOS". | Mesma correção do `story-tipografico`. | Corrigido |
| P51 | cena-02 | A legenda da polaroid quebrava como "1. Tamanho / · 2. Sabores", com a linha começando pelo ponto. | `story-polaroid`: " · " no título vira quebra de linha. Agora aparece "1. Tamanho" e "2. Sabores". | Corrigido |
| P51 | cena-05 | Logo sem placa sobre a parte clara da foto (paleta noite), ilegível. | `story-foto-cheia`: o logo sempre tem placa. Nas paletas ouro, creme e tomate (P11, P23, P43) já tinha, então não muda nada. | Corrigido |
| P23, P51 | reel.mp4 | A transição `zoomin` mostra por cerca de 0,2 s uma tela de cor chapada (vermelho em P23 e laranja em P51, na entrada do CTA). Parece falha de vídeo. | `arte.json`: P23 corte 1 passou a `smoothup` e P51 corte 5 passou a `circleclose`. As sequências continuam únicas, e o validador passou. | Corrigido |
| P31 | feed | Fran-Brócolis no círculo: a metade de cima do recorte era fundo preto da foto e a pizza ficava pequena embaixo. | `foto-circulo`: recorte específico para `frango-brocolis` (zoom 1,5, foco 0,5/0,74). Agora a pizza preenche o círculo. | Corrigido |
| P49 | slide-02 | "71 sabores" ao lado do título "Sabores": palavra repetida. | Título passou a "Tradicionais, especiais e doces", com a linha "Qual é o seu favorito?". | Corrigido |
| P49 | slide-03 | "16 fatias" com o título "Fatias" repetia a palavra. A linha "Até 4 sabores · 7 bordas · 3 massas" quebrava com o "·" no início. | Título passou a "Até 4 sabores", com as linhas "7 bordas" e "3 massas" (fatos do cardápio). | Corrigido |
| P29 | feed | O subtítulo dizia "...bacon e pimenta", mas o cardápio diz "pimenta calabresa". | `FEED_PHOTO_SUB.P29` = "Mussarela, calabresa, pimentão, ovos, bacon e pimenta calabresa". | Corrigido |
| P37 | feed | O subtítulo "Hoje abrimos das 18h às 23h" repetia o título "Véspera de Natal: abrimos 18h–23h". A foto de Bolonhesa não tinha relação com o texto. | Subtítulo passou a "Bolonhesa para um, Marguerita para outro", tirado da legenda do post e ligado à foto. | Corrigido |

## Peças conferidas sem problema

P03 (3), P04 (6), P05, P06, P10, P11 (6 cenas), P13, P14, P15, P16, P17 (4), P18, P19, P20, P21, P22, P23 (8 cenas), P25 s1 e s3, P26, P27 (cenas 2 a 5 e 7), P28 (4; respostas do quiz conferidas no cardápio), P30, P32, P33 s2 a s4, P34, P35 (6 cenas), P38, P39, P40, P41, P42, P43 (cenas 1 a 5 e 7), P44, P46, P47 (5 cenas), P48, P50, P51 (cenas 1, 3, 4 e 6), P53, P54.

Também conferido:
- Todo CTA forte mostra "Peça agora pelo Disk Pizza" com "link na bio".
- Todo CTA suave mostra "Monte a sua pelo link na bio".
- Os posts sem CTA (P18, P38, P42) estão certos.
- Toda peça com foto tem o selo "Foto ilustrativa".
- Nenhum texto traz preço, desconto, "gelado", "quentinha", prazo ou italiano.

## Reels

Conferidos com ffprobe depois da remontagem: todos têm 1080x1920, 30 fps, H.264 e yuv420p.

| Reel | Duração |
|---|---|
| P11 | 15,9 s |
| P23 | 15,9 s |
| P27 | 17,2 s |
| P35 | 16,2 s |
| P43 | 15,6 s |
| P47 | 14,4 s |
| P51 | 15,0 s |

Extraí um quadro no meio de cada transição e um perto do fim de cada Reel. Nenhum texto importante fica acima de 250 px ou abaixo de 1580 px.

O `hblur` de P27 deixa o quadro totalmente borrado por cerca de 0,2 s, mas isso é o próprio efeito da transição, então mantive.

## Validadores (rodados no final)

| Validador | Resultado |
|---|---|
| `node marketing/tools/validar-arte.js` | OK, com os avisos conhecidos: P28 repete o layout de quiz e P39/P40 usam o mesmo layout de frase em dias não seguidos |
| `node marketing/tools/gerar-calendario.js` | OK: calendário válido |
| `node marketing/tools/verificar-midia.js` (FFmpeg no PATH) | 55 posts, 124 imagens, 0 posts com erro; 46 imagens 1080x1080 e 9 vídeos 1080x1920 |

Não mudei texto de Reel, então não foi preciso rodar `gerar-roteiros.js`.

## Pendências e observações (sem correção)

1. **P39 e P40 usam o mesmo layout (`frase-de-efeito`) em posts vizinhos (26/12 e 30/12).** A pauta define os dois como "frase", e o tipo obriga o layout. As paletas são diferentes (ouro e creme), então não parecem iguais, mas o formato se repete. Se a pauta permitir, vale trocar o tipo de um deles.
2. **P52: "Comente quantos você achou" ocupa 3 linhas na coluna estreita da lista.** Ficou legível, mas apertado acima do CTA suave.
3. **P17 slides 2 e 3: sobra uma área vazia entre a polaroid e o título.** É detalhe de composição, sem erro.
4. **P25 slide 2: "Desde 2015" aparece no cabeçalho da comanda e no carimbo.** É repetição decorativa e foi mantida.
