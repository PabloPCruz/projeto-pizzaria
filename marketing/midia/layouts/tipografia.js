// Família tipográfica (feed 1080x1080, sem foto). Ver CATALOGO.md.
// Todos aceitam os tipos text, size, step e list (s.tipo; aceita também s.layout dos SLIDES de conteudo.js).
// Helpers locais: contraste WCAG, cores derivadas da paleta, grão, quebra de título e ajuste de texto ao espaço.

// ---------------------------------------------------------------- helpers
const COND = "font-family:Bahnschrift,'Arial Narrow',sans-serif;font-stretch:75%";
const tipoDe = (s) => s.tipo || s.layout || 'text';

function lum(hex) {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contraste(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** Primeira cor da lista com contraste >= min sobre `fundo` (ou a de maior contraste). */
function legivel(fundo, lista, min = 4.5) {
  const ok = lista.find((c) => contraste(c, fundo) >= min);
  return ok || lista.slice().sort((a, b) => contraste(b, fundo) - contraste(a, fundo))[0];
}
/** Cores derivadas: hi = destaque legível sobre o fundo; btn/btnInk = botão com contraste garantido. */
function cores(p) {
  const hi = [p.accent, p.accent2, p.ink].find((c) => contraste(c, p.bg) >= 4.5 && contraste(c, p.bg2) >= 4.5) || p.ink;
  let btn = p.accent, btnInk = p.bg;
  if (contraste(p.accent, p.bg) < 4.5) [btn, btnInk] = contraste('#ffffff', p.accent2) >= 4.5 ? [p.accent2, '#ffffff'] : [p.ink, p.bg];
  return { hi, btn, btnInk };
}
const vars = (n, p, extra = {}) => {
  const c = cores(p);
  const all = { hi: c.hi, btn: c.btn, btnInk: c.btnInk, ...extra };
  return `${n.varsCss(p)};${Object.entries(all).map(([k, v]) => `--${k}:${v}`).join(';')}`;
};

/** Grão (ruído) em SVG embutido; use com mix-blend-mode:overlay. */
function grao(op = 0.55, freq = 0.8) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 ${op}'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/** Gerador pseudoaleatório determinístico (enfeites sempre iguais para o mesmo texto). */
function rnd(seed) {
  let a = 0;
  for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Quebra o título em até maxK linhas equilibradas, evitando terminar linha em palavra de ligação. */
const LIGACAO = new Set(['a', 'o', 'e', 'é', 'de', 'da', 'do', 'em', 'no', 'na', 'os', 'as', 'ou', 'um', 'que', 'com', 'sem', 'para', 'pelo', 'pela', 'seu', 'sua', 'nossa', 'nosso', 'qual', 'time']);
function quebrar(texto, maxK = 4, alvo = 9) {
  const w = String(texto || '').trim().split(/\s+/).filter(Boolean);
  if (w.length <= 1) return w;
  let best = null;
  const avalia = (l) => {
    let c = 0;
    l.forEach((x, i) => {
      c += (x.length - alvo) ** 2;
      const ult = x.split(' ').pop().toLowerCase();
      if (i < l.length - 1 && LIGACAO.has(ult)) c += 45;
    });
    if (!best || c < best.c) best = { c, l };
  };
  const rec = (i, k, acc) => {
    if (k === 1) return avalia([...acc, w.slice(i).join(' ')]);
    for (let j = i + 1; j <= w.length - (k - 1); j++) rec(j, k - 1, [...acc, w.slice(i, j).join(' ')]);
  };
  for (let k = 1; k <= Math.min(maxK, w.length); k++) rec(0, k, []);
  return best.l;
}

/**
 * Ajuste no navegador: [data-fit="largura"] recebe a fonte que faz a linha ocupar a largura (entre data-min e data-max);
 * [data-caixa] reduz proporcionalmente os [data-fit] internos até o primeiro filho caber na altura da caixa.
 */
const FIT_JS = `<script>(function(){
function fit(){
  document.querySelectorAll('[data-fit]').forEach(function(el){
    var alvo=+el.getAttribute('data-fit'),max=+(el.getAttribute('data-max')||600),min=+(el.getAttribute('data-min')||22);
    el.style.fontSize='100px';var w=el.offsetWidth||1;
    el.style.fontSize=Math.max(min,Math.min(max,100*alvo/w))+'px';
  });
  document.querySelectorAll('[data-caixa]').forEach(function(box){
    var inn=box.firstElementChild;if(!inn)return;var lim=box.clientHeight,i=0;
    while(inn.offsetHeight>lim+1&&i<30){
      var k=Math.max(.85,lim/inn.offsetHeight*.99);
      box.querySelectorAll('[data-fit]').forEach(function(el){el.style.fontSize=Math.max(+(el.getAttribute('data-min')||22),parseFloat(el.style.fontSize)*k)+'px'});
      i++;
    }
  });
}
fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
})();</script>`;

/**
 * Máscara de tinta de carimbo (PNG preto e branco gerado uma vez com ruído determinístico): use como mask-image
 * (mask-mode luminance) para falhas de tinta. Mais leve que filtro SVG, que às vezes deixa blocos sem pintar no Chrome headless.
 */
let _mancha = null;
function mancha(n) {
  if (!_mancha) {
    _mancha = (async () => {
      const r = rnd('carimbo');
      const ruido = (w) => {
        const b = Buffer.alloc(w * w);
        for (let i = 0; i < b.length; i++) b[i] = Math.max(0, Math.min(255, Math.round(128 + ((r() + r() + r() + r()) - 2) * 110)));
        return n.sharp(b, { raw: { width: w, height: w, channels: 1 } }).png().toBuffer();
      };
      const fino = await n.sharp(await ruido(400)).blur(1.2).png().toBuffer();
      const grosso = await n.sharp(await n.sharp(await ruido(100)).blur(1).png().toBuffer()).resize(400, 400, { kernel: 'cubic' }).png().toBuffer();
      const lim = async (buf, k) => { const st = (await n.sharp(buf).stats()).channels[0]; return n.sharp(buf).threshold(Math.round(st.mean - k * st.stdev)).png().toBuffer(); };
      const out = await n.sharp(await lim(fino, 1.9)).composite([{ input: await lim(grosso, 1.8), blend: 'multiply' }]).greyscale().png({ palette: true, colours: 2 }).toBuffer();
      return `url("data:image/png;base64,${out.toString('base64')}")`;
    })();
  }
  return _mancha;
}
const maskTinta = (u, tam = 400) => `-webkit-mask-image:${u};mask-image:${u};-webkit-mask-size:${tam}px;mask-size:${tam}px;mask-mode:luminance`;

const ESTRELA = (t, cor, estilo = '') => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" style="${estilo}"><path d="M12 0C12.8 7.2 16.8 11.2 24 12C16.8 12.8 12.8 16.8 12 24C11.2 16.8 7.2 12.8 0 12C7.2 11.2 11.2 7.2 12 0Z" fill="${cor}"/></svg>`;
const SETA = (t, cor) => `<svg width="${t}" height="${Math.round(t * 0.5)}" viewBox="0 0 40 20" style="display:inline-block;vertical-align:middle"><path d="M0 10H36M28 2L37 10L28 18" fill="none" stroke="${cor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---------------------------------------------------------------- 1. poster-tipografico
const posterTipografico = {
  id: 'poster-tipografico',
  formato: 'feed',
  usa: 'texto',
  tipos: ['text', 'size', 'step', 'list'],
  paletas: ['creme', 'carvao', 'tomate'],
  descricao: 'Pôster editorial: título empilhado em linhas justificadas alternando Bahnschrift condensada em caixa alta e Playfair itálico, fios duplos e ornamento.',
  async render(s, { n, p }) {
    const t = tipoDe(s);
    const forte = s.cta === 'forte';
    const linhas = [];
    if (t === 'size') {
      linhas.push({ html: n.esc(s.title), st: 'A', max: 330 });
      linhas.push({ html: `<span style="color:var(--hi)">${n.esc(s.big)}</span><span class="pt-B" style="font-size:.42em;margin-left:.12em">${n.esc(s.bigLabel)}</span>`, st: 'A', max: 400 });
    } else if (t === 'step') {
      linhas.push({ html: `nº ${n.esc(s.n)}`, st: 'B', max: 190 });
      quebrar(s.title, 2, 8).forEach((l) => linhas.push({ html: n.esc(l), st: 'A', max: 300 }));
    } else {
      let ls = quebrar(s.title, t === 'list' ? 3 : 4, 9);
      if (ls.length === 1 && /\s/.test(ls[0].trim())) ls = quebrar(s.title, 2, 2); // pôster pede ao menos 2 linhas
      ls.forEach((l, i) => linhas.push({ html: n.esc(l), st: i % 2 ? 'B' : 'A', max: i % 2 ? 210 : 360 }));
    }
    const W = 936;
    const titulo = linhas.map((l) => `<span class="pt-ln pt-${l.st}" data-fit="${W}" data-max="${l.max}" data-min="40">${l.html}</span>`).join('');
    const corpo = t === 'list'
      ? `<ol class="pt-list" style="--fl:${Math.max(0, ...(s.lines || []).map((l) => l.length)) > 28 ? 33 : 38}px">${(s.lines || []).map((l, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b><span>${n.esc(l)}</span></li>`).join('')}</ol>`
      : (s.lines || []).map((l, i) => `<p class="pt-p${i === 0 ? ' pt-p1' : ''}">${n.esc(l)}</p>`).join('');
    const suave = s.cta === 'suave' ? `<p class="pt-suave">${n.CTA_SUAVE} ${SETA(44, 'currentColor')}</p>` : '';
    return `<div class="pt" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.pt .pt-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.32}
.pt .pt-wrap{position:absolute;inset:0;padding:58px 72px ${forte ? 168 : 60}px;display:flex;flex-direction:column}
.pt .pt-hd{display:flex;justify-content:space-between;align-items:baseline;${COND};font-weight:600;font-size:28px;letter-spacing:.3em;text-transform:uppercase}
.pt .pt-hd .e{color:var(--hi)}
.pt .pt-hd .i{color:var(--muted);letter-spacing:.12em}
.pt .pt-rule{margin-top:18px;height:10px;border-top:5px solid var(--ink);border-bottom:1.5px solid var(--ink)}
.pt .pt-tt{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:26px 0 22px}
.pt .pt-ln{display:block;width:max-content;white-space:nowrap}
.pt .pt-A{${COND};font-weight:700;text-transform:uppercase;line-height:.86;letter-spacing:-.01em;padding:.12em 0 .02em}
.pt .pt-B{font-family:PF,serif;font-style:italic;font-weight:500;line-height:1.02;color:var(--hi);padding:0 .1em .1em 0;text-transform:none;letter-spacing:0}
.pt .pt-orn{display:flex;align-items:center;gap:18px;margin-bottom:26px}
.pt .pt-orn i{flex:1;height:1.5px;background:var(--ink);opacity:.7}
.pt .pt-orn .d{font:600 30px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:12px}
.pt .pt-ft{display:flex;align-items:flex-end;gap:40px}
.pt .pt-txt{flex:1;min-width:0}
.pt .pt-p{font:400 31px/1.38 IN,sans-serif;color:var(--muted);margin-top:6px;text-wrap:balance}
.pt .pt-p1{font:600 34px/1.3 IN,sans-serif;color:var(--ink)}
.pt .pt-list{list-style:none}
.pt .pt-list li{display:flex;gap:18px;align-items:baseline;padding:15px 0;border-top:1.5px solid color-mix(in srgb,var(--ink) 35%,transparent);font:600 var(--fl)/1.2 IN,sans-serif}
.pt .pt-list b{flex:none;width:52px;${COND};font-weight:700;color:var(--hi);font-size:34px;letter-spacing:.05em}
.pt .pt-suave{margin-top:18px;font:italic 500 36px/1.2 PF,serif;color:var(--hi);display:flex;align-items:center;gap:14px}
.pt .pt-cta{position:absolute;left:0;right:0;bottom:0;height:128px;background:var(--btn);color:var(--btnInk);display:flex;align-items:center;justify-content:space-between;padding:0 72px}
.pt .pt-cta b{${COND};font-weight:700;font-size:54px;text-transform:uppercase;letter-spacing:.02em}
.pt .pt-cta span{font:600 28px IN,sans-serif;display:flex;align-items:center;gap:14px}
</style>
<div class="pt-grao"></div>
<div class="pt-wrap">
  <div class="pt-hd"><span class="e">${n.esc(s.eyebrow || 'Disk Pizza')}</span><span class="i">${s.idx ? n.esc(s.idx) : 'Curitiba'}</span></div>
  <div class="pt-rule"></div>
  <div class="pt-tt" data-caixa><div>${titulo}</div></div>
  <div class="pt-orn"><i></i>${s.deslize ? `<span class="d">deslize ${SETA(46, 'currentColor')}</span>` : ESTRELA(30, 'var(--hi)')}<i></i></div>
  <div class="pt-ft"><div class="pt-txt">${corpo}${suave}</div>${n.logo({ altura: 132, placa: p.placaLogo })}</div>
</div>
${forte ? `<div class="pt-cta"><b>${n.CTA_FORTE}</b><span>link na bio ${SETA(46, 'currentColor')}</span></div>` : ''}
${FIT_JS}
</div>`;
  },
};

// ---------------------------------------------------------------- 2. quadro-cardapio
// Se título + itens (+ CTA suave) não cabem entre o logo e a etiqueta do CTA, reduz as fontes aos poucos (mín. 26 px)
// até caber: evita que a etiqueta do CTA cubra o último item ou que o CTA suave saia do quadro.
const QC_FIT = `<script>(function(){
function alt(b){var k=b.children,t=1e9,z=0;for(var j=0;j<k.length;j++){var r=k[j].getBoundingClientRect(),cs=getComputedStyle(k[j]);if(!r.height)continue;t=Math.min(t,r.top-parseFloat(cs.marginTop));z=Math.max(z,r.bottom+parseFloat(cs.marginBottom))}return z-t}
function fit(){var b=document.querySelector('.qc .qc-in');if(!b)return;var cs=getComputedStyle(b),av=b.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
var els=b.querySelectorAll('.qc-h,.qc-row,.qc-p,.qc-big,.qc-lab,.qc-eb,.qc-suave'),i=0;
while(alt(b)>av&&i<40){els.forEach(function(e){var f=parseFloat(getComputedStyle(e).fontSize);e.style.fontSize=Math.max(26,f*.96)+'px'});i++}}
fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
})();</script>`;
const quadroCardapio = {
  id: 'quadro-cardapio',
  formato: 'feed',
  usa: 'texto',
  tipos: ['text', 'size', 'step', 'list'],
  paletas: ['manjericao', 'carvao', 'creme'],
  descricao: 'Quadro de giz emoldurado: título manuscrito, itens com pontilhado, rabiscos de giz; etiqueta de papel para o CTA.',
  async render(s, { n, p }) {
    const t = tipoDe(s);
    const quadro = ['manjericao', 'noite'].includes(p.nome) ? p.bg2 : '#1f2523';
    const moldura = p.escuro ? 'color-mix(in srgb,#8a5a32 60%,var(--bg2))' : 'var(--bg2)';
    const maxItem = Math.max(0, ...(s.lines || []).map((l) => l.length));
    const fItem = maxItem <= 20 ? 54 : maxItem <= 28 ? 46 : 40;
    const giz = '#f3efe6';
    const giz2 = legivel(quadro, ['#cdcabf', '#e2dfd6']);
    const gizHi = legivel(quadro, [p.accent, '#f2d675']);
    const ts = n.tamanho(s.title, [[10, 132], [16, 116], [24, 104], [34, 86], [99, 74]]);
    const rows = (arr) => arr.map((l) => `<div class="qc-row"><span>${n.esc(l)}</span><i></i>${ESTRELA(26, gizHi)}</div>`).join('');
    let miolo = '';
    if (t === 'list') miolo = `<div class="qc-rows">${rows(s.lines || [])}</div>`;
    else if (t === 'size') {
      miolo = `<div class="qc-size"><span class="qc-big">${n.esc(s.big)}</span><span class="qc-lab">${n.esc(s.bigLabel)}</span></div><div class="qc-rows">${rows(s.lines || [])}</div>`;
    } else if (t === 'step') {
      miolo = (s.lines || []).map((l) => `<p class="qc-p">${n.esc(l)}</p>`).join('');
    } else {
      miolo = (s.lines || []).map((l, i) => `<p class="qc-p${i ? '' : ' qc-p1'}">${n.esc(l)}</p>`).join('');
    }
    const passo = t === 'step'
      ? `<div class="qc-step"><svg viewBox="0 0 200 170" width="200" height="170"><path d="M100 12C150 8 190 40 188 86C186 132 146 162 98 160C48 158 10 128 12 82C14 40 52 14 112 16" fill="none" stroke="${gizHi}" stroke-width="5" stroke-linecap="round"/></svg><span>${n.esc(s.n)}</span></div>`
      : '';
    const cta = s.cta === 'forte'
      ? `<div class="qc-tag"><b>${n.CTA_FORTE}</b><span>link na bio</span></div>`
      : s.cta === 'suave' ? `<p class="qc-suave">${n.CTA_SUAVE} ${SETA(44, gizHi)}</p>` : '';
    const rab = (x, y, r, sc = 1, op = 0.55) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${sc})" opacity="${op}" fill="none" stroke="${giz}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M0 0L60 -8L34 70Z"/><path d="M4 5C20 2 40 -1 56 -4"/><circle cx="26" cy="14" r="5"/><circle cx="38" cy="34" r="4"/><circle cx="24" cy="38" r="3"/></g>`;
    return `<div class="qc" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:${giz};${vars(n, p)}">
<style>
.qc .qc-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.35}
.qc .qc-mold{position:absolute;inset:34px;border-radius:26px;background:linear-gradient(135deg,color-mix(in srgb,${moldura} 80%,#000),${moldura} 40%,color-mix(in srgb,${moldura} 70%,#000));box-shadow:0 18px 40px rgba(0,0,0,.35),inset 0 0 0 2px color-mix(in srgb,var(--accent) 55%,transparent)}
.qc .qc-board{position:absolute;inset:58px;border-radius:12px;background:radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.07),transparent 55%),radial-gradient(ellipse at 75% 80%,rgba(255,255,255,.05),transparent 50%),${quadro};box-shadow:inset 0 0 60px rgba(0,0,0,.55);overflow:hidden}
.qc .qc-board:before{content:"";position:absolute;inset:0;background-image:${grao(0.9, 0.65)};mix-blend-mode:screen;opacity:.12}
.qc .qc-in{position:absolute;inset:0;padding:${s.cta === 'forte' ? '200px 70px 196px' : '200px 70px 80px'};display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:safe center}
.qc .chalk{filter:url(#qc-giz)}
.qc .qc-eb{display:flex;align-items:center;gap:20px;${COND};font-weight:600;font-size:34px;letter-spacing:.32em;text-transform:uppercase;color:${giz2};margin-bottom:10px}
.qc .qc-eb svg{flex:none}
.qc .qc-h{font-family:'Segoe Script',cursive;font-weight:700;font-size:${ts}px;line-height:1.24;color:${giz};text-wrap:balance;max-width:860px}
.qc .qc-und{margin:2px auto 22px}
.qc .qc-rows{width:800px;margin-top:6px}
.qc .qc-row{display:flex;align-items:center;gap:16px;padding:.26em 0;${COND};font-weight:600;font-size:${fItem}px;text-transform:uppercase;letter-spacing:.04em;text-align:left}
.qc .qc-row span{max-width:700px;line-height:1.08}
.qc .qc-row i{flex:1;min-width:30px;border-bottom:5px dotted color-mix(in srgb,${giz} 55%,transparent);transform:translateY(6px)}
.qc .qc-p{font:400 38px/1.4 IN,sans-serif;color:${giz2};max-width:800px;margin-top:10px;text-wrap:balance}
.qc .qc-p1{font:600 44px/1.3 IN,sans-serif;color:${giz}}
.qc .qc-size{display:flex;align-items:baseline;gap:18px;margin:-6px 0 4px}
.qc .qc-big{${COND};font-weight:700;font-size:230px;line-height:.9;color:${gizHi}}
.qc .qc-lab{font-family:'Segoe Script',cursive;font-size:58px;color:${giz}}
.qc .qc-step{position:relative;width:200px;height:170px;margin-bottom:6px}
.qc .qc-step span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;${COND};font-weight:700;font-size:120px;color:${gizHi};padding-top:6px}
.qc .qc-suave{margin-top:30px;font:600 36px IN,sans-serif;color:${gizHi};display:flex;align-items:center;gap:14px}
.qc .qc-tag{position:absolute;left:50%;bottom:92px;transform:translateX(-50%) rotate(-2deg);background:var(--btn);color:var(--btnInk);padding:20px 46px 18px;border-radius:6px;box-shadow:0 10px 24px rgba(0,0,0,.4);text-align:center;white-space:nowrap}
.qc .qc-tag:before{content:"";position:absolute;left:50%;top:-14px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,transparent 55%),#9aa0a6;box-shadow:0 3px 6px rgba(0,0,0,.4)}
.qc .qc-tag b{display:block;${COND};font-weight:700;font-size:46px;text-transform:uppercase;letter-spacing:.03em}
.qc .qc-tag span{font:600 26px IN,sans-serif}
.qc .qc-logo{position:absolute;left:50%;top:40px;transform:translateX(-50%)}
.qc .qc-idx{position:absolute;left:44px;top:84px;${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:${giz2}}
.qc .qc-desl{position:absolute;right:96px;bottom:84px;font:400 34px 'Segoe Script',cursive;color:${gizHi};display:flex;align-items:center;gap:12px}
</style>
<svg width="0" height="0" style="position:absolute"><filter id="qc-giz"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="2.6"/></filter></svg>
<div class="qc-grao"></div>
<div class="qc-mold"></div>
<div class="qc-board">
  <svg width="964" height="964" viewBox="0 0 964 964" style="position:absolute;inset:0">${rab(26, 890, -18, 0.8, 0.3)}${rab(884, 46, 24, 0.7, 0.28)}
    <g fill="none" stroke="${giz}" stroke-width="3" stroke-linecap="round" opacity=".28"><path d="M40 60C120 40 200 48 250 40"/><path d="M720 920C800 908 880 916 930 900"/></g>
  </svg>
  <div class="qc-logo">${n.logo({ altura: 118 })}</div>
  ${s.idx ? `<span class="qc-idx">${n.esc(s.idx)}</span>` : ''}
  <div class="qc-in chalk">
    ${passo}
    ${s.eyebrow ? `<div class="qc-eb"><svg width="70" height="16" viewBox="0 0 70 16"><path d="M2 8C14 2 24 14 36 8S58 2 68 8" fill="none" stroke="${gizHi}" stroke-width="3.5" stroke-linecap="round"/></svg>${n.esc(s.eyebrow)}<svg width="70" height="16" viewBox="0 0 70 16"><path d="M2 8C14 2 24 14 36 8S58 2 68 8" fill="none" stroke="${gizHi}" stroke-width="3.5" stroke-linecap="round"/></svg></div>` : ''}
    <h1 class="qc-h">${n.esc(s.title)}</h1>
    <svg class="qc-und" width="360" height="22" viewBox="0 0 360 22"><path d="M6 14C90 4 200 6 354 10M40 18C140 12 240 14 320 16" fill="none" stroke="${gizHi}" stroke-width="4" stroke-linecap="round"/></svg>
    ${miolo}
    ${cta.startsWith('<p') ? cta : ''}
  </div>
  ${s.deslize ? `<span class="qc-desl chalk">deslize ${SETA(50, gizHi)}</span>` : ''}
</div>
${cta.startsWith('<div') ? cta : ''}
${QC_FIT}
</div>`;
  },
};

// ---------------------------------------------------------------- 3. numero-gigante
const numeroGigante = {
  id: 'numero-gigante',
  formato: 'feed',
  usa: 'texto',
  tipos: ['size', 'step', 'text'],
  paletas: ['ouro', 'noite', 'tomate'],
  descricao: 'Número enorme em Bahnschrift condensada sangrando para fora do quadro, com painel de texto assimétrico. Em text, usa o número inicial do título ou uma inicial vazada.',
  async render(s, { n, p }) {
    const t = tipoDe(s);
    let num = '', titulo = s.title || '', vazado = false;
    if (t === 'size') num = String(s.big);
    else if (t === 'step') num = String(s.n).padStart(2, '0');
    else {
      const m = /^(\d+)\s+(.+)$/.exec(titulo.trim());
      if (m) { num = m[1]; titulo = m[2]; } else { num = titulo.trim().charAt(0).toUpperCase(); vazado = true; }
    }
    const W = vazado ? 520 : num.length <= 1 ? 420 : num.length === 2 ? 640 : 860;
    const ts = n.tamanho(titulo, [[10, 100], [18, 84], [28, 68], [99, 60]]);
    const corpo = (s.lines || []).map((l, i) => `<p class="ng-p${i ? '' : ' ng-p1'}">${n.esc(l)}</p>`).join('');
    const cta = s.cta === 'forte'
      ? `<div class="ng-cta"><b>${n.CTA_FORTE}</b><span>link na bio ${SETA(40, 'currentColor')}</span></div>`
      : s.cta === 'suave' ? `<p class="ng-suave">${n.CTA_SUAVE} ${SETA(40, 'currentColor')}</p>` : '';
    const direita = corpo || cta || s.deslize;
    // muito texto à direita + CTA forte: a área de baixo cresce e o número diminui
    const sobe = s.cta === 'forte' && (s.lines || []).join(' ').length > 40 ? 70 : 0;
    return `<div class="ng" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.ng .ng-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.3}
.ng .ng-fios{position:absolute;inset:0;background:linear-gradient(90deg,transparent 0 56px,color-mix(in srgb,var(--ink) 12%,transparent) 56px 57.5px,transparent 57.5px) 0 0/100% 100% no-repeat}
.ng .ng-top{position:absolute;left:${vazado ? 70 : 44}px;top:0;height:${(direita ? 640 : 690) - sobe}px;display:flex;align-items:flex-end}
.ng .ng-nw{display:flex;align-items:flex-end}
.ng .ng-num{display:block;width:max-content;white-space:nowrap;${COND};font-weight:700;line-height:.74;letter-spacing:-.03em;color:var(--accent);margin-bottom:-.02em}
.ng .ng-cap{font-family:PF,serif;font-style:italic;font-weight:800;font-stretch:normal;line-height:.8;letter-spacing:0;padding-right:.08em}
.ng .ng-lab{font-family:'Segoe Script',cursive;font-size:84px;line-height:1;color:var(--ink);transform:rotate(-8deg);transform-origin:left bottom;margin:0 0 6px -10px;white-space:nowrap}
.ng .ng-base{position:absolute;left:56px;right:56px;top:${(direita ? 672 : 722) - sobe}px;height:3px;background:var(--ink)}
.ng .ng-base:after{content:"";position:absolute;left:0;top:-5px;width:150px;height:13px;background:var(--accent2)}
.ng .ng-bt{position:absolute;left:56px;right:56px;top:${(direita ? 712 : 762) - sobe}px;bottom:52px;display:flex;gap:44px}
.ng .ng-l{flex:${direita ? '0 0 480px' : '1'};display:flex;flex-direction:column}
.ng .ng-r{flex:1;min-width:0;border-left:1.5px solid color-mix(in srgb,var(--ink) 30%,transparent);padding-left:40px;display:flex;flex-direction:column}
.ng .ng-eb{${COND};font-weight:600;font-size:28px;letter-spacing:.3em;text-transform:uppercase;color:var(--hi);margin-bottom:12px}
.ng .ng-h{font-family:PF,serif;font-weight:800;font-size:${ts}px;line-height:1.02;text-wrap:balance}
.ng .ng-p{font:400 30px/1.38 IN,sans-serif;color:var(--muted);margin-top:8px;text-wrap:pretty}
.ng .ng-p1{margin-top:0;font-weight:600;color:var(--ink);font-size:33px}
.ng .ng-cta{margin-top:auto;background:var(--btn);color:var(--btnInk);padding:16px 24px;border-radius:12px}
.ng .ng-cta b{display:block;${COND};font-weight:700;font-size:38px;line-height:1.05;text-transform:uppercase;letter-spacing:.02em}
.ng .ng-cta span{font:600 25px IN,sans-serif;display:flex;align-items:center;gap:12px;margin-top:6px}
.ng .ng-suave{margin-top:auto;font:italic 500 32px/1.25 PF,serif;color:var(--hi)}
.ng .ng-suave svg{margin-left:6px}
.ng .ng-logo{position:absolute;right:56px;top:52px}
.ng .ng-idx{position:absolute;right:58px;top:${p.placaLogo ? 238 : 214}px;${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:var(--muted)}
.ng .ng-desl{margin-top:auto;font:400 34px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:12px}
</style>
<div class="ng-grao"></div>
<div class="ng-top"><div class="ng-nw"><span class="ng-num${vazado ? ' ng-cap' : ''}" data-fit="${W}" data-max="${(vazado ? 760 : 770) - sobe}">${n.esc(num)}</span>${t === 'size' ? `<span class="ng-lab">${n.esc(s.bigLabel)}</span>` : ''}</div></div>
<div class="ng-logo">${n.logo({ altura: 118, placa: p.placaLogo })}</div>
${s.idx ? `<span class="ng-idx">${n.esc(s.idx)}</span>` : ''}
<div class="ng-base"></div>
<div class="ng-bt">
  <div class="ng-l">${s.eyebrow ? `<p class="ng-eb">${n.esc(s.eyebrow)}</p>` : ''}<h1 class="ng-h">${n.esc(titulo)}</h1></div>
  ${direita ? `<div class="ng-r">${corpo}${cta}${s.deslize && !s.cta ? `<span class="ng-desl">deslize ${SETA(46, 'currentColor')}</span>` : ''}</div>` : ''}
</div>
${FIT_JS}
</div>`;
  },
};

// ---------------------------------------------------------------- 4. bilhete-pedido
const bilhetePedido = {
  id: 'bilhete-pedido',
  formato: 'feed',
  usa: 'texto',
  tipos: ['step', 'text', 'list', 'size'],
  paletas: ['tomate', 'manjericao', 'creme'],
  descricao: 'Comanda de papel com bordas picotadas e canhoto destacável sobre a paleta; carimbo com o número; ótimo para passos e "como pedir".',
  async render(s, { n, p }) {
    const t = tipoDe(s);
    const papel = '#fffaf0', tinta = '#1c1712', tinta2 = '#55493b';
    const verm = '#b3141f';
    const ts = n.tamanho(s.title, [[10, 112], [18, 84], [28, 68], [99, 58]]);
    let miolo = '';
    if (t === 'list') {
      miolo = `<div class="bp-list">${(s.lines || []).map((l) => `<div class="bp-li"><svg width="34" height="34" viewBox="0 0 34 34"><rect x="2" y="2" width="30" height="30" rx="4" fill="none" stroke="${tinta}" stroke-width="2.5"/><path d="M8 18L14 24L27 9" fill="none" stroke="${verm}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${n.esc(l)}</span></div>`).join('')}</div>`;
    } else if (t === 'size') {
      const ls = s.lines || [];
      miolo = ls.map((l, i) => (i === ls.length - 1 && ls.length > 1 && l.length <= 40 ? `<p class="bp-mao">${n.esc(l)}</p>` : `<p class="bp-p${i ? '' : ' bp-p1'}">${n.esc(l)}</p>`)).join('');
    } else {
      const ls = s.lines || [];
      miolo = ls.map((l, i) => (i === ls.length - 1 && ((ls.length > 1 && l.length <= 40) || (t === 'step' && l.length <= 70))
        ? `<p class="bp-mao">${n.esc(l)}</p>`
        : `<p class="bp-p">${n.esc(l)}</p>`)).join('');
    }
    const selo = t === 'step' ? `<span class="bp-sn">nº</span><span class="bp-sb">${n.esc(s.n)}</span>`
      : t === 'size' ? `<span class="bp-sb" style="font-size:96px">${n.esc(s.big)}</span><span class="bp-sn">${n.esc(s.bigLabel)}</span>`
        : `${ESTRELA(44, verm)}<span class="bp-sn" style="margin-top:8px;font-size:26px">desde</span><span class="bp-sb" style="font-size:64px">2015</span>`;
    const canhoto = s.cta === 'forte'
      ? `<b class="bp-c1">${n.CTA_FORTE}</b><span class="bp-c2">link na bio ${SETA(40, tinta)}</span>`
      : s.cta === 'suave' ? `<b class="bp-c1" style="font-size:38px">${n.CTA_SUAVE}</b>` : '';
    const barras = Array.from({ length: 44 }, (_, i) => `<rect x="${i * 7}" y="0" width="${[2, 4, 1, 3][(i * 7) % 4]}" height="48" fill="${tinta}"/>`).join('');
    const H = 900, Y = s.cta ? 690 : 740;
    const grunge = await mancha(n);
    return `<div class="bp" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:${tinta};${vars(n, p)}">
<style>
.bp .bp-fundo{position:absolute;inset:0;background:radial-gradient(circle,color-mix(in srgb,var(--ink) 14%,transparent) 2px,transparent 2.5px) 0 0/34px 34px}
.bp .bp-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.3}
.bp .bp-sombra{position:absolute;left:196px;top:${(1080 - H) / 2}px;width:688px;height:${H}px;transform:rotate(-2.2deg);filter:drop-shadow(0 22px 26px rgba(0,0,0,.38)) drop-shadow(0 2px 3px rgba(0,0,0,.25))}
.bp .bp-papel{position:absolute;inset:0;background:linear-gradient(180deg,#fffdf7,${papel} 40%,#f6efe0);
  -webkit-mask:radial-gradient(circle 11px at 50% 0,#0000 97%,#000) 0 0/30px 100% repeat-x,radial-gradient(circle 11px at 50% 100%,#0000 97%,#000) 0 0/30px 100% repeat-x,radial-gradient(circle 22px at 0 ${Y}px,#0000 97%,#000),radial-gradient(circle 22px at 100% ${Y}px,#0000 97%,#000);
  -webkit-mask-composite:source-in;mask-composite:intersect}
.bp .bp-papel:after{content:"";position:absolute;inset:0;background-image:${grao(0.5, 1.2)};mix-blend-mode:multiply;opacity:.18}
.bp .bp-in{position:absolute;left:52px;right:52px;top:44px;height:${Y - 64}px;display:flex;flex-direction:column}
.bp .bp-hd{display:flex;align-items:center;justify-content:space-between}
.bp .bp-hd .m{text-align:right;${COND};font-weight:600;font-size:24px;letter-spacing:.24em;text-transform:uppercase;color:${tinta2};line-height:1.45}
.bp .bp-tr{border-top:3px dashed ${tinta};opacity:.55;margin:22px 0}
.bp .bp-eb{display:flex;justify-content:space-between;${COND};font-weight:700;font-size:28px;letter-spacing:.22em;text-transform:uppercase;color:${verm}}
.bp .bp-eb .i{color:${tinta2};letter-spacing:.1em}
.bp .bp-h{font-family:PF,serif;font-weight:800;font-size:${ts}px;line-height:1.04;margin-top:10px;text-wrap:balance;max-width:560px}
.bp .bp-p{font:500 36px/1.36 IN,sans-serif;color:${tinta2};margin-top:8px;text-wrap:pretty}
.bp .bp-p1{font-weight:700;color:${tinta}}
.bp .bp-mao{max-width:420px;font:400 40px/1.3 'Segoe Script',cursive;color:${verm};margin-top:14px;transform:rotate(-2deg);transform-origin:left}
.bp .bp-list{display:flex;flex-direction:column;gap:6px;max-width:480px}
.bp .bp-li{display:flex;align-items:center;gap:18px;font:600 34px/1.2 IN,sans-serif;white-space:nowrap;padding:10px 0;border-bottom:2px dotted ${tinta}55}
.bp .bp-li svg{flex:none}
.bp .bp-rec{display:flex;align-items:baseline;gap:14px;${COND};font-weight:600;font-size:34px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px}
.bp .bp-rec i{flex:1;border-bottom:3px dotted ${tinta}77}
.bp .bp-rec b{font-size:64px;letter-spacing:0;color:${verm}}
.bp .bp-perf{position:absolute;left:30px;right:30px;top:${Y - 1}px;border-top:3px dashed ${tinta};opacity:.45}
.bp .bp-can{position:absolute;left:52px;right:52px;top:${Y + 26}px;bottom:34px;display:flex;flex-direction:column;justify-content:center}
.bp .bp-c1{${COND};font-weight:700;font-size:46px;text-transform:uppercase;letter-spacing:.02em;line-height:1.02;max-width:370px}
.bp .bp-c2{font:600 27px IN,sans-serif;color:${tinta2};display:flex;align-items:center;gap:12px;margin-top:8px}
.bp .bp-bar{display:flex;flex-direction:column;align-items:flex-start;gap:10px}
.bp .bp-bar span{${COND};font-weight:600;font-size:24px;letter-spacing:.3em;text-transform:uppercase;color:${tinta2}}
.bp .bp-selo{position:absolute;right:26px;top:${Y - 92}px;width:220px;height:220px;border-radius:50%;border:5px solid ${verm};color:${verm};display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-14deg);opacity:.92;box-shadow:inset 0 0 0 9px ${papel},inset 0 0 0 12px ${verm};mix-blend-mode:multiply;${maskTinta(grunge, 300)}}
.bp .bp-sn{${COND};font-weight:700;font-size:30px;letter-spacing:.2em;text-transform:uppercase;line-height:1}
.bp .bp-sb{${COND};font-weight:700;font-size:110px;line-height:.9}
.bp .bp-clip{position:absolute;left:50%;top:-34px;margin-left:-60px}
.bp .bp-desl{position:absolute;right:56px;bottom:46px;font:400 34px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:12px}
.bp .bp-idx{position:absolute;right:56px;top:52px;${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:var(--ink)}
</style>
<div class="bp-fundo"></div><div class="bp-grao"></div>
${s.idx ? `<span class="bp-idx">${n.esc(s.idx)}</span>` : ''}
<div class="bp-sombra">
  <div class="bp-papel">
    <div class="bp-in">
      <div class="bp-hd">${n.logo({ altura: 92, placa: true })}<div class="m">Disk Pizza<br>Curitiba · desde 2015</div></div>
      <div class="bp-tr"></div>
      ${t !== 'step' && s.eyebrow ? `<div class="bp-eb"><span>${n.esc(s.eyebrow)}</span></div>` : ''}
      <h1 class="bp-h">${n.esc(s.title)}</h1>
      <div class="bp-tr" style="margin:26px 0 16px"></div>
      ${miolo}
    </div>
    <div class="bp-perf"></div>
    <div class="bp-can">${canhoto || `<div class="bp-bar"><svg width="300" height="48" viewBox="0 0 304 48">${barras}</svg><span>Disk Pizza</span></div>`}</div>
    <div class="bp-selo">${selo}</div>
  </div>
</div>
${s.deslize ? `<span class="bp-desl">deslize ${SETA(46, 'currentColor')}</span>` : ''}
</div>`;
  },
};

// ---------------------------------------------------------------- 5. conversa-whatsapp
const conversaWhatsapp = {
  id: 'conversa-whatsapp',
  formato: 'feed',
  usa: 'texto',
  tipos: ['text', 'size', 'step', 'list'],
  paletas: ['noite', 'creme', 'manjericao'],
  descricao: 'Tela de conversa genérica: cabeçalho com avatar da casa, balões com título e linhas, indicador "digitando" e botão de resposta rápida com o CTA.',
  async render(s, { n, p }) {
    const t = tipoDe(s);
    const ts = n.tamanho(s.title, [[12, 104], [20, 86], [34, 72], [99, 62]]);
    const reacao = `<span class="cw-re"><svg width="40" height="40" viewBox="0 0 40 40"><path d="M6 8Q20 0 34 8L20 37Z" fill="#f2c14e"/><path d="M6 8Q20 0 34 8" fill="none" stroke="#c8781e" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="14" r="3.4" fill="#c8102e"/><circle cx="24" cy="20" r="3" fill="#c8102e"/><circle cx="19" cy="27" r="2.6" fill="#c8102e"/></svg><svg width="34" height="34" viewBox="0 0 24 24"><path d="M12 21C5 15.5 2 12 2 8.2C2 5.3 4.3 3 7.1 3C9 3 10.9 4.1 12 5.8C13.1 4.1 15 3 16.9 3C19.7 3 22 5.3 22 8.2C22 12 19 15.5 12 21Z" fill="#e0364a"/></svg></span>`;
    const balao = (html, cls = '', extra = '') => `<div class="cw-b ${cls}">${html}${extra}</div>`;
    const bals = [];
    if (t === 'size') {
      bals.push(balao(`<div class="cw-sz"><b>${n.esc(s.big)}</b><span>${n.esc(s.bigLabel)}</span></div><p class="cw-h" style="font-size:60px">${n.esc(s.title)}</p>`, 'cw-1', reacao));
      (s.lines || []).forEach((l) => bals.push(balao(`<p class="cw-p">${n.esc(l)}</p>`)));
    } else if (t === 'step') {
      bals.push(balao(`<div class="cw-st"><b>${n.esc(s.n)}</b><p class="cw-h">${n.esc(s.title)}</p></div>`, 'cw-1', reacao));
      (s.lines || []).forEach((l) => bals.push(balao(`<p class="cw-p">${n.esc(l)}</p>`)));
    } else if (t === 'list') {
      bals.push(balao(`<p class="cw-h">${n.esc(s.title)}</p>`, 'cw-1', reacao));
      bals.push(balao(`<ul class="cw-ul">${(s.lines || []).map((l) => `<li><svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="var(--accent2)"/><path d="M8 15.5L13 20L22 10" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>${n.esc(l)}</li>`).join('')}</ul>`));
    } else {
      bals.push(balao(`<p class="cw-h">${n.esc(s.title)}</p>`, 'cw-1', reacao));
      (s.lines || []).forEach((l) => bals.push(balao(`<p class="cw-p">${n.esc(l)}</p>`)));
    }
    const resp = s.cta === 'forte'
      ? `<div class="cw-qr"><b>${n.CTA_FORTE}</b><span>link na bio</span></div>`
      : s.cta === 'suave' ? `<div class="cw-qr cw-qr2"><b>${n.CTA_SUAVE}</b></div>` : '';
    const digitando = `<div class="cw-out"><div class="cw-typ"><i></i><i></i><i></i></div></div>`;
    return `<div class="cw" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.cw .cw-fundo{position:absolute;inset:0;background:
  radial-gradient(circle at 20px 20px,color-mix(in srgb,var(--ink) 10%,transparent) 2.5px,transparent 3px) 0 0/56px 56px,
  radial-gradient(circle at 48px 48px,color-mix(in srgb,var(--accent) 16%,transparent) 1.8px,transparent 2.3px) 0 0/56px 56px}
.cw .cw-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.3}
.cw .cw-top{position:absolute;left:0;right:0;top:0;height:164px;background:var(--bg2);display:flex;align-items:center;gap:26px;padding:0 56px;box-shadow:0 6px 24px rgba(0,0,0,.18)}
.cw .cw-av{width:116px;height:116px;border-radius:50%;background:#141414;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px var(--accent)}
.cw .cw-nm b{display:block;font:800 42px IN,sans-serif;color:var(--ink)}
.cw .cw-nm span{display:flex;align-items:center;gap:10px;font:500 26px IN,sans-serif;color:var(--muted)}
.cw .cw-nm span i{width:14px;height:14px;border-radius:50%;background:var(--hi)}
.cw .cw-idx{margin-left:auto;${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:var(--muted)}
.cw .cw-body{position:absolute;left:56px;right:56px;top:188px;bottom:${s.cta ? 150 : 56}px;display:flex;flex-direction:column;justify-content:center;gap:20px}
.cw .cw-chip{align-self:center;background:var(--bg2);color:var(--ink);font:700 24px IN,sans-serif;letter-spacing:.18em;text-transform:uppercase;padding:10px 26px;border-radius:999px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.cw .cw-b{align-self:flex-start;max-width:900px;background:var(--ink);color:var(--bg);border-radius:12px 40px 40px 40px;padding:26px 40px 28px;box-shadow:0 8px 22px rgba(0,0,0,.2);position:relative}
.cw .cw-1{border-top-left-radius:6px;margin-bottom:16px}
.cw .cw-1:before{content:"";position:absolute;left:-16px;top:0;border-top:26px solid var(--ink);border-left:18px solid transparent}
.cw .cw-h{font:800 ${ts}px/1.08 IN,sans-serif;letter-spacing:-.02em;text-wrap:balance}
.cw .cw-p{font:500 40px/1.34 IN,sans-serif;text-wrap:pretty}
.cw .cw-sz{display:flex;align-items:baseline;gap:16px}
.cw .cw-sz b{${COND};font-weight:700;font-size:210px;line-height:.85;color:var(--bg)}
.cw .cw-sz span{${COND};font-weight:600;font-size:48px;text-transform:uppercase;letter-spacing:.12em}
.cw .cw-st{display:flex;align-items:center;gap:28px}
.cw .cw-st b{flex:none;width:118px;height:118px;border-radius:50%;background:var(--bg);color:var(--ink);display:flex;align-items:center;justify-content:center;${COND};font-weight:700;font-size:80px}
.cw .cw-ul{list-style:none}
.cw .cw-ul li{display:flex;align-items:center;gap:18px;font:600 38px/1.3 IN,sans-serif;padding:7px 0}
.cw .cw-ul svg{flex:none}
.cw .cw-out{align-self:flex-end;margin-top:6px}
.cw .cw-typ{display:flex;gap:14px;background:var(--btn);padding:30px 38px;border-radius:40px 12px 40px 40px;box-shadow:0 8px 22px rgba(0,0,0,.2)}
.cw .cw-typ i{width:24px;height:24px;border-radius:50%;background:var(--btnInk);opacity:.85}
.cw .cw-typ i:nth-child(2){opacity:.6}.cw .cw-typ i:nth-child(3){opacity:.35}
.cw .cw-qr{position:absolute;left:56px;right:56px;bottom:46px;height:92px;border-radius:999px;background:var(--btn);color:var(--btnInk);display:flex;align-items:center;justify-content:center;gap:22px;box-shadow:0 8px 22px rgba(0,0,0,.22)}
.cw .cw-qr b{font:800 38px IN,sans-serif}
.cw .cw-qr span{font:600 26px IN,sans-serif;opacity:.9;border-left:2px solid currentColor;padding-left:22px}
.cw .cw-qr2{background:transparent;color:var(--hi);border:3px solid var(--hi);box-shadow:none}
.cw .cw-re{position:absolute;right:26px;bottom:-26px;display:flex;gap:4px;align-items:center;background:var(--bg2);border:3px solid var(--bg);border-radius:999px;padding:6px 14px;box-shadow:0 4px 10px rgba(0,0,0,.2)}
.cw .cw-desl{position:absolute;right:60px;bottom:52px;font:400 34px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:12px}
</style>
<div class="cw-fundo"></div><div class="cw-grao"></div>
<div class="cw-top"><div class="cw-av">${n.logo({ altura: 70 })}</div><div class="cw-nm"><b>Disk Pizza</b><span><i></i>Curitiba</span></div>${s.idx ? `<span class="cw-idx">${n.esc(s.idx)}</span>` : ''}</div>
<div class="cw-body">
  ${s.eyebrow ? `<span class="cw-chip">${n.esc(s.eyebrow)}</span>` : ''}
  ${bals.join('')}
  ${digitando}
</div>
${resp}
${s.deslize && !s.cta ? `<span class="cw-desl">deslize ${SETA(46, 'currentColor')}</span>` : ''}
</div>`;
  },
};

// ---------------------------------------------------------------- 6. celebracao
function decorCelebracao(variante, p, seed) {
  const r = rnd(seed);
  const W = 1080;
  const f = (x) => x.toFixed(0);
  // cores de enfeite que aparecem sobre o fundo (contraste mínimo de 1,6 para não sumir)
  const visiveis = [p.accent2, p.accent, p.ink, '#c8102e', '#e8cc74', '#f5efe3'].filter((c, i, a) => a.indexOf(c) === i && contraste(c, p.bg) >= 1.6);
  const livre = (x, y, zonas) => !zonas.some(([x1, y1, x2, y2]) => x > x1 && x < x2 && y > y1 && y < y2);
  // centro (texto), topo do logo e faixa do CTA ficam livres
  const ZONAS = [[150, 250, 930, 900], [360, 30, 720, 260], [140, 880, 940, 1080]];
  if (variante === 'sobrio') return '';
  if (variante === 'natal') {
    const cs = visiveis.slice(0, 3);
    const bolas = [[70, 200, 40], [150, 110, 28], [236, 250, 34], [318, 150, 22], [762, 140, 24], [842, 236, 36], [930, 110, 28], [1010, 214, 42]];
    const g = bolas.map(([x, y, rr], i) => {
      const c = cs[i % cs.length];
      return `<line x1="${x}" y1="0" x2="${x}" y2="${y - rr}" stroke="${p.accent}" stroke-width="2" opacity=".75"/>
<rect x="${f(x - rr * 0.3)}" y="${f(y - rr - 10)}" width="${f(rr * 0.6)}" height="12" rx="2" fill="${p.accent}"/>
<circle cx="${x}" cy="${y}" r="${rr}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${rr}" fill="url(#ce-brilho)"/>
<path d="M${x - rr * 0.92} ${f(y - rr * 0.18)}Q${x} ${f(y + rr * 0.22)} ${x + rr * 0.92} ${f(y - rr * 0.18)}" stroke="${p.accent}" stroke-width="2.5" fill="none" opacity=".8"/>
<path d="M${x - rr * 0.8} ${f(y + rr * 0.32)}Q${x} ${f(y + rr * 0.7)} ${x + rr * 0.8} ${f(y + rr * 0.32)}" stroke="${p.accent}" stroke-width="1.6" fill="none" opacity=".6" stroke-dasharray="2 5" stroke-linecap="round"/>`;
    }).join('');
    const floco = (x, y, t, op) => `<g transform="translate(${f(x)} ${f(y)})" stroke="${p.ink}" stroke-width="2" stroke-linecap="round" fill="none" opacity="${op.toFixed(2)}">${[0, 60, 120, 180, 240, 300].map((a) => `<g transform="rotate(${a})"><line x1="0" y1="0" x2="0" y2="${f(-t)}"/><path d="M${f(-t * 0.28)} ${f(-t * 0.78)}L0 ${f(-t * 0.5)}L${f(t * 0.28)} ${f(-t * 0.78)}"/></g>`).join('')}</g>`;
    const flocos = Array.from({ length: 40 }, () => {
      const x = r() * W, y = 280 + r() * 780, t = 8 + r() * 16;
      return livre(x, y, ZONAS) ? floco(x, y, t, 0.2 + r() * 0.35) : '';
    }).join('');
    // ramos de azevinho em traço dourado nos cantos de baixo
    const baga = ['#c8102e', '#e2513d', p.ink].find((c) => contraste(c, p.bg) >= 1.6);
    const folha = (rot) => `<path transform="rotate(${rot})" d="M0 0C10 -8 18 -6 22 -16C26 -8 34 -10 40 -4C36 2 42 8 36 14C30 10 24 16 18 12C14 18 6 14 0 0Z" fill="none" stroke="${p.accent}" stroke-width="2.4" stroke-linejoin="round"/><path transform="rotate(${rot})" d="M2 1L36 8" stroke="${p.accent}" stroke-width="1.6" opacity=".7"/>`;
    const azevinho = (x, y, esp) => `<g transform="translate(${x} ${y}) scale(${esp} 1.6)">${folha(-160)}${folha(-110)}${folha(-60)}<circle cx="-4" cy="-8" r="6" fill="${baga}"/><circle cx="6" cy="-12" r="6" fill="${baga}"/><circle cx="2" cy="1" r="6" fill="${baga}"/></g>`;
    return `<defs><radialGradient id="ce-brilho" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>
<path d="M0 34Q270 120 540 34Q810 120 1080 34" fill="none" stroke="${p.accent}" stroke-width="2" opacity=".55"/>
${Array.from({ length: 19 }, (_, i) => { const x = 30 + i * 57; const y = 34 + 86 * Math.sin(((x % 540) / 540) * Math.PI) * 0.5; return `<circle cx="${x}" cy="${f(y + 6)}" r="5.5" fill="${i % 2 ? p.accent : visiveis[0]}"/>`; }).join('')}
${g}${flocos}${azevinho(120, 1000, 1.6)}${azevinho(960, 1000, -1.6)}`;
  }
  if (variante === 'halloween') {
    const escuroM = '#16120f', soltoM = p.escuro ? p.ink : escuroM;
    const morcego = (x, y, sc, rot, op = 0.9, cor = soltoM) => `<g transform="translate(${x} ${y}) scale(${sc}) rotate(${rot})" fill="${cor}" opacity="${op}"><path d="M0 4C-4 -2 -8 -4 -11 -2C-15 -12 -27 -16 -50 -10C-41 -6 -37 2 -39 10C-31 4 -25 6 -21 14C-15 6 -7 6 0 12C7 6 15 6 21 14C25 6 31 4 39 10C37 2 41 -6 50 -10C27 -16 15 -12 11 -2C8 -4 4 -2 0 4Z"/><path d="M-6 -1L-7 -11L-2.5 -5.5L2.5 -5.5L7 -11L6 -1C4 3 -4 3 -6 -1Z"/></g>`;
    const N = 9, R0 = 360;
    const ang = Array.from({ length: N }, (_, i) => (i / (N - 1)) * 90);
    const teia = `<g stroke="${p.ink}" stroke-width="1.6" fill="none" opacity=".4">${ang.map((a) => `<line x1="0" y1="0" x2="${f(R0 * Math.cos((a * Math.PI) / 180))}" y2="${f(R0 * Math.sin((a * Math.PI) / 180))}"/>`).join('')}${[60, 120, 185, 255, 330].map((rr) => `<path d="${ang.map((a, i) => {
      const px = rr * Math.cos((a * Math.PI) / 180), py = rr * Math.sin((a * Math.PI) / 180);
      if (!i) return `M${f(px)} ${f(py)}`;
      const am = ((a - 5.6) * Math.PI) / 180, rm = rr * 0.86;
      return `Q${f(rm * Math.cos(am))} ${f(rm * Math.sin(am))} ${f(px)} ${f(py)}`;
    }).join(' ')}"/>`).join('')}</g>`;
    const aranha = `<line x1="228" y1="0" x2="228" y2="300" stroke="${p.ink}" stroke-width="1.5" opacity=".6"/><g transform="translate(228 312)" fill="${p.ink}"><ellipse cx="0" cy="0" rx="11" ry="14"/><circle cx="0" cy="-16" r="7"/>${[-1, 1].map((sx) => [-10, -2, 6, 13].map((dy, k) => `<path d="M${sx * 8} ${dy - 4}Q${sx * 24} ${dy - 14 + k * 2} ${sx * 30} ${dy + 6 + k * 3}" stroke="${p.ink}" stroke-width="2.6" fill="none"/>`).join('')).join('')}</g>`;
    const estrelas = Array.from({ length: 22 }, () => {
      const x = r() * W, y = r() * W;
      return livre(x, y, ZONAS) ? `<circle cx="${f(x)}" cy="${f(y)}" r="${(1.5 + r() * 2.5).toFixed(1)}" fill="${p.ink}" opacity="${(0.3 + r() * 0.5).toFixed(2)}"/>` : '';
    }).join('');
    return `<defs><radialGradient id="ce-lua" cx=".4" cy=".38" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>
<radialGradient id="ce-halo"><stop offset=".55" stop-color="${p.accent}" stop-opacity=".22"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient></defs>
${estrelas}
<circle cx="890" cy="196" r="230" fill="url(#ce-halo)"/>
<circle cx="890" cy="196" r="132" fill="${p.accent}"/><circle cx="890" cy="196" r="132" fill="url(#ce-lua)"/>
<g fill="#000" opacity=".1"><circle cx="850" cy="160" r="22"/><circle cx="926" cy="236" r="16"/><circle cx="930" cy="150" r="10"/><circle cx="858" cy="250" r="9"/></g>
${morcego(856, 222, 1.6, -6, 0.95, escuroM)}${morcego(930, 140, 0.8, 12, 0.9, escuroM)}${morcego(1010, 340, 1.0, -14, p.escuro ? 0.55 : 0.85)}${morcego(110, 900, 1.2, 8, p.escuro ? 0.45 : 0.75)}${morcego(990, 960, 0.85, -10, p.escuro ? 0.4 : 0.7)}${morcego(70, 420, 0.7, 14, p.escuro ? 0.35 : 0.6)}
${teia}${aranha}`;
  }
  // anonovo e padrão ('estrelas'): fogos, brilhos e confete
  const fogos = (cx, cy, raio, cor, raios = 18) => `<g stroke="${cor}" stroke-linecap="round">${Array.from({ length: raios }, (_, i) => {
    const a = (i / raios) * Math.PI * 2, r1 = raio * 0.3, r2 = raio * (0.78 + (i % 2) * 0.22);
    const x1 = cx + r1 * Math.cos(a), y1 = cy + r1 * Math.sin(a), x2 = cx + r2 * Math.cos(a), y2 = cy + r2 * Math.sin(a);
    return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke-width="3.2"/><circle cx="${f(cx + (r2 + 14) * Math.cos(a))}" cy="${f(cy + (r2 + 14) * Math.sin(a))}" r="3.6" fill="${cor}" stroke="none"/>${i % 2 ? '' : `<circle cx="${f(cx + (r2 + 34) * Math.cos(a))}" cy="${f(cy + (r2 + 34) * Math.sin(a))}" r="2.2" fill="${cor}" stroke="none" opacity=".7"/>`}`;
  }).join('')}<circle cx="${cx}" cy="${cy}" r="5" fill="${cor}" stroke="none"/></g>`;
  const brilhos = Array.from({ length: 22 }, () => {
    const x = r() * W, y = r() * W;
    if (!livre(x, y, ZONAS)) return '';
    const t = 12 + r() * 26;
    return `<path transform="translate(${f(x)} ${f(y)}) scale(${(t / 24).toFixed(2)})" d="M0 -12C.8 -4.8 4.8 -.8 12 0C4.8 .8 .8 4.8 0 12C-.8 4.8 -4.8 .8 -12 0C-4.8 -.8 -.8 -4.8 0 -12Z" fill="${r() > 0.4 ? p.accent : p.ink}" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`;
  }).join('');
  const confete = variante === 'anonovo' ? Array.from({ length: 90 }, () => {
    const x = r() * W, y = r() * W;
    if (!livre(x, y, ZONAS)) return '';
    const c = visiveis[Math.floor(r() * visiveis.length)];
    return r() > 0.3
      ? `<rect x="${f(x)}" y="${f(y)}" width="${f(8 + r() * 8)}" height="${f(16 + r() * 12)}" rx="2" fill="${c}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})" opacity=".9"/>`
      : `<circle cx="${f(x)}" cy="${f(y)}" r="${(4 + r() * 4).toFixed(1)}" fill="${c}" opacity=".9"/>`;
  }).join('') : '';
  const fg = variante === 'anonovo'
    ? fogos(170, 190, 150, p.accent) + fogos(930, 150, 110, visiveis[0], 14) + fogos(990, 900, 90, p.accent, 14) + fogos(90, 960, 70, visiveis[0], 12)
    : '';
  return `${fg}${brilhos}${confete}`;
}

const celebracao = {
  id: 'celebracao',
  formato: 'feed',
  usa: 'texto',
  tipos: ['text', 'size', 'step', 'list'],
  paletas: ['tomate', 'noite', 'manjericao'],
  variantes: ['natal', 'anonovo', 'halloween', 'sobrio'],
  descricao: 'Datas comemorativas: título serifado elegante com enfeites em SVG (bolas e flocos no natal, fogos e confete no ano novo, lua e morcegos no halloween). "sobrio" não tem nada festivo (datas de respeito).',
  async render(s, { n, p, variante }) {
    const t = tipoDe(s);
    const v = ['natal', 'anonovo', 'halloween', 'sobrio'].includes(variante) ? variante : 'estrelas';
    const sobrio = v === 'sobrio';
    const ts = n.tamanho(s.title, sobrio ? [[12, 120], [24, 104], [34, 88], [99, 76]] : [[12, 156], [20, 120], [30, 98], [99, 84]]);
    const extra = t === 'size' ? `<p class="ce-big"><b>${n.esc(s.big)}</b> ${n.esc(s.bigLabel)}</p>`
      : '';
    const passo = t === 'step' ? `<p class="ce-n">nº ${n.esc(s.n)}</p>` : '';
    const linhas = t === 'list'
      ? `<ul class="ce-ul">${(s.lines || []).map((l) => `<li>${ESTRELA(22, 'var(--hi)')}<span>${n.esc(l)}</span></li>`).join('')}</ul>`
      : (s.lines || []).map((l, i) => `<p class="ce-p${i ? '' : ' ce-p1'}">${n.esc(l)}</p>`).join('');
    const cta = s.cta === 'forte'
      ? `<div class="ce-cta"><b>${n.CTA_FORTE}</b><span>link na bio</span></div>`
      : s.cta === 'suave' ? `<p class="ce-suave">${n.CTA_SUAVE}</p>` : '';
    const fundo = sobrio
      ? 'var(--bg)'
      : v === 'halloween' ? 'radial-gradient(ellipse at 80% 15%,var(--bg2),var(--bg) 60%)' : 'radial-gradient(ellipse at 50% 45%,var(--bg2),var(--bg) 72%)';
    if (sobrio) {
      return `<div class="ce" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.ce .ce-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.25}
