// Gera a mídia dos posts (feed e carrossel 1080x1080, quadros de Reel 1080x1920) a partir de calendario/posts.json.
// Fotos: smart crop (sharp, atenção/foco) sem esticar; logo da marca em faixa própria, nunca sobre a pizza.
// Texto e layout: HTML renderizado no Chrome sem interface (fontes Playfair Display e Inter do projeto).
// Uso: node marketing/tools/gerar-midia.js [--only P01,P02] [--jobs 4]   (não agenda nem envia nada)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..', '..');
const sharp = require(path.join(ROOT, 'node_modules', 'sharp'));
const { FEED_PHOTO_SUB, SLIDES, REELS } = require('../midia/conteudo.js');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'calendario', 'posts.json'), 'utf8'));

const PHOTOS = path.join(ROOT, 'src', 'assets', 'img-flavors');
const LOGO = path.join(ROOT, 'src', 'assets', 'img', 'logo-crop-640.png');
const FONT_DIR = path.join(ROOT, 'node_modules', '@fontsource-variable');
const OUT = path.join(ROOT, 'marketing', 'midia', 'processada');
const WORK = path.join(ROOT, 'marketing', 'midia', '_trabalho');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find((p) => fs.existsSync(p));

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const JOBS = args.includes('--jobs') ? Number(args[args.indexOf('--jobs') + 1]) : 4;

const url = (p) => pathToFileURL(p).href;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CTA_FORTE = 'Peça agora pelo Disk Pizza';

const CSS = `
@font-face{font-family:PF;src:url("${url(path.join(FONT_DIR, 'playfair-display/files/playfair-display-latin-wght-normal.woff2'))}");font-weight:400 900}
@font-face{font-family:IN;src:url("${url(path.join(FONT_DIR, 'inter/files/inter-latin-wght-normal.woff2'))}");font-weight:100 900}
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#0f0f0f;--ink2:#1a1a1a;--gold:#d4af37;--goldl:#e8cc74;--golds:#c9a24b;--cream:#f5efe3;--muted:#cbc2b0;--red:#c8102e}
html,body{overflow:hidden;background:var(--ink);font-family:IN,sans-serif;color:var(--cream)}
h1,.big{font-family:PF,serif;font-weight:700;letter-spacing:-.01em}
h1,p{text-wrap:balance}
.c{position:relative;overflow:hidden}
.pill{position:absolute;right:24px;bottom:24px;background:rgba(15,15,15,.78);color:var(--cream);font-size:24px;font-weight:600;padding:8px 18px;border-radius:999px;border:1px solid rgba(232,204,116,.45)}
.eyebrow{color:var(--golds);font-size:28px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}
.sub{color:var(--muted);font-weight:500}
.cta-f{display:inline-block;background:var(--red);color:#fff;font-weight:800;border-radius:999px;box-shadow:0 8px 30px rgba(200,16,46,.35)}
.cta-s{color:var(--goldl);font-weight:700;border:2px solid rgba(212,175,55,.7);border-radius:999px;display:inline-block}
.idx{position:absolute;color:var(--muted);font-size:26px;font-weight:600;letter-spacing:.06em}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,rgba(212,175,55,.16),transparent 62%)}
.frame{position:absolute;inset:34px;border:2px solid rgba(212,175,55,.35);border-radius:28px}
`;

function titleSize(t, sizes) {
  const n = t.length;
  return n <= sizes[0][0] ? sizes[0][1] : n <= sizes[1][0] ? sizes[1][1] : sizes[2][1];
}

// --- 1080x1080 -----------------------------------------------------------
function feedPhoto(s, photoUrl, cta) {
  const ts = titleSize(s.title, [[22, 58], [34, 50], [99, 44]]);
  return `<div class="c" style="width:1080px;height:1080px;background:var(--ink)">
  <div style="position:relative;height:810px;background:url('${photoUrl}') center/cover"><span class="pill">Foto ilustrativa</span></div>
  <div style="position:absolute;left:0;right:0;top:810px;height:270px;border-top:4px solid var(--gold);background:linear-gradient(180deg,#171717,#0f0f0f);display:flex;align-items:center;gap:34px;padding:0 44px">
    <img src="${url(LOGO)}" style="height:172px;width:auto">
    <div style="flex:1;min-width:0">
      <h1 style="font-size:${ts}px;line-height:1.08;color:var(--cream)">${esc(s.title)}</h1>
      ${s.sub ? `<p class="sub" style="font-size:27px;line-height:1.3;margin-top:8px">${esc(s.sub)}</p>` : ''}
      ${cta === 'forte' ? `<p style="margin-top:12px;color:var(--goldl);font-size:25px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">${CTA_FORTE} · link na bio</p>` : ''}
    </div>
  </div>
  ${s.idx ? `<span class="idx" style="right:28px;top:26px;background:rgba(15,15,15,.7);padding:4px 14px;border-radius:999px">${s.idx}</span>` : ''}
</div>`;
}

