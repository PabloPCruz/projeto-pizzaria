// Família FOTO (feed 1080x1080): sete composições diferentes com a foto da pizza como protagonista.
// Todas usam as cores da paleta (var(--bg), var(--ink)...) e escolhem automaticamente cores com contraste >= 4,5:1.

// ---------- utilidades locais (cor, contraste, texturas) ----------
const hexRgb = (hex) => { const c = hex.replace('#', ''); return [0, 2, 4].map((i) => parseInt(c.substr(i, 2), 16)); };
const rgba = (hex, a) => `rgba(${hexRgb(hex).join(',')},${a})`;
const lum = (hex) => {
  const [r, g, b] = hexRgb(hex).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, k) => k - m); return (x + 0.05) / (y + 0.05); };
/** Tamanho do título pelas faixas de n.tamanho, limitado para que a palavra mais longa caiba na largura (Playfair bold ~0,56em/letra). */
function tamTitulo(n, texto, faixas, largura, k = 0.56) {
  const maior = Math.max(1, ...String(texto || '').split(/\s+/).map((w) => w.length));
  return Math.min(n.tamanho(texto, faixas), Math.floor(largura / (maior * k)));
}
const ESCURO = '#16120e';
const CLARO = '#fffaf1';

/** Tons para texto sobre véu escuro aplicado à foto (paletas claras ganham véu escuro e acento claro). */
function tonsFoto(p) {
  if (p.escuro) return { veu: p.bg, ink: p.ink, muted: p.muted, accent: p.accent, accent2: p.accent2, placaLogo: p.placaLogo };
  return { veu: p.ink, ink: '#f7f0e2', muted: '#dcd1bd', accent: p.nome === 'creme' ? '#dcbc68' : p.bg, accent2: p.accent2, placaLogo: false };
}
/** Tons de um cartão que contrasta com a paleta (cartão claro em paleta escura e vice-versa). */
function tonsCartao(p) {
  if (!p.escuro) return { ...tonsFoto(p), fundo: '#1d1813' };
  const acc = [p.accent2, p.accent, '#9a1b1b'].find((c) => contraste(c, CLARO) >= 4.5) || '#9a1b1b';
  return { fundo: CLARO, ink: '#1c1712', muted: '#5b4f40', accent: acc, accent2: acc, placaLogo: true };
}
/** Cor de botão com texto legível. ordem: 'accent' (dourado primeiro) ou 'accent2' (vermelho primeiro). */
function botao(t, ordem = 'accent2') {
  const a = [[t.accent2, '#ffffff']];
  const b = [[t.accent, ESCURO], [t.accent, '#ffffff']];
  const cands = ordem === 'accent' ? [...b, ...a] : [...a, ...b, [t.accent2, ESCURO]];
  const ok = cands.find(([bg, fg]) => contraste(bg, fg) >= 4.5);
  return ok ? { bg: ok[0], fg: ok[1] } : { bg: t.accent, fg: contraste(t.accent, '#fff') > contraste(t.accent, ESCURO) ? '#fff' : ESCURO };
}
/** Primeira cor da lista com contraste >= 4,5 sobre o fundo (para textos pequenos em cor de acento). */
const legivel = (fundo, ...cores) => cores.find((c) => contraste(c, fundo) >= 4.5) || (lum(fundo) > 0.3 ? '#1c1712' : '#f7f0e2');

// Grão de filme: bitmap de ruído gerado uma vez com sharp (um filtro SVG feTurbulence às vezes não
// termina de pintar no Chrome sem interface e deixa faixas pretas no JPEG).
let graoUrl = null;
async function grao(n) {
  if (graoUrl) return graoUrl;
  const path = require('path');
  const fs = require('fs');
  const S = 256;
  let seed = 20151;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const buf = Buffer.alloc(S * S * 3);
  for (let i = 0; i < S * S; i++) { const v = Math.round(128 + (rnd() + rnd() + rnd() - 1.5) * 110); buf.fill(Math.max(0, Math.min(255, v)), i * 3, i * 3 + 3); }
  const dir = path.join(n.ROOT, 'marketing', 'midia', '_trabalho', 'fotos');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'grao-fotos.png');
  if (!fs.existsSync(out)) await n.sharp(buf, { raw: { width: S, height: S, channels: 3 } }).png().toFile(out);
  graoUrl = n.url(out);
  return graoUrl;
}
const SETA = '<svg width="34" height="14" viewBox="0 0 34 14" style="display:inline-block;vertical-align:middle"><path d="M0 7h31M25 1.5l6 5.5-6 5.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// CSS compartilhado da família (classes com prefixo fts-). Use `${await cssBase(n)}` dentro do <style>.
const cssBase = async (n) => `.fts-grao{position:absolute;inset:0;background:url("${await grao(n)}") 0 0/256px 256px;pointer-events:none}
${CSS_BASE}`;
const CSS_BASE = `
.fts-eb{font-family:Bahnschrift,'Arial Narrow',sans-serif;font-weight:600;font-size:24px;letter-spacing:.26em;text-transform:uppercase;line-height:1}
.fts-tt{font-family:PF,serif;font-weight:700;line-height:1.04;letter-spacing:-.01em;text-wrap:balance}
.fts-sub{font-family:IN,sans-serif;font-size:27px;line-height:1.36;font-weight:400;text-wrap:balance}
.fts-pill{display:inline-block;font:700 28px/1 IN,sans-serif;padding:20px 34px;border-radius:999px;white-space:nowrap;box-shadow:0 10px 24px rgba(0,0,0,.22)}
.fts-bio{font-family:Bahnschrift,'Arial Narrow',sans-serif;font-weight:600;font-size:24px;letter-spacing:.18em;text-transform:uppercase;white-space:nowrap}
.fts-suave{font-family:PF,serif;font-style:italic;font-weight:600;font-size:32px;line-height:1.2;white-space:nowrap}
.fts-idx{font-family:Bahnschrift,'Arial Narrow',sans-serif;font-weight:600;font-size:26px;letter-spacing:.12em}
`;