.ce .ce-fr{position:absolute;inset:44px;border:1.5px solid color-mix(in srgb,var(--ink) 40%,transparent)}
.ce .ce-in{position:absolute;left:120px;right:120px;top:120px;bottom:${s.cta ? 220 : 200}px;display:flex;flex-direction:column;justify-content:center}
.ce .ce-cab{border-left:6px solid var(--hi);padding:4px 0 4px 34px}
.ce .ce-in > :not(.ce-cab){margin-left:40px}
.ce .ce-eb{${COND};font-weight:600;font-size:30px;letter-spacing:.34em;text-transform:uppercase;color:var(--hi)}
.ce .ce-h{font-family:PF,serif;font-weight:600;font-size:${ts}px;line-height:1.04;margin-top:26px;text-wrap:balance}
.ce .ce-rule{width:140px;height:1.5px;background:var(--ink);opacity:.6;margin:46px 0 36px}
.ce .ce-p{font:400 32px/1.45 IN,sans-serif;color:var(--muted);margin-top:18px;text-wrap:pretty;max-width:780px}
.ce .ce-p1{font:italic 400 44px/1.34 PF,serif;color:var(--ink);margin-top:0;text-wrap:balance}
.ce .ce-big{${COND};font-weight:600;font-size:40px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:18px}
.ce .ce-big b{font-size:96px;color:var(--hi);letter-spacing:0}
.ce .ce-ul{list-style:none}.ce .ce-ul li{display:flex;gap:16px;align-items:center;font:500 34px/1.3 IN,sans-serif;padding:8px 0}
.ce .ce-cta{position:absolute;left:160px;bottom:104px}
.ce .ce-cta b{display:inline-block;background:var(--btn);color:var(--btnInk);font:700 32px IN,sans-serif;padding:18px 34px;border-radius:4px}
.ce .ce-cta span{font:500 26px IN,sans-serif;color:var(--muted);margin-left:20px}
.ce .ce-suave{position:absolute;left:160px;bottom:110px;font:italic 500 34px PF,serif;color:var(--hi)}
.ce .ce-logo{position:absolute;right:96px;bottom:92px}
.ce .ce-idx{position:absolute;right:96px;top:92px;${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:var(--muted)}
.ce .ce-desl{position:absolute;left:160px;bottom:110px;font:400 32px 'Segoe Script',cursive;color:var(--hi)}
.ce .ce-n{font:italic 600 56px/1 PF,serif;color:var(--hi);margin-bottom:14px}
</style>
<div class="ce-grao"></div><div class="ce-fr"></div>
<div class="ce-in">
  <div class="ce-cab">${passo}${s.eyebrow ? `<p class="ce-eb">${n.esc(s.eyebrow)}</p>` : ''}
  <h1 class="ce-h">${n.esc(s.title)}</h1></div>
  ${extra}
  <div class="ce-rule"></div>
  ${linhas}
</div>
${cta}
${s.deslize && !s.cta ? `<span class="ce-desl">deslize →</span>` : ''}
<div class="ce-logo">${n.logo({ altura: 112, placa: p.placaLogo })}</div>
${s.idx ? `<span class="ce-idx">${n.esc(s.idx)}</span>` : ''}
</div>`;
    }
    return `<div class="ce" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.ce .ce-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.3}
