// Núcleo compartilhado pelos layouts: fontes, paletas, fotos recortadas, logo, selos e CTA.
// Todo layout em midia/layouts/*.js recebe este módulo em ctx.n (ver CATALOGO.md).
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..', '..');
const sharp = require(path.join(ROOT, 'node_modules', 'sharp'));
const PHOTOS = path.join(ROOT, 'src', 'assets', 'img-flavors');
const WORK = path.join(ROOT, 'marketing', 'midia', '_trabalho');
const FONT_DIR = path.join(ROOT, 'node_modules', '@fontsource-variable');
const LOGO_FILE = path.join(ROOT, 'src', 'assets', 'img', 'logo-crop-640.png'); // 640x536, fundo transparente, letras brancas

const url = (p) => pathToFileURL(p).href;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CTA_FORTE = 'Peça agora pelo Disk Pizza';
const CTA_SUAVE = 'Monte a sua pelo link na bio';
const HORARIO = 'Segunda a sábado · 18h às 23h';

// Fontes: Playfair Display (PF) e Inter (IN) vêm do projeto. Fontes do Windows liberadas para acento:
// 'Bahnschrift' (condensada, ótima para números e chamadas), 'Segoe Script' e 'Gabriola' (manuscritas), 'Georgia'.
const FONTES_CSS = `
@font-face{font-family:PF;src:url("${url(path.join(FONT_DIR, 'playfair-display/files/playfair-display-latin-wght-normal.woff2'))}");font-weight:400 900}
@font-face{font-family:PF;font-style:italic;src:url("${url(path.join(FONT_DIR, 'playfair-display/files/playfair-display-latin-wght-italic.woff2'))}");font-weight:400 900}
@font-face{font-family:IN;src:url("${url(path.join(FONT_DIR, 'inter/files/inter-latin-wght-normal.woff2'))}");font-weight:100 900}
`;

const BASE_CSS = `${FONTES_CSS}
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;font-family:IN,sans-serif}
h1,h2,p{text-wrap:balance}
.pf{font-family:PF,serif}.in{font-family:IN,sans-serif}.cond{font-family:Bahnschrift,'Arial Narrow',sans-serif}.script{font-family:'Segoe Script',Gabriola,cursive}
`;

// Paletas da marca. escuro=true: texto claro. placaLogo=true: o logo (chama vermelha e letras brancas) some no fundo,
// então use logo({ placa: p.placaLogo }) — vale para creme, ouro e tomate.
const PALETAS = {
  carvao: { bg: '#0f0f0f', bg2: '#1c1a17', ink: '#f5efe3', muted: '#cbc2b0', accent: '#d4af37', accent2: '#c8102e', escuro: true, placaLogo: false },
  creme: { bg: '#f3ead8', bg2: '#e6d7bb', ink: '#1c1712', muted: '#5b4f40', accent: '#9a7a22', accent2: '#b3141f', escuro: false, placaLogo: true },
  tomate: { bg: '#a3121f', bg2: '#7a0d17', ink: '#fff4e6', muted: '#f5cfc0', accent: '#f2c94c', accent2: '#1c1712', escuro: true, placaLogo: true },
  manjericao: { bg: '#1e3b2c', bg2: '#132619', ink: '#f5efe3', muted: '#c6d6c4', accent: '#e8cc74', accent2: '#d94a3a', escuro: true, placaLogo: false },
  ouro: { bg: '#d9b54a', bg2: '#bf9a33', ink: '#161310', muted: '#3d3322', accent: '#161310', accent2: '#a30d25', escuro: false, placaLogo: true },
  noite: { bg: '#121826', bg2: '#0a0e17', ink: '#f5efe3', muted: '#b9c0cf', accent: '#e8cc74', accent2: '#e2513d', escuro: true, placaLogo: false },
  chocolate: { bg: '#3b2418', bg2: '#27170f', ink: '#f8ecdc', muted: '#dcc3aa', accent: '#e8cc74', accent2: '#e98a9b', escuro: true, placaLogo: false },
};

function paleta(nome) {
  const p = PALETAS[nome];
  if (!p) throw new Error(`paleta desconhecida: ${nome} (use ${Object.keys(PALETAS).join(', ')})`);
  return { nome, ...p };
}

// Variáveis CSS da paleta, para usar como var(--bg) etc. dentro do layout.
const varsCss = (p) => `--bg:${p.bg};--bg2:${p.bg2};--ink:${p.ink};--muted:${p.muted};--accent:${p.accent};--accent2:${p.accent2}`;

// Ponto da pizza quando a atenção automática erra: [x, y] em fração da foto original (e zoom opcional).
const FOCO = { 'frango-brocolis': [0.5, 0.64, 1.15], margherita: [0.42, 0.55], brigadeiro: [0.5, 0.7] };
const FOTOS = fs.readdirSync(PHOTOS).filter((f) => /^[a-z-]+\.jpg$/.test(f)).map((f) => f.replace('.jpg', ''));

