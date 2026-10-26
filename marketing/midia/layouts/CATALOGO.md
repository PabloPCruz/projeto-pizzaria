# Catálogo de layouts — Disk Pizza (v2)

Objetivo: **nenhum post igual ao outro e todos bonitos**. Cada post combina um layout + uma paleta (+ variante), escolhidos em `marketing/midia/arte.json` pela direção de arte.

## Contrato de um layout

Arquivo em `marketing/midia/layouts/<familia>.js` exportando um objeto ou uma lista:

```js
module.exports = [{
  id: 'foto-circulo',            // único, kebab-case, igual ao catálogo abaixo
  formato: 'feed',               // 'feed' = 1080x1080 | 'story' = 1080x1920 (quadro de Reel)
  usa: 'foto',                   // 'foto' (exige s.photo) | 'texto' (sem foto) | 'ambos' | 'cta' (cena final de Reel)
  tipos: ['photo'],              // opcional: tipos de conteúdo aceitos (photo, text, size, step, list, cta)
  paletas: ['tomate', 'creme'],  // opcional: paletas usadas na prévia
  variantes: ['a', 'b'],         // opcional: nomes de variantes aceitas em ctx.variante
  descricao: '...',
  async render(s, ctx) { return '<div style="position:relative;width:1080px;height:1080px;overflow:hidden">...</div>'; },
}];
```

- `s` (conteúdo, vem de `conteudo.js` / `calendario/posts.json`): `tipo` (photo | text | size | step | list | cta), `title`, `sub`, `eyebrow`, `lines[]`, `photo` (nome em `src/assets/img-flavors`, sem .jpg), `cta` ('forte' | 'suave' | null), `big` + `bigLabel` (tipo size), `n` (tipo step), `idx` ("2/4" em carrossel), `deslize` (1º slide de carrossel).
- `ctx`: `{ n, p, post, variante }`. `n` = `marketing/midia/nucleo.js` (fotos, logo, selo, CTA, paletas). `p` = paleta (`p.bg, p.bg2, p.ink, p.muted, p.accent, p.accent2, p.escuro, p.placaLogo`); use `n.varsCss(p)` para ter `var(--bg)` etc.
- Retorne **um único div raiz** com o tamanho exato do formato. CSS inline ou `<style>` dentro do div (prefixe as classes com o id do layout para não colidir).

## Regras obrigatórias (o QA confere)

1. **Logo em toda peça**: `n.logo({ altura, placa: p.placaLogo })`. O logo tem letras brancas e chama vermelha: em fundo claro ou vermelho use placa; sobre foto, coloque sobre área escura/gradiente ou com placa.
2. **"Foto ilustrativa"** visível em toda peça com foto: `n.seloIlustrativa({ estilo, escuro })`.
3. **Fotos só por `await n.foto(nome, w, h, opts)`**: smart crop que mantém a pizza no centro e nunca estica. As fotos originais têm no máximo 1000 px de largura: evite áreas de foto muito maiores que ~1100 px de lado (fica borrado) e não amplie demais com `zoom`.
4. **Não cubra o centro da pizza com texto**. Texto sobre foto só com gradiente/placa que garanta contraste ≥ 4,5:1.
5. **CTA**: `s.cta === 'forte'` → texto exato `n.CTA_FORTE` ("Peça agora pelo Disk Pizza") + "link na bio". `'suave'` → `n.CTA_SUAVE`. `null` → sem CTA.
6. **Carrossel**: mostre `s.idx` (pode usar `n.indice`) e, se `s.deslize`, uma indicação "deslize".
7. **Texto**: nada menor que 22 px; títulos com `n.tamanho()` para não estourar; teste título curto e longo. Português com acentos corretos; não invente texto além de enfeites neutros (ex.: "Curitiba", "desde 2015", "Disk Pizza").
8. **Reels (story)**: nada importante acima de 250 px nem abaixo de 1580 px (interface do Instagram).
9. **Fontes**: `PF` (Playfair Display, tem itálico), `IN` (Inter), e do Windows: `Bahnschrift` (condensada), `'Segoe Script'`/`Gabriola` (manuscritas), `Georgia`. Nada de fonte da internet.
10. Sem imagens externas; enfeites com CSS/SVG inline.

Prévia: `node marketing/tools/preview-layout.js <id> [--paletas tomate,creme] [--variante x]` → `marketing/midia/_trabalho/preview/<id>/folha.jpg`.

## Layouts

