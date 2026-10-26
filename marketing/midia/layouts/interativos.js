// Formatos interativos (feed 1080x1080): quiz, este-ou-aquele, checklist, caça-palavras, frase de efeito,
// fluxo do pedido e "você sabia?". Ver CATALOGO.md, seção "Formatos interativos (v2.1)".
// O tipo de conteúdo chega em s.tipo (ou s.layout dos SLIDES). Cores sempre via paleta, com contraste conferido aqui.

// ---------------------------------------------------------------- helpers
const COND = "font-family:Bahnschrift,'Arial Narrow',sans-serif;font-stretch:75%";
const BAHN = "font-family:Bahnschrift,'Arial Narrow',sans-serif";
const PAPEL = '#fffaf0', TINTA = '#1c1712', TINTA2 = '#55493b', VERM = '#b3141f';

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
  return lista.find((c) => contraste(c, fundo) >= min) || lista.slice().sort((a, b) => contraste(b, fundo) - contraste(a, fundo))[0];
}
/** Mistura linear de duas cores hex (t = 0 → a, 1 → b). */
function misturar(a, b, t) {
  const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16));
  const A = rgb(a), B = rgb(b);
  return `#${A.map((v, i) => Math.round(v * (1 - t) + B[i] * t).toString(16).padStart(2, '0')).join('')}`;
}
/** Cores derivadas da paleta: hi (destaque legível no fundo), btn/btnInk (botão), hiInk (texto/ícone sobre hi). */
function cores(p) {
  const hi = [p.accent, p.accent2, p.ink].find((c) => contraste(c, p.bg) >= 4.5 && contraste(c, p.bg2) >= 4.5) || p.ink;
  let btn = p.accent, btnInk = p.bg;
  if (contraste(p.accent, p.bg) < 4.5) [btn, btnInk] = contraste('#ffffff', p.accent2) >= 4.5 ? [p.accent2, '#ffffff'] : [p.ink, p.bg];
  const hiInk = legivel(hi, [p.bg, p.ink, '#161310', '#ffffff']);
  return { hi, btn, btnInk, hiInk };
}
const vars = (n, p, extra = {}) => {
  const c = cores(p);
  const all = { ...c, ...extra };
  return `${n.varsCss(p)};${Object.entries(all).map(([k, v]) => `--${k}:${v}`).join(';')}`;
};

/** Grão (ruído) em SVG embutido como imagem; use com mix-blend-mode:overlay. */
function grao(op = 0.55, freq = 0.8) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 ${op}'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/** Gerador pseudoaleatório determinístico (mesma semente = mesmo resultado). */
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

/**
 * Ajuste no navegador: [data-fit] recebe a fonte que faz a linha ocupar a largura (entre data-min e data-max);
 * [data-caixa] reduz a fonte do primeiro filho (filhos internos em em) até caber na caixa (mínimo data-min).
 */
const FIT_JS = `<script>(function(){
function fit(){
  document.querySelectorAll('[data-fit]').forEach(function(el){
    var alvo=+el.getAttribute('data-fit'),max=+(el.getAttribute('data-max')||600),min=+(el.getAttribute('data-min')||22);
    el.style.fontSize='100px';var w=el.scrollWidth||1;
    el.style.fontSize=Math.max(min,Math.min(max,100*alvo/w))+'px';
  });
  document.querySelectorAll('[data-caixa]').forEach(function(box){
    var inn=box.firstElementChild;if(!inn)return;
    if(!inn.getAttribute('data-fs0'))inn.setAttribute('data-fs0',parseFloat(getComputedStyle(inn).fontSize));
    var fs=+inn.getAttribute('data-fs0'),min=+(box.getAttribute('data-min')||40),i=0;inn.style.fontSize=fs+'px';
    var cs=getComputedStyle(box),limH=function(){return box.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)},limW=box.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
    while((inn.offsetHeight>limH()+1||inn.scrollWidth>limW+1)&&fs>min&&i<80){fs=Math.max(min,fs*.96);inn.style.fontSize=fs+'px';i++;}
  });
}
fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
})();</script>`;

const ESTRELA = (t, cor, estilo = '') => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" style="${estilo}"><path d="M12 0C12.8 7.2 16.8 11.2 24 12C16.8 12.8 12.8 16.8 12 24C11.2 16.8 7.2 12.8 0 12C7.2 11.2 11.2 7.2 12 0Z" fill="${cor}"/></svg>`;
const SETA = (t, cor) => `<svg width="${t}" height="${Math.round(t * 0.5)}" viewBox="0 0 40 20" style="display:inline-block;vertical-align:middle;flex:none"><path d="M0 10H36M28 2L37 10L28 18" fill="none" stroke="${cor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/** Balão de comentário genérico (não é logo de nenhuma rede). */
const BALAO = (t, cor) => `<svg width="${t}" height="${t}" viewBox="0 0 48 48" style="flex:none"><path d="M9 9h30a5 5 0 0 1 5 5v17a5 5 0 0 1-5 5H23l-9 8v-8H9a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5z" fill="none" stroke="${cor}" stroke-width="3.4" stroke-linejoin="round"/><circle cx="16" cy="22.5" r="2.7" fill="${cor}"/><circle cx="24" cy="22.5" r="2.7" fill="${cor}"/><circle cx="32" cy="22.5" r="2.7" fill="${cor}"/></svg>`;

/** Título com o final em <em> (itálico de destaque): parte após a última pontuação interna ou as últimas palavras. */
function destaqueFinal(n, texto, maxPal = 3) {
  const t = String(texto || '').trim();
  const m = /^(.{8,}[,.:;!?—–])\s+(\S.*)$/.exec(t);
  if (m && m[2].split(/\s+/).length <= 8) return `${n.esc(m[1])} <em>${n.esc(m[2])}</em>`;
  const w = t.split(/\s+/);
  if (w.length < 3) return n.esc(t);
  const k = Math.min(maxPal, Math.ceil(w.length / 3));
  return `${n.esc(w.slice(0, -k).join(' '))} <em>${n.esc(w.slice(-k).join(' '))}</em>`;
}

/** Faixa de CTA forte no rodapé (texto exato + "link na bio"). */
const faixaCta = (n, cls) => `<div class="${cls}"><b>${n.CTA_FORTE}</b><span>link na bio ${SETA(46, 'currentColor')}</span></div>`;
const cssFaixa = (sel, h = 124, pad = 64) => `${sel}{position:absolute;left:0;right:0;bottom:0;height:${h}px;background:var(--btn);color:var(--btnInk);display:flex;align-items:center;justify-content:space-between;padding:0 ${pad}px;z-index:6}
${sel} b{${COND};font-weight:700;font-size:52px;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap}
${sel} span{font:600 28px IN,sans-serif;display:flex;align-items:center;gap:14px;white-space:nowrap}`;

// ---------------------------------------------------------------- 1. quiz-opcoes
const quizOpcoes = {
  id: 'quiz-opcoes',
  formato: 'feed',
  usa: 'texto',
  tipos: ['quiz'],
  paletas: ['noite', 'creme', 'tomate'],
  descricao: 'Quiz de múltipla escolha: pergunta em Playfair com final em itálico, opções A–D em botões com sombra deslocada, interrogação gigante ao fundo e instrução com balão de comentário.',
  async render(s, { n, p }) {
    const ops = (s.opcoes || []).filter(Boolean).slice(0, 4);
    const maxOp = Math.max(0, ...ops.map((o) => o.length));
    // modos: 'tiles' (2-3 opções curtas em colunas, letra em cima), 'grade' (4 curtas em 2x2) ou lista
    const tiles = ops.length <= 3 && maxOp <= 9;
    const grade = !tiles && ops.length === 4 && maxOp <= 13;
    const forte = s.cta === 'forte';
    const compacto = !grade && !tiles && ops.length >= 4;
    const fo = tiles ? (maxOp <= 6 ? 58 : 50) : grade ? 46 : maxOp <= 14 ? 46 : maxOp <= 24 ? (compacto ? 36 : 40) : (compacto ? 32 : 36);
    const bq = tiles ? 96 : grade ? 84 : compacto ? 64 : 74;
    const cols = tiles ? ops.length : grade ? 2 : 1;
    const ts = n.tamanho(s.title, [[30, 104], [45, 88], [65, 74], [90, 62], [999, 54]]);
    const instr = (s.lines || []).filter(Boolean);
    const card = `color-mix(in srgb,var(--bg) 88%,var(--ink))`;
    const opsHtml = ops.map((o, i) => `<div class="qz-op"><b>${'ABCD'[i]}</b><span>${n.esc(o)}</span></div>`).join('');
    return `<div class="qz" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.qz .qz-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.28}
