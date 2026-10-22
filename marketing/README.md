# marketing/ — Disk Pizza

Conteúdo de redes sociais (Instagram e Facebook). **Nada aqui altera o app (`src/`) e nada é agendado automaticamente.**

| Pasta | O que tem |
|---|---|
| `estrategia.md` | pilares, regras de marca, gatilhos e datas (Fase 2) |
| `calendario/` | `posts.json` (fonte editável), `calendario.json/.md/.csv` (gerados) |
| `midia/conteudo.js` | texto escrito nas artes e cenas dos Reels |
| `midia/processada/Pxx/` | mídia pronta por post (JPEG 1080×1080; quadros dos Reels 1080×1920; `reel.mp4` depois do FFmpeg) |
| `midia/roteiros-reels.md` | roteiros, trilha e como montar os vídeos |
| `midia/verificacao.json` | resultado da verificação (alimenta a tabela da Fase 4) |
| `tools/` | scripts Node (usam `sharp` do projeto e o Chrome já instalado) |

## Ordem dos comandos

```bash
node marketing/tools/gerar-calendario.js   # valida e gera o calendário
node marketing/tools/gerar-midia.js        # gera a mídia (opção --only P01,P02)
node marketing/tools/gerar-roteiros.js     # roteiros dos Reels
node marketing/tools/montar-reels.js       # vídeos (precisa do FFmpeg)
node marketing/tools/verificar-midia.js    # confere formato e resolução exata
node marketing/tools/folha-de-contato.js <pasta>   # miniaturas para revisão visual
```

Fotos de origem: `src/assets/img-flavors/*.jpg` (banco de imagens, ver `CREDITS.md`); logo: `src/assets/img/logo-crop-640.png`.