.ce .ce-fr{position:absolute;inset:38px;border:2px solid var(--accent);opacity:.55;border-radius:6px}
.ce .ce-fr:after{content:"";position:absolute;inset:10px;border:1px solid var(--accent);border-radius:3px}
.ce .ce-logo{position:absolute;left:50%;top:76px;transform:translateX(-50%)}
.ce .ce-in{position:absolute;left:110px;right:110px;top:${v === 'natal' ? 270 : 250}px;bottom:${s.cta === 'forte' ? 250 : s.cta ? 190 : 120}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.ce .ce-eb{font-family:'Segoe Script',cursive;font-size:46px;color:var(--hi);margin-bottom:6px}
.ce .ce-h{font-family:PF,serif;font-weight:700;font-style:italic;font-size:${ts}px;line-height:1.02;text-wrap:balance;letter-spacing:-.01em}
.ce .ce-orn{display:flex;align-items:center;gap:16px;margin:30px 0 22px}
.ce .ce-orn i{width:110px;height:1.5px;background:var(--accent)}
.ce .ce-p{font:400 32px/1.42 IN,sans-serif;color:var(--muted);margin-top:8px;text-wrap:balance;max-width:800px}
.ce .ce-p1{font:500 38px/1.36 IN,sans-serif;color:var(--ink)}
.ce .ce-big{${COND};font-weight:600;font-size:44px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:8px}
.ce .ce-big b{font-size:130px;color:var(--hi);letter-spacing:0}
.ce .ce-ul{list-style:none;text-align:left}.ce .ce-ul li{display:flex;gap:16px;align-items:center;font:500 34px/1.3 IN,sans-serif;padding:7px 0}
.ce .ce-cta{position:absolute;left:0;right:0;bottom:100px;text-align:center}
.ce .ce-cta b{display:inline-block;background:var(--btn);color:var(--btnInk);font:800 36px IN,sans-serif;padding:22px 46px;border-radius:999px;box-shadow:0 10px 26px rgba(0,0,0,.25)}
.ce .ce-cta span{display:block;font:500 26px IN,sans-serif;color:var(--muted);margin-top:14px}
.ce .ce-suave{position:absolute;left:0;right:0;bottom:104px;text-align:center;font:italic 500 36px PF,serif;color:var(--hi)}
.ce .ce-idx{position:absolute;left:0;right:0;bottom:48px;text-align:center;${COND};font-weight:600;font-size:28px;letter-spacing:.12em;color:var(--muted)}
.ce .ce-n{font:italic 600 64px/1 PF,serif;color:var(--hi);margin-bottom:10px}
.ce .ce-desl{position:absolute;left:0;right:0;bottom:96px;text-align:center;font:400 34px 'Segoe Script',cursive;color:var(--hi)}
</style>
<div style="position:absolute;inset:0;background:${fundo}"></div>
<div class="ce-grao"></div>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0">${decorCelebracao(v, p, s.title + v)}</svg>
<div class="ce-fr"></div>
<div class="ce-logo">${n.logo({ altura: 130, placa: p.placaLogo })}</div>
${s.idx ? `<span class="ce-idx">${n.esc(s.idx)}</span>` : ''}
<div class="ce-in">
  ${passo}${s.eyebrow ? `<p class="ce-eb">${n.esc(s.eyebrow)}</p>` : ''}
  <h1 class="ce-h">${n.esc(s.title)}</h1>
  ${extra}
  <div class="ce-orn"><i></i>${ESTRELA(26, 'var(--accent)')}<i></i></div>
  ${linhas}
</div>
${cta}
${s.deslize && !s.cta ? `<span class="ce-desl">deslize →</span>` : ''}
</div>`;
  },
};

// ---------------------------------------------------------------- 7. faixa-diagonal
const faixaDiagonal = {
  id: 'faixa-diagonal',
  formato: 'feed',
  usa: 'texto',
  tipos: ['text', 'size', 'step', 'list'],
  paletas: ['carvao', 'ouro', 'tomate'],
  descricao: 'Faixas diagonais de cor com texto corrido e chamada em caixa alta condensada (Black Friday sem cara de anúncio de desconto: nada de %, OFF ou preço).',
  async render(s, { n, p }) {
    const t = tipoDe(s);
    const rep = (txt, k = 10) => Array.from({ length: k }, () => `<span>${n.esc(txt)}</span>${ESTRELA(26, 'currentColor', 'flex:none')}`).join('');
    const faixaA = rep(s.eyebrow || 'Disk Pizza');
    const faixaB = s.cta === 'forte' ? rep(`${n.CTA_FORTE} · link na bio`, 4)
      : s.cta === 'suave' ? rep(n.CTA_SUAVE, 4)
        : s.deslize ? rep('deslize →', 10) : rep('Disk Pizza · Curitiba', 6);
    const linhasT = [];
    if (t === 'size') { linhasT.push(n.esc(s.title)); linhasT.push(`${n.esc(s.big)} ${n.esc(s.bigLabel)}`); }
    else if (t === 'step') { linhasT.push(`nº ${n.esc(s.n)}`); linhasT.push(...quebrar(s.title, 2, 8).map(n.esc)); }
    else {
      const len = String(s.title || '').length;
      const k = len <= 12 ? 1 : len <= 24 ? 2 : 3;
      linhasT.push(...quebrar(s.title, k, Math.ceil(len / k)).map(n.esc));
    }
    const W = 880;
    const titulo = linhasT.map((l, i) => `<span class="fd-ln${i === linhasT.length - 1 && linhasT.length > 1 ? ' fd-hi' : ''}" data-fit="${W}" data-max="${t === 'list' ? 170 : 250}" data-min="44">${l}</span>`).join('');
    const corpo = t === 'list'
      ? `<div class="fd-list">${(s.lines || []).map((l) => `<span>${n.esc(l)}</span>`).join('')}</div>`
      : (s.lines || []).map((l) => `<p class="fd-p">${n.esc(l)}</p>`).join('');
    return `<div class="fd" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.fd .fd-fundo{position:absolute;inset:0;background:repeating-linear-gradient(-52deg,transparent 0 46px,color-mix(in srgb,var(--ink) 5%,transparent) 46px 48px)}
.fd .fd-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.3}
.fd .fd-band{position:absolute;left:-160px;width:1400px;display:flex;align-items:center;gap:28px;white-space:nowrap;${COND};font-weight:700;text-transform:uppercase;letter-spacing:.06em;box-shadow:0 12px 30px rgba(0,0,0,.28);overflow:hidden}
.fd .fd-a{top:96px;height:104px;font-size:56px;background:var(--btn);color:var(--btnInk);transform:rotate(-6deg);padding-left:190px}
.fd .fd-a2{top:92px;height:118px;background:var(--accent2);transform:rotate(-2.5deg);opacity:.9;box-shadow:none}
.fd .fd-b{bottom:74px;height:96px;font-size:40px;background:var(--ink);color:var(--bg);transform:rotate(-6deg);padding-left:200px}
.fd .fd-in{position:absolute;left:96px;right:104px;top:236px;bottom:212px;display:flex;flex-direction:column}
.fd .fd-tt{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center}
.fd .fd-ln{display:block;width:max-content;white-space:nowrap;${COND};font-weight:700;text-transform:uppercase;line-height:.92;letter-spacing:-.005em;padding:.06em 0 0}
.fd .fd-hi{color:var(--hi)}
.fd .fd-ft{display:flex;align-items:flex-end;gap:36px;margin-top:22px}
.fd .fd-txt{flex:1;min-width:0;border-left:6px solid var(--hi);padding-left:24px}
.fd .fd-p{font:500 32px/1.36 IN,sans-serif;color:var(--muted);text-wrap:balance}
.fd .fd-p+.fd-p{margin-top:6px}
.fd .fd-list{display:flex;flex-wrap:wrap;gap:12px}
.fd .fd-list span{font:700 28px IN,sans-serif;border:2.5px solid var(--ink);border-radius:999px;padding:8px 22px}
.fd .fd-lg{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.fd .fd-idx{${COND};font-weight:600;font-size:28px;letter-spacing:.12em;color:var(--muted)}
</style>
<div class="fd-fundo"></div><div class="fd-grao"></div>
<div class="fd-band fd-a2"></div>
<div class="fd-band fd-a">${faixaA}</div>
<div class="fd-in">
  <div class="fd-tt" data-caixa><div>${titulo}</div></div>
  <div class="fd-ft"><div class="fd-txt">${corpo || `<p class="fd-p">Disk Pizza · Curitiba</p>`}</div><div class="fd-lg">${n.logo({ altura: 120, placa: p.placaLogo })}${s.idx ? `<span class="fd-idx">${n.esc(s.idx)}</span>` : ''}</div></div>
</div>
<div class="fd-band fd-b">${faixaB}</div>
${FIT_JS}
</div>`;
  },
};

// ---------------------------------------------------------------- 8. selo-carimbo
const seloCarimbo = {
  id: 'selo-carimbo',
  formato: 'feed',
  usa: 'texto',
  tipos: ['text', 'size', 'step', 'list'],
  paletas: ['creme', 'chocolate', 'manjericao'],
  descricao: 'Selo/carimbo redondo com texto em círculo (SVG textPath) e textura de tinta; título serifado e linhas ao lado.',
  async render(s, { n, p }) {
    const t = tipoDe(s);
    const c = cores(p);
    const anel = s.eyebrow && s.eyebrow.length <= 14 && !/disk pizza/i.test(s.eyebrow)
      ? `${s.eyebrow.toUpperCase()} ✦ DISK PIZZA ✦ CURITIBA ✦ DESDE 2015 ✦`
      : 'DISK PIZZA ✦ CURITIBA ✦ DESDE 2015 ✦ DISK PIZZA ✦ CURITIBA ✦';
    const R = 232, circ = 2 * Math.PI * R;
    const centro = t === 'size'
      ? `<text x="300" y="330" text-anchor="middle" style="${COND};font-weight:700;font-size:200px" fill="${c.hi}">${n.esc(s.big)}</text><text x="300" y="395" text-anchor="middle" style="${COND};font-weight:600;font-size:44px;letter-spacing:.2em" fill="${c.hi}">${n.esc(String(s.bigLabel).toUpperCase())}</text>`
      : t === 'step'
        ? `<text x="300" y="232" text-anchor="middle" style="font-family:PF,serif;font-style:italic;font-size:54px" fill="${c.hi}">nº</text><text x="300" y="400" text-anchor="middle" style="${COND};font-weight:700;font-size:210px" fill="${c.hi}">${n.esc(s.n)}</text>`
        : `<g transform="translate(300 214)"><path d="M0 -26C1.7 -10 10 -1.7 26 0C10 1.7 1.7 10 0 26C-1.7 10 -10 1.7 -26 0C-10 -1.7 -1.7 -10 0 -26Z" fill="${c.hi}"/></g>
<text x="300" y="322" text-anchor="middle" style="font-family:'Segoe Script',cursive;font-size:62px" fill="${c.hi}">Disk Pizza</text>
<g fill="${c.hi}">${[260, 300, 340].map((x, i) => `<path transform="translate(${x} 378) scale(${i === 1 ? 0.7 : 0.5})" d="M0 -24C1.6 -9.6 9.6 -1.6 24 0C9.6 1.6 1.6 9.6 0 24C-1.6 9.6 -9.6 1.6 -24 0C-9.6 -1.6 -1.6 -9.6 0 -24Z"/>`).join('')}</g>`;
    const ts = Math.min(t === 'list' ? 84 : 999, n.tamanho(s.title, [[10, 108], [18, 88], [28, 74], [99, 64]]));
    const corpo = t === 'list'
      ? `<ul class="sc-ul">${(s.lines || []).map((l) => `<li>${ESTRELA(22, 'var(--hi)', 'flex:none')}<span>${n.esc(l)}</span></li>`).join('')}</ul>`
      : (s.lines || []).map((l, i) => `<p class="sc-p${i ? '' : ' sc-p1'}">${n.esc(l)}</p>`).join('');
    const cta = s.cta === 'forte'
      ? `<div class="sc-cta"><b>${n.CTA_FORTE}</b><span>link na bio ${SETA(40, 'currentColor')}</span></div>`
      : s.cta === 'suave' ? `<p class="sc-suave">${n.CTA_SUAVE} ${SETA(40, 'currentColor')}</p>` : '';
    // Selo inteiro dentro do quadro (antes sangrava à direita e cortava o texto do anel).
    const D = t === 'list' ? 460 : 500;
    const SR = 44, ST = t === 'list' ? 330 : 300;
    const tinta = await mancha(n);
    return `<div class="sc" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.sc .sc-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.32}
