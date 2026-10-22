// Valida marketing/calendario/posts.json e gera calendario.json, calendario.md e calendario.csv.
// Uso: node marketing/tools/gerar-calendario.js        (não agenda nem envia nada)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'marketing', 'calendario');
const PHOTOS_DIR = path.join(ROOT, 'src', 'assets', 'img-flavors');
const SITE = 'https://www.diskpizzacwb.com.br/';
const START = '2026-10-22';
const END = '2027-01-22';
const MAX_PER_MONTH = 20;
const MAX_PER_WINDOW = 20;
const MAX_PHOTO_USES = 4;
const BANNED_PHOTOS = ['chocolate-morango', 'frango-com-catupiry', 'quatro-queijos']; // marca de terceiro no papel
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const BASE_TAGS = ['#DiskPizza', '#PizzaCuritiba', '#Curitiba'];
const CTA_FORTE = 'Peça agora pelo Disk Pizza';
const FREE_DELIVERY = 'Entrega grátis até 3 km da loja, confira pelo CEP.';
const BANNED_RE = [
  [/R\$/, 'preço'],
  [/\b(desconto|brinde|cupom|off|oferta|ofertas)\b/i, 'promessa de oferta'],
  [/\d\s?%/, 'percentual'],
  [/\b(buon|mamma|famiglia|ciao|bella|bellissima|mangia|nonna|forza)\b/i, 'italiano (pedido: sem expressões em italiano)'],
  [/melhor (pizza|pizzaria)|a melhor/i, 'superlativo não comprovado'],
  [/forno a lenha|artesanal|fresquinh|ingredientes frescos|massa feita no dia/i, 'afirmação sem fonte'],
  [/chega em \d|minutos? (para|pra) chegar|entrega rápida/i, 'prazo de entrega não informado pela loja'],
];

const posts = JSON.parse(fs.readFileSync(path.join(DIR, 'posts.json'), 'utf8'));
const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);

const dayOf = (d) => WEEKDAYS[new Date(`${d}T12:00:00Z`).getUTCDay()];
const addDays = (d, n) => new Date(new Date(`${d}T12:00:00Z`).getTime() + n * 864e5).toISOString().slice(0, 10);

function buildCaption(p, net) {
  const lines = [...p.body];
  const link = net === 'facebook' ? SITE : 'link na bio';
  if (p.cta === 'forte') lines.push(`👉 ${CTA_FORTE}: ${net === 'facebook' ? link : 'link na bio'}.`);
  else if (p.cta === 'suave') lines.push(`Monte a sua pelo ${net === 'facebook' ? 'site: ' + SITE : 'link na bio'}.`);
  if (p.photos.length) lines.push('📷 Foto ilustrativa.');
  let text = lines.join('\n\n');
  if (net === 'instagram') text += '\n\n' + [...BASE_TAGS, ...(p.tags || [])].join(' ');
  return text;
}

// 1) campos, datas e horários
const ids = new Set();
for (const p of posts) {
  if (ids.has(p.id)) err(p.id, 'id duplicado');
  ids.add(p.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) err(p.id, 'data inválida');
  if (!/^\d{2}:\d{2}$/.test(p.time)) err(p.id, 'hora inválida');
  if (p.date < START || p.date > END) err(p.id, `fora da janela ${START}..${END}`);
  if (!['feed', 'carrossel', 'reel'].includes(p.format)) err(p.id, 'formato inválido');
  if (!['forte', 'suave', 'info'].includes(p.cta)) err(p.id, 'cta inválido');
  p.weekday = dayOf(p.date);
  if (p.weekday === 'dom') err(p.id, 'domingo: loja fechada');
  p.networks = ['instagram', 'facebook'];
  p.media_spec = p.format === 'reel' ? '1080x1920' : '1080x1080';
  p.media_target =
    p.format === 'carrossel'
      ? `marketing/midia/processada/${p.id}/slide-01..${String(p.slides || 4).padStart(2, '0')}.jpg`
      : p.format === 'reel'
        ? `marketing/midia/processada/${p.id}/reel.mp4`
        : `marketing/midia/processada/${p.id}/feed.jpg`;
  p.caption_instagram = buildCaption(p, 'instagram');
  p.caption_facebook = buildCaption(p, 'facebook');
  p.status = 'rascunho';
}

