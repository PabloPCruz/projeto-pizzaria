// Layouts da primeira versão (todos com a mesma cara). Ficam como reserva: o diretor de arte só os usa com moderação.
module.exports = [
  {
    id: 'classico-faixa',
    formato: 'feed',
    usa: 'foto',
    descricao: 'Foto 4:3 em cima e faixa escura embaixo com logo, título, subtítulo e CTA.',
    async render(s, { n, p }) {
      const foto = await n.foto(s.photo, 1080, 810);
      const ts = n.tamanho(s.title, [[22, 58], [34, 50], [99, 44]]);
      return `<div style="position:relative;width:1080px;height:1080px;background:${p.bg};overflow:hidden;${n.varsCss(p)}">
  <div style="position:relative;height:810px;background:url('${foto}') center/cover">${n.seloIlustrativa()}</div>
  <div style="position:absolute;left:0;right:0;top:810px;height:270px;border-top:4px solid var(--accent);background:linear-gradient(180deg,var(--bg2),var(--bg));display:flex;align-items:center;gap:34px;padding:0 44px">
    ${n.logo({ altura: 172, placa: p.placaLogo })}
    <div style="flex:1;min-width:0">
      <h1 class="pf" style="font-size:${ts}px;line-height:1.08;color:var(--ink)">${n.esc(s.title)}</h1>
      ${s.sub ? `<p style="font-size:27px;line-height:1.3;margin-top:8px;color:var(--muted)">${n.esc(s.sub)}</p>` : ''}
      ${s.cta === 'forte' ? `<p style="margin-top:12px;color:var(--accent);font-size:25px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">${n.CTA_FORTE} · link na bio</p>` : ''}
    </div>
  </div>
  ${n.indice(s.idx)}
</div>`;
    },
  },
  {
    id: 'cartao-elegante',
    formato: 'feed',
    usa: 'texto',
    descricao: 'Cartão escuro com moldura dourada fina, logo no topo e texto centralizado (aceita tipo size, step e list).',
    async render(s, { n, p }) {
      const ts = n.tamanho(s.title, [[16, 112], [26, 92], [99, 76]]);
      const big = s.tipo === 'size'
        ? `<div style="text-align:center;margin-top:10px"><span class="pf" style="display:block;font-size:${s.cta ? 220 : 270}px;line-height:1.12;color:var(--accent);font-weight:700">${n.esc(s.big)}</span><p style="font-size:44px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);margin-top:4px">${n.esc(s.bigLabel)}</p></div>`
        : '';
      const step = s.tipo === 'step'
        ? `<div style="margin:0 auto 30px;width:210px;height:210px;border-radius:50%;border:4px solid var(--accent);display:flex;align-items:center;justify-content:center"><span class="pf" style="font-size:130px;color:var(--accent);font-weight:700">${n.esc(s.n)}</span></div>`
        : '';
      const linhas = (s.lines || []).map((l) => s.tipo === 'list'
        ? `<li style="list-style:none;font-size:46px;font-weight:600;padding:14px 0;border-bottom:1px solid var(--accent)">${n.esc(l)}</li>`
        : `<p style="font-size:44px;line-height:1.35;margin-top:16px;color:var(--muted)">${n.esc(l)}</p>`).join('');
      return `<div style="position:relative;width:1080px;height:1080px;background:radial-gradient(ellipse at 50% 38%,var(--bg2),var(--bg) 70%);overflow:hidden;color:var(--ink);${n.varsCss(p)}">
  <div style="position:absolute;inset:34px;border:2px solid var(--accent);opacity:.45;border-radius:28px"></div>
  <div style="position:absolute;left:50%;top:70px;transform:translateX(-50%)">${n.logo({ altura: 148, placa: p.placaLogo })}</div>
  <div style="position:absolute;left:90px;right:90px;top:250px;bottom:${s.cta ? 240 : 110}px;display:flex;flex-direction:column;justify-content:center;text-align:center;align-items:center">
    ${s.eyebrow ? `<p style="color:var(--accent);font-size:28px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;margin-bottom:22px">${n.esc(s.eyebrow)}</p>` : ''}
    ${step}
    <h1 class="pf" style="font-size:${s.tipo === 'size' ? 78 : ts}px;line-height:1.08">${n.esc(s.title)}</h1>
    ${big}
    ${s.tipo === 'list' ? `<ul style="margin:34px auto 0;width:800px;text-align:left">${linhas}</ul>` : linhas}
  </div>
  ${s.cta === 'forte' ? `<div style="position:absolute;left:0;right:0;bottom:92px;text-align:center"><span style="display:inline-block;background:var(--accent2);color:#fff;font-weight:800;border-radius:999px;font-size:38px;padding:22px 46px">${n.CTA_FORTE}</span><p style="font-size:27px;margin-top:16px;color:var(--muted)">link na bio · sem cadastro</p></div>` : ''}
  ${s.cta === 'suave' ? `<div style="position:absolute;left:0;right:0;bottom:92px;text-align:center"><span style="display:inline-block;color:var(--accent);font-weight:700;border:2px solid var(--accent);border-radius:999px;font-size:32px;padding:16px 38px">${n.CTA_SUAVE}</span></div>` : ''}
  ${s.deslize ? `<span style="position:absolute;left:0;right:0;bottom:80px;text-align:center;font:600 30px IN,sans-serif;color:var(--accent)">DESLIZE &rarr;</span>` : ''}
  ${n.indice(s.idx, { estilo: 'right:62px;bottom:62px', cor: p.ink, fundo: 'transparent' })}
</div>`;
    },
  },
  {
    id: 'story-classico',
    formato: 'story',
    usa: 'foto',
    descricao: 'Reel: foto 4:3 no meio sobre a própria foto desfocada, logo no topo e título embaixo.',
    async render(s, { n, p }) {
      const fg = await n.foto(s.photo, 1080, 810);
      const bg = await n.foto(s.photo, 1080, 1920, { blur: 38, brilho: 0.42, saturacao: 1.1 });
      const ts = n.tamanho(s.title, [[20, 84], [32, 72], [99, 62]]);
      return `<div style="position:relative;width:1080px;height:1920px;overflow:hidden;color:var(--ink);${n.varsCss(p)}">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,15,15,.55),rgba(15,15,15,.1) 35%,rgba(15,15,15,.15) 70%,rgba(15,15,15,.85)),url('${bg}') center/cover"></div>
  <div style="position:absolute;left:50%;top:268px;transform:translateX(-50%)">${n.logo({ altura: 190 })}</div>
  <div style="position:absolute;left:0;top:555px;width:1080px;height:810px;background:url('${fg}') center/cover;border-top:4px solid var(--accent);border-bottom:4px solid var(--accent)">${n.seloIlustrativa()}</div>
  <div style="position:absolute;left:70px;right:70px;top:1410px;text-align:center"><h1 class="pf" style="font-size:${ts}px;line-height:1.08;color:#f5efe3;text-shadow:0 4px 24px rgba(0,0,0,.7)">${n.esc(s.title)}</h1></div>
</div>`;
    },
  },
  {
    id: 'story-texto',
    formato: 'story',
    usa: 'texto',
    descricao: 'Reel: cena só de texto, fundo da paleta com brilho, logo no topo.',
    async render(s, { n, p }) {
      const ts = n.tamanho(s.title, [[16, 120], [28, 100], [99, 86]]);
      return `<div style="position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,var(--bg2),var(--bg) 70%);color:var(--ink);${n.varsCss(p)}">
  <div style="position:absolute;inset:60px;border:2px solid var(--accent);opacity:.4;border-radius:28px"></div>
  <div style="position:absolute;left:50%;top:268px;transform:translateX(-50%)">${n.logo({ altura: 210, placa: p.placaLogo })}</div>
  <div style="position:absolute;left:90px;right:90px;top:560px;height:860px;display:flex;flex-direction:column;justify-content:center;text-align:center;align-items:center">
    ${s.eyebrow ? `<p style="color:var(--accent);font-size:34px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;margin-bottom:28px">${n.esc(s.eyebrow)}</p>` : ''}
    <h1 class="pf" style="font-size:${ts}px;line-height:1.08">${n.esc(s.title)}</h1>
    ${(s.lines || []).map((l) => `<p style="font-size:46px;line-height:1.35;margin-top:20px;color:var(--muted)">${n.esc(l)}</p>`).join('')}
  </div>
</div>`;
    },
  },
  {
    id: 'story-cta',
    formato: 'story',
    usa: 'cta',
    descricao: 'Reel: cena final com logo grande, "Peça agora pelo Disk Pizza", botão e horário.',
    async render(s, { n, p }) {
      return `<div style="position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,var(--bg2),var(--bg) 70%);color:var(--ink);${n.varsCss(p)}">
  <div style="position:absolute;inset:60px;border:2px solid var(--accent);opacity:.4;border-radius:28px"></div>
  <div style="position:absolute;left:50%;top:340px;transform:translateX(-50%)">${n.logo({ altura: 300, placa: p.placaLogo })}</div>
  <div style="position:absolute;left:70px;right:70px;top:740px;text-align:center">
    <h1 class="pf" style="font-size:96px;line-height:1.08">${n.CTA_FORTE}</h1>
    <p style="font-size:44px;margin-top:34px;color:var(--muted)">link na bio · sem cadastro</p>
    <span style="display:inline-block;background:var(--accent2);color:#fff;font-weight:800;border-radius:999px;font-size:44px;padding:26px 60px;margin-top:60px">Monte a sua pizza</span>
    <p style="font-size:36px;margin-top:70px;color:var(--muted)">${n.HORARIO}</p>
  </div>
</div>`;
    },
  },
];
