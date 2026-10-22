// Monta os Reels (1080x1920, 30 fps, H.264 + AAC) a partir dos quadros cena-NN.jpg: zoom suave em cada cena e transição suave entre elas.
// Requer FFmpeg no PATH (winget install Gyan.FFmpeg). Uso:
//   node marketing/tools/montar-reels.js [--only P02,P11] [--musica C:/caminho/trilha.mp3] [--dry-run]
// Sem --musica o vídeo sai sem áudio (a trilha pode ser escolhida no app do Instagram). Não agenda nem envia nada.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const { REELS } = require('../midia/conteudo.js');
const OUT = path.join(ROOT, 'marketing', 'midia', 'processada');
const args = process.argv.slice(2);
const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const only = arg('--only') ? new Set(arg('--only').split(',')) : null;
const music = arg('--musica');
const dry = args.includes('--dry-run');
const FPS = 30;
const FADE = 0.4; // duração da transição entre cenas (s)

if (!dry && spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
  console.error('FFmpeg não encontrado no PATH. Instale com: winget install Gyan.FFmpeg (e abra um terminal novo).');
  process.exit(2);
}
if (music && !fs.existsSync(music)) { console.error(`Trilha não encontrada: ${music}`); process.exit(2); }

for (const [id, scenes] of Object.entries(REELS)) {
  if (only && !only.has(id)) continue;
  const dir = path.join(OUT, id);
  const frames = scenes.map((_, i) => path.join(dir, `cena-${String(i + 1).padStart(2, '0')}.jpg`));
  const missing = frames.filter((f) => !fs.existsSync(f));
  if (missing.length) { console.error(`${id}: faltam quadros (rode gerar-midia.js): ${missing.map((m) => path.basename(m)).join(', ')}`); process.exit(1); }

  const inputs = [];
  const chains = [];
  scenes.forEach((s, i) => {
    const frames_n = Math.round((s.dur + FADE) * FPS); // cada clipe dura um pouco mais para cobrir a transição
    inputs.push('-i', frames[i]); // quadro único: o zoompan gera os frames (com -loop ele multiplicaria os frames)
    // Imagem ampliada 2x antes do zoompan evita tremor; zoom de 1.00 a 1.06 (ou o inverso com zoomOut).
    const z = s.zoomOut ? `if(eq(on,0),1.06,max(zoom-0.0006,1.0))` : `min(zoom+0.0006,1.06)`;
    chains.push(`[${i}:v]scale=2160:3840,zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames_n}:s=1080x1920:fps=${FPS},setsar=1,scale=in_range=full:out_range=limited,format=yuv420p[v${i}]`);
  });
  let last = 'v0';
  let acc = scenes[0].dur;
  for (let i = 1; i < scenes.length; i++) {
    const out = i === scenes.length - 1 ? 'vout' : `x${i}`;
    chains.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${(acc).toFixed(2)}[${out}]`);
    acc += scenes[i].dur;
    last = out;
  }
  if (scenes.length === 1) chains.push(`[v0]null[vout]`);
  const total = acc + FADE;
  const cmd = ['-y', ...inputs];
  if (music) cmd.push('-i', music);
  cmd.push('-filter_complex', chains.join(';'), '-map', '[vout]');
  if (music) cmd.push('-map', `${scenes.length}:a`, '-af', `afade=t=in:d=0.6,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2`, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  cmd.push('-t', total.toFixed(2), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-movflags', '+faststart', path.join(dir, 'reel.mp4'));

  console.log(`${id}: ${scenes.length} cenas, ~${total.toFixed(1)}s ${music ? '+ trilha' : '(sem áudio)'}`);
  if (dry) { console.log('ffmpeg ' + cmd.map((c) => (/[\s;\[]/.test(c) ? `"${c}"` : c)).join(' ') + '\n'); continue; }
  const r = spawnSync('ffmpeg', cmd, { stdio: 'inherit' });
  if (r.status !== 0) { console.error(`${id}: ffmpeg falhou (código ${r.status})`); process.exit(1); }
}
console.log(dry ? 'dry-run: nada foi gerado.' : 'Reels gerados. Rode: node marketing/tools/verificar-midia.js');