/** Bloco de CTA. cores: { bt:{bg,fg}, ink, muted, accent }. */
function cta(s, n, { bt, ink, muted, accent, alinhar = 'flex-start', gap = 24, empilhar = false }) {
  if (s.cta === 'forte') {
    const dirc = empilhar ? `flex-direction:column;align-items:${alinhar};gap:18px` : `align-items:center;gap:${gap}px;flex-wrap:wrap;justify-content:${alinhar}`;
    return `<div style="display:flex;${dirc}">
      <span class="fts-pill" style="background:${bt.bg};color:${bt.fg}">${n.CTA_FORTE}</span>
      <span class="fts-bio" style="color:${muted}">link na bio ${SETA}</span></div>`;
  }
  if (s.cta === 'suave') {
    return `<div style="display:flex;justify-content:${alinhar}"><span class="fts-suave" style="color:${ink};border-bottom:2px solid ${accent};padding-bottom:6px">${n.CTA_SUAVE} <span style="color:${accent}">${SETA}</span></span></div>`;
  }
  return '';
}
const deslize = (s, cor) => (s.deslize ? `<span class="fts-bio" style="color:${cor}">Deslize ${SETA}</span>` : '');
const idxTxt = (s, n) => (s.idx ? n.esc(s.idx).replace('/', '<span style="opacity:.55;margin:0 .18em">/</span>') : '');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// ---------- layouts ----------
module.exports = [
  // 1) FOTO CHEIA ---------------------------------------------------------
  {
    id: 'foto-cheia',
    formato: 'feed',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['carvao', 'tomate', 'noite'],
    variantes: ['baixo', 'esquerda'],
    descricao: 'Foto ocupando o quadro, véu da paleta embaixo (baixo) ou à esquerda (esquerda), título grande em Playfair, CTA em pílula e logo no canto.',
    async render(s, { n, p, variante }) {
      const v = variante === 'esquerda' ? 'esquerda' : 'baixo';
      const t = tonsFoto(p);
      const bt = botao(t, 'accent');
      const acc = legivel(t.veu, t.accent, t.ink);
      const topo = `<div style="position:absolute;left:0;right:0;top:0;height:300px;background:linear-gradient(180deg,rgba(10,8,6,.62),rgba(10,8,6,.28) 55%,rgba(10,8,6,0))"></div>`;
      const eyebrow = s.eyebrow
        ? `<span class="fts-eb" style="color:${acc}">${n.esc(s.eyebrow)}</span>`
        : `<span style="display:block;width:72px;height:3px;background:${t.accent}"></span>`;
      if (v === 'baixo') {
        const foto = await n.foto(s.photo, 1080, 900);
        const ts = tamTitulo(n, s.title, [[12, 112], [20, 92], [30, 78], [99, 68]], 920);
        return `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;background:${t.veu};color:${t.ink};${n.varsCss(p)}">
  <style>${await cssBase(n)}</style>
  <div style="position:absolute;left:0;top:0;width:1080px;height:900px;background:url('${foto}') center/cover"></div>
  ${topo}
  <div style="position:absolute;inset:0;background:linear-gradient(0deg,${t.veu} 0,${t.veu} 31%,${rgba(t.veu, 0.9)} 40%,${rgba(t.veu, 0.55)} 50%,${rgba(t.veu, 0.15)} 60%,${rgba(t.veu, 0)} 68%)"></div>
  <div class="fts-grao" style="opacity:.07;mix-blend-mode:overlay"></div>
  <div style="position:absolute;left:56px;top:50px">${n.logo({ altura: 104, placa: true, cor: 'rgba(14,11,8,.5)' })}</div>
  ${n.seloIlustrativa({ estilo: 'right:52px;top:62px' })}
  <div style="position:absolute;left:80px;right:80px;bottom:72px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:26px">${eyebrow}
      <span style="display:flex;gap:28px;align-items:center">${deslize(s, t.muted)}${s.idx ? `<span class="fts-idx" style="color:${t.muted}">${idxTxt(s, n)}</span>` : ''}</span></div>
    <h1 class="fts-tt" style="font-size:${ts}px;max-width:900px">${n.esc(s.title)}</h1>
    ${s.sub ? `<p class="fts-sub" style="color:${t.muted};margin-top:20px;max-width:860px">${n.esc(s.sub)}</p>` : ''}
    ${s.cta ? `<div style="margin-top:34px">${cta(s, n, { bt, ink: t.ink, muted: t.muted, accent: t.accent })}</div>` : ''}
  </div>
</div>`;
      }
      // variante esquerda: véu lateral, foto deslocada para a direita
      const foto = await n.foto(s.photo, 700, 1080);
      const ts = tamTitulo(n, s.title, [[8, 96], [10, 86], [18, 76], [28, 66], [99, 60]], 470);
      return `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;background:${t.veu};color:${t.ink};${n.varsCss(p)}">
  <style>${await cssBase(n)}</style>
  <div style="position:absolute;left:380px;top:0;width:700px;height:1080px;background:url('${foto}') center/cover"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,${t.veu} 0,${t.veu} 45%,${rgba(t.veu, 0.9)} 51%,${rgba(t.veu, 0.55)} 59%,${rgba(t.veu, 0.15)} 68%,${rgba(t.veu, 0)} 76%)"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 45% at 0% 100%,${rgba('#000000', 0.25)},transparent)"></div>
  <div class="fts-grao" style="opacity:.07;mix-blend-mode:overlay"></div>
  <div style="position:absolute;left:76px;top:66px">${n.logo({ altura: 112, placa: t.placaLogo })}</div>
  ${n.seloIlustrativa({ estilo: 'right:48px;bottom:52px' })}
  ${n.indice(s.idx, { estilo: 'right:48px;top:52px' })}
  <div style="position:absolute;left:80px;width:470px;top:240px;bottom:${s.cta === 'forte' ? 270 : s.cta ? 200 : 140}px;display:flex;flex-direction:column;justify-content:center">
    <div style="margin-bottom:28px">${eyebrow}</div>
    <h1 class="fts-tt" style="font-size:${ts}px">${n.esc(s.title)}</h1>
    ${s.sub ? `<p class="fts-sub" style="color:${t.muted};margin-top:24px;font-size:26px">${n.esc(s.sub)}</p>` : ''}
  </div>
  <div style="position:absolute;left:80px;bottom:76px;display:flex;flex-direction:column;gap:22px;align-items:flex-start">
    ${cta(s, n, { bt, ink: t.ink, muted: t.muted, accent: t.accent, empilhar: true })}
    ${deslize(s, t.muted)}
  </div>
</div>`;
    },
  },

  // 2) FOTO DIVIDIDA ------------------------------------------------------
  {
    id: 'foto-dividida',
    formato: 'feed',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['creme', 'manjericao', 'ouro'],
    variantes: ['esquerda', 'direita'],
    descricao: 'Foto vertical em ~57% do quadro e painel da paleta com logo, título, filete e CTA. Variantes: foto à esquerda ou à direita.',
    async render(s, { n, p, variante }) {
      const dir = variante === 'direita';
      const FW = 610, PW = 1080 - FW;
      const foto = await n.foto(s.photo, FW, 1080);
      const ts = tamTitulo(n, s.title, [[10, 80], [16, 66], [24, 58], [99, 52]], 354);
      const acc = legivel(p.bg, p.accent, p.accent2, p.ink);
      const bt = botao(p, 'accent2');
      const ladoFoto = dir ? `right:0` : `left:0`;
      const ladoPainel = dir ? `left:0` : `right:0`;
      const ctaHtml = s.cta === 'forte'
        ? `<p class="pf" style="font-family:PF,serif;font-style:italic;font-weight:600;font-size:36px;line-height:1.15;color:var(--ink)">${n.CTA_FORTE}</p>
           <p style="margin-top:16px"><span class="fts-pill" style="background:${bt.bg};color:${bt.fg};font-size:24px;padding:15px 26px">link na bio ${SETA}</span></p>`
        : s.cta === 'suave'
          ? `<p style="font-family:PF,serif;font-style:italic;font-weight:600;font-size:32px;line-height:1.2;color:var(--ink)">${n.CTA_SUAVE}</p><p style="margin-top:12px;color:${acc}">${SETA}</p>`
          : '';
      return `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${n.varsCss(p)}">
  <style>${await cssBase(n)}
  .fdv-painel{position:absolute;top:0;bottom:0;${ladoPainel};width:${PW}px;background:
    repeating-linear-gradient(135deg,${rgba(p.ink, 0.035)} 0 2px,transparent 2px 16px),
    radial-gradient(ellipse 120% 70% at 50% 0%,var(--bg2),var(--bg) 70%)}
  </style>
  <div style="position:absolute;top:0;${ladoFoto};width:${FW}px;height:1080px;background:url('${foto}') center/cover"></div>
  <div style="position:absolute;top:0;${ladoFoto};width:${FW}px;height:1080px;background:linear-gradient(${dir ? 270 : 90}deg,rgba(0,0,0,0) 70%,rgba(0,0,0,.28))"></div>
  <div class="fdv-painel"></div>
  <div class="fts-grao" style="${ladoPainel};width:${PW}px;opacity:.08;mix-blend-mode:overlay"></div>
  <div style="position:absolute;top:0;bottom:0;${dir ? `left:${PW - 8}px` : `left:${FW}px`};width:8px;background:var(--accent)"></div>
  <div style="position:absolute;top:44px;bottom:44px;${dir ? `left:${PW - 38}px` : `left:${FW + 30}px`};width:2px;background:${rgba(p.accent, 0.45)}"></div>
  ${n.seloIlustrativa({ estilo: dir ? 'right:36px;bottom:40px' : 'left:36px;bottom:40px' })}
  <div style="position:absolute;top:0;bottom:0;${ladoPainel};width:${PW}px;padding:72px ${dir ? 64 : 52}px 72px ${dir ? 52 : 64}px;display:flex;flex-direction:column">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      ${n.logo({ altura: 104, placa: p.placaLogo })}
      ${s.idx ? `<span class="fts-idx" style="color:var(--muted);margin-top:8px">${idxTxt(s, n)}</span>` : ''}
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:24px 0">
      ${s.eyebrow ? `<p class="fts-eb" style="color:${acc};margin-bottom:22px">${n.esc(s.eyebrow)}</p>` : ''}
      <h1 class="fts-tt" style="font-size:${ts}px">${n.esc(s.title)}</h1>
      <div style="display:flex;align-items:center;gap:12px;margin:28px 0 0">
        <span style="width:56px;height:2px;background:var(--accent)"></span><span style="width:9px;height:9px;transform:rotate(45deg);background:var(--accent)"></span><span style="width:56px;height:2px;background:var(--accent)"></span>
      </div>
      ${s.sub ? `<p class="fts-sub" style="color:var(--muted);margin-top:24px;font-size:26px">${n.esc(s.sub)}</p>` : ''}
    </div>
    <div>${ctaHtml}${s.deslize ? `<p style="margin-top:18px">${deslize(s, 'var(--muted)')}</p>` : ''}</div>
  </div>
</div>`;
    },
  },

  // 3) FOTO CÍRCULO -------------------------------------------------------
  {
    id: 'foto-circulo',
    formato: 'feed',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['tomate', 'noite', 'chocolate'],
    descricao: 'Fundo da paleta com pontos e anéis; pizza recortada em círculo com aro; título em arco (curto) ou reto (longo) acima; subtítulo e CTA embaixo.',
    async render(s, { n, p }) {
      const CX = 540, CY = 566, D = 530;
      // No círculo a pizza precisa preencher o recorte: fotos com muito fundo vazio (frango-brocolis: metade de cima preta) aproximam mais.
      const RECORTE_CIRCULO = { 'frango-brocolis': { zoom: 1.5, foco: [0.5, 0.74] } };
      const foto = await n.foto(s.photo, D, D, RECORTE_CIRCULO[s.photo] || { zoom: 1.08 });
      const arco = String(s.title || '').length <= 22;
      const ts = arco ? n.tamanho(s.title, [[8, 92], [12, 84], [16, 76], [99, 66]]) : tamTitulo(n, s.title, [[30, 60], [99, 54]], 620);
      const acc = legivel(p.bg, p.accent, p.ink);
      const bt = botao(p, p.escuro ? 'accent' : 'accent2');
      const R = 348;
      const titulo = arco
        ? `<svg width="1080" height="1080" style="position:absolute;left:0;top:0;overflow:visible"><defs><path id="fcArco" d="M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}"/></defs>
            <text style="font-family:PF,serif;font-weight:700;font-size:${ts}px;letter-spacing:.01em" fill="${p.ink}"><textPath href="#fcArco" startOffset="50%" text-anchor="middle">${n.esc(s.title)}</textPath></text></svg>`
        : `<div style="position:absolute;left:230px;right:230px;top:52px;height:186px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
            ${s.eyebrow ? `<p class="fts-eb" style="color:${acc};margin-bottom:14px">${n.esc(s.eyebrow)}</p>` : ''}<h1 class="fts-tt" style="font-size:${ts}px">${n.esc(s.title)}</h1></div>`;
      const aneis = [392, 452, 512, 572].map((r, i) => `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity="${(0.24 - i * 0.05).toFixed(2)}"/>`).join('');
      return `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;background:radial-gradient(circle at ${CX}px ${CY}px,var(--bg2) 0,var(--bg) 62%);color:var(--ink);${n.varsCss(p)}">
  <style>${await cssBase(n)}</style>
  <svg width="1080" height="1080" style="position:absolute;left:0;top:0">
    <defs><pattern id="fciPt" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="2" fill="${p.ink}" opacity=".18"/></pattern>
      <radialGradient id="fciGr" cx="${CX}" cy="${CY}" r="640" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></radialGradient>
      <mask id="fciMk"><rect width="1080" height="1080" fill="url(#fciGr)"/></mask></defs>
    <rect width="1080" height="1080" fill="url(#fciPt)" mask="url(#fciMk)"/>
    ${aneis}
  </svg>
  <div class="fts-grao" style="opacity:.07;mix-blend-mode:overlay"></div>
  <svg width="1080" height="1080" style="position:absolute;left:0;top:0">
    <circle cx="${CX}" cy="${CY}" r="${D / 2 + 36}" fill="none" stroke="${p.accent}" stroke-width="3" stroke-dasharray="1 13" stroke-linecap="round" opacity=".9"/>
    <circle cx="${CX}" cy="${CY}" r="${D / 2 + 54}" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity=".35"/>
  </svg>
  <div style="position:absolute;left:${CX - D / 2}px;top:${CY - D / 2}px;width:${D}px;height:${D}px;border-radius:50%;background:url('${foto}') center/cover;
    box-shadow:0 0 0 12px var(--bg),0 0 0 15px var(--accent),0 34px 70px rgba(0,0,0,.45)"></div>
  ${titulo}
  <div style="position:absolute;left:56px;top:48px">${n.logo({ altura: 92, placa: p.placaLogo })}</div>
  ${s.idx ? `<span class="fts-idx" style="position:absolute;right:60px;top:66px;color:var(--muted)">${idxTxt(s, n)}</span>` : ''}
  ${n.seloIlustrativa({ estilo: `left:${CX + 150}px;top:${CY + 236}px;transform:rotate(-8deg)` })}
  ${s.eyebrow && arco ? `<p class="fts-eb" style="position:absolute;left:0;right:0;top:${CY - R - ts - 56}px;text-align:center;color:${acc}">${n.esc(s.eyebrow)}</p>` : ''}
  <div style="position:absolute;left:90px;right:90px;bottom:52px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center">
    ${s.sub ? `<p class="fts-sub" style="color:var(--muted)">${n.esc(s.sub)}</p>` : ''}
    ${cta(s, n, { bt, ink: p.ink, muted: p.muted, accent: acc, alinhar: 'center' })}
    ${deslize(s, 'var(--muted)')}
  </div>
</div>`;
    },
  },

  // 4) FOTO POLAROID ------------------------------------------------------
  {
    id: 'foto-polaroid',
    formato: 'feed',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['creme', 'manjericao', 'chocolate'],
    descricao: 'Fundo de papel na cor da paleta; foto em polaroid inclinada com fitas adesivas e legenda manuscrita; título em Playfair abaixo.',
    async render(s, { n, p }) {
      const PH = 500, PX = 282;
      const foto = await n.foto(s.photo, PH, PH);
      const ts = tamTitulo(n, s.title, [[12, 86], [20, 72], [30, 62], [99, 56]], 640);
      const legenda = s.sub || 'Disk Pizza · Curitiba';
      const ls = n.tamanho(legenda, [[24, 32], [40, 27], [99, 24]]);
      const acc = legivel(p.bg, p.accent, p.ink);
      const bt = botao(p, 'accent2');
      const fita = (estilo) => `<div style="position:absolute;${estilo};width:170px;height:46px;background:linear-gradient(180deg,rgba(255,248,226,.62),rgba(240,228,196,.55));
        box-shadow:0 2px 6px rgba(0,0,0,.12);clip-path:polygon(0 8%,4% 0,8% 10%,12% 0,100% 0,96% 12%,100% 24%,96% 38%,100% 52%,96% 66%,100% 80%,96% 92%,100% 100%,0 100%,4% 88%,0 74%,4% 60%,0 46%,4% 32%,0 20%)"></div>`;
      const W = PH + 52, H = PH + 26 + 138;
      return `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;background:radial-gradient(ellipse 80% 70% at 50% 35%,var(--bg) 40%,var(--bg2));color:var(--ink);${n.varsCss(p)}">
  <style>${await cssBase(n)}</style>
  <div class="fts-grao" style="opacity:.12;mix-blend-mode:soft-light"></div>
  <p style="position:absolute;left:48px;top:150px;font-family:'Segoe Script',Gabriola,cursive;font-size:34px;color:${acc};transform:rotate(-9deg)">Curitiba</p>
  <svg width="120" height="70" viewBox="0 0 120 70" style="position:absolute;left:118px;top:206px;color:${acc}"><path d="M6 10 C 40 60, 80 62, 108 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M96 32 L109 39 L99 51" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <div style="position:absolute;left:${PX + 30}px;top:62px;width:${W}px;height:${H}px;background:${p.escuro ? 'rgba(0,0,0,.22)' : 'var(--bg2)'};box-shadow:0 8px 24px rgba(0,0,0,.14);transform:rotate(4.5deg);border-radius:4px"></div>
  <div style="position:absolute;left:${PX}px;top:52px;width:${W}px;height:${H}px;transform:rotate(-3deg);background:linear-gradient(170deg,#fffdf8,#f4efe4);border-radius:3px;
    box-shadow:0 2px 3px rgba(0,0,0,.18),0 26px 50px rgba(0,0,0,.32)">
    <div style="position:absolute;left:26px;top:26px;width:${PH}px;height:${PH}px;background:url('${foto}') center/cover;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)">
      ${n.seloIlustrativa({ estilo: 'right:14px;bottom:14px' })}
    </div>
    <div style="position:absolute;left:30px;right:30px;top:${PH + 26}px;bottom:8px;display:flex;align-items:center;justify-content:center;text-align:center">
      <p style="font-family:'Segoe Script',Gabriola,cursive;font-size:${ls}px;line-height:1.35;color:#2b241c;text-wrap:balance">${n.esc(legenda)}</p>
    </div>
    ${fita('left:-46px;top:6px;transform:rotate(-38deg)')}
    ${fita('right:-46px;top:6px;transform:rotate(38deg)')}
  </div>
  <div style="position:absolute;right:60px;bottom:58px">${n.logo({ altura: 112, placa: p.placaLogo })}</div>
  ${s.idx ? `<span class="fts-idx" style="position:absolute;right:62px;top:70px;color:var(--muted)">${idxTxt(s, n)}</span>` : ''}
  <div style="position:absolute;left:84px;right:330px;bottom:${s.cta ? 58 : 70}px;display:flex;flex-direction:column;align-items:flex-start">
    ${s.eyebrow ? `<p class="fts-eb" style="color:${acc};margin-bottom:16px">${n.esc(s.eyebrow)}</p>` : ''}
    <h1 class="fts-tt" style="font-size:${ts}px">${n.esc(s.title)}</h1>
    ${s.cta ? `<div style="margin-top:26px">${cta(s, n, { bt, ink: p.ink, muted: p.muted, accent: acc, gap: 22 })}</div>` : ''}
    ${s.deslize ? `<div style="margin-top:18px">${deslize(s, 'var(--muted)')}</div>` : ''}
  </div>
</div>`;
    },
  },

  // 5) FOTO REVISTA -------------------------------------------------------
  {
    id: 'foto-revista',
    formato: 'feed',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['carvao', 'tomate', 'ouro'],
    descricao: 'Capa de revista: foto cheia, masthead DISK PIZZA no topo, chamadas de capa à esquerda e selo estourado de CTA.',
    async render(s, { n, p, post }) {
      const t = tonsFoto(p);
      const foto = await n.foto(s.photo, 1080, 1080);
      const ts = tamTitulo(n, s.title, [[10, 92], [16, 80], [26, 66], [99, 58]], 460, 0.58);
      const acc = legivel(t.veu, t.accent, t.ink);
      const bt = botao(t, 'accent');
      const d = post && post.date ? new Date(post.date + 'T12:00:00') : null;
      const edicao = d && !isNaN(d) ? `${MESES[d.getMonth()]} ${d.getFullYear()}` : 'Curitiba';
      const estrela = Array.from({ length: 28 }, (_, i) => { const a = (Math.PI * i) / 14, r = i % 2 ? 44 : 50; return `${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`; }).join(',');
      const selo = s.cta
        ? `<div style="position:absolute;right:46px;bottom:52px;width:262px;height:262px;transform:rotate(-9deg);filter:drop-shadow(0 12px 22px rgba(0,0,0,.4))">
            <div style="position:absolute;inset:0;background:${bt.bg};clip-path:polygon(${estrela})"></div>
            <div style="position:absolute;inset:34px;border-radius:50%;border:2px dashed ${rgba(bt.fg === '#ffffff' ? '#ffffff' : bt.fg, 0.45)};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:${bt.fg};padding:0 14px">
              ${s.cta === 'forte'
    ? `<span style="font:800 27px/1.14 IN,sans-serif;white-space:nowrap">${n.CTA_FORTE.replace(' pelo ', '<br>pelo ')}</span><span class="fts-bio" style="margin-top:12px;font-size:22px;letter-spacing:.12em">link na bio</span>`
    : `<span style="font:italic 700 27px/1.15 PF,serif">${n.CTA_SUAVE}</span>`}
            </div></div>`
        : '';
      return `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;background:${t.veu};color:${t.ink};${n.varsCss(p)}">
  <style>${await cssBase(n)}</style>
  <div style="position:absolute;inset:0;background:url('${foto}') center/cover"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,${rgba(t.veu, 0.92)} 0,${rgba(t.veu, 0.7)} 20%,${rgba(t.veu, 0)} 34%)"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,${rgba(t.veu, 0.95)} 0,${rgba(t.veu, 0.88)} 34%,${rgba(t.veu, 0.6)} 46%,${rgba(t.veu, 0)} 62%)"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(0deg,${rgba(t.veu, 0.85)} 0,${rgba(t.veu, 0)} 28%)"></div>
  <div class="fts-grao" style="opacity:.08;mix-blend-mode:overlay"></div>
  <div style="position:absolute;left:52px;right:52px;top:40px">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${rgba(t.ink, 0.6)};padding-bottom:12px">
      <span class="fts-eb" style="color:${t.ink};font-size:22px;letter-spacing:.3em">Curitiba · desde 2015</span>
      <span class="fts-eb" style="color:${t.ink};font-size:22px;letter-spacing:.3em">${n.esc(edicao)}</span>
    </div>
    <div style="font-family:PF,serif;font-weight:900;font-size:168px;line-height:.98;letter-spacing:-.02em;text-align:center;color:${t.ink};margin-top:8px;white-space:nowrap;text-shadow:0 6px 30px rgba(0,0,0,.25)">DISK <span style="font-style:italic;color:${acc}">PIZZA</span></div>
    <div style="height:2px;background:${rgba(t.ink, 0.6)};margin-top:8px"></div>
  </div>
  ${n.seloIlustrativa({ estilo: 'right:52px;top:300px' })}
  ${n.indice(s.idx, { estilo: 'right:52px;top:354px' })}
  <div style="position:absolute;left:58px;width:460px;top:316px;bottom:220px;display:flex;flex-direction:column;justify-content:center;text-shadow:0 2px 16px rgba(0,0,0,.35)">
    ${s.eyebrow ? `<p class="fts-eb" style="color:${acc};margin-bottom:20px">${n.esc(s.eyebrow)}</p>` : `<span style="display:block;width:64px;height:6px;background:${t.accent};margin-bottom:26px"></span>`}
    <h1 class="fts-tt" style="font-size:${ts}px;font-style:italic;font-weight:800">${n.esc(s.title)}</h1>
    ${s.sub ? `<p class="fts-sub" style="color:${t.muted};margin-top:22px;padding-top:20px;border-top:1px solid ${rgba(t.ink, 0.45)};font-size:26px">${n.esc(s.sub)}</p>` : ''}
    ${s.deslize ? `<p style="margin-top:26px">${deslize(s, t.ink)}</p>` : ''}
  </div>
  <div style="position:absolute;left:52px;bottom:52px">${n.logo({ altura: 104, placa: true, cor: 'rgba(14,11,8,.55)' })}</div>
  ${selo}
</div>`;
    },
  },

  // 6) FOTO MOLDURA -------------------------------------------------------
  {
    id: 'foto-moldura',
    formato: 'feed',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['carvao', 'creme', 'manjericao'],
    descricao: 'Foto emoldurada com passe-partout na cor da paleta, filete dourado e placa de cardápio com o título na base.',
    async render(s, { n, p }) {
      const PW = 800, PH = 564, PX = 140, PY = 186;
      const foto = await n.foto(s.photo, PW, PH);
      const ts = tamTitulo(n, s.title, [[12, 70], [20, 60], [30, 52], [99, 46]], 650);
      const acc = legivel(p.bg2, p.accent, p.ink);
      const bt = botao(p, 'accent2');
      const canto = (estilo) => `<span style="position:absolute;${estilo};width:12px;height:12px;background:var(--accent);transform:rotate(45deg)"></span>`;
      const parafuso = (lado) => `<span style="position:absolute;${lado}:18px;top:50%;width:14px;height:14px;margin-top:-7px;border-radius:50%;background:radial-gradient(circle at 35% 35%,${rgba('#ffffff', 0.7)},var(--accent) 45%,${rgba('#000000', 0.5)})"></span>`;
      return `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;color:var(--ink);background:
    repeating-linear-gradient(0deg,${rgba(p.ink, 0.025)} 0 1px,transparent 1px 5px),repeating-linear-gradient(90deg,${rgba(p.ink, 0.02)} 0 1px,transparent 1px 6px),
    radial-gradient(ellipse 75% 70% at 50% 42%,var(--bg) 50%,var(--bg2));${n.varsCss(p)}">
  <style>${await cssBase(n)}</style>
  <div class="fts-grao" style="opacity:.1;mix-blend-mode:soft-light"></div>
  <div style="position:absolute;inset:26px;border:2px solid ${rgba(p.accent, 0.7)}"></div>
  <div style="position:absolute;inset:36px;border:1px solid ${rgba(p.accent, 0.4)}"></div>
  ${canto('left:20px;top:20px')}${canto('right:20px;top:20px')}${canto('left:20px;bottom:20px')}${canto('right:20px;bottom:20px')}
  <div style="position:absolute;left:0;right:0;top:46px;display:flex;justify-content:center">${n.logo({ altura: 94, placa: p.placaLogo })}</div>
  ${s.idx ? `<span class="fts-idx" style="position:absolute;right:70px;top:76px;color:var(--muted)">${idxTxt(s, n)}</span>` : ''}
  <div style="position:absolute;left:${PX - 16}px;top:${PY - 16}px;width:${PW + 32}px;height:${PH + 32}px;border:3px solid var(--accent);box-shadow:inset 0 0 0 1px ${rgba('#000000', 0.15)}"></div>
  <div style="position:absolute;left:${PX}px;top:${PY}px;width:${PW}px;height:${PH}px;background:url('${foto}') center/cover;
    box-shadow:inset 0 0 0 1px rgba(0,0,0,.25),inset 0 4px 14px rgba(0,0,0,.35),0 18px 40px rgba(0,0,0,.28)">${n.seloIlustrativa({ estilo: 'right:18px;top:18px' })}</div>
  <div style="position:absolute;left:150px;right:150px;top:${PY + PH - 34}px;padding:26px 64px 28px;text-align:center;border-radius:6px;
    background:linear-gradient(180deg,${rgba('#ffffff', 0.06)},${rgba('#000000', 0.08)}),var(--bg2);border:2px solid var(--accent);
    box-shadow:inset 0 0 0 6px var(--bg2),inset 0 0 0 7px ${rgba(p.accent, 0.55)},0 18px 36px rgba(0,0,0,.3)">
    ${parafuso('left')}${parafuso('right')}
    ${s.eyebrow ? `<p class="fts-eb" style="color:${acc};margin-bottom:12px">${n.esc(s.eyebrow)}</p>` : ''}
    <h1 class="fts-tt" style="font-size:${ts}px">${n.esc(s.title)}</h1>
    ${s.sub ? `<p style="font-family:PF,serif;font-style:italic;font-size:27px;line-height:1.3;color:var(--muted);margin-top:12px;text-wrap:balance">${n.esc(s.sub)}</p>` : ''}
  </div>
  <div style="position:absolute;left:80px;right:80px;bottom:58px;display:flex;flex-direction:column;align-items:center;gap:16px">
    ${cta(s, n, { bt, ink: p.ink, muted: p.muted, accent: legivel(p.bg, p.accent, p.ink), alinhar: 'center' })}
    ${deslize(s, 'var(--muted)')}
  </div>
</div>`;
    },
  },

  // 7) FOTO CARTÃO --------------------------------------------------------
  {
    id: 'foto-cartao',
    formato: 'feed',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['ouro', 'noite', 'tomate'],
    descricao: 'Foto de cantos arredondados flutuando sobre a paleta e cartão de texto sobreposto no canto inferior direito, com sombra suave. Bom para carrossel.',
    async render(s, { n, p }) {
      const FW = 940, FH = 700, FX = 70, FY = 64;
      const foto = await n.foto(s.photo, FW, FH);
      const c = tonsCartao(p);
      const ts = tamTitulo(n, s.title, [[10, 76], [18, 62], [28, 54], [99, 48]], 500);
      const acc = legivel(c.fundo, c.accent, c.ink);
      const bt = botao(c, 'accent2');
      return `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;background:radial-gradient(ellipse 70% 60% at 20% 90%,var(--bg2),var(--bg) 70%);color:var(--ink);${n.varsCss(p)}">
  <style>${await cssBase(n)}</style>
  <div style="position:absolute;inset:0;background:radial-gradient(${rgba(p.ink, 0.13)} 1.5px,transparent 2.2px) 0 0/26px 26px;-webkit-mask-image:linear-gradient(180deg,transparent 55%,#000 85%)"></div>
  <div class="fts-grao" style="opacity:.08;mix-blend-mode:overlay"></div>
  <div style="position:absolute;left:${FX}px;top:${FY}px;width:${FW}px;height:${FH}px;border-radius:38px;background:url('${foto}') center/cover;
    box-shadow:0 2px 4px rgba(0,0,0,.15),0 30px 60px rgba(0,0,0,.38)">
    ${n.seloIlustrativa({ estilo: 'left:26px;top:26px' })}
    ${n.indice(s.idx, { estilo: 'right:26px;top:26px' })}
  </div>
  <div style="position:absolute;left:${FX + 6}px;bottom:70px">${n.logo({ altura: 112, placa: p.placaLogo })}</div>
  <div style="position:absolute;right:56px;bottom:56px;width:600px;padding:42px 46px 44px 52px;border-radius:26px;background:${c.fundo};color:${c.ink};
    box-shadow:0 2px 6px rgba(0,0,0,.14),0 28px 60px rgba(0,0,0,.34);overflow:hidden">
    <span style="position:absolute;left:0;top:0;bottom:0;width:10px;background:${c.accent}"></span>
    ${s.eyebrow ? `<p class="fts-eb" style="color:${acc};margin-bottom:18px">${n.esc(s.eyebrow)}</p>` : ''}
    <h1 class="fts-tt" style="font-size:${ts}px">${n.esc(s.title)}</h1>
    ${s.sub ? `<p class="fts-sub" style="color:${c.muted};margin-top:16px;font-size:25px">${n.esc(s.sub)}</p>` : ''}
    ${s.cta === 'forte'
    ? `<div style="margin-top:26px;display:flex;flex-direction:column;align-items:flex-start;gap:14px"><span class="fts-pill" style="background:${bt.bg};color:${bt.fg};font-size:26px;padding:18px 30px;box-shadow:none">${n.CTA_FORTE}</span><span class="fts-bio" style="color:${c.muted};font-size:22px;padding-left:4px">link na bio ${SETA}</span></div>`
    : s.cta ? `<div style="margin-top:24px">${cta(s, n, { bt, ink: c.ink, muted: c.muted, accent: acc })}</div>` : ''}
    ${s.deslize ? `<div style="margin-top:20px">${deslize(s, c.muted)}</div>` : ''}
  </div>
</div>`;
    },
  },
];
