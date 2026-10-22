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

### P11 — 2026-11-07 (sáb) 16:30 — Pizza de Nachos

Duração ≈ 10.4 s · 1080×1920 · sem narração · clima da trilha: divertido e curioso, andamento médio

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 3.5 s | foto `nachos.jpg` (foto ilustrativa) | Já provou pizza de Nachos? |
| 2 | 3.5 s | foto `nachos.jpg` (foto ilustrativa) | Mussarela, carne moída, cheddar e doritos |
| 3 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Já provou pizza de Nachos? 🧀

Mussarela, carne moída, cheddar e doritos. Um dos nossos sabores especiais.

Hoje a gente abre às 18h.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #PizzaDeNachos
```

### P23 — 2026-11-28 (sáb) 16:30 — 71 sabores

Duração ≈ 15.6 s · 1080×1920 · sem narração · clima da trilha: animado, ritmo marcado (cenas rápidas de 2 s)

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.2 s | tela de texto | Sábado · 71 sabores · Qual é o seu? |
| 2 | 2 s | foto `peperone.jpg` (foto ilustrativa) | Peperone |
| 3 | 2 s | foto `brocolis.jpg` (foto ilustrativa) | Brócolis |
| 4 | 2 s | foto `nachos.jpg` (foto ilustrativa) | Nachos |
| 5 | 2 s | foto `bolonhesa.jpg` (foto ilustrativa) | Bolonhesa |
| 6 | 2 s | foto `mexicana.jpg` (foto ilustrativa) | Mexicana |
| 7 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Sábado chegou e a gente tem 71 sabores esperando por você. 🍕

Tradicionais, especiais e doces. Qual é o seu primeiro pedido da noite?

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #71Sabores
```

### P27 — 2026-12-05 (sáb) 16:30 — Sobremesa em fatias

Duração ≈ 15.9 s · 1080×1920 · sem narração · clima da trilha: doce e suave, mais lento

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.5 s | tela de texto | Doces · Sobremesa em formato de pizza |
| 2 | 2.5 s | foto `brigadeiro.jpg` (foto ilustrativa) | Brigadeiro |
| 3 | 2.5 s | foto `confete.jpg` (foto ilustrativa) | Confete |
| 4 | 2.5 s | foto `bem-casado.jpg` (foto ilustrativa) | Bem Casado |
| 5 | 2.5 s | tela de texto | Borda · Nutella ou chocolate · Para terminar a fatia |
| 6 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Sobremesa em formato de pizza? 🍫

Brigadeiro, Confete, Bem Casado... e, se quiser, borda de Nutella ou de chocolate.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #PizzaDoce
```

### P35 — 2026-12-19 (sáb) 16:30 — Semana do Natal

Duração ≈ 15.9 s · 1080×1920 · sem narração · clima da trilha: natalino instrumental, calmo e acolhedor

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.5 s | tela de texto | Natal · Natal em família · A família toda reunida |
| 2 | 2.5 s | foto `portuguesa.jpg` (foto ilustrativa) | Portuguesa |
| 3 | 2.5 s | foto `quatro-queijos-bacon.jpg` (foto ilustrativa) | Quatro Queijos com Bacon |
| 4 | 2.5 s | foto `frango-bacon-catupiry.jpg` (foto ilustrativa) | Frango Especial |
| 5 | 2.5 s | tela de texto | Sua mesa · Escolha os sabores de cada um |
| 6 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Semana de Natal chegando e a família toda reunida. 🎄

Pizza também é jeito de comemorar junto: escolha os sabores de cada um.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #Natal
```

### P43 — 2027-01-02 (sáb) 16:30 — Sábado de verão

Duração ≈ 15.9 s · 1080×1920 · sem narração · clima da trilha: leve e ensolarado, verão

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.5 s | tela de texto | Verão · Sábado de verão pede pizza |
| 2 | 2.5 s | foto `mussarela-tomate.jpg` (foto ilustrativa) | Mussarela |
| 3 | 2.5 s | foto `peperone.jpg` (foto ilustrativa) | Peperone |
| 4 | 2.5 s | foto `brocolis.jpg` (foto ilustrativa) | Brócolis |
| 5 | 2.5 s | tela de texto | Simples · Monte, confira e envie · Pelo WhatsApp, sem cadastro |
| 6 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Sábado de verão pede pizza. ☀️

Escolha os sabores, confira o carrinho e envie o pedido pelo WhatsApp.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #Verao
```

### P47 — 2027-01-09 (sáb) 16:30 — Salgada e doce na mesma pizza

Duração ≈ 13.7 s · 1080×1920 · sem narração · clima da trilha: animado e bem-humorado

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.8 s | tela de texto | Sábado · Salgada de um lado, doce do outro |
| 2 | 2.5 s | foto `peperone.jpg` (foto ilustrativa) | Salgada |
| 3 | 2.5 s | foto `brigadeiro.jpg` (foto ilustrativa) | Doce |
| 4 | 2.5 s | tela de texto | Na mesma pizza · A partir da média · 2 sabores ou mais |
| 5 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Salgada de um lado, doce do outro. 🍕🍫

Escolha um sabor salgado e um doce na mesma pizza (a partir da média).

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #PizzaDoce
```

### P51 — 2027-01-16 (sáb) 16:30 — Monte sua pizza em 6 passos

Duração ≈ 13.4 s · 1080×1920 · sem narração · clima da trilha: prático, ritmo de tutorial

> Depende do deploy da escolha de massa no site (o Reel cita o passo "Massa").

| Cena | Duração | Imagem | Texto na tela |
|---|---|---|---|
| 1 | 2.5 s | tela de texto | Montador · Monte a sua em 6 passos |
| 2 | 2.5 s | foto `margherita.jpg` (foto ilustrativa) | Tamanho e sabores |
| 3 | 2.5 s | tela de texto | Passos 3 a 5 · Massa, borda e extras · Tudo do seu jeito |
| 4 | 2.5 s | foto `frango-brocolis.jpg` (foto ilustrativa) | Revise e envie pelo WhatsApp |
| 5 | 3 s | tela da marca | Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h |

Legenda (Instagram):

```
Monte a sua pizza em 6 passos: tamanho, sabores, massa, borda, extras e revisão. 🍕

Sem cadastro, e o pedido segue pronto para o nosso WhatsApp.

👉 Peça agora pelo Disk Pizza: link na bio.

📷 Foto ilustrativa.

#DiskPizza #PizzaCuritiba #Curitiba #MonteSuaPizza
```

## Se a loja puder gravar clipes reais (opcional, melhora muito)

Clipes verticais de 3 a 5 s, câmera parada, boa luz: (1) pizza saindo do forno ou sendo cortada, (2) close do queijo esticando, (3) pizza na caixa sendo fechada, (4) a equipe montando um pedido. Com eles, troco as cenas de foto de banco por vídeo real e removo o rótulo “foto ilustrativa” dessas cenas.