function ctaBlock(cta, big) {
  if (cta === 'forte')
    return `<div style="position:absolute;left:0;right:0;bottom:${big ? 120 : 92}px;text-align:center"><span class="cta-f" style="font-size:${big ? 46 : 38}px;padding:${big ? 26 : 22}px ${big ? 54 : 46}px">${CTA_FORTE}</span><p class="sub" style="font-size:${big ? 30 : 27}px;margin-top:16px">link na bio · sem cadastro</p></div>`;
  if (cta === 'suave')
    return `<div style="position:absolute;left:0;right:0;bottom:92px;text-align:center"><span class="cta-s" style="font-size:32px;padding:16px 38px">Monte a sua pelo link na bio</span></div>`;
  return '';
}

function feedText(s) {
  const ts = titleSize(s.title, [[16, 112], [26, 92], [99, 76]]);
  const bigPx = s.cta ? 220 : 270;
  const body = s.layout === 'size'
    ? `<div style="text-align:center;margin-top:10px"><span class="big" style="display:block;font-size:${bigPx}px;line-height:1.12;color:var(--gold);font-family:PF">${esc(s.big)}</span><p style="font-size:44px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--cream);margin-top:4px">${esc(s.bigLabel)}</p></div>`
    : s.layout === 'step'
      ? `<div style="margin:0 auto;width:210px;height:210px;border-radius:50%;border:4px solid var(--gold);display:flex;align-items:center;justify-content:center;margin-bottom:30px"><span class="big" style="font-size:130px;color:var(--gold)">${esc(s.n)}</span></div>`
      : '';
  const lines = (s.lines || []).map((l) => s.layout === 'list'
    ? `<li style="list-style:none;font-size:46px;font-weight:600;padding:14px 0;border-bottom:1px solid rgba(212,175,55,.3)">${esc(l)}</li>`
    : `<p class="sub" style="font-size:${s.layout === 'size' ? 42 : 44}px;line-height:1.35;margin-top:16px">${esc(l)}</p>`).join('');
  const listWrap = s.layout === 'list' ? `<ul style="margin:34px auto 0;width:800px;text-align:left">${lines}</ul>` : lines;
  const hasCta = !!s.cta;
  return `<div class="c" style="width:1080px;height:1080px;background:var(--ink)">
  <div class="glow"></div><div class="frame"></div>
  <img src="${url(LOGO)}" style="position:absolute;left:50%;top:70px;height:148px;transform:translateX(-50%)">
  <div style="position:absolute;left:90px;right:90px;top:${s.layout === 'size' ? 245 : 250}px;bottom:${hasCta ? (s.layout === 'size' ? 250 : 230) : 110}px;display:flex;flex-direction:column;justify-content:center;text-align:center;align-items:center">
    ${s.eyebrow ? `<p class="eyebrow" style="margin-bottom:22px">${esc(s.eyebrow)}</p>` : ''}
    ${s.layout === 'step' ? body : ''}
    <h1 style="font-size:${s.layout === 'size' ? 78 : ts}px;line-height:1.08">${esc(s.title)}</h1>
    ${s.layout === 'size' ? body : ''}
    ${listWrap}
  </div>
  ${ctaBlock(s.cta)}
  ${s.deslize ? `<span class="idx" style="left:0;right:0;bottom:80px;text-align:center;font-size:30px;color:var(--goldl)">DESLIZE &rarr;</span>` : ''}
  ${s.idx ? `<span class="idx" style="right:62px;bottom:62px">${s.idx}</span>` : ''}
</div>`;
}

// --- 1080x1920 (quadros de Reel) ------------------------------------------
// Zona segura: nada importante acima de 250px nem abaixo de ~1580px (interface do Reels).
function storyPhoto(s, photoUrl, bgUrl) {
  const ts = titleSize(s.title, [[20, 84], [32, 72], [99, 62]]);
  return `<div class="c" style="width:1080px;height:1920px;background:var(--ink)">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,15,15,.55),rgba(15,15,15,.1) 35%,rgba(15,15,15,.15) 70%,rgba(15,15,15,.85)),url('${bgUrl}') center/cover"></div>
  <img src="${url(LOGO)}" style="position:absolute;left:50%;top:268px;height:190px;transform:translateX(-50%)">
  <div style="position:absolute;left:0;top:555px;width:1080px;height:810px;background:url('${photoUrl}') center/cover;border-top:4px solid var(--gold);border-bottom:4px solid var(--gold)"><span class="pill">Foto ilustrativa</span></div>
  <div style="position:absolute;left:70px;right:70px;top:1410px;text-align:center">
    <h1 style="font-size:${ts}px;line-height:1.08;text-shadow:0 4px 24px rgba(0,0,0,.7)">${esc(s.title)}</h1>
  </div>
</div>`;
}