.qz .qz-pt{position:absolute;inset:0;background:radial-gradient(circle,color-mix(in srgb,var(--ink) 10%,transparent) 2px,transparent 2.6px) 0 0/36px 36px}
.qz .qz-q{position:absolute;right:-30px;top:-40px;font:italic 900 1000px/1 PF,serif;color:var(--hi);opacity:.11}
.qz .qz-w{position:absolute;inset:0;padding:54px 64px ${forte ? 162 : 54}px;display:flex;flex-direction:column}
.qz .qz-hd{display:flex;align-items:center;justify-content:space-between;min-height:${p.placaLogo ? 132 : 110}px}
.qz .qz-eb{display:flex;align-items:center;gap:22px}
.qz .qz-pill{display:flex;align-items:center;gap:12px;border:3px solid var(--hi);color:var(--hi);border-radius:999px;padding:9px 26px 9px 12px;${COND};font-weight:700;font-size:32px;letter-spacing:.24em;text-transform:uppercase}
.qz .qz-pill i{width:40px;height:40px;border-radius:50%;background:var(--hi);color:var(--hiInk);font:italic 800 30px/40px PF,serif;text-align:center;letter-spacing:0}
.qz .qz-idx{${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:var(--muted)}
.qz .qz-tt{flex:1;min-height:0;display:flex;align-items:center;padding:20px 0 26px}
.qz .qz-h{font:800 ${ts}px/1.06 PF,serif;letter-spacing:-.012em;max-width:900px;text-wrap:balance}
.qz .qz-h em{font-style:italic;font-weight:700;color:var(--hi)}
.qz .qz-ops{display:grid;grid-template-columns:repeat(${cols},1fr);gap:${tiles || grade ? 28 : compacto ? 16 : 20}px 34px;padding-right:10px}
.qz .qz-op{display:flex;align-items:center;gap:24px;min-height:${grade ? 124 : 0}px;padding:${grade ? 20 : compacto ? 11 : 15}px 28px ${grade ? 20 : compacto ? 11 : 15}px ${grade ? 20 : 14}px;border:4px solid var(--ink);border-radius:24px;background:${card};box-shadow:9px 9px 0 var(--hi);font:700 ${fo}px/1.12 IN,sans-serif;letter-spacing:-.01em}
.qz .qz-op span{text-wrap:balance}
${tiles ? `.qz .qz-op{flex-direction:column;align-items:flex-start;justify-content:space-between;gap:30px;min-height:${ops.length === 2 ? 250 : 236}px;padding:22px 26px 26px}` : ''}
.qz .qz-op b{flex:none;width:${bq}px;height:${bq}px;border-radius:18px;background:var(--ink);color:var(--bg);display:flex;align-items:center;justify-content:center;${BAHN};font-weight:700;font-size:${Math.round(bq * 0.6)}px}
.qz .qz-ft{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:40px;min-height:48px}
.qz .qz-in{display:flex;align-items:center;gap:16px;font:600 34px IN,sans-serif;color:var(--ink)}
.qz .qz-suave{display:flex;align-items:center;gap:12px;font:italic 600 34px PF,serif;color:var(--hi);margin-top:14px}
.qz .qz-desl{font:400 34px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:12px;white-space:nowrap}
${cssFaixa('.qz .qz-cta')}
</style>
<div class="qz-pt"></div><div class="qz-grao"></div>
<div class="qz-q">?</div>
<div class="qz-w">
  <div class="qz-hd">
    <div class="qz-eb">${s.eyebrow ? `<span class="qz-pill"><i>?</i>${n.esc(s.eyebrow)}</span>` : ''}${s.idx ? `<span class="qz-idx">${n.esc(s.idx)}</span>` : ''}</div>
    ${n.logo({ altura: 104, placa: p.placaLogo })}
  </div>
  <div class="qz-tt" data-caixa data-min="44"><h1 class="qz-h">${destaqueFinal(n, s.title, 2)}</h1></div>
  <div class="qz-ops">${opsHtml}</div>
  ${instr.length || s.deslize ? `<div class="qz-ft">${instr.length ? `<span class="qz-in">${BALAO(52, 'var(--hi)')}${n.esc(instr[0])}</span>` : '<span></span>'}${s.deslize ? `<span class="qz-desl">deslize ${SETA(46, 'currentColor')}</span>` : ''}</div>` : ''}
  ${s.cta === 'suave' ? `<p class="qz-suave">${n.CTA_SUAVE} ${SETA(44, 'currentColor')}</p>` : ''}
</div>
${forte ? faixaCta(n, 'qz-cta') : ''}
${FIT_JS}
</div>`;
  },
};

// ---------------------------------------------------------------- 2. este-ou-aquele
const esteOuAquele = {
  id: 'este-ou-aquele',
  formato: 'feed',
  usa: 'ambos',
  tipos: ['versus'],
  paletas: ['carvao', 'creme', 'ouro'],
  descricao: 'Este ou aquele: duas metades com corte diagonal e selo "OU" no centro; com s.fotos, cada metade é a foto da pizza (com "Foto ilustrativa"); sem fotos, metades em cores da paleta com a opção em tipografia condensada gigante.',
  async render(s, { n, p }) {
    const [a = '', b = ''] = s.opcoes || [];
    const fotos = Array.isArray(s.fotos) && s.fotos.filter(Boolean).length >= 2 ? s.fotos : null;
    const forte = s.cta === 'forte';
    const instr = (s.lines || []).filter(Boolean)[0] || '';
    const instrTopo = !!(s.cta && instr);
    const temRow = !!(s.eyebrow || s.idx || s.deslize);
    const T = 250 + (instrTopo ? 56 : 0) + (temRow ? 40 : 0);
    const B = 136;
    const H = 1080 - T - B;
    const ts = n.tamanho(s.title, [[22, 84], [36, 74], [56, 62], [999, 54]]);
    const titulo = n.esc(s.title).replace(/(^|\s)(ou)(?=\s)/i, '$1<em>$2</em>');
    // cores das metades sem foto: A = accent2, B = ink (texto no tom de maior contraste)
    let corA = p.accent2;
    const tintasA = ['#ffffff', p.ink, p.bg, '#161310'];
    // se nenhuma tinta chega a 4,5:1 sobre o accent2 (ex.: manjericão), escurece a metade A aos poucos
    for (let k = 1; k <= 6 && !tintasA.some((c) => contraste(c, corA) >= 4.5); k++) corA = misturar(p.accent2, '#000000', k * 0.06);
    const inkA = legivel(corA, tintasA);
    const corB = p.ink, inkB = p.bg;
    const fA = fotos ? await n.foto(fotos[0], 590, H) : null;
    const fB = fotos ? await n.foto(fotos[1], 590, H) : null;
    const metade = (lado, txt, foto, cor, tinta) => {
      const esq = lado === 'A';
      const curto = txt.length <= 11;
      const label = curto
        ? `<span class="vs-lb" data-fit="400" data-max="150" data-min="56">${n.esc(txt)}</span>`
        : `<span class="vs-lb vs-lb2">${n.esc(txt)}</span>`;
      return `<div class="vs-m vs-${esq ? 'a' : 'b'}${foto ? ' vs-f' : ''}" style="${foto ? `background:#141414 url('${foto}') center/cover` : `background:${cor}`};color:${foto ? '#fff8ee' : tinta}">
    ${foto ? '<i class="vs-gr"></i>' : `<span class="vs-wm">${lado}</span><i class="vs-tex"></i>`}
    <div class="vs-tx"><span class="vs-chip">${lado}</span>${label}</div>
    ${foto ? n.seloIlustrativa({ estilo: esq ? 'left:30px;top:28px' : 'right:30px;top:28px' }) : ''}
  </div>`;
    };
    const rodapeDir = forte
      ? `<div class="vs-pill"><b>${n.CTA_FORTE}</b><span>link na bio ${SETA(40, 'currentColor')}</span></div>`
      : s.cta === 'suave' ? `<span class="vs-suave">${n.CTA_SUAVE} ${SETA(44, 'currentColor')}</span>`
        : instr ? `<span class="vs-in">${BALAO(52, 'var(--hi)')}${n.esc(instr)}</span>` : '<span class="vs-orn">Disk Pizza · Curitiba</span>';
    return `<div class="vs" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.vs .vs-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.28;z-index:1;pointer-events:none}
