// Família Reels (story 1080x1920): quadros de cena para montar-reels.js. Ver CATALOGO.md.
// Zona segura do Instagram: nada importante acima de 250 px nem abaixo de 1580 px.
// Fotos originais têm ~1000x750: recortes grandes ficam sobre fundo desfocado/gradiente para disfarçar a ampliação.

/** '#rrggbb' -> 'rgba(r,g,b,a)'. */
function rgba(hex, a) {
  const v = parseInt(String(hex).replace('#', ''), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}
/** Luminância relativa (0 = preto, 1 = branco). */
function luminancia(hex) {
  const v = parseInt(String(hex).replace('#', ''), 16);
  const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** Cor de texto legível sobre um fundo sólido (escuro ou claro). */
const textoSobre = (hex) => (luminancia(hex) > 0.3 ? '#1c1712' : '#ffffff');
/** Destaque que não se confunde com o texto (na paleta ouro o accent é quase preto: usa accent2). */
const destaque = (p) => (luminancia(p.accent) < 0.05 ? p.accent2 : p.accent);
/** Destaque claro para usar sobre a placa escura (selo): na paleta ouro usa o próprio dourado do fundo. */
const destaqueSobreEscuro = (p) => (luminancia(p.accent) < 0.05 ? p.bg : p.accent);
/** Fundo da placa do logo: escuro nas paletas que exigem placa (creme, ouro, tomate). */
const placaCor = (p) => (p.placaLogo ? '#141414' : p.bg2);
/** Padrão de pontos sutil na cor do texto da paleta. */
const pontos = (p, a = 0.07, passo = 34) => `radial-gradient(${rgba(p.ink, a)} 2px,transparent 2.6px) 0 0/${passo}px ${passo}px`;

module.exports = [
  // ---------------------------------------------------------------- foto
  {
    id: 'story-foto-cheia',
    formato: 'story',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['noite', 'creme', 'tomate'],
    descricao: 'Reel: foto vertical "cheia" (recorte alto esfumado sobre a própria foto desfocada), gradiente na cor da paleta e título grande na base da zona segura.',
    async render(s, { n, p }) {
      const bg = await n.foto(s.photo, 1080, 1920, { blur: 34, brilho: 0.6, saturacao: 1.15 });
      // Recorte quase quadrado (ampliação ~1,4x, nítido) esfumado sobre a própria foto desfocada: lê como foto cheia.
      const fg = await n.foto(s.photo, 1080, 1200);
      const ts = n.tamanho(s.title, [[10, 132], [16, 112], [24, 94], [32, 80], [99, 68]]);
      return `<div style="position:relative;width:1080px;height:1920px;overflow:hidden;background:${p.bg};color:var(--ink);${n.varsCss(p)}">
  <div style="position:absolute;inset:0;background:url('${bg}') center/cover"></div>
  <div style="position:absolute;left:0;top:170px;width:1080px;height:1200px;background:url('${fg}') center/cover;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 14%,#000 74%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0,#000 14%,#000 74%,transparent 100%)"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 90% 50% at 50% 38%,transparent 55%,rgba(0,0,0,.4) 100%)"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.62) 0,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 56%,${rgba(p.bg, 0.86)} 67%,${p.bg} 74%,${p.bg} 100%)"></div>
  <div style="position:absolute;left:70px;top:272px">${n.logo({ altura: 128, placa: true })}</div>
  ${n.seloIlustrativa({ estilo: 'right:64px;top:300px' })}
  <div style="position:absolute;left:80px;right:80px;bottom:372px">
    <div style="width:96px;height:8px;border-radius:4px;background:var(--accent);margin-bottom:30px"></div>
    <h1 class="pf" style="font-size:${ts}px;line-height:1.04;font-weight:700;letter-spacing:-.01em;color:var(--ink)">${n.esc(s.title)}</h1>
    <p style="margin-top:26px;font-size:26px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:var(--accent)">Disk Pizza · Curitiba</p>
  </div>
</div>`;
    },
  },
  {
    id: 'story-dividido',
    formato: 'story',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['tomate', 'creme', 'manjericao'],
    descricao: 'Reel: foto na metade de cima com base em arco e filete na cor de destaque; selo redondo com o logo na emenda; painel da paleta com título centralizado.',
    async render(s, { n, p }) {
      const fg = await n.foto(s.photo, 1080, 1080);
      const ts = n.tamanho(s.title, [[10, 118], [16, 100], [24, 84], [32, 72], [99, 62]]);
      return `<div style="position:relative;width:1080px;height:1920px;overflow:hidden;background:${pontos(p)},linear-gradient(180deg,var(--bg) 50%,var(--bg2));color:var(--ink);${n.varsCss(p)}">
  <div style="position:absolute;left:-40px;top:0;width:1160px;height:1102px;background:var(--accent);border-radius:0 0 580px 580px/0 0 150px 150px"></div>
  <div style="position:absolute;left:-40px;top:0;width:1160px;height:1086px;overflow:hidden;border-radius:0 0 580px 580px/0 0 150px 150px">
    <div style="position:absolute;left:40px;top:0;width:1080px;height:1086px;background:url('${fg}') center/cover"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55) 0,rgba(0,0,0,0) 26%)"></div>
  </div>
  ${n.seloIlustrativa({ estilo: 'right:56px;top:296px' })}
  <div style="position:absolute;left:50%;top:950px;width:272px;height:272px;margin-left:-136px;border-radius:50%;background:${placaCor(p)};border:6px solid ${destaqueSobreEscuro(p)};box-shadow:0 18px 44px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center">${n.logo({ altura: 146 })}</div>
  <div style="position:absolute;left:90px;right:90px;top:1262px;height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
    ${s.eyebrow ? `<p style="font-size:30px;font-weight:700;letter-spacing:.26em;text-transform:uppercase;color:var(--accent);margin-bottom:18px">${n.esc(s.eyebrow)}</p>` : ''}
    <h1 class="pf" style="font-size:${ts}px;line-height:1.06;font-weight:700;color:var(--ink)">${n.esc(s.title)}</h1>
    <div style="display:flex;align-items:center;gap:18px;margin-top:26px;color:var(--accent)"><span style="width:70px;height:2px;background:currentColor"></span><span style="font-size:24px;font-weight:700;letter-spacing:.3em">DISK PIZZA</span><span style="width:70px;height:2px;background:currentColor"></span></div>
  </div>
</div>`;
    },
  },
  {
    id: 'story-polaroid',
    formato: 'story',
    usa: 'foto',
    tipos: ['photo'],
    paletas: ['creme', 'chocolate', 'manjericao'],
    descricao: 'Reel: polaroid inclinada com fita adesiva sobre a paleta (com outra polaroid atrás), legenda manuscrita com o título.',
    async render(s, { n, p }) {
      const fg = await n.foto(s.photo, 780, 780);
      const ts = n.tamanho(s.title, [[10, 92], [16, 80], [24, 68], [34, 56], [99, 48]]);
      const fita = (estilo) => `<div style="position:absolute;${estilo};width:210px;height:62px;background:linear-gradient(90deg,rgba(255,250,235,.62),rgba(240,228,200,.72));box-shadow:0 2px 6px rgba(0,0,0,.12);border-left:2px dashed rgba(0,0,0,.06);border-right:2px dashed rgba(0,0,0,.06)"></div>`;
      return `<div style="position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(ellipse 70% 45% at 50% 52%,${rgba(p.accent, 0.16)},transparent 70%),${pontos(p, 0.08, 30)},linear-gradient(180deg,var(--bg),var(--bg2));color:var(--ink);${n.varsCss(p)}">
  <div style="position:absolute;left:50%;top:268px;transform:translateX(-50%)">${n.logo({ altura: 124, placa: p.placaLogo })}</div>
  <div style="position:absolute;left:128px;top:470px;width:840px;height:1040px;background:#efe6d4;transform:rotate(5deg);box-shadow:0 24px 50px rgba(0,0,0,.28)"></div>
  <div style="position:absolute;left:110px;top:462px;width:860px;height:1060px;background:#fbf8f1;transform:rotate(-3.2deg);box-shadow:0 34px 70px rgba(0,0,0,.38),0 2px 0 rgba(0,0,0,.05)">
    <div style="position:absolute;left:40px;top:40px;width:780px;height:780px;background:url('${fg}') center/cover;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)">${n.seloIlustrativa({ estilo: 'right:18px;bottom:18px' })}</div>
    <div style="position:absolute;left:44px;right:44px;top:836px;bottom:24px;display:flex;align-items:center;justify-content:center;text-align:center">
      <h1 class="script" style="font-size:${ts}px;line-height:1.18;color:#2a221c;font-weight:400">${String(s.title || '').split(/\s+·\s+/).map((x) => n.esc(x)).join('<br>')}</h1>
    </div>
    ${fita('left:-46px;top:-14px;transform:rotate(-38deg)')}
    ${fita('right:-46px;top:-14px;transform:rotate(36deg)')}
  </div>
</div>`;
    },
  },

  // ---------------------------------------------------------------- texto
  {
    id: 'story-tipografico',
    formato: 'story',
    usa: 'texto',
    tipos: ['text'],
    paletas: ['tomate', 'noite', 'ouro'],
    descricao: 'Reel: cena de texto com tipografia enorme ocupando a tela (linhas alternando Bahnschrift caixa alta e Playfair itálico na cor de destaque).',
    async render(s, { n, p }) {
      const W = 920;
      const palavras = String(s.title || '').split(/\s+/).filter(Boolean);
      const total = String(s.title || '').length;
      const max = total <= 12 ? 8 : total <= 22 ? 10 : 11;
      const linhas = [];
      for (const w of palavras) {
        const ult = linhas[linhas.length - 1];
        if (ult && (ult + ' ' + w).length <= max) linhas[linhas.length - 1] = ult + ' ' + w;
        else linhas.push(w);
      }
      // Tamanho por linha para preencher a largura (estimativa de largura média por letra).
      let estilos = linhas.map((l, i) => {
        const cond = i % 2 === 0;
        const px = Math.floor(Math.min(cond ? 250 : 200, W / (l.length * (cond ? 0.74 : 0.52))));
        return { l, cond, px };
      });
      const extra = (s.lines || []).length * 70 + (s.eyebrow ? 0 : -40);
      const alturaMax = 880 - extra;
      const alt = estilos.reduce((a, e) => a + e.px * (e.cond ? 1 : 1.18), 0);
      if (alt > alturaMax) estilos = estilos.map((e) => ({ ...e, px: Math.floor(e.px * alturaMax / alt) }));
      const titulo = estilos.map((e) => e.cond
        ? `<span class="cond" style="display:block;font-size:${e.px}px;line-height:1;font-weight:700;text-transform:uppercase;letter-spacing:-.005em;color:var(--ink)">${n.esc(e.l)}</span>`
        : `<span class="pf" style="display:block;font-size:${e.px}px;line-height:1.18;font-style:italic;font-weight:600;color:${destaque(p)}">${n.esc(e.l)}</span>`).join('');
      return `<div style="position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(ellipse 80% 50% at 30% 45%,var(--bg) 40%,var(--bg2));color:var(--ink);${n.varsCss(p)}">
  <div style="position:absolute;right:-300px;top:340px;width:820px;height:820px;border-radius:50%;border:3px solid var(--accent);opacity:.22"></div>
  <div style="position:absolute;right:-220px;top:420px;width:660px;height:660px;border-radius:50%;border:2px solid var(--accent);opacity:.14"></div>
  <div style="position:absolute;right:-180px;bottom:-160px;width:620px;height:620px;border-radius:50%;background:${rgba(p.accent, 0.08)}"></div>
  <div style="position:absolute;left:80px;right:80px;top:300px;display:flex;align-items:center;gap:22px;color:var(--accent)">
    <span style="width:64px;height:4px;background:currentColor"></span>
    <span style="font-size:32px;font-weight:800;letter-spacing:.28em;text-transform:uppercase">${n.esc(s.eyebrow || 'Disk Pizza')}</span>
  </div>
  <div style="position:absolute;left:80px;right:80px;top:390px;height:960px;display:flex;flex-direction:column;justify-content:center;white-space:nowrap">
    ${titulo}
    ${(s.lines || []).map((l, i) => `<p style="white-space:normal;font-size:42px;line-height:1.3;font-weight:500;color:var(--muted);margin-top:${i ? 10 : 44}px;max-width:900px">${n.esc(l)}</p>`).join('')}
  </div>
  <div style="position:absolute;left:80px;right:80px;top:1400px;display:flex;align-items:center;justify-content:space-between">
    ${n.logo({ altura: 118, placa: p.placaLogo })}
    <span style="font-size:26px;font-weight:700;letter-spacing:.3em;color:var(--muted)">CURITIBA</span>
  </div>
</div>`;
    },
  },

  // ---------------------------------------------------------------- CTA
  {
    id: 'story-cta-ticket',
    formato: 'story',
    usa: 'cta',
    tipos: ['cta'],
    paletas: ['tomate', 'noite', 'creme'],
    descricao: 'Reel (cena final): comanda de papel com bordas picotadas, logo, CTA forte, "Monte a sua pizza" em carimbo, link na bio e horário.',
    async render(s, { n, p }) {
      const papel = '#fffaf0', tinta = '#1c1712';
      const vermelho = '#b3141f';
      return `<div class="sct" style="position:relative;width:1080px;height:1920px;overflow:hidden;background:repeating-linear-gradient(135deg,${rgba(p.ink, 0.05)} 0 18px,transparent 18px 46px),linear-gradient(180deg,var(--bg),var(--bg2));${n.varsCss(p)}">
  <style>
    .sct .tk{position:absolute;left:130px;top:300px;width:820px;height:1230px;background:${papel};color:${tinta};filter:drop-shadow(0 30px 50px rgba(0,0,0,.4));transform:rotate(-1.2deg)}
    .sct .tk:before,.sct .tk:after{content:"";position:absolute;left:0;right:0;height:22px;background:linear-gradient(-45deg,${papel} 11px,transparent 0),linear-gradient(45deg,${papel} 11px,transparent 0);background-size:22px 22px;background-repeat:repeat-x}
    .sct .tk:before{top:-22px;background-position:left bottom;transform:scaleY(-1)}
    .sct .tk:after{bottom:-22px;background-position:left top}
    .sct .furo{position:absolute;width:56px;height:56px;border-radius:50%;background:${p.bg};top:476px;box-shadow:inset 0 6px 10px rgba(0,0,0,.25)}
    .sct .tracos{border-top:3px dashed rgba(28,23,18,.28)}
  </style>
  <div class="tk">
    <div style="position:absolute;left:0;right:0;top:56px;text-align:center">${n.logo({ altura: 150, placa: true })}</div>
    <p class="cond" style="position:absolute;left:0;right:0;top:300px;text-align:center;font-size:30px;letter-spacing:.42em;font-weight:700;color:#5b4f40">COMANDA · DISK PIZZA</p>
    <p style="position:absolute;left:0;right:0;top:362px;text-align:center;font-size:26px;letter-spacing:.2em;color:#7a6c58">CURITIBA</p>
    <div style="position:absolute;inset:0;overflow:hidden"><div class="furo" style="left:-28px"></div><div class="furo" style="right:-28px"></div></div>
    <div class="tracos" style="position:absolute;left:50px;right:50px;top:503px"></div>
    <h1 class="pf" style="position:absolute;left:60px;right:60px;top:560px;text-align:center;font-size:92px;line-height:1.05;font-weight:800;color:${tinta}">${n.CTA_FORTE}</h1>
    <div style="position:absolute;left:0;right:0;top:810px;text-align:center">
      <span class="cond" style="display:inline-block;transform:rotate(-4deg);border:5px solid ${vermelho};color:${vermelho};border-radius:14px;padding:14px 38px;font-size:54px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;box-shadow:inset 0 0 0 3px ${papel},inset 0 0 0 6px ${vermelho}">Monte a sua pizza</span>
    </div>
    <p style="position:absolute;left:0;right:0;top:950px;text-align:center;font-size:40px;font-weight:800;color:${tinta}">link na bio &rarr;</p>
    <div class="tracos" style="position:absolute;left:50px;right:50px;top:1040px"></div>
    <p style="position:absolute;left:0;right:0;top:1066px;text-align:center;font-size:32px;font-weight:600;color:#5b4f40">${n.HORARIO}</p>
    <div style="position:absolute;left:250px;right:250px;top:1140px;height:56px;background:repeating-linear-gradient(90deg,${tinta} 0 4px,transparent 4px 9px,${tinta} 9px 11px,transparent 11px 15px,${tinta} 15px 20px,transparent 20px 24px);opacity:.75"></div>
  </div>
</div>`;
    },
  },
  {
    id: 'story-cta-selo',
    formato: 'story',
    usa: 'cta',
    tipos: ['cta'],
    paletas: ['chocolate', 'creme', 'manjericao'],
    descricao: 'Reel (cena final): selo redondo girado com texto em círculo e logo no centro, CTA forte grande, botão "Monte a sua pizza", link na bio e horário.',
    async render(s, { n, p }) {
      const fundoSelo = placaCor(p);
      const anel = 'PEÇA AGORA ★ LINK NA BIO ★ DISK PIZZA ★ CURITIBA ★ ';
      const botao = p.accent2;
      const corAnel = destaqueSobreEscuro(p);
      return `<div style="position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(circle at 50% 620px,${rgba(p.accent, 0.22)},transparent 520px),radial-gradient(ellipse at 50% 40%,var(--bg),var(--bg2) 80%);color:var(--ink);${n.varsCss(p)}">
  <div style="position:absolute;left:50%;top:300px;width:640px;height:640px;margin-left:-320px;transform:rotate(-12deg)">
    <svg width="640" height="640" viewBox="0 0 640 640" style="position:absolute;inset:0;filter:drop-shadow(0 26px 40px rgba(0,0,0,.35))">
      <defs><path id="sctSeloArco" d="M320,320 m-246,0 a246,246 0 1,1 492,0 a246,246 0 1,1 -492,0"/></defs>
      <circle cx="320" cy="320" r="312" fill="${corAnel}"/>
      <circle cx="320" cy="320" r="300" fill="${fundoSelo}"/>
      <circle cx="320" cy="320" r="290" fill="none" stroke="${corAnel}" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
      <circle cx="320" cy="320" r="206" fill="none" stroke="${corAnel}" stroke-width="3"/>
      <text font-family="Bahnschrift,Arial Narrow,sans-serif" font-weight="700" font-size="44" fill="${corAnel}" letter-spacing="4"><textPath href="#sctSeloArco" textLength="1520" lengthAdjust="spacing">${anel}</textPath></text>
    </svg>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(12deg)">${n.logo({ altura: 196 })}</div>
  </div>
  <div style="position:absolute;left:70px;right:70px;top:1010px;text-align:center">
    <h1 class="pf" style="font-size:104px;line-height:1.02;font-weight:800;color:var(--ink)">${n.CTA_FORTE}</h1>
    <span style="display:inline-block;margin-top:46px;background:${botao};color:${textoSobre(botao)};font-weight:800;border-radius:999px;font-size:44px;padding:24px 58px;box-shadow:0 12px 30px rgba(0,0,0,.25)">Monte a sua pizza</span>
    <p style="margin-top:30px;font-size:38px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)">link na bio</p>
    <p style="margin-top:16px;font-size:32px;color:var(--muted)">${n.HORARIO}</p>
  </div>
</div>`;
    },
  },
];
