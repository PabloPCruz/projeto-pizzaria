// Gera a mídia dos posts (feed e carrossel 1080x1080, quadros de Reel 1080x1920) a partir de calendario/posts.json.
// O visual de cada post vem da direção de arte (midia/arte.json): layout + paleta (+ variante) por post, slide ou cena.
// Layouts em midia/layouts/*.js (contrato em midia/layouts/CATALOGO.md); sem entrada em arte.json usa os clássicos (v1).
// Uso: node marketing/tools/gerar-midia.js [--only P01,P02] [--jobs 4]   (não agenda nem envia nada)
const fs = require('fs');
const path = require('path');
const n = require('../midia/nucleo.js');
const { renderizar, carregarLayouts, DIM, CHROME } = require('./lib-render.js');
const { FEED_PHOTO_SUB, SLIDES, REELS } = require('../midia/conteudo.js');

const ROOT = n.ROOT;
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'calendario', 'posts.json'), 'utf8'));
const artePath = path.join(ROOT, 'marketing', 'midia', 'arte.json');
const ARTE = fs.existsSync(artePath) ? JSON.parse(fs.readFileSync(artePath, 'utf8')) : {};
const OUT = path.join(ROOT, 'marketing', 'midia', 'processada');
const WORK = path.join(ROOT, 'marketing', 'midia', '_trabalho');

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const JOBS = args.includes('--jobs') ? Number(args[args.indexOf('--jobs') + 1]) : 4;
const LAYOUTS = carregarLayouts();

// Conteúdo de cada peça do post (slides, cenas ou a imagem única), já com `tipo`.
function pecas(p) {
  if (p.format === 'reel') {
    const sc = REELS[p.id];
    if (!sc) throw new Error(`${p.id}: sem cenas em conteudo.js`);
    return sc.map((c, i) => ({ ...c, tipo: c.t === 'photo' ? 'photo' : c.t === 'cta' ? 'cta' : 'text', arquivo: `cena-${String(i + 1).padStart(2, '0')}.jpg` }));
  }
  if (p.format === 'carrossel' || !p.photos.length || SLIDES[p.id]) {
    const sl = SLIDES[p.id];
    if (!sl) throw new Error(`${p.id}: sem slides em conteudo.js`);
    if (p.format === 'carrossel' && sl.length !== p.slides) throw new Error(`${p.id}: ${sl.length} slides, calendário diz ${p.slides}`);
    const car = p.format === 'carrossel';
    return sl.map((s, i) => ({ ...s, tipo: s.layout || 'text', idx: car ? `${i + 1}/${sl.length}` : '', arquivo: car ? `slide-${String(i + 1).padStart(2, '0')}.jpg` : 'feed.jpg' }));
  }
  return [{ tipo: 'photo', title: p.on_art, sub: FEED_PHOTO_SUB[p.id], photo: p.photos[0], cta: p.cta, arquivo: 'feed.jpg' }];
}

// Layout padrão (v1) quando a direção de arte não definiu.
function padrao(peca, formato) {
  if (formato === 'story') return peca.tipo === 'photo' ? 'story-classico' : peca.tipo === 'cta' ? 'story-cta' : 'story-texto';
  return peca.tipo === 'photo' ? 'classico-faixa' : 'cartao-elegante';
}

// Escolha de arte da peça i: arte.json aceita { layout, paleta, variante } no post e/ou listas `slides`/`cenas`.
function arteDa(p, i) {
  const a = ARTE[p.id] || {};
  const lista = a.slides || a.cenas || [];
  const item = lista[i] || {};
  return { layout: item.layout || a.layout, paleta: item.paleta || a.paleta || 'carvao', variante: item.variante || a.variante };
}

function compativel(L, peca) {
  if (L.tipos && !L.tipos.includes(peca.tipo)) return `não aceita tipo ${peca.tipo}`;
  if (L.usa === 'foto' && peca.tipo !== 'photo') return 'exige foto';
  if (L.usa === 'texto' && (peca.tipo === 'photo' || peca.tipo === 'cta')) return 'é só para texto';
  if (L.usa === 'cta' && peca.tipo !== 'cta') return 'é só para a cena final';
  if (peca.tipo === 'cta' && L.usa !== 'cta') return 'a cena final pede layout de CTA';
  return null;
}

async function main() {
  if (!CHROME) throw new Error('Chrome/Edge não encontrado (defina a variável CHROME).');
  const jobs = [];
  const avisos = [];
  for (const p of posts) {
    if (only && !only.has(p.id)) continue;
    const formato = p.format === 'reel' ? 'story' : 'feed';
    pecas(p).forEach((peca, i) => {
      const a = arteDa(p, i);
      let id = a.layout || padrao(peca, formato);
      let L = LAYOUTS[id];
      const motivo = !L ? 'layout inexistente' : L.formato !== formato ? `layout é ${L.formato}` : compativel(L, peca);
      if (motivo) { avisos.push(`${p.id} ${peca.arquivo}: ${id} (${motivo}); usei ${padrao(peca, formato)}`); id = padrao(peca, formato); L = LAYOUTS[id]; }
      jobs.push({ p, peca, L, paleta: a.paleta, variante: a.variante, out: path.join(OUT, p.id, peca.arquivo) });
    });
  }
  console.log(`${jobs.length} imagens a gerar com ${path.basename(CHROME)}...`);
  avisos.forEach((x) => console.log('AVISO:', x));
  let next = 0, done = 0;
  const falhas = [];
  async function worker() {
    while (next < jobs.length) {
      const j = jobs[next++];
      try {
        const inner = await j.L.render(j.peca, { n, p: n.paleta(j.paleta), post: j.p, variante: j.variante });
        const [w, h] = DIM[j.L.formato];
        await renderizar(inner, w, h, j.out, path.join(WORK, 'html', `${j.p.id}-${path.basename(j.out, '.jpg')}`));
        done++;
      } catch (e) { falhas.push(`${j.p.id} ${path.basename(j.out)} (${j.L.id}): ${e.message}`); }
    }
  }
  await Promise.all(Array.from({ length: JOBS }, () => worker()));
  console.log(`geradas: ${done}/${jobs.length}`);
  if (falhas.length) { console.log('FALHAS:\n' + falhas.join('\n')); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