.vs .vs-top{position:absolute;left:0;right:0;top:0;height:${T}px;padding:${temRow ? 40 : 46}px 64px 28px;display:flex;flex-direction:column}
.vs .vs-row{display:flex;justify-content:space-between;align-items:center;height:40px}
.vs .vs-eb{${COND};font-weight:700;font-size:30px;letter-spacing:.28em;text-transform:uppercase;color:var(--hi)}
.vs .vs-ri{display:flex;align-items:center;gap:26px}
.vs .vs-idx{${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:var(--muted)}
.vs .vs-desl{font:400 32px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:10px}
.vs .vs-tt{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;text-align:center}
.vs .vs-h{font:800 ${ts}px/1.05 PF,serif;letter-spacing:-.012em;max-width:960px;text-wrap:balance}
.vs .vs-h em{font-style:italic;font-weight:700;color:var(--hi);padding:0 .06em}
.vs .vs-it{display:flex;align-items:center;justify-content:center;gap:14px;font:600 30px IN,sans-serif;color:var(--ink);margin-top:6px}
.vs .vs-m{position:absolute;top:${T}px;height:${H}px;width:590px;overflow:hidden}
.vs .vs-a{left:0;clip-path:polygon(0 0,569px 0,499px 100%,0 100%)}
.vs .vs-b{left:490px;clip-path:polygon(91px 0,100% 0,100% 100%,21px 100%)}
.vs .vs-gr{position:absolute;inset:0;background:linear-gradient(0deg,rgba(12,9,6,.9) 0,rgba(12,9,6,.66) 30%,rgba(12,9,6,0) 60%)}
.vs .vs-tex{position:absolute;inset:0;background:repeating-linear-gradient(-58deg,transparent 0 26px,color-mix(in srgb,currentColor 7%,transparent) 26px 28px)}
.vs .vs-wm{position:absolute;top:50%;transform:translateY(-54%);font:italic 900 620px/1 PF,serif;opacity:.1}
.vs .vs-a .vs-wm{right:70px}
.vs .vs-b .vs-wm{left:120px}
.vs .vs-tx{position:absolute;display:flex;flex-direction:column;gap:18px}
.vs .vs-a .vs-tx{left:60px;width:420px;align-items:flex-start;text-align:left}
.vs .vs-b .vs-tx{right:60px;width:420px;align-items:flex-end;text-align:right}
.vs .vs-m:not(.vs-f) .vs-tx{top:44px;bottom:50px;justify-content:space-between}
.vs .vs-f .vs-tx{bottom:40px}
.vs .vs-chip{width:68px;height:68px;border-radius:50%;border:4px solid currentColor;display:flex;align-items:center;justify-content:center;${BAHN};font-weight:700;font-size:38px;line-height:1}
.vs .vs-lb{display:block;width:max-content;white-space:nowrap;${COND};font-weight:700;text-transform:uppercase;line-height:.92;letter-spacing:.005em}
.vs .vs-lb2{width:auto;max-width:420px;white-space:normal;font-size:70px;text-wrap:balance}
.vs .vs-ou{position:absolute;left:450px;top:${T + H / 2 - 90}px;width:180px;height:180px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;box-shadow:0 16px 34px rgba(0,0,0,.38);z-index:2}
.vs .vs-ou:before{content:"";position:absolute;inset:12px;border-radius:50%;border:3px solid var(--hi)}
.vs .vs-ou b{font:italic 900 66px/1 PF,serif;color:var(--ink);letter-spacing:.02em;padding-right:.06em}
.vs .vs-ou svg{position:absolute}
.vs .vs-bot{position:absolute;left:0;right:0;bottom:0;height:${B}px;display:flex;align-items:center;justify-content:space-between;gap:30px;padding:0 56px}
.vs .vs-in{display:flex;align-items:center;gap:16px;font:600 34px IN,sans-serif;color:var(--ink)}
.vs .vs-suave{display:flex;align-items:center;gap:12px;font:italic 600 36px PF,serif;color:var(--hi)}
.vs .vs-orn{${COND};font-weight:600;font-size:30px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted)}
.vs .vs-pill{display:flex;align-items:center;gap:22px;background:var(--btn);color:var(--btnInk);border-radius:999px;padding:16px 30px 16px 36px}
.vs .vs-pill b{${COND};font-weight:700;font-size:44px;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap}
.vs .vs-pill span{font:600 26px IN,sans-serif;display:flex;align-items:center;gap:10px;white-space:nowrap}
</style>
<div class="vs-top">
  ${temRow ? `<div class="vs-row"><span class="vs-eb">${n.esc(s.eyebrow || '')}</span><span class="vs-ri">${s.deslize ? `<span class="vs-desl">deslize ${SETA(44, 'currentColor')}</span>` : ''}${s.idx ? `<span class="vs-idx">${n.esc(s.idx)}</span>` : ''}</span></div>` : ''}
  <div class="vs-tt" data-caixa data-min="42"><h1 class="vs-h">${titulo}</h1></div>
  ${instrTopo ? `<p class="vs-it">${BALAO(46, 'var(--hi)')}${n.esc(instr)}</p>` : ''}
