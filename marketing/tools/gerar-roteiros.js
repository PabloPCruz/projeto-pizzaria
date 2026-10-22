// Gera marketing/midia/roteiros-reels.md a partir de conteudo.js (cenas) e calendario/posts.json (legenda e data).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { REELS } = require('../midia/conteudo.js');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'calendario', 'calendario.json'), 'utf8'));

const MOOD = {
  P02: 'acolhedor e caloroso, andamento médio (apresentação da casa)',
  P11: 'divertido e curioso, andamento médio',
  P23: 'animado, ritmo marcado (cenas rápidas de 2 s)',
  P27: 'doce e suave, mais lento',
  P35: 'natalino instrumental, calmo e acolhedor',
  P43: 'leve e ensolarado, verão',
  P47: 'animado e bem-humorado',
  P51: 'prático, ritmo de tutorial',
};
const NOTES = {
  P51: 'Depende do deploy da escolha de massa no site (o Reel cita o passo "Massa").',
};

const fmt = (s) => (s.t === 'cta' ? 'Peça agora pelo Disk Pizza · link na bio · Segunda a sábado, 18h às 23h' : [s.eyebrow, s.title, ...(s.lines || [])].filter(Boolean).join(' · '));
const img = (s) => (s.t === 'photo' ? `foto \`${s.photo}.jpg\` (foto ilustrativa)` : s.t === 'cta' ? 'tela da marca' : 'tela de texto');

const md = [
  '# Roteiros dos Reels — Disk Pizza',
  '',
  'Gerado por `marketing/tools/gerar-roteiros.js`. Reels **animados com as fotos de banco**, sem narração, com texto na tela, logo e CTA final. Quadros em `processada/Pxx/cena-NN.jpg` (1080×1920); o vídeo é montado por `montar-reels.js` (precisa do FFmpeg).',
  '',
  '## Como produzir',
  '',
  '```bash',
  'winget install Gyan.FFmpeg                       # uma vez; depois abra um terminal novo',
  'node marketing/tools/montar-reels.js              # gera todos os reel.mp4 (sem áudio)',
  'node marketing/tools/montar-reels.js --only P02 --musica C:/caminho/trilha.mp3',
  'node marketing/tools/verificar-midia.js           # confere 1080x1920 e duração',
  '```',
  '',
  '## Trilha sonora',
  '',
  '- **Não incluo música nos vídeos por padrão.** Música comercial em alta tem direitos autorais e eu não consigo conferir o que está em alta hoje; o seu Instagram comercial também tende a oferecer só a biblioteca de sons liberados da Meta. A forma mais segura: publicar sem áudio e **escolher o som dentro do app do Instagram** (ou usar uma faixa livre de direitos com `--musica`).',
  '- **Opção A, italiana:** procure “tarantella”, “mandolim” ou “acordeão italiano” em bibliotecas livres de direitos (YouTube Audio Library, Pixabay Music), e confira a licença de uso comercial de cada faixa. Melodias antigas como *Funiculì, Funiculà* (1880) são de domínio público, mas **cada gravação tem direitos próprios**: só use uma gravação com licença livre.',
  '- **Opção B, acolhedora (combina com o tom escolhido, sem italiano):** violão ou piano suave, instrumental, 90 a 110 BPM.',
  '- Volume baixo, entrada suave e saída em fade (o script aplica 0,6 s e 1,2 s quando você passa `--musica`).',
  '',
  '## Roteiros',
  '',
  ...posts.filter((p) => p.format === 'reel').flatMap((p) => {
    const sc = REELS[p.id];
    const total = sc.reduce((a, s) => a + s.dur, 0) + 0.4;
    return [
      `### ${p.id} — ${p.date} (${p.weekday || ''}) ${p.time} — ${p.theme}`,
      '',
      `Duração ≈ ${total.toFixed(1)} s · 1080×1920 · sem narração · clima da trilha: ${MOOD[p.id]}${NOTES[p.id] ? `\n\n> ${NOTES[p.id]}` : ''}`,
      '',
      '| Cena | Duração | Imagem | Texto na tela |',
      '|---|---|---|---|',
      ...sc.map((s, i) => `| ${i + 1} | ${s.dur} s | ${img(s)} | ${fmt(s)} |`),
      '',
      'Legenda (Instagram):',
      '',
      '```',
      ...((posts.find((x) => x.id === p.id).caption_instagram) || p.body.join('\n\n')).split('\n'),
      '```',
      '',
    ];
  }),
  '## Se a loja puder gravar clipes reais (opcional, melhora muito)',
  '',
  'Clipes verticais de 3 a 5 s, câmera parada, boa luz: (1) pizza saindo do forno ou sendo cortada, (2) close do queijo esticando, (3) pizza na caixa sendo fechada, (4) a equipe montando um pedido. Com eles, troco as cenas de foto de banco por vídeo real e removo o rótulo “foto ilustrativa” dessas cenas.',
  '',
].join('\n');

fs.writeFileSync(path.join(ROOT, 'marketing', 'midia', 'roteiros-reels.md'), md);
console.log('roteiros gerados:', posts.filter((p) => p.format === 'reel').length);