function storyText(s) {
  const ts = titleSize(s.title, [[16, 120], [28, 100], [99, 86]]);
  return `<div class="c" style="width:1080px;height:1920px;background:var(--ink)">
  <div class="glow"></div><div class="frame" style="inset:60px"></div>
  <img src="${url(LOGO)}" style="position:absolute;left:50%;top:268px;height:210px;transform:translateX(-50%)">
  <div style="position:absolute;left:90px;right:90px;top:560px;height:860px;display:flex;flex-direction:column;justify-content:center;text-align:center;align-items:center">
    ${s.eyebrow ? `<p class="eyebrow" style="margin-bottom:28px;font-size:34px">${esc(s.eyebrow)}</p>` : ''}
    <h1 style="font-size:${ts}px;line-height:1.08">${esc(s.title)}</h1>
    ${(s.lines || []).map((l) => `<p class="sub" style="font-size:46px;line-height:1.35;margin-top:20px">${esc(l)}</p>`).join('')}
  </div>
</div>`;
}

function storyCta() {
  return `<div class="c" style="width:1080px;height:1920px;background:var(--ink)">
  <div class="glow"></div><div class="frame" style="inset:60px"></div>
  <img src="${url(LOGO)}" style="position:absolute;left:50%;top:340px;height:300px;transform:translateX(-50%)">
  <div style="position:absolute;left:70px;right:70px;top:720px;text-align:center">
    <h1 style="font-size:96px;line-height:1.08">${CTA_FORTE}</h1>
    <p class="sub" style="font-size:44px;margin-top:34px">link na bio · sem cadastro</p>
    <span class="cta-f" style="font-size:44px;padding:26px 60px;margin-top:60px">Monte a sua pizza</span>
    <p class="sub" style="font-size:36px;margin-top:70px">Segunda a sábado · 18h às 23h</p>
  </div>
</div>`;
}

// --- fotos: smart crop ------------------------------------------------------
// Ajuste manual do ponto da pizza (fração x, y da foto original) quando a atenção automática erra. Chave: nome do arquivo sem .jpg.
// Valor: [x, y, zoom opcional] (zoom 1 = a maior janela 4:3 possível).
const FOCUS = { 'frango-brocolis': [0.5, 0.64, 1.15] };
const baseCache = new Map();
async function photoBase(name) {
  if (baseCache.has(name)) return baseCache.get(name);
  const src = path.join(PHOTOS, `${name}.jpg`);
  const meta = await sharp(src).metadata();
  const aspect = 4 / 3;
  let img = sharp(src).rotate();
  if (Math.abs(meta.width / meta.height - aspect) > 0.01) {
    let left, top, w, h;
    if (meta.width / meta.height > aspect) { h = meta.height; w = Math.round(h * aspect); } else { w = meta.width; h = Math.round(w / aspect); }
    if (FOCUS[name]) {
      const z = FOCUS[name][2] || 1;
      w = Math.round(w / z); h = Math.round(h / z);
      left = Math.round(Math.min(Math.max(FOCUS[name][0] * meta.width - w / 2, 0), meta.width - w));
      top = Math.round(Math.min(Math.max(FOCUS[name][1] * meta.height - h / 2, 0), meta.height - h));
    } else {
      // A atenção do sharp é calculada numa versão reduzida; os deslocamentos voltam à escala da foto original.
      const tw = 640, th = 480;
      const probe = await sharp(src).resize(tw, th, { fit: 'cover', position: sharp.strategy.attention }).toBuffer({ resolveWithObject: true });
      const k = Math.max(tw / meta.width, th / meta.height);
      left = Math.round(Math.abs(probe.info.cropOffsetLeft || 0) / k);
      top = Math.round(Math.abs(probe.info.cropOffsetTop || 0) / k);
      left = Math.min(left, meta.width - w); top = Math.min(top, meta.height - h);
    }
    img = sharp(src).rotate().extract({ left, top, width: w, height: h });
  }
  const dir = path.join(WORK, 'base');
  fs.mkdirSync(dir, { recursive: true });
  const fg = path.join(dir, `${name}-1080x810.jpg`);
  const bg = path.join(dir, `${name}-bg-1080x1920.jpg`);
  const buf = await img.resize(1080, 810, { kernel: 'lanczos3' }).sharpen({ sigma: 0.6 }).jpeg({ quality: 95 }).toBuffer();
  fs.writeFileSync(fg, buf);
  await sharp(buf).resize(1080, 1920, { fit: 'cover' }).blur(38).modulate({ brightness: 0.42, saturation: 1.1 }).jpeg({ quality: 90 }).toFile(bg);
  const r = { fg: url(fg), bg: url(bg) };
  baseCache.set(name, r);
  return r;
}