</div>
${metade('A', a, fA, corA, inkA)}
${metade('B', b, fB, corB, inkB)}
<div class="vs-ou">${ESTRELA(30, 'var(--hi)', 'left:-6px;top:22px')}${ESTRELA(22, 'var(--hi)', 'right:0;bottom:24px')}<b>OU</b></div>
<div class="vs-bot">${n.logo({ altura: 86, placa: p.placaLogo })}${rodapeDir}</div>
<div class="vs-grao"></div>
${FIT_JS}
</div>`;
  },
};

// ---------------------------------------------------------------- 3. checklist
const checklist = {
  id: 'checklist',
  formato: 'feed',
  usa: 'texto',
  tipos: ['checklist'],
  paletas: ['manjericao', 'creme', 'tomate'],
  descricao: 'Bloco de notas espiralado sobre a paleta: margem vermelha, pauta, título em Playfair e itens com caixinhas marcadas à mão; lápis ao lado e etiqueta de CTA.',
  async render(s, { n, p }) {
    const itens = (s.lines || []).filter(Boolean).slice(0, 6);
    const forte = s.cta === 'forte';
    const PX = 64, PT = 70, PW = 770, PH = forte ? 800 : 948;
    const k = itens.length;
    const maxL = Math.max(0, ...itens.map((l) => l.length));
    let fi = k <= 3 ? 44 : k === 4 ? 41 : k === 5 ? 38 : 35;
    if (maxL > 28) fi -= 3;
    if (forte && k >= 5) fi -= 2;
    const rowH = Math.round((forte ? 0.84 : 1) * (k <= 3 ? 112 : k === 4 ? 104 : k === 5 ? 94 : 84));
    const ts = n.tamanho(s.title, [[18, 80], [30, 68], [48, 58], [999, 50]]);
    const r = rnd(`checklist|${s.title}`);
    const j = (v) => (v + (r() - 0.5) * 4).toFixed(1);
    const caixa = () => `<svg width="56" height="56" viewBox="0 0 56 56" style="flex:none;overflow:visible"><path d="M${j(7)} ${j(12)}L${j(45)} ${j(9)}L${j(47)} ${j(48)}L${j(6)} ${j(49)}Z" fill="none" stroke="${TINTA}" stroke-width="3.2" stroke-linejoin="round"/><path d="M${j(13)} ${j(29)}C${j(18)} ${j(33)} ${j(21)} ${j(38)} ${j(24)} ${j(44)}C${j(31)} ${j(28)} ${j(42)} ${j(12)} ${j(58)} ${j(-4)}" fill="none" stroke="${VERM}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const lista = itens.map((l) => `<div class="ck-it">${caixa()}<span>${n.esc(l)}</span></div>`).join('');
    const aneis = Array.from({ length: 13 }, (_, i) => 70 + i * 52).filter((x) => x < PW - 40)
      .map((x) => `<circle cx="${x}" cy="34" r="9" fill="var(--bg)"/><rect x="${x - 7}" y="-24" width="14" height="60" rx="7" fill="none" stroke="#8d9298" stroke-width="5"/><rect x="${x - 4}" y="-20" width="4" height="34" rx="2" fill="#d9dde1"/>`).join('');
    const lapis = `<svg class="ck-lap" width="200" height="640" viewBox="0 0 200 640"><g transform="rotate(9 100 320)">
      <rect x="72" y="20" width="56" height="64" rx="12" fill="#e98a9b"/>
      <rect x="70" y="78" width="60" height="46" fill="#b8bdc2"/><path d="M70 92H130M70 108H130" stroke="#8d9298" stroke-width="3"/>
      <rect x="72" y="124" width="56" height="400" fill="var(--pencil)"/><rect x="72" y="124" width="18" height="400" fill="rgba(255,255,255,.22)"/><rect x="110" y="124" width="18" height="400" fill="rgba(0,0,0,.14)"/>
      <path d="M72 524L128 524L100 604Z" fill="#ecc89a"/><path d="M90 576L110 576L100 604Z" fill="#2b2622"/></g></svg>`;
    const pencil = contraste(p.accent, p.bg) >= 2 ? p.accent : p.accent2;
    return `<div class="ck" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p, { pencil })}">
<style>
.ck .ck-fundo{position:absolute;inset:0;background:radial-gradient(circle,color-mix(in srgb,var(--ink) 13%,transparent) 2px,transparent 2.6px) 0 0/34px 34px}
.ck .ck-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.3}
.ck .ck-papel{position:absolute;left:${PX}px;top:${PT}px;width:${PW}px;height:${PH}px;transform:rotate(-1.6deg);background:linear-gradient(180deg,#fffdf8,${PAPEL} 50%,#f8f0e0);border-radius:10px;box-shadow:0 26px 40px rgba(0,0,0,.34),0 3px 6px rgba(0,0,0,.2);color:${TINTA}}
.ck .ck-papel:after{content:"";position:absolute;inset:0;border-radius:10px;background-image:${grao(0.5, 1.2)};mix-blend-mode:multiply;opacity:.16}
.ck .ck-mg{position:absolute;left:96px;top:0;bottom:0;width:3px;background:${VERM};opacity:.55}
.ck .ck-esp{position:absolute;left:0;top:0;overflow:visible}
.ck .ck-in{position:absolute;left:128px;right:52px;top:74px;bottom:${s.cta === 'suave' ? 30 : 46}px;display:flex;flex-direction:column}
.ck .ck-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
.ck .ck-eb{font:400 40px/1.2 'Segoe Script',cursive;color:${VERM};transform:rotate(-2deg);transform-origin:left;margin-top:8px}
.ck .ck-tt{flex:1;min-height:0;display:flex;align-items:center;padding:6px 0 14px}
.ck .ck-h{font:800 ${ts}px/1.06 PF,serif;letter-spacing:-.01em;text-wrap:balance}
.ck .ck-it{display:flex;align-items:center;gap:22px;min-height:${rowH}px;border-bottom:2.5px solid rgba(52,96,160,.32);font:600 ${fi}px/1.16 IN,sans-serif;padding:6px 0}
.ck .ck-it:first-child{border-top:2.5px solid rgba(52,96,160,.32)}
.ck .ck-it span{text-wrap:balance}
.ck .ck-suave{display:flex;align-items:center;gap:12px;margin-top:18px;font:400 34px 'Segoe Script',cursive;color:${VERM}}
.ck .ck-lap{position:absolute;left:${PX + PW + 20}px;top:${forte ? 150 : 250}px}
.ck .ck-idx{position:absolute;right:52px;top:58px;${COND};font-weight:600;font-size:32px;letter-spacing:.12em;color:var(--ink)}
.ck .ck-desl{position:absolute;right:40px;bottom:${forte ? 200 : 52}px;font:400 34px 'Segoe Script',cursive;color:var(--hi);display:flex;flex-direction:column;align-items:center;gap:2px}
.ck .ck-tag{position:absolute;left:${PX - 14}px;bottom:40px;width:900px;height:136px;transform:rotate(1deg);background:var(--btn);color:var(--btnInk);display:flex;align-items:center;justify-content:space-between;gap:26px;padding:0 66px 0 70px;box-shadow:0 14px 28px rgba(0,0,0,.32);clip-path:polygon(0 0,100% 0,calc(100% - 26px) 50%,100% 100%,0 100%,26px 50%)}
.ck .ck-tag b{${COND};font-weight:700;font-size:46px;line-height:1;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap}
.ck .ck-tag span{font:600 27px IN,sans-serif;display:flex;align-items:center;gap:12px;white-space:nowrap}
</style>
<div class="ck-fundo"></div><div class="ck-grao"></div>
${lapis}
<div class="ck-papel">
  <div class="ck-mg"></div>
  <svg class="ck-esp" width="${PW}" height="50" viewBox="0 0 ${PW} 50">${aneis}</svg>
  <div class="ck-in">
    <div class="ck-hd"><span class="ck-eb">${n.esc(s.eyebrow || '')}</span>${n.logo({ altura: 82, placa: true })}</div>
    <div class="ck-tt" data-caixa data-min="40"><h1 class="ck-h">${n.esc(s.title)}</h1></div>
    <div class="ck-list">${lista}</div>
    ${s.cta === 'suave' ? `<p class="ck-suave">${n.CTA_SUAVE} ${SETA(44, VERM)}</p>` : ''}
  </div>
</div>
${s.idx ? `<span class="ck-idx">${n.esc(s.idx)}</span>` : ''}
${s.deslize ? `<span class="ck-desl">deslize ${SETA(54, 'currentColor')}</span>` : ''}
${forte ? `<div class="ck-tag"><b>${n.CTA_FORTE}</b><span>link na bio ${SETA(40, 'currentColor')}</span></div>` : ''}
${FIT_JS}
</div>`;
  },
};

