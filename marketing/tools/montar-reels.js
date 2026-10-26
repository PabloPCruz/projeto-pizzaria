// Monta os Reels (1080x1920, 30 fps, H.264 + AAC) a partir dos quadros cena-NN.jpg: movimento em cada cena e transição entre elas.
// Requer FFmpeg no PATH (winget install Gyan.FFmpeg). Uso:
//   node marketing/tools/montar-reels.js [--only P02,P11] [--musica C:/caminho/trilha.mp3] [--saida pasta] [--dry-run]
// Sem --musica o vídeo sai sem áudio (a trilha pode ser escolhida no app do Instagram). Não agenda nem envia nada.
// --saida <pasta>: grava <pasta>/<id>.mp4 (teste) em vez de processada/<id>/reel.mp4.
//
// Direção de arte (opcional): marketing/midia/arte.json (ou o arquivo em ARTE_JSON=<caminho>). Por reel:
//   { "P11": { "cenas": [{ "layout": "story-polaroid", "movimento": "pan-direita" }, ...],
//              "transicoes": ["slideleft", "circleopen"] } }      // uma transição por corte (cenas - 1)
// Também aceita o reel dentro de "reels" ou "posts" ({ "reels": { "P11": {...} } }). "layout" é usado por gerar-midia.js.
// Movimentos: zoom-in, zoom-out, pan-esquerda, pan-direita, parado. Sem arte.json: zoom-in (zoom-out se a cena tiver zoomOut) e fade.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const { REELS } = require('../midia/conteudo.js');
const OUT = path.join(ROOT, 'marketing', 'midia', 'processada');
const ARTE = process.env.ARTE_JSON ? path.resolve(process.env.ARTE_JSON) : path.join(ROOT, 'marketing', 'midia', 'arte.json');
const args = process.argv.slice(2);
const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const only = arg('--only') ? new Set(arg('--only').split(',')) : null;
const music = arg('--musica');
const saida = arg('--saida') ? path.resolve(arg('--saida')) : null;
const dry = args.includes('--dry-run');
const FPS = 30;
const FADE = 0.4; // duração da transição entre cenas (s)
const PAN_ZOOM = 1.08; // zoom fixo dos movimentos de pan

// Transições do filtro xfade do FFmpeg (exceto 'custom', que exige expressão).
const TRANSICOES = new Set(['fade', 'wipeleft', 'wiperight', 'wipeup', 'wipedown', 'slideleft', 'slideright', 'slideup', 'slidedown',
  'circlecrop', 'rectcrop', 'distance', 'fadeblack', 'fadewhite', 'radial', 'smoothleft', 'smoothright', 'smoothup', 'smoothdown',
  'circleopen', 'circleclose', 'vertopen', 'vertclose', 'horzopen', 'horzclose', 'dissolve', 'pixelize', 'diagtl', 'diagtr', 'diagbl',
  'diagbr', 'hlslice', 'hrslice', 'vuslice', 'vdslice', 'hblur', 'fadegrays', 'wipetl', 'wipetr', 'wipebl', 'wipebr', 'squeezeh',
  'squeezev', 'zoomin', 'fadefast', 'fadeslow', 'hlwind', 'hrwind', 'vuwind', 'vdwind', 'coverleft', 'coverright', 'coverup',
  'coverdown', 'revealleft', 'revealright', 'revealup', 'revealdown']);
const MOVIMENTOS = ['zoom-in', 'zoom-out', 'pan-esquerda', 'pan-direita', 'parado'];

/** Expressões do zoompan (z, x, y) para o movimento, com nf = número de frames do clipe. Entrada já ampliada 2x. */
function zoompan(mov, nf) {
  const centroX = `iw/2-(iw/zoom/2)`, centroY = `ih/2-(ih/zoom/2)`;
  const t = `on/${Math.max(nf - 1, 1)}`; // 0 -> 1 ao longo do clipe
  switch (mov) {
    case 'zoom-in': return { z: `min(zoom+0.0006,1.06)`, x: centroX, y: centroY };
    case 'zoom-out': return { z: `if(eq(on,0),1.06,max(zoom-0.0006,1.0))`, x: centroX, y: centroY };
    case 'pan-direita': return { z: `${PAN_ZOOM}`, x: `(iw-iw/zoom)*${t}`, y: centroY }; // câmera anda para a direita
    case 'pan-esquerda': return { z: `${PAN_ZOOM}`, x: `(iw-iw/zoom)*(1-${t})`, y: centroY };
    case 'parado': return { z: '1', x: '0', y: '0' };
    default: throw new Error(`movimento desconhecido: ${mov}`);
  }
}

function lerArte() {
  if (!fs.existsSync(ARTE)) {
    if (process.env.ARTE_JSON) { console.error(`ARTE_JSON não encontrado: ${ARTE}`); process.exit(2); }
    return {};
  }
  try { return JSON.parse(fs.readFileSync(ARTE, 'utf8')); } catch (e) { console.error(`${ARTE}: JSON inválido (${e.message})`); process.exit(2); }
}
const arte = lerArte();
const arteDo = (id) => arte[id] || (arte.reels && arte.reels[id]) || (arte.posts && arte.posts[id]) || null;