// --- render ----------------------------------------------------------------
function runChrome(htmlPath, pngPath, w, h) {
  return new Promise((resolve, reject) => {
    const p = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--no-first-run', `--window-size=${w},${h}`, `--screenshot=${pngPath}`, '--virtual-time-budget=4000', url(htmlPath)], { stdio: 'ignore' });
    p.on('error', reject);
    p.on('exit', () => (fs.existsSync(pngPath) ? resolve() : reject(new Error('Chrome não gerou ' + pngPath))));
  });
}

const jobs = [];
const wrap = (w, h, inner) => `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${CSS}html,body{width:${w}px;height:${h}px}</style><body>${inner}</body></html>`;

async function plan() {
  for (const p of posts) {
    if (only && !only.has(p.id)) continue;
    const dir = path.join(OUT, p.id);
    const add = (file, w, h, html) => jobs.push({ id: p.id, out: path.join(dir, file), w, h, html });
    if (p.format === 'reel') {
      const scenes = REELS[p.id];
      if (!scenes) throw new Error(`${p.id}: sem cenas em conteudo.js`);
      for (let i = 0; i < scenes.length; i++) {
        const s = scenes[i];
        let inner;
        if (s.t === 'photo') { const b = await photoBase(s.photo); inner = storyPhoto(s, b.fg, b.bg); }
        else if (s.t === 'text') inner = storyText(s);
        else inner = storyCta();
        add(`cena-${String(i + 1).padStart(2, '0')}.jpg`, 1080, 1920, wrap(1080, 1920, inner));
      }
    } else if (p.format === 'carrossel' || !p.photos.length) {
      const slides = SLIDES[p.id];
      if (!slides) throw new Error(`${p.id}: sem slides em conteudo.js`);
      if (p.format === 'carrossel' && slides.length !== p.slides) throw new Error(`${p.id}: ${slides.length} slides, calendário diz ${p.slides}`);
      for (let i = 0; i < slides.length; i++) {
        const s = { ...slides[i], idx: p.format === 'carrossel' ? `${i + 1}/${slides.length}` : '' };
        const inner = s.layout === 'photo' ? feedPhoto(s, (await photoBase(s.photo)).fg, s.cta) : feedText(s);
        const file = p.format === 'carrossel' ? `slide-${String(i + 1).padStart(2, '0')}.jpg` : 'feed.jpg';
        add(file, 1080, 1080, wrap(1080, 1080, inner));
      }
    } else {
      const s = { title: p.on_art, sub: FEED_PHOTO_SUB[p.id] };
      add('feed.jpg', 1080, 1080, wrap(1080, 1080, feedPhoto(s, (await photoBase(p.photos[0])).fg, p.cta)));
    }
  }
}

async function main() {
  if (!CHROME) throw new Error('Chrome/Edge não encontrado (defina a variável CHROME).');
  fs.mkdirSync(WORK, { recursive: true });
  await plan();
  console.log(`${jobs.length} imagens a gerar com ${path.basename(CHROME)}...`);
  let next = 0, done = 0;
  const failures = [];
  async function worker(n) {
    while (next < jobs.length) {
      const j = jobs[next++];
      const base = path.join(WORK, `${j.id}-${path.basename(j.out, '.jpg')}`);
      try {
        fs.mkdirSync(path.dirname(j.out), { recursive: true });
        fs.writeFileSync(base + '.html', j.html);
        await runChrome(base + '.html', base + '.png', j.w, j.h);
        const meta = await sharp(base + '.png').metadata();
        let img = sharp(base + '.png');
        if (meta.width !== j.w || meta.height !== j.h) img = img.extract({ left: 0, top: 0, width: Math.min(j.w, meta.width), height: Math.min(j.h, meta.height) });
        await img.removeAlpha().jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(j.out);
        fs.rmSync(base + '.png', { force: true });
        done++;
      } catch (e) { failures.push(`${j.id} ${path.basename(j.out)}: ${e.message}`); }
    }
  }
  await Promise.all(Array.from({ length: JOBS }, (_, i) => worker(i)));
  console.log(`geradas: ${done}/${jobs.length}`);
  if (failures.length) { console.log('FALHAS:\n' + failures.join('\n')); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