// ---------------------------------------------------------------- 4. caca-palavras
/** Maiúsculas sem acento, só letras. */
const normaliza = (w) => String(w || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');

/**
 * Caça-palavras determinístico: palavras na horizontal (esq→dir) e vertical (cima→baixo), alternando a direção
 * preferida; preenche o resto com letras de semente fixa e garante que cada palavra apareça uma única vez.
 */
function gerarGrade(palavras, tamMin = 10) {
  const ws = [...new Set((palavras || []).map(normaliza).filter((w) => w.length >= 2))];
  const ordem = ws.slice().sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
  const LETRAS = 'AABCCDEEFGHIIJLMMNNOOPQRRSSTTUUVXZ';
  const conta = (g, w) => {
    const N = g.length;
    let k = 0;
    for (let i = 0; i < N; i++) {
      const lin = g[i].join(''), col = g.map((row) => row[i]).join('');
      for (const t of [lin, col]) for (let x = t.indexOf(w); x >= 0; x = t.indexOf(w, x + 1)) k++;
    }
    return k;
  };
  for (let N = Math.max(tamMin, ...ordem.map((w) => w.length)); N <= 16; N++) {
    for (let tent = 0; tent < 30; tent++) {
      const r = rnd(`caca|${N}|${tent}|${ordem.join(',')}`);
      const g = Array.from({ length: N }, () => Array(N).fill(''));
      let ok = true;
      ordem.forEach((w, wi) => {
        if (!ok) return;
        const pref = wi % 2 ? 'V' : 'H';
        const cands = [];
        for (const d of ['H', 'V']) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          if ((d === 'H' ? x : y) + w.length <= N) cands.push({ d, x, y, k: r() + (d === pref ? 0 : 1) });
        }
        cands.sort((u, v) => u.k - v.k);
        const cabe = (c) => [...w].every((ch, i) => { const cel = c.d === 'H' ? g[c.y][c.x + i] : g[c.y + i][c.x]; return cel === '' || cel === ch; });
        const c = cands.find(cabe);
        if (!c) { ok = false; return; }
        [...w].forEach((ch, i) => { if (c.d === 'H') g[c.y][c.x + i] = ch; else g[c.y + i][c.x] = ch; });
      });
      if (!ok) continue;
      for (let semente = 0; semente < 30; semente++) {
        const rf = rnd(`disk-pizza|${semente}|${ordem.join(',')}`);
        const gg = g.map((row) => row.map((ch) => ch || LETRAS[Math.floor(rf() * LETRAS.length)]));
        if (ordem.every((w) => conta(gg, w) === 1)) return { N, g: gg, ws };
      }
    }
  }
  throw new Error(`caça-palavras: não coube (${ws.join(', ')})`);
}

const cacaPalavras = {
  id: 'caca-palavras',
  formato: 'feed',
  usa: 'texto',
  tipos: ['grade'],
  paletas: ['tomate', 'noite', 'creme'],
  descricao: 'Caça-palavras: grade de letras gerada de forma determinística a partir de s.palavras (horizontal e vertical) em cartão de papel, lista das palavras com caixinhas e lupa, título em Playfair.',
  async render(s, { n, p }) {
    const { N, g, ws } = gerarGrade(s.palavras);
    const forte = s.cta === 'forte';
    const G = forte ? 624 : 666;
    const cel = G / N;
    const fl = Math.max(30, Math.round(cel * 0.58));
    const ts = n.tamanho(s.title, [[14, 88], [24, 74], [40, 60], [999, 52]]);
    const [sub = '', ...extras] = (s.lines || []).filter(Boolean); // 1ª linha sob o título; as demais (ex.: 'Comente quantos você achou') na coluna da lista
    const TOP = forte ? 262 : 286;
    const CW = G + 36;
    const listX = 56 + CW + 40;
    const fw = ws.length >= 8 ? 30 : 33;
    const letras = g.map((row) => row.map((ch) => `<span>${ch}</span>`).join('')).join('');
    const lupa = `<svg width="66" height="66" viewBox="0 0 64 64"><circle cx="26" cy="26" r="17" fill="none" stroke="var(--hi)" stroke-width="5"/><path d="M38.5 38.5L56 56" stroke="var(--hi)" stroke-width="8" stroke-linecap="round"/><path d="M17 21a11 11 0 0 1 9-7" fill="none" stroke="var(--hi)" stroke-width="3.4" stroke-linecap="round"/></svg>`;
    return `<div class="cp" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.cp .cp-fundo{position:absolute;inset:0;background:radial-gradient(circle,color-mix(in srgb,var(--ink) 12%,transparent) 2px,transparent 2.6px) 0 0/34px 34px}
.cp .cp-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.3}
.cp .cp-hd{position:absolute;left:58px;right:${p.placaLogo ? 250 : 220}px;top:46px;height:${TOP - 72}px;display:flex;align-items:center}
.cp .cp-hi{font-size:${ts}px;width:100%}
.cp .cp-eb{display:flex;gap:20px;align-items:center;${COND};font-weight:700;font-size:max(24px,.36em);letter-spacing:.28em;text-transform:uppercase;color:var(--hi);margin-bottom:8px}
.cp .cp-eb .x{color:var(--muted);letter-spacing:.12em;font-weight:600}
.cp .cp-tt{min-height:0;flex:0 1 auto;display:flex;align-items:center}
.cp .cp-h{font:800 1em/1.02 PF,serif;letter-spacing:-.012em;text-wrap:balance}
.cp .cp-h em{font-style:italic;font-weight:700;color:var(--hi)}
.cp .cp-sub{font:500 max(26px,.38em)/1.3 IN,sans-serif;color:var(--muted);margin-top:.18em;text-wrap:balance}
.cp .cp-logo{position:absolute;right:58px;top:52px}
.cp .cp-card{position:absolute;left:56px;top:${TOP}px;width:${CW}px;height:${CW}px;background:${PAPEL};border-radius:22px;padding:18px;box-shadow:0 22px 38px rgba(0,0,0,.32),0 2px 5px rgba(0,0,0,.18);transform:rotate(-.6deg)}
.cp .cp-card:after{content:"";position:absolute;inset:0;border-radius:22px;background-image:${grao(0.5, 1.2)};mix-blend-mode:multiply;opacity:.14;pointer-events:none}
.cp .cp-g{width:${G}px;height:${G}px;display:grid;grid-template-columns:repeat(${N},1fr);grid-template-rows:repeat(${N},1fr);border:2.5px solid ${TINTA};border-radius:8px;background:
  linear-gradient(90deg,rgba(28,23,18,.12) 1.5px,transparent 1.5px) 0 0/${cel}px ${cel}px,
  linear-gradient(0deg,rgba(28,23,18,.12) 1.5px,transparent 1.5px) 0 0/${cel}px ${cel}px}
.cp .cp-g span{display:flex;align-items:center;justify-content:center;${BAHN};font-weight:600;font-size:${fl}px;color:${TINTA};line-height:1}
.cp .cp-ls{position:absolute;left:${listX}px;right:40px;top:${TOP + 4}px;height:${CW}px;display:flex;flex-direction:column}
.cp .cp-w{display:flex;align-items:center;gap:14px;padding:${ws.length >= 8 ? 8 : 11}px 0;border-bottom:2px dashed color-mix(in srgb,var(--ink) 30%,transparent);${COND};font-weight:700;font-size:${fw}px;letter-spacing:.06em;white-space:nowrap}
.cp .cp-w i{flex:none;width:30px;height:30px;border:3px solid var(--ink);border-radius:6px}
.cp .cp-bx{margin-top:auto;display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.cp .cp-idx{${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:var(--muted)}
.cp .cp-desl{font:400 32px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:10px}
.cp .cp-suave{font:italic 600 30px/1.2 PF,serif;color:var(--hi)}
.cp .cp-com{display:flex;gap:10px;align-items:flex-start;font:600 26px/1.3 IN,sans-serif;color:var(--ink)}
.cp .cp-com svg{flex:none;margin-top:2px}
${cssFaixa('.cp .cp-cta', 124, 58)}
</style>
<div class="cp-fundo"></div><div class="cp-grao"></div>
<div class="cp-hd" data-caixa data-min="44"><div class="cp-hi">
  ${s.eyebrow ? `<div class="cp-eb">${n.esc(s.eyebrow)}</div>` : ''}
  <h1 class="cp-h">${n.esc(s.title)}</h1>
  ${sub ? `<p class="cp-sub">${n.esc(sub)}</p>` : ''}
</div></div>
<div class="cp-logo">${n.logo({ altura: 104, placa: p.placaLogo })}</div>
<div class="cp-card"><div class="cp-g">${letras}</div></div>
<div class="cp-ls">
  <div style="margin:-6px 0 10px">${lupa}</div>
  ${ws.map((w) => `<div class="cp-w"><i></i>${w}</div>`).join('')}
  <div class="cp-bx">
    ${extras.map((l) => `<p class="cp-com"><svg width="30" height="30" viewBox="0 0 64 64"><path d="M10 12h44a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H30l-12 10V46h-8a5 5 0 0 1-5-5V17a5 5 0 0 1 5-5z" fill="none" stroke="var(--hi)" stroke-width="5" stroke-linejoin="round"/></svg><span>${n.esc(l)}</span></p>`).join('')}
    ${s.cta === 'suave' ? `<p class="cp-suave">${n.CTA_SUAVE}</p>` : ''}
    ${s.deslize ? `<span class="cp-desl">deslize ${SETA(44, 'currentColor')}</span>` : ''}
    ${s.idx ? `<span class="cp-idx">${n.esc(s.idx)}</span>` : ''}
  </div>
</div>
${forte ? faixaCta(n, 'cp-cta') : ''}
${FIT_JS}
</div>`;
  },
};