/** Movimentos e transições do reel (validados). Sai com erro se algum nome for inválido. */
function planoDo(id, scenes) {
  const a = arteDo(id) || {};
  const cenas = Array.isArray(a.cenas) ? a.cenas : [];
  const trans = Array.isArray(a.transicoes) ? a.transicoes : [];
  const erros = [];
  if (cenas.length && cenas.length !== scenes.length) console.warn(`${id}: arte.json tem ${cenas.length} cenas e o reel tem ${scenes.length} (as que faltarem usam o padrão)`);
  if (trans.length && trans.length !== scenes.length - 1) console.warn(`${id}: arte.json tem ${trans.length} transições para ${scenes.length - 1} cortes (as que faltarem usam fade)`);
  const movimentos = scenes.map((s, i) => {
    const m = cenas[i] && cenas[i].movimento;
    if (!m) return s.zoomOut ? 'zoom-out' : 'zoom-in';
    if (!MOVIMENTOS.includes(m)) erros.push(`cena ${i + 1}: movimento "${m}" inválido (use ${MOVIMENTOS.join(', ')})`);
    return m;
  });
  const transicoes = scenes.slice(1).map((_, i) => {
    const t = trans[i];
    if (!t) return 'fade';
    if (!TRANSICOES.has(t)) erros.push(`corte ${i + 1}: transição "${t}" inválida (use ${[...TRANSICOES].join(', ')})`);
    return t;
  });
  if (erros.length) { console.error(`${id}: ${ARTE}\n  ${erros.join('\n  ')}`); process.exit(1); }
  return { movimentos, transicoes };
}

if (!dry && spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
  console.error('FFmpeg não encontrado no PATH. Instale com: winget install Gyan.FFmpeg (e abra um terminal novo).');
  process.exit(2);
}
if (music && !fs.existsSync(music)) { console.error(`Trilha não encontrada: ${music}`); process.exit(2); }
if (saida && !dry) fs.mkdirSync(saida, { recursive: true });

for (const [id, scenes] of Object.entries(REELS)) {
  if (only && !only.has(id)) continue;
  const dir = path.join(OUT, id);
  const frames = scenes.map((_, i) => path.join(dir, `cena-${String(i + 1).padStart(2, '0')}.jpg`));
  const missing = frames.filter((f) => !fs.existsSync(f));
  if (missing.length) { console.error(`${id}: faltam quadros (rode gerar-midia.js): ${missing.map((m) => path.basename(m)).join(', ')}`); process.exit(1); }
  const { movimentos, transicoes } = planoDo(id, scenes);

  const inputs = [];
  const chains = [];
  scenes.forEach((s, i) => {
    const nf = Math.round((s.dur + FADE) * FPS); // cada clipe dura um pouco mais para cobrir a transição
    inputs.push('-i', frames[i]); // quadro único: o zoompan gera os frames (com -loop ele multiplicaria os frames)
    // Imagem ampliada 2x antes do zoompan evita tremor.
    const zp = zoompan(movimentos[i], nf);
    chains.push(`[${i}:v]scale=2160:3840,zoompan=z='${zp.z}':x='${zp.x}':y='${zp.y}':d=${nf}:s=1080x1920:fps=${FPS},setsar=1,scale=in_range=full:out_range=limited,format=yuv420p[v${i}]`);
  });
  let last = 'v0';
  let acc = scenes[0].dur;
  for (let i = 1; i < scenes.length; i++) {
    const out = i === scenes.length - 1 ? 'vout' : `x${i}`;
    chains.push(`[${last}][v${i}]xfade=transition=${transicoes[i - 1]}:duration=${FADE}:offset=${(acc).toFixed(2)}[${out}]`);
    acc += scenes[i].dur;
    last = out;
  }
  if (scenes.length === 1) chains.push(`[v0]null[vout]`);
  const total = acc + FADE;
  const destino = saida ? path.join(saida, `${id}.mp4`) : path.join(dir, 'reel.mp4');
  const cmd = ['-y', ...inputs];
  if (music) cmd.push('-i', music);
  cmd.push('-filter_complex', chains.join(';'), '-map', '[vout]');
  if (music) cmd.push('-map', `${scenes.length}:a`, '-af', `afade=t=in:d=0.6,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2`, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  cmd.push('-t', total.toFixed(2), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-movflags', '+faststart', destino);

  console.log(`${id}: ${scenes.length} cenas, ~${total.toFixed(1)}s ${music ? '+ trilha' : '(sem áudio)'} | movimentos: ${movimentos.join(', ')} | transições: ${transicoes.join(', ') || '-'} -> ${path.relative(ROOT, destino)}`);
  if (dry) { console.log('ffmpeg ' + cmd.map((c) => (/[\s;\[]/.test(c) ? `"${c}"` : c)).join(' ') + '\n'); continue; }
  const r = spawnSync('ffmpeg', cmd, { stdio: 'inherit' });
  if (r.status !== 0) { console.error(`${id}: ffmpeg falhou (código ${r.status})`); process.exit(1); }
}
console.log(dry ? 'dry-run: nada foi gerado.' : 'Reels gerados. Rode: node marketing/tools/verificar-midia.js');