// 2) quintas, sextas e sábados obrigatórios (a partir de 23/10: hoje, 22/10, já não tem como sair)
const byDate = new Map(posts.map((p) => [p.date, p]));
const missing = [];
for (let d = START; d <= END; d = addDays(d, 1)) {
  if (['qui', 'sex', 'sáb'].includes(dayOf(d)) && !byDate.has(d)) missing.push(`${d} (${dayOf(d)})`);
}
const missingNotToday = missing.filter((m) => !m.startsWith(START));
if (missingNotToday.length) errors.push(`quinta/sexta/sábado sem post: ${missingNotToday.join(', ')}`);
if (missing.length !== missingNotToday.length) warnings.push(`${START} (quinta, hoje) fica sem post: a mídia e as aprovações das Fases 3 e 4 não saem a tempo.`);

// 3) limites por mês e por janela de 30 dias
const perMonth = {};
for (const p of posts) perMonth[p.date.slice(0, 7)] = (perMonth[p.date.slice(0, 7)] || 0) + 1;
for (const [m, n] of Object.entries(perMonth)) if (n > MAX_PER_MONTH) errors.push(`${m}: ${n} posts (máximo ${MAX_PER_MONTH})`);
const windows = [[START, '2026-11-21'], ['2026-11-22', '2026-12-21'], ['2026-12-22', END]];
const perWindow = windows.map(([a, b]) => ({ a, b, n: posts.filter((p) => p.date >= a && p.date <= b).length }));
for (const w of perWindow) if (w.n > MAX_PER_WINDOW) errors.push(`janela ${w.a}..${w.b}: ${w.n} posts (máximo ${MAX_PER_WINDOW})`);

// 4) fotos: existência, banidas, limite de uso
const uses = {};
for (const p of posts) {
  for (const f of p.photos) {
    uses[f] = (uses[f] || 0) + 1;
    if (BANNED_PHOTOS.includes(f)) err(p.id, `foto proibida (marca de terceiro): ${f}`);
    if (!fs.existsSync(path.join(PHOTOS_DIR, `${f}.jpg`))) err(p.id, `foto inexistente: ${f}.jpg`);
  }
  if (p.format === 'reel' && !p.photos.length) err(p.id, 'reel sem fotos');
}
for (const [f, n] of Object.entries(uses)) if (n > MAX_PHOTO_USES) errors.push(`foto ${f} usada ${n}x (máximo ${MAX_PHOTO_USES})`);