### Família foto (feed) — `layouts/fotos.js`
| id | ideia |
|---|---|
| `foto-cheia` | Foto ocupando o quadrado inteiro; gradiente forte no terço de baixo; eyebrow + título grande alinhado à esquerda; CTA em pílula; logo pequeno no canto. Variantes: `baixo`, `esquerda` (gradiente lateral). |
| `foto-dividida` | Foto vertical em ~58% da largura e painel da paleta com o texto. Variantes: `esquerda`, `direita`. |
| `foto-circulo` | Fundo da paleta com padrão sutil (pontos/anéis); pizza recortada em círculo grande com aro; título acima (pode ser em arco com SVG textPath) e subtítulo abaixo. |
| `foto-polaroid` | Fundo de papel/creme; foto como polaroid levemente inclinada com fita adesiva; legenda manuscrita; título em Playfair ao lado/abaixo. |
| `foto-revista` | Capa de revista: foto cheia, masthead "DISK PIZZA" gigante no topo, chamadas de capa laterais com título/sub/CTA. |
| `foto-moldura` | Foto emoldurada com passe-partout na cor da paleta e filete dourado; título na base como placa de cardápio. |
| `foto-cartao` | Foto com cantos arredondados flutuando sobre a paleta e um cartão de texto sobreposto em um canto (sombra suave). Bom para slides de carrossel. |

### Família tipográfica (feed, sem foto) — `layouts/tipografia.js`
| id | ideia |
|---|---|
| `poster-tipografico` | Pôster: palavras do título empilhadas em tamanhos/pesos mistos (Playfair itálico + Bahnschrift caixa alta), fios e ornamentos. |
| `quadro-cardapio` | Quadro de giz/cardápio: fundo texturizado escuro, título manuscrito, linhas com pontilhado; ótimo para `list` e listas de bordas/bebidas. |
| `numero-gigante` | Número enorme (tipo `size`/`step`) em Bahnschrift, composição assimétrica com rótulo e linhas. |
| `bilhete-pedido` | Comanda/bilhete de pedido com bordas picotadas sobre a paleta; ótimo para passos e "como pedir". |
| `conversa-whatsapp` | Balões de conversa (pergunta do cliente, resposta da casa) para engajamento e avisos. Não imite a marca do WhatsApp: balões genéricos. |
| `celebracao` | Datas festivas: confete/estrelas/brilhos em CSS, título serifado elegante. Variantes: `natal`, `anonovo`, `halloween`, `sobrio` (sem enfeite festivo, para datas de respeito). |
| `faixa-diagonal` | Faixas diagonais de cor com chamada em caixa alta condensada (Black Friday, promoção). |
| `selo-carimbo` | Composição de selo/carimbo redondo (ex.: "Desde 2015", "Entrega grátis até 3 km") com texto em círculo (SVG). |

### Família Reels (story 1080x1920) — `layouts/stories.js`
| id | ideia |
|---|---|
| `story-foto-cheia` | Foto vertical cheia (recorte alto), gradientes em cima e embaixo, título grande na parte de baixo da zona segura. |
| `story-dividido` | Metade de cima foto, metade de baixo paleta com título e eyebrow. |
| `story-polaroid` | Polaroid inclinada sobre a paleta com legenda manuscrita. |
| `story-tipografico` | Cena de texto: tipografia enorme ocupando a tela, cores da paleta. |
| `story-cta-ticket` | Cena final em formato de bilhete/comanda com CTA, link na bio e horário. |
| `story-cta-selo` | Cena final com selo redondo girado, CTA grande e horário. |

### Reserva (v1) — `layouts/classicos.js`
`classico-faixa`, `cartao-elegante`, `story-classico`, `story-texto`, `story-cta`.

## Paletas (`n.PALETAS`)
`carvao`, `creme`, `tomate`, `manjericao`, `ouro`, `noite`, `chocolate`.

## Formatos interativos (v2.1) — `layouts/interativos.js`

Para posts que **não são só vitrine de sabor**: jogos, enquetes, curiosidades, humor, guias. O conteúdo vem em `SLIDES[id]` com o campo `layout` = tipo abaixo (o gerador passa como `s.tipo`).

| tipo de conteúdo | campos de `s` | layout(s) |
|---|---|---|
| `quiz` | `eyebrow`, `title` (pergunta), `opcoes` (2 a 4 textos curtos; o layout põe A/B/C/D), `lines` (instrução, ex.: "Responda nos comentários") | `quiz-opcoes` |
| `versus` | `title` (pergunta), `opcoes` (exatamente 2), `fotos` (opcional: 2 nomes de foto), `lines` | `este-ou-aquele` (com ou sem fotos) |
| `checklist` | `eyebrow`, `title`, `lines` (3 a 6 itens) | `checklist` |
| `grade` | `title`, `palavras` (5 a 8 palavras, só letras, máx. 10 letras), `lines` | `caca-palavras` (grade gerada de forma determinística, palavras na horizontal/vertical) |
| `frase` | `eyebrow` (opcional), `title` (frase de efeito/humor curta), `sub` (opcional) | `frase-de-efeito` |
| `fluxo` | `eyebrow`, `title`, `lines` (3 a 5 etapas) | `fluxo-pedido` (infográfico com setas/ícones CSS) |
| `curiosidade` | `eyebrow` (ex.: "Você sabia?"), `title`, `lines` (1 a 3 frases) | `voce-sabia` |

Regras extras: `este-ou-aquele` com `fotos` é `usa: 'ambos'` e precisa do selo "Foto ilustrativa"; os demais são `usa: 'texto'`. Todos aceitam `cta` e `idx`/`deslize` como os outros layouts.