// ---------------------------------------------------------------- 5. frase-de-efeito
const fraseDeEfeito = {
  id: 'frase-de-efeito',
  formato: 'feed',
  usa: 'texto',
  tipos: ['frase'],
  paletas: ['tomate', 'carvao', 'ouro'],
  descricao: 'Frase de efeito: aspas gigantes em Playfair, frase enorme com o final em itálico de destaque, assinatura manuscrita opcional (s.sub) e moldura fina.',
  async render(s, { n, p }) {
    const forte = s.cta === 'forte';
    const ts = n.tamanho(s.title, [[24, 134], [40, 120], [60, 100], [90, 84], [999, 70]]);
    const temTopo = !!(s.eyebrow || s.idx);
    // assinatura manuscrita: cabe numa linha só (com o traço) até ~40 letras
    const tamAss = n.tamanho(String(s.sub || '').replace(/^\s*[—–-]\s*/, ''), [[28, 42], [34, 37], [999, 33]]);
    return `<div class="fe" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.fe .fe-luz{position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 30% 40%,color-mix(in srgb,var(--ink) 8%,transparent),transparent 70%)}
.fe .fe-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.32}
.fe .fe-mold{position:absolute;inset:32px;border:2px solid color-mix(in srgb,var(--ink) 28%,transparent);border-radius:6px}
.fe .fe-aq{position:relative;flex:none;height:140px;margin-left:-14px}
.fe .fe-aq span{position:absolute;left:0;top:-120px;font:900 440px/1 PF,serif;color:var(--hi)}
.fe .fe-af{position:absolute;right:72px;bottom:${forte ? -10 : -110}px;height:300px;font:900 300px/1 PF,serif;color:var(--hi);opacity:.18}
.fe .fe-top{position:absolute;left:84px;top:74px;display:flex;align-items:center;gap:22px}
.fe .fe-eb{display:flex;align-items:center;gap:16px;${COND};font-weight:700;font-size:30px;letter-spacing:.3em;text-transform:uppercase;color:var(--hi)}
.fe .fe-eb:before{content:"";width:46px;height:3px;background:var(--hi)}
.fe .fe-idx{${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:var(--muted)}
.fe .fe-logo{position:absolute;right:76px;top:62px}
.fe .fe-c{position:absolute;left:96px;right:96px;top:${temTopo ? 140 : 110}px;bottom:${forte ? 176 : s.cta || s.deslize ? 150 : 90}px;display:flex;flex-direction:column;justify-content:center}
.fe .fe-tt{flex:0 1 auto;min-height:0;display:flex;align-items:flex-start}
.fe .fe-h{font:800 ${ts}px/1.04 PF,serif;letter-spacing:-.015em;text-wrap:balance}
.fe .fe-h em{font-style:italic;font-weight:700;color:var(--hi)}
.fe .fe-ass{align-self:flex-end;display:flex;align-items:center;gap:18px;margin-top:22px;font:400 ${tamAss}px/1.2 'Segoe Script',cursive;color:var(--ink);text-align:right;max-width:100%}
.fe .fe-ass:before{content:"";flex:none;width:70px;height:2.5px;background:var(--hi)}
.fe .fe-bot{position:absolute;left:96px;right:96px;bottom:${forte ? 168 : 74}px;display:flex;align-items:center;justify-content:space-between}
.fe .fe-suave{display:flex;align-items:center;gap:12px;font:italic 600 36px PF,serif;color:var(--hi)}
.fe .fe-desl{font:400 34px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:12px;margin-left:auto}
${cssFaixa('.fe .fe-cta')}
</style>
<div class="fe-luz"></div><div class="fe-grao"></div>
${forte ? '' : '<div class="fe-mold"></div>'}
${s.cta === 'suave' || s.deslize ? '' : '<div class="fe-af">”</div>'}
${temTopo ? `<div class="fe-top">${s.eyebrow ? `<span class="fe-eb">${n.esc(s.eyebrow)}</span>` : ''}${s.idx ? `<span class="fe-idx">${n.esc(s.idx)}</span>` : ''}</div>` : ''}
<div class="fe-logo">${n.logo({ altura: 104, placa: p.placaLogo })}</div>
<div class="fe-c">
  <div class="fe-aq"><span>“</span></div>
  <div class="fe-tt" data-caixa data-min="48"><h1 class="fe-h">${destaqueFinal(n, s.title, 3)}</h1></div>
  ${s.sub ? `<p class="fe-ass">${n.esc(String(s.sub).replace(/^\s*[—–-]\s*/, ''))}</p>` : ''}
</div>
${s.cta === 'suave' || s.deslize ? `<div class="fe-bot">${s.cta === 'suave' ? `<span class="fe-suave">${n.CTA_SUAVE} ${SETA(44, 'currentColor')}</span>` : ''}${s.deslize ? `<span class="fe-desl">deslize ${SETA(46, 'currentColor')}</span>` : ''}</div>` : ''}
${forte ? faixaCta(n, 'fe-cta') : ''}
${FIT_JS}
</div>`;
  },
};

