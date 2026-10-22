// Verifica a mídia processada contra calendario/posts.json: arquivos, formato e resolução exata.
// Feed e carrossel = JPEG 1080x1080; quadros de Reel = JPEG 1080x1920; reel.mp4 (se existir) = 1080x1920 via ffprobe.
// Grava marketing/midia/verificacao.json (usada pela tabela de validação da Fase 4). Uso: node marketing/tools/verificar-midia.js
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const sharp = require(path.join(ROOT, 'node_modules', 'sharp'));
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'calendario', 'posts.json'), 'utf8'));
const { SLIDES, REELS } = require('../midia/conteudo.js');
const OUT = path.join(ROOT, 'marketing', 'midia', 'processada');
const MAX_BYTES = 8 * 1024 * 1024;
const hasFfprobe = spawnSync('ffprobe', ['-version'], { stdio: 'ignore' }).status === 0;

async function checkImage(file, w, h, problems) {
  if (!fs.existsSync(file)) return problems.push(`falta ${path.relative(ROOT, file)}`);
  const m = await sharp(file).metadata();
  if (m.format !== 'jpeg') problems.push(`${path.basename(file)}: formato ${m.format}`);
  if (m.width !== w || m.height !== h) problems.push(`${path.basename(file)}: ${m.width}x${m.height} (esperado ${w}x${h})`);
  if (fs.statSync(file).size > MAX_BYTES) problems.push(`${path.basename(file)}: acima de 8 MB`);
  const st = await sharp(file).stats();
  if (st.channels.every((c) => c.stdev < 3)) problems.push(`${path.basename(file)}: imagem praticamente lisa`);
}

(async () => {
  const result = [];
  let bad = 0, count = 0;
  for (const p of posts) {
    const dir = path.join(OUT, p.id);
    const problems = [];
    let expected;
    if (p.format === 'reel') {
      const n = (REELS[p.id] || []).length;
      expected = Array.from({ length: n }, (_, i) => `cena-${String(i + 1).padStart(2, '0')}.jpg`);
      for (const f of expected) { await checkImage(path.join(dir, f), 1080, 1920, problems); count++; }
    } else if (p.format === 'carrossel') {
      const n = p.slides;
      if ((SLIDES[p.id] || []).length !== n) problems.push(`conteúdo tem ${(SLIDES[p.id] || []).length} slides e o calendário ${n}`);
      expected = Array.from({ length: n }, (_, i) => `slide-${String(i + 1).padStart(2, '0')}.jpg`);
      for (const f of expected) { await checkImage(path.join(dir, f), 1080, 1080, problems); count++; }
    } else {
      expected = ['feed.jpg'];
      await checkImage(path.join(dir, 'feed.jpg'), 1080, 1080, problems); count++;
    }
    if (fs.existsSync(dir)) {
      const extra = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg') && !expected.includes(f));
      if (extra.length) problems.push(`arquivos extras: ${extra.join(', ')}`);
    }
    let video = null;
    if (p.format === 'reel') {
      const mp4 = path.join(dir, 'reel.mp4');
      if (!fs.existsSync(mp4)) video = 'pendente (precisa do FFmpeg)';
      else if (!hasFfprobe) video = 'existe, mas sem ffprobe para conferir';
      else {
        const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration', '-of', 'csv=p=0', mp4], { encoding: 'utf8' });
        const [w, h, d] = r.stdout.trim().split(',');
        if (Number(w) !== 1080 || Number(h) !== 1920) problems.push(`reel.mp4: ${w}x${h} (esperado 1080x1920)`);
        if (Number(d) > 90) problems.push(`reel.mp4: ${d}s (máximo 90s)`);
        video = `ok ${w}x${h} ${Number(d).toFixed(1)}s`;
      }
    }
    const spec = p.format === 'reel' ? '1080x1920' : '1080x1080';
    const status = problems.length ? 'ERRO' : p.format === 'reel' ? (video && video.startsWith('ok') ? `OK ${spec} (vídeo)` : `quadros OK ${spec}; vídeo pendente`) : `OK ${spec}`;
    if (problems.length) bad++;
    result.push({ id: p.id, date: p.date, format: p.format, spec, status, video, files: expected.length, problems });
  }
  fs.writeFileSync(path.join(ROOT, 'marketing', 'midia', 'verificacao.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`posts: ${posts.length} | imagens conferidas: ${count} | posts com erro: ${bad}`);
  const by = {};
  for (const r of result) by[r.status] = (by[r.status] || 0) + 1;
  console.log('resumo:', JSON.stringify(by));
  for (const r of result.filter((x) => x.problems.length)) console.log(`${r.id}: ${r.problems.join(' | ')}`);
  console.log(`ffprobe: ${hasFfprobe ? 'disponível' : 'não instalado (reel.mp4 não pode ser conferido)'}`);
  process.exit(bad ? 1 : 0);
})();
