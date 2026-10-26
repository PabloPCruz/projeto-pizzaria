# Roteiros dos Reels — Disk Pizza

Gerado por `marketing/tools/gerar-roteiros.js`. Reels **animados com as fotos de banco**, sem narração, com texto na tela, logo e CTA final. Quadros em `processada/Pxx/cena-NN.jpg` (1080×1920); o vídeo é montado por `montar-reels.js` (precisa do FFmpeg).

## Como produzir

```bash
winget install Gyan.FFmpeg                       # uma vez; depois abra um terminal novo
node marketing/tools/montar-reels.js              # gera todos os reel.mp4 (sem áudio)
node marketing/tools/montar-reels.js --only P02 --musica C:/caminho/trilha.mp3
node marketing/tools/verificar-midia.js           # confere 1080x1920 e duração
```

## Trilha sonora

- **Não incluo música nos vídeos por padrão.** Música comercial em alta tem direitos autorais e eu não consigo conferir o que está em alta hoje; o seu Instagram comercial também tende a oferecer só a biblioteca de sons liberados da Meta. A forma mais segura: publicar sem áudio e **escolher o som dentro do app do Instagram** (ou usar uma faixa livre de direitos com `--musica`).
- **Opção A, italiana:** procure “tarantella”, “mandolim” ou “acordeão italiano” em bibliotecas livres de direitos (YouTube Audio Library, Pixabay Music), e confira a licença de uso comercial de cada faixa. Melodias antigas como *Funiculì, Funiculà* (1880) são de domínio público, mas **cada gravação tem direitos próprios**: só use uma gravação com licença livre.
- **Opção B, acolhedora (combina com o tom escolhido, sem italiano):** violão ou piano suave, instrumental, 90 a 110 BPM.
- Volume baixo, entrada suave e saída em fade (o script aplica 0,6 s e 1,2 s quando você passa `--musica`).

## Roteiros

### X02 — 2026-10-22 (qui) 16:15 — Quinta de pizza (hoje), vídeo

Duração ≈ 13.4 s · 1080×1920 · sem narração · clima da trilha: undefined

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.5 s | tela de texto | Hoje · Quinta tem pizza · Abrimos às 18h |
| 2 | 2.5 s | foto `frango-brocolis.jpg` (foto ilustrativa) | Fran-Brócolis |
| 3 | 2.5 s | foto `mexicana.jpg` (foto ilustrativa) | Mexicana |
| 4 | 2.5 s | foto `calabresa.jpg` (foto ilustrativa) | Calabresa |
| 5 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Quinta-feira também é dia de pizza! 🍕

Hoje a gente abre às 18h. Escolha o tamanho, os sabores e a borda e envie o pedido pelo WhatsApp.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #QuintaDePizza
```

### P02 — 2026-10-24 (sáb) 16:30 — Apresentação da casa

Duração ≈ 17.9 s · 1080×1920 · sem narração · clima da trilha: acolhedor e caloroso, andamento médio (apresentação da casa)

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.5 s | tela de texto | Prazer · Disk Pizza · Pizzaria de família · Curitiba · desde 2015 |
| 2 | 3 s | foto `bolonhesa.jpg` (foto ilustrativa) | Tradicionais, especiais e doces |
| 3 | 3 s | foto `quatro-queijos-bacon.jpg` (foto ilustrativa) | Do pequeno ao gigante |
| 4 | 3 s | foto `lombo-milho.jpg` (foto ilustrativa) | Misture salgado e doce |
| 5 | 3 s | foto `frango-bacon-catupiry.jpg` (foto ilustrativa) | Segunda a sábado · 18h às 23h |
| 6 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Prazer, somos a Disk Pizza! 🍕

Pizzaria de família em Curitiba desde 2015, com sabores tradicionais, especiais e doces e tamanhos para toda fome.

Abrimos de segunda a sábado, das 18h às 23h. No domingo a gente descansa.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #PizzariaDeFamilia
```

### P11 — 2026-11-07 (sáb) 16:30 — Do clique à sua porta