// ---------------------------------------------------------------- 6. fluxo-pedido
/** Ícones de linha (viewBox 64): celular, balão, confirmação, pizza, casa, carrinho. */
const ICONES = {
  celular: '<rect x="18" y="5" width="28" height="54" rx="6"/><path d="M28 51h8"/><path d="M24 16h16M24 24h16M24 32h10"/>',
  balao: '<path d="M10 12h44a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H30l-12 10V46h-8a5 5 0 0 1-5-5V17a5 5 0 0 1 5-5z"/><circle cx="21" cy="29" r="1.6"/><circle cx="32" cy="29" r="1.6"/><circle cx="43" cy="29" r="1.6"/>',
  check: '<circle cx="32" cy="32" r="25"/><path d="M20 33l8 8 16-17"/>',
  pizza: '<path d="M8 15C22 6 42 6 56 15L32 59Z"/><path d="M12 21C25 13 39 13 52 21"/><circle cx="26" cy="28" r="3.6"/><circle cx="38" cy="31" r="3.2"/><circle cx="31" cy="42" r="3"/>',
  casa: '<path d="M7 31L32 9l25 22"/><path d="M14 26v30h36V26"/><path d="M27 56V41h10v15"/>',
  carrinho: '<path d="M5 10h9l7 31h30l6-22H17"/><circle cx="25" cy="52" r="4.5"/><circle cx="47" cy="52" r="4.5"/>',
  tamanho: '<circle cx="32" cy="32" r="26"/><circle cx="32" cy="32" r="19"/><path d="M32 13v38M13 32h38M18.6 18.6l26.8 26.8M45.4 18.6L18.6 45.4"/>',
};
function iconeDe(texto, i) {
  const t = normaliza(texto).toLowerCase();
  if (/carrinho|cep/.test(t)) return 'carrinho';
  if (/tamanho|gigante|fatia/.test(t)) return 'tamanho';
  if (/whats|envi|mensag|conversa|chat/.test(t)) return 'balao';
  if (/confirm|confer|confira|aprova/.test(t)) return 'check';
  if (/chega|casa|porta|entreg|receb/.test(t)) return 'casa';
  if (/pizza|forno|prepar|sabor|tamanho|massa|borda/.test(t)) return 'pizza';
  if (/site|monte|clique|escolh|celular|link|acess/.test(t)) return 'celular';
  return ['celular', 'balao', 'check', 'casa', 'pizza'][i % 5];
}