.sc .sc-selo{${maskTinta(tinta, 420)};position:absolute;right:${SR}px;top:${ST}px;width:${D}px;height:${D}px;transform:rotate(-12deg)}
.sc .sc-eco{position:absolute;right:${SR}px;top:${ST}px;width:${D}px;height:${D}px;border-radius:50%;border:3px dashed var(--hi);opacity:.2;transform:translate(-22px,-30px)}
.sc .sc-hd{position:absolute;left:300px;right:64px;top:64px;height:${p.placaLogo ? 170 : 150}px;display:flex;align-items:center;gap:22px;${COND};font-weight:600;font-size:26px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted)}
.sc .sc-hd i{flex:1;height:1.5px;background:color-mix(in srgb,var(--ink) 35%,transparent)}
.sc .sc-logo{position:absolute;left:64px;top:64px}
.sc .sc-in{position:absolute;left:64px;width:${t === 'list' ? 480 : 450}px;top:${p.placaLogo ? 262 : 242}px;bottom:130px;display:flex;flex-direction:column;justify-content:center}
.sc .sc-eb{${COND};font-weight:600;font-size:30px;letter-spacing:.3em;text-transform:uppercase;color:var(--hi);display:flex;align-items:center;gap:18px}
.sc .sc-eb i{width:60px;height:2px;background:var(--hi)}
.sc .sc-h{font-family:PF,serif;font-weight:800;font-size:${ts}px;line-height:1.04;margin-top:16px;text-wrap:balance}
.sc .sc-p{font:400 31px/1.4 IN,sans-serif;color:var(--muted);margin-top:8px;text-wrap:pretty}
.sc .sc-p1{margin-top:22px;font:600 34px/1.34 IN,sans-serif;color:var(--ink)}
.sc .sc-ul{list-style:none;margin-top:18px}
.sc .sc-ul li{display:flex;gap:18px;align-items:center;font:600 34px/1.25 IN,sans-serif;padding:9px 0;border-bottom:1.5px dashed color-mix(in srgb,var(--ink) 35%,transparent)}
.sc .sc-cta{display:flex;flex-direction:column;align-items:flex-start;gap:12px;margin-top:32px}
.sc .sc-cta b{background:var(--btn);color:var(--btnInk);${COND};font-weight:700;font-size:35px;text-transform:uppercase;letter-spacing:.02em;padding:16px 26px;border-radius:10px;white-space:nowrap}
.sc .sc-cta span{font:600 27px IN,sans-serif;color:var(--muted);display:flex;align-items:center;gap:12px}
.sc .sc-suave{margin-top:26px;font:italic 500 34px/1.3 PF,serif;color:var(--hi)}
.sc .sc-suave svg{margin-left:10px}
.sc .sc-idx{color:var(--ink);letter-spacing:.12em;font-size:30px}
.sc .sc-desl{font:400 34px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:12px;letter-spacing:0;text-transform:none}
.sc .sc-ft{position:absolute;left:64px;right:64px;bottom:52px;height:60px;display:flex;align-items:center;gap:22px;${COND};font-weight:600;font-size:26px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted)}
.sc .sc-ft i{flex:1;height:1.5px;background:color-mix(in srgb,var(--ink) 35%,transparent)}
</style>
<div style="position:absolute;inset:0;background:radial-gradient(circle at 72% 30%,var(--bg2),transparent 62%)"></div>
<div class="sc-grao"></div>
<div class="sc-eco"></div>
<svg class="sc-selo" viewBox="0 0 600 600">
  <defs>
    <path id="sc-circ" d="M300 ${300 - R}A${R} ${R} 0 1 1 ${300 - 0.01} ${300 - R}"/>
  </defs>
  <g>
    <circle cx="300" cy="300" r="290" fill="none" stroke="${c.hi}" stroke-width="10"/>
    <circle cx="300" cy="300" r="274" fill="none" stroke="${c.hi}" stroke-width="2.5"/>
    <circle cx="300" cy="300" r="190" fill="none" stroke="${c.hi}" stroke-width="2.5"/>
    <circle cx="300" cy="300" r="180" fill="none" stroke="${c.hi}" stroke-width="8"/>
    <text style="${COND};font-weight:700;font-size:44px" fill="${c.hi}"><textPath href="#sc-circ" textLength="${(circ - 8).toFixed(0)}" lengthAdjust="spacing" dominant-baseline="central">${n.esc(anel)}</textPath></text>
    ${centro}
  </g>
</svg>
<div class="sc-logo">${n.logo({ altura: 128, placa: p.placaLogo })}</div>
<div class="sc-hd"><i></i><span>Curitiba</span>${s.idx ? `<span class="sc-idx">${n.esc(s.idx)}</span>` : ''}</div>
<div class="sc-in">
  ${s.eyebrow ? `<p class="sc-eb"><i></i>${n.esc(s.eyebrow)}</p>` : ''}
  <h1 class="sc-h">${n.esc(s.title)}</h1>
  ${corpo}${cta}
</div>
<div class="sc-ft">${ESTRELA(26, 'var(--hi)')}<i></i>${s.deslize && !s.cta ? `<span class="sc-desl">deslize ${SETA(46, 'currentColor')}</span>` : ''}</div>
</div>`;
  },
};

module.exports = [posterTipografico, quadroCardapio, numeroGigante, bilhetePedido, conversaWhatsapp, celebracao, faixaDiagonal, seloCarimbo];