Duração ≈ 15.9 s · 1080×1920 · sem narração · clima da trilha: divertido e curioso, andamento médio

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.5 s | tela de texto | Como pedir · Do clique à sua porta · Em 4 passos |
| 2 | 2.5 s | foto `nachos.jpg` (foto ilustrativa) | 1. Monte do seu jeito |
| 3 | 2.5 s | foto `quatro-queijos-bacon.jpg` (foto ilustrativa) | 2. Confira o carrinho e o CEP |
| 4 | 2.5 s | tela de texto | Passo 3 · Envie pelo WhatsApp · A loja confirma com você · Sem cadastro |
| 5 | 2.5 s | foto `presunto.jpg` (foto ilustrativa) | 4. Pizza na sua porta |
| 6 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Do clique à sua porta, em 4 passos. 🛵

1. Monte a pizza no site: tamanho, sabores, massa e borda.

2. Confira o carrinho e informe o CEP.

3. Envie o pedido pelo WhatsApp: a loja confirma com você.

4. Agora é só esperar a pizza chegar.

Sem cadastro. Hoje a gente abre às 18h.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #PeçaPeloSite #ComoPedir
```

### P23 — 2026-11-28 (sáb) 16:30 — Jogo: pare o vídeo e descubra o seu sabor

Duração ≈ 15.9 s · 1080×1920 · sem narração · clima da trilha: animado, ritmo marcado (cenas rápidas de 2 s)

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 3 s | tela de texto | Jogo de sábado · Pare o vídeo! · O sabor que aparecer é o seu pedido de hoje |
| 2 | 1.5 s | foto `calabresa.jpg` (foto ilustrativa) | Calabresa |
| 3 | 1.5 s | foto `bolonhesa.jpg` (foto ilustrativa) | Bolonhesa |
| 4 | 1.5 s | foto `mussarela-tomate.jpg` (foto ilustrativa) | Mussarela |
| 5 | 1.5 s | foto `frango-brocolis.jpg` (foto ilustrativa) | Fran-Brócolis |
| 6 | 1.5 s | foto `nachos.jpg` (foto ilustrativa) | Nachos |
| 7 | 2 s | tela de texto | E aí? · Qual saiu para você? · Conta nos comentários |
| 8 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Pare o vídeo! O sabor que aparecer é o seu pedido de hoje. 🍕

Calabresa, Bolonhesa, Mussarela, Fran-Brócolis ou Nachos: qual saiu para você? Conta nos comentários.

Não gostou do resultado? Tem outros 66 sabores no cardápio.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #PareOVideo #71Sabores
```

### P27 — 2026-12-05 (sáb) 16:30 — Confraternização: uma Gigante, 4 sabores

Duração ≈ 17.2 s · 1080×1920 · sem narração · clima da trilha: doce e suave, mais lento

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.5 s | tela de texto | Confraternização · Cada um quer um sabor? · A Gigante resolve |
| 2 | 2.2 s | foto `portuguesa.jpg` (foto ilustrativa) | Sabor 1: Portuguesa |
| 3 | 2.2 s | foto `quatro-queijos-bacon.jpg` (foto ilustrativa) | Sabor 2: Quatro Queijos com Bacon |
| 4 | 2.2 s | foto `lombo-milho.jpg` (foto ilustrativa) | Sabor 3: Lombo com Milho |
| 5 | 2.2 s | foto `confete.jpg` (foto ilustrativa) | Sabor 4: Confete |
| 6 | 2.5 s | tela de texto | Gigante · 16 fatias, até 4 sabores · Qual seria a sua combinação? |
| 7 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Confraternização chegando e cada um quer um sabor? 🎄

A Gigante tem 16 fatias e até 4 sabores. Exemplo: Portuguesa, Quatro Queijos com Bacon, Lombo com Milho e, para fechar, Confete.

Conta aqui qual seria a sua combinação.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #PizzaGigante #Confraternizacao
```

### P35 — 2026-12-19 (sáb) 16:30 — Natal: quem é quem na mesa

Duração ≈ 16.2 s · 1080×1920 · sem narração · clima da trilha: natalino instrumental, calmo e acolhedor

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.5 s | tela de texto | Natal · Quem é quem na mesa de Natal? |
| 2 | 2.5 s | foto `calabresa.jpg` (foto ilustrativa) | O tio que só pede Calabresa |
| 3 | 2.5 s | foto `margherita.jpg` (foto ilustrativa) | A tia que não abre mão da Marguerita |
| 4 | 2.5 s | foto `bem-casado.jpg` (foto ilustrativa) | Quem já vai direto no doce |
| 5 | 2.8 s | tela de texto | Na Gigante · Até 4 sabores · Todo mundo representado · Marque a sua família |
| 6 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Quem é quem na mesa de Natal? 🎄

Tem o tio que só pede Calabresa, a tia que não abre mão da Marguerita e quem já vai direto no doce.

Na Gigante cabem até 4 sabores: dá para ter todo mundo representado. Marque a sua família aqui.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #Natal
```