const fluxoPedido = {
  id: 'fluxo-pedido',
  formato: 'feed',
  usa: 'texto',
  tipos: ['fluxo'],
  paletas: ['noite', 'creme', 'manjericao'],
  descricao: 'Infográfico de 3 a 5 etapas: círculos com ícones de linha (celular, balão, confirmação, pizza, casa), números em selos e caminho pontilhado em onda com setas.',
  async render(s, { n, p }) {
    const etapas = (s.lines || []).filter(Boolean).slice(0, 5);
    const k = Math.max(1, etapas.length);
    const forte = s.cta === 'forte';
    const ts = n.tamanho(s.title, [[24, 96], [40, 80], [60, 66], [999, 58]]);
    const D = k <= 3 ? 220 : k === 4 ? 184 : 156;
    const fl = k <= 3 ? 38 : k === 4 ? 34 : 29;
    const M = 44, colW = (1080 - 2 * M) / k;
    const ond = k <= 3 ? 80 : k === 4 ? 96 : 110;
    const top0 = p.placaLogo ? 352 : 340;
    const areaBot = forte ? 932 : (s.cta === 'suave' || s.deslize) ? 920 : 1010;
    const flowH = D + ond + 28 + fl * 1.2 * 2;
    const y0 = Math.round(top0 + Math.max(0, (areaBot - top0 - flowH) / 2));
    const pts = etapas.map((_, i) => ({ x: M + colW * (i + 0.5), y: y0 + D / 2 + (i % 2 ? ond : 0) }));
    let caminho = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const x1 = a.x + D / 2 + 12, x2 = b.x - D / 2 - 14, cx = (x1 + x2) / 2;
      caminho += `<path d="M${x1} ${a.y}C${cx} ${a.y} ${cx} ${b.y} ${x2} ${b.y}" fill="none" stroke="var(--hi)" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 13"/>`
        + `<path d="M${x2 - 13} ${b.y - 12}L${x2 + 1} ${b.y}L${x2 - 13} ${b.y + 12}" fill="none" stroke="var(--hi)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const usados = [];
    const nomes = etapas.map((e, i) => {
      let nm = iconeDe(e, i);
      if (usados.includes(nm)) nm = ['celular', 'pizza', 'tamanho', 'balao', 'check', 'carrinho', 'casa'].find((x) => !usados.includes(x)) || nm;
      usados.push(nm);
      return nm;
    });
    const nos = etapas.map((e, i) => {
      const c = pts[i];
      const ic = ICONES[nomes[i]];
      return `<div class="fx-no${i === k - 1 ? ' fx-ult' : ''}" style="left:${c.x - D / 2}px;top:${c.y - D / 2}px">
  <svg width="${Math.round(D * 0.5)}" height="${Math.round(D * 0.5)}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${ic}</svg>
  <b>${i + 1}</b></div>
<p class="fx-lb" style="left:${c.x - colW / 2 + 6}px;top:${c.y + D / 2 + 26}px;width:${colW - 12}px">${n.esc(e)}</p>`;
    }).join('');
    return `<div class="fx" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.fx .fx-fundo{position:absolute;inset:0;background:linear-gradient(color-mix(in srgb,var(--ink) 6%,transparent) 1.5px,transparent 1.5px) 0 0/54px 54px,linear-gradient(90deg,color-mix(in srgb,var(--ink) 6%,transparent) 1.5px,transparent 1.5px) 0 0/54px 54px}
.fx .fx-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.3}
.fx .fx-hd{position:absolute;left:64px;right:${p.placaLogo ? 250 : 230}px;top:56px;height:${top0 - 96}px;display:flex;flex-direction:column}
.fx .fx-eb{display:flex;align-items:center;gap:20px;${COND};font-weight:700;font-size:30px;letter-spacing:.28em;text-transform:uppercase;color:var(--hi);height:40px}
.fx .fx-eb .x{color:var(--muted);letter-spacing:.12em;font-weight:600}
.fx .fx-tt{flex:1;min-height:0;display:flex;align-items:center}
.fx .fx-h{font:800 ${ts}px/1.04 PF,serif;letter-spacing:-.012em;text-wrap:balance}
.fx .fx-h em{font-style:italic;font-weight:700;color:var(--hi)}
.fx .fx-logo{position:absolute;right:60px;top:56px}
.fx .fx-no{position:absolute;width:${D}px;height:${D}px;border-radius:50%;background:var(--ink);color:var(--bg);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 ${Math.round(D * 0.06)}px color-mix(in srgb,var(--ink) 14%,transparent),0 16px 30px rgba(0,0,0,.25)}
.fx .fx-ult{background:var(--btn);color:var(--btnInk);box-shadow:0 0 0 ${Math.round(D * 0.06)}px color-mix(in srgb,var(--btn) 26%,transparent),0 16px 30px rgba(0,0,0,.25)}
.fx .fx-no b{position:absolute;left:-8px;top:-8px;width:${Math.round(D * 0.34)}px;height:${Math.round(D * 0.34)}px;border-radius:50%;background:var(--bg);color:var(--hi);border:3px solid var(--hi);display:flex;align-items:center;justify-content:center;${BAHN};font-weight:700;font-size:${Math.round(D * 0.2)}px}
.fx .fx-lb{position:absolute;text-align:center;font:700 ${fl}px/1.2 IN,sans-serif;color:var(--ink);text-wrap:balance}
.fx .fx-bot{position:absolute;left:64px;right:64px;bottom:58px;display:flex;align-items:center;justify-content:space-between}
.fx .fx-suave{display:flex;align-items:center;gap:12px;font:italic 600 36px PF,serif;color:var(--hi)}
.fx .fx-desl{font:400 34px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:12px;margin-left:auto}
${cssFaixa('.fx .fx-cta')}
</style>
<div class="fx-fundo"></div><div class="fx-grao"></div>
<div class="fx-hd">
  ${s.eyebrow || s.idx ? `<div class="fx-eb">${n.esc(s.eyebrow || '')}${s.idx ? `<span class="x">${n.esc(s.idx)}</span>` : ''}</div>` : ''}
  <div class="fx-tt" data-caixa data-min="44"><h1 class="fx-h">${destaqueFinal(n, s.title, 2)}</h1></div>
</div>
<div class="fx-logo">${n.logo({ altura: 104, placa: p.placaLogo })}</div>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;left:0;top:0">${caminho}</svg>
${nos}
${s.cta === 'suave' || s.deslize ? `<div class="fx-bot">${s.cta === 'suave' ? `<span class="fx-suave">${n.CTA_SUAVE} ${SETA(44, 'currentColor')}</span>` : ''}${s.deslize ? `<span class="fx-desl">deslize ${SETA(46, 'currentColor')}</span>` : ''}</div>` : ''}
${forte ? faixaCta(n, 'fx-cta') : ''}
${FIT_JS}
</div>`;
  },
};

// ---------------------------------------------------------------- 7. voce-sabia
const voceSabia = {
  id: 'voce-sabia',
  formato: 'feed',
  usa: 'texto',
  tipos: ['curiosidade'],
  paletas: ['chocolate', 'ouro', 'noite'],
  descricao: '"Você sabia?" em Playfair itálico gigante com sublinhado à mão, selo estrelado com lâmpada, título e até 3 frases com fio de destaque.',
  async render(s, { n, p }) {
    const forte = s.cta === 'forte';
    const c = cores(p);
    const chamada = s.eyebrow || 'Você sabia?';
    const ts = n.tamanho(s.title, [[30, 100], [50, 86], [80, 72], [999, 62]]);
    const ls = (s.lines || []).filter(Boolean).slice(0, 3);
    const R1 = 150, R2 = 128, P = 18;
    const estrela = Array.from({ length: P * 2 }, (_, i) => {
      const ang = (Math.PI * i) / P - Math.PI / 2, rr = i % 2 ? R2 : R1;
      return `${(160 + rr * Math.cos(ang)).toFixed(1)},${(160 + rr * Math.sin(ang)).toFixed(1)}`;
    }).join(' ');
    const selo = `<svg width="320" height="320" viewBox="0 0 320 320"><polygon points="${estrela}" fill="var(--hi)"/>
      <circle cx="160" cy="160" r="112" fill="none" stroke="var(--hiInk)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" opacity=".7"/>
      <g transform="translate(100 92) scale(1.2)" fill="none" stroke="var(--hiInk)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M50 14C33 14 21 27 21 43c0 11 6 19 12 25 4 4 5 8 5 12h24c0-4 1-8 5-12 6-6 12-14 12-25C79 27 67 14 50 14Z"/>
        <path d="M39 89h22M43 98h14"/><path d="M42 62l8-10 8 10"/><path d="M50 52v28" opacity="0"/>
        <path d="M50 2v-8M14 14l-6-6M86 14l6-6M6 44h-8M94 44h8" stroke-width="5"/></g></svg>`;
    return `<div class="vc" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:var(--bg);color:var(--ink);${vars(n, p)}">
<style>
.vc .vc-raios{position:absolute;right:-260px;top:-260px;width:900px;height:900px;border-radius:50%;background:repeating-conic-gradient(color-mix(in srgb,var(--ink) 6%,transparent) 0 6deg,transparent 6deg 15deg);-webkit-mask:radial-gradient(circle,#000 30%,transparent 70%);mask:radial-gradient(circle,#000 30%,transparent 70%)}
.vc .vc-grao{position:absolute;inset:0;background-image:${grao(0.6)};mix-blend-mode:overlay;opacity:.32}
.vc .vc-selo{position:absolute;right:52px;top:50px;transform:rotate(12deg) scale(.86);transform-origin:right top;filter:drop-shadow(0 14px 22px rgba(0,0,0,.3))}
.vc .vc-logo{position:absolute;left:64px;top:56px}
.vc .vc-col{position:absolute;left:64px;right:72px;top:${p.placaLogo ? 214 : 190}px;bottom:${forte ? 190 : s.cta || s.deslize ? 150 : 70}px;display:flex;flex-direction:column;justify-content:center;gap:34px}
.vc .vc-ch{flex:none;margin-left:-6px}
.vc .vc-ch h2{display:block;width:max-content;font:italic 800 120px/1.02 PF,serif;color:var(--hi);letter-spacing:-.01em;white-space:nowrap;padding-right:.12em}
.vc .vc-ch svg{display:block;margin:4px 0 0 10px}
.vc .vc-c{flex:0 1 auto;min-height:0}
.vc .vc-in{font-size:${ts}px;display:flex;flex-direction:column;gap:.34em}
.vc .vc-h{font:800 1em/1.06 PF,serif;letter-spacing:-.012em;text-wrap:balance;max-width:940px}
.vc .vc-ls{border-left:6px solid var(--hi);padding-left:28px;display:flex;flex-direction:column;gap:.2em;margin-top:.14em}
.vc .vc-ls p{font:400 max(22px,.42em)/1.36 IN,sans-serif;color:var(--muted);text-wrap:pretty;max-width:860px}
.vc .vc-ls p:first-child{font-weight:600;color:var(--ink);font-size:max(24px,.46em)}
.vc .vc-bot{position:absolute;left:64px;right:64px;bottom:${forte ? 66 : 62}px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.vc .vc-pill{display:flex;align-items:center;gap:24px;background:var(--btn);color:var(--btnInk);border-radius:999px;padding:20px 34px 20px 40px;box-shadow:0 12px 26px rgba(0,0,0,.25)}
.vc .vc-pill b{${COND};font-weight:700;font-size:48px;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap}
.vc .vc-pill span{font:600 27px IN,sans-serif;display:flex;align-items:center;gap:10px;white-space:nowrap}
.vc .vc-suave{display:flex;align-items:center;gap:12px;font:italic 600 36px PF,serif;color:var(--hi)}
.vc .vc-desl{font:400 34px 'Segoe Script',cursive;color:var(--hi);display:flex;align-items:center;gap:12px;margin-left:auto;white-space:nowrap}
.vc .vc-idx{position:absolute;right:64px;bottom:${forte ? 168 : s.cta || s.deslize ? 124 : 58}px;${COND};font-weight:600;font-size:30px;letter-spacing:.12em;color:var(--muted)}
</style>
<div class="vc-raios"></div><div class="vc-grao"></div>
<div class="vc-selo">${selo}</div>
<div class="vc-logo">${n.logo({ altura: 104, placa: p.placaLogo })}</div>
<div class="vc-col">
<div class="vc-ch"><h2 data-fit="640" data-max="140" data-min="64">${n.esc(chamada)}</h2><svg width="420" height="30" viewBox="0 0 420 30"><path d="M6 20C110 6 250 4 412 12M60 26C160 18 260 18 360 22" fill="none" stroke="${c.hi}" stroke-width="5" stroke-linecap="round"/></svg></div>
<div class="vc-c" data-caixa data-min="46"><div class="vc-in">
  <h1 class="vc-h">${n.esc(s.title)}</h1>
  ${ls.length ? `<div class="vc-ls">${ls.map((l) => `<p>${n.esc(l)}</p>`).join('')}</div>` : ''}
</div></div>
</div>
${s.idx ? `<span class="vc-idx">${n.esc(s.idx)}</span>` : ''}
${s.cta || s.deslize ? `<div class="vc-bot">${forte ? `<div class="vc-pill"><b>${n.CTA_FORTE}</b><span>link na bio ${SETA(40, 'currentColor')}</span></div>` : s.cta === 'suave' ? `<span class="vc-suave">${n.CTA_SUAVE} ${SETA(44, 'currentColor')}</span>` : ''}${s.deslize ? `<span class="vc-desl">deslize ${SETA(46, 'currentColor')}</span>` : ''}</div>` : ''}
${FIT_JS}
</div>`;
  },
};

module.exports = [quizOpcoes, esteOuAquele, checklist, cacaPalavras, fraseDeEfeito, fluxoPedido, voceSabia];