// 5) texto: regras de marca e limites das redes
for (const p of posts) {
  for (const net of ['instagram', 'facebook']) {
    const c = p[`caption_${net}`];
    if (c.length > 2200) err(p.id, `legenda ${net} com ${c.length} caracteres (máx. 2200)`);
    for (const [re, why] of BANNED_RE) if (re.test(c)) err(p.id, `${net}: ${why} (${re})`);
    if (/grátis/i.test(c) && !c.includes('3 km')) err(p.id, `${net}: “grátis” sem a regra de 3 km`);
  }
  if (/entrega grátis/i.test(p.caption_instagram) && !p.caption_instagram.includes(FREE_DELIVERY)) err(p.id, 'frase da entrega grátis fora do padrão');
  const tags = (p.caption_instagram.match(/#\S+/g) || []).length;
  if (tags > 30) err(p.id, `${tags} hashtags (máx. 30)`);
  if (p.cta === 'forte' && !p.caption_instagram.includes(CTA_FORTE)) err(p.id, 'CTA forte sem a frase “Peça agora pelo Disk Pizza”');
}

// 6) cobertura de temas obrigatórios
const has = (re) => posts.some((p) => re.test(`${p.theme} ${p.date_theme || ''}`));
for (const [re, nome] of [[/Black Friday/, 'Black Friday'], [/Natal/, 'Natal'], [/Ano Novo|Réveillon|2027/, 'Ano Novo'], [/Verão/, 'Verão'], [/Feriado|Proclamação|Consciência/, 'Feriados']]) {
  if (!has(re)) errors.push(`tema obrigatório ausente: ${nome}`);
}
const forte = posts.filter((p) => p.cta === 'forte').length;
const gated = posts.filter((p) => p.depends_on).map((p) => p.id);

// 7) saídas
if (!errors.length) {
  fs.writeFileSync(path.join(DIR, 'calendario.json'), JSON.stringify(posts, null, 2) + '\n');
  const csvEsc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const head = ['id', 'data', 'dia', 'hora', 'formato', 'pilar', 'tema', 'data_tema', 'gatilho', 'cta', 'fotos', 'depende', 'midia', 'legenda_instagram'];
  const rows = posts.map((p) => [p.id, p.date, p.weekday, p.time, p.format, p.pillar, p.theme, p.date_theme || '', p.trigger, p.cta, p.photos.join('+'), p.depends_on || '', p.media_target, p.caption_instagram]);
  fs.writeFileSync(path.join(DIR, 'calendario.csv'), '﻿' + [head, ...rows].map((r) => r.map(csvEsc).join(';')).join('\r\n') + '\r\n');

  const md = [
    '# Calendário editorial — Disk Pizza (22/10/2026 a 22/01/2027)',
    '',
    `Gerado por \`marketing/tools/gerar-calendario.js\`. **Rascunho: nada foi agendado.** ${posts.length} posts; todos em Instagram e Facebook.`,
    '',
    `Por mês: ${Object.entries(perMonth).map(([m, n]) => `${m} = ${n}`).join(' · ')}. Por janela de 30 dias: ${perWindow.map((w) => `${w.n}`).join(' · ')}. (máximo ${MAX_PER_MONTH} em ambas as contas)`,
    '',
    '| ID | Data | Dia | Hora | Formato | Pilar | Tema | CTA | Fotos | Obs |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...posts.map((p) => `| ${p.id} | ${p.date} | ${p.weekday} | ${p.time} | ${p.format}${p.slides ? ' (' + p.slides + ')' : ''} | ${p.pillar} | ${p.theme}${p.date_theme ? ' — ' + p.date_theme : ''} | ${p.cta} | ${p.photos.join(', ') || '(arte gráfica)'} | ${p.depends_on ? '⚠ depende do deploy da massa' : ''} |`),
    '',
    '## Legendas',
    '',
    ...posts.flatMap((p) => [`### ${p.id} — ${p.date} (${p.weekday}) ${p.time} — ${p.theme}`, `Formato ${p.format} ${p.media_spec} · gatilho: ${p.trigger} · texto na arte: “${p.on_art}”${p.notes ? `\n\n> ${p.notes}` : ''}`, '', '```', p.caption_instagram, '```', '']),
  ].join('\n');
  fs.writeFileSync(path.join(DIR, 'calendario.md'), md + '\n');
}

console.log(`posts: ${posts.length} | por mês: ${JSON.stringify(perMonth)} | janelas 30d: ${perWindow.map((w) => w.n)}`);
console.log(`CTA forte: ${forte} | reels: ${posts.filter((p) => p.format === 'reel').length} | carrosséis: ${posts.filter((p) => p.format === 'carrossel').length} | feed: ${posts.filter((p) => p.format === 'feed').length}`);
console.log(`dependem do deploy da massa: ${gated.join(', ')}`);
console.log(`usos de foto: ${JSON.stringify(uses)}`);
console.log(`fotos distintas usadas: ${Object.keys(uses).length}`);
warnings.forEach((w) => console.log('AVISO:', w));
if (errors.length) {
  console.log(`\nERROS (${errors.length}):`);
  errors.forEach((e) => console.log(' -', e));
  process.exit(1);
}
console.log('\nOK: calendário válido; arquivos gerados em marketing/calendario/.');