### P43 — 2027-01-02 (sáb) 16:30 — Verão: este ou aquele

Duração ≈ 15.6 s · 1080×1920 · sem narração · clima da trilha: leve e ensolarado, verão

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.2 s | tela de texto | Verão · Este ou aquele? · Edição sábado de sol |
| 2 | 2 s | tela de texto | Este ou aquele · Praia ou piscina? |
| 3 | 2 s | tela de texto | Este ou aquele · Refri de 2L ou latinha? |
| 4 | 2 s | foto `peperone.jpg` (foto ilustrativa) | Peperone... |
| 5 | 2 s | foto `mussarela-tomate.jpg` (foto ilustrativa) | ...ou Mussarela? |
| 6 | 2 s | tela de texto | Sua vez · Responda nos comentários · Hoje abrimos às 18h |
| 7 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Este ou aquele, edição verão: ☀️

Praia ou piscina?

Refri de 2L ou latinha?

Peperone ou Mussarela?

Responda tudo nos comentários. E hoje é sábado: a gente abre às 18h.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #Verao #EsteOuAquele
```

### P47 — 2027-01-09 (sáb) 16:30 — Você sabia? Salgada e doce na mesma pizza

Duração ≈ 14.4 s · 1080×1920 · sem narração · clima da trilha: animado e bem-humorado

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 3 s | tela de texto | Você sabia? · Salgada e doce na mesma pizza · Pode! |
| 2 | 2.5 s | foto `peperone.jpg` (foto ilustrativa) | De um lado, Peperone |
| 3 | 2.5 s | foto `brigadeiro.jpg` (foto ilustrativa) | Do outro, Brigadeiro |
| 4 | 3 s | tela de texto | A partir da média · 2, 3 ou 4 sabores · Média: 2 · Grande e Big: 3 · Gigante: 4 |
| 5 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Você sabia? Dá para pedir salgada de um lado e doce do outro, na mesma pizza. 🍕

É a partir da média, que leva 2 sabores. Na Grande e na Big são 3; na Gigante, 4.

Qual dupla você montaria?

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #PizzaDoce #VoceSabia
```

### P51 — 2027-01-16 (sáb) 16:30 — Monte a sua em 6 passos

Duração ≈ 15.0 s · 1080×1920 · sem narração · clima da trilha: prático, ritmo de tutorial

> Depende do deploy da escolha de massa no site (o Reel cita o passo "Massa").

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.2 s | tela de texto | Montador · Monte a sua em 6 passos |
| 2 | 2.5 s | foto `presunto.jpg` (foto ilustrativa) | 1. Tamanho · 2. Sabores |
| 3 | 2.2 s | tela de texto | Passo 3 · Massa · Fina, média ou grossa |
| 4 | 2.2 s | tela de texto | Passos 4 e 5 · Borda e extras · 7 bordas · observações |
| 5 | 2.5 s | foto `lombo-milho.jpg` (foto ilustrativa) | 6. Revise e envie pelo WhatsApp |
| 6 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Seis passos e a pizza fica do seu jeito: 🍕

1. Tamanho · 2. Sabores · 3. Massa · 4. Borda · 5. Extras · 6. Revisão

Depois é só enviar pelo WhatsApp. Sem cadastro.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #MonteSuaPizza
```

## Se a loja puder gravar clipes reais (opcional, melhora muito)

Clipes verticais de 3 a 5 s, câmera parada, boa luz: (1) pizza saindo do forno ou sendo cortada, (2) close do queijo esticando, (3) pizza na caixa sendo fechada, (4) a equipe montando um pedido. Com eles, troco as cenas de foto de banco por vídeo real e removo o rótulo “foto ilustrativa” dessas cenas.