const cache = new Map();
/**
 * Foto recortada no tamanho exato (w x h), com smart crop: mantém a pizza no centro e nunca estica.
 * opts: { zoom (>=1, aproxima), foco:[x,y], blur (px), brilho (0-2), saturacao (0-2) }. Retorna URL file:// de um JPEG.
 */
async function foto(nome, w, h, opts = {}) {
  if (!FOTOS.includes(nome)) throw new Error(`foto inexistente: ${nome}`);
  const key = JSON.stringify([nome, w, h, opts]);
  if (cache.has(key)) return cache.get(key);
  const src = path.join(PHOTOS, `${nome}.jpg`);
  const meta = await sharp(src).metadata();
  const aspect = w / h;
  let cw, ch;
  if (meta.width / meta.height > aspect) { ch = meta.height; cw = Math.round(ch * aspect); } else { cw = meta.width; ch = Math.round(cw / aspect); }
  const foco = opts.foco || FOCO[nome];
  const zoom = Math.max(1, opts.zoom || (foco && foco[2]) || 1);
  cw = Math.round(cw / zoom); ch = Math.round(ch / zoom);
  let left, top;
  if (foco) {
    left = foco[0] * meta.width - cw / 2; top = foco[1] * meta.height - ch / 2;
  } else {
    const tw = 600, th = Math.round(600 / aspect);
    const probe = await sharp(src).resize(tw, th, { fit: 'cover', position: sharp.strategy.attention }).toBuffer({ resolveWithObject: true });
    const k = Math.max(tw / meta.width, th / meta.height);
    const fullW = Math.round(cw * zoom), fullH = Math.round(ch * zoom);
    left = Math.abs(probe.info.cropOffsetLeft || 0) / k + (fullW - cw) / 2;
    top = Math.abs(probe.info.cropOffsetTop || 0) / k + (fullH - ch) / 2;
  }
  left = Math.round(Math.min(Math.max(left, 0), meta.width - cw));
  top = Math.round(Math.min(Math.max(top, 0), meta.height - ch));
  let img = sharp(src).rotate().extract({ left, top, width: cw, height: ch }).resize(w, h, { kernel: 'lanczos3' });
  if (opts.blur) img = img.blur(opts.blur);
  else img = img.sharpen({ sigma: 0.6 });
  if (opts.brilho || opts.saturacao) img = img.modulate({ brightness: opts.brilho || 1, saturation: opts.saturacao || 1 });
  const dir = path.join(WORK, 'fotos');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${nome}-${w}x${h}-${Buffer.from(key).toString('base64url').slice(-16)}.jpg`);
  await img.jpeg({ quality: 93 }).toFile(out);
  const u = url(out);
  cache.set(key, u);
  return u;
}

/** Logo da marca (letras brancas). Em fundo claro use { placa: true } (círculo/placa escura atrás). */
function logo({ altura = 150, placa = false, cor = '#141414', estilo = '' } = {}) {
  const img = `<img src="${url(LOGO_FILE)}" style="height:${altura}px;width:auto;display:block">`;
  if (!placa) return `<div style="${estilo}">${img}</div>`;
  const pad = Math.round(altura * 0.16);
  return `<div style="display:inline-block;background:${cor};border-radius:${Math.round(altura * 0.28)}px;padding:${pad}px ${Math.round(pad * 1.3)}px;box-shadow:0 10px 30px rgba(0,0,0,.25);${estilo}">${img}</div>`;
}

/** Selo obrigatório em toda peça com foto de banco de imagens. */
function seloIlustrativa({ estilo = 'right:24px;bottom:24px', escuro = true } = {}) {
  const bg = escuro ? 'rgba(15,15,15,.78)' : 'rgba(255,250,240,.9)';
  const fg = escuro ? '#f5efe3' : '#1c1712';
  return `<span style="position:absolute;${estilo};background:${bg};color:${fg};font:600 23px IN,sans-serif;padding:7px 16px;border-radius:999px;letter-spacing:.01em">Foto ilustrativa</span>`;
}

/** Índice do carrossel ("2/4"). */
function indice(idx, { estilo = 'right:40px;top:36px', cor = '#f5efe3', fundo = 'rgba(15,15,15,.55)' } = {}) {
  return idx ? `<span style="position:absolute;${estilo};font:600 24px IN,sans-serif;color:${cor};background:${fundo};padding:5px 14px;border-radius:999px">${esc(idx)}</span>` : '';
}

/** Tamanho do título pela quantidade de letras: faixas [[maxLetras, px], ...] (a última vale para o resto). */
function tamanho(texto, faixas) {
  const n = String(texto || '').length;
  for (const [max, px] of faixas) if (n <= max) return px;
  return faixas[faixas.length - 1][1];
}

module.exports = {
  ROOT, sharp, url, esc, CTA_FORTE, CTA_SUAVE, HORARIO, BASE_CSS, PALETAS, paleta, varsCss, foto, logo, seloIlustrativa, indice, tamanho, FOTOS,
};
