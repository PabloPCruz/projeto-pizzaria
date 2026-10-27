// Monta o payload em lote para o Metricool e a tabela de validação. NÃO agenda nada e NÃO chama o Metricool.
// Entradas: calendario/calendario.json, midia/verificacao.json, marketing/payload/config.json (marca, URL base das mídias).
// Saídas:   payload/payload-lote.json, payload/tabela-validacao.md, payload/tabela-validacao.csv
// Uso: node marketing/tools/montar-payload.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'marketing', 'payload');
fs.mkdirSync(DIR, { recursive: true });
const cfgPath = path.join(DIR, 'config.json');
if (!fs.existsSync(cfgPath)) {
  fs.writeFileSync(cfgPath, JSON.stringify({
    _ajuda: 'blogId = id da marca Disk Pizza no Metricool (Instagram @diskpizzactba + Facebook). mediaBaseUrl = URL pública que serve processada/Pxx/... sem barra no fim. Enquanto null, nada é agendável.',
    blogId: null,
    timezone: 'America/Sao_Paulo',
    mediaBaseUrl: null,
    liberados: { deploy_massa: false },
  }, null, 2) + '\n');
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'calendario', 'calendario.json'), 'utf8'));
const ver = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'midia', 'verificacao.json'), 'utf8')).map((v) => [v.id, v]));

const OFFSET = '-03:00'; // America/Sao_Paulo não tem horário de verão desde 2019
const now = Date.now();
const agPath = path.join(DIR, 'agendados.json');
const agendados = fs.existsSync(agPath) ? JSON.parse(fs.readFileSync(agPath, 'utf8')) : [];
const redesAgendadas = (id) => new Set(agendados.filter((a) => a.post === id).map((a) => a.rede));
const PUBLICADOS = new Set(cfg.publicados || []);
const idAgendado = (id, rede) => (agendados.find((a) => a.post === id && a.rede === rede) || {}).metricoolId || null;
const items = [];
const rows = [];

for (const p of posts) {
  if (PUBLICADOS.has(p.id)) continue; // já foi ao ar: não entra na tabela
  const v = ver[p.id];
  const dir = `marketing/midia/processada/${p.id}`;
  const files = p.format === 'reel' ? ['reel.mp4'] : p.format === 'carrossel' ? Array.from({ length: p.slides }, (_, i) => `slide-${String(i + 1).padStart(2, '0')}.jpg`) : ['feed.jpg'];
  const local = files.map((f) => path.join(ROOT, dir, f));
  const missingLocal = local.filter((f) => !fs.existsSync(f));
  // Imagens e vídeos podem vir de bases diferentes (o GitHub serve .mp4 como arquivo genérico; o jsDelivr serve video/mp4).
  const baseDe = (f) => (f.endsWith('.mp4') ? cfg.mediaBaseUrlVideo || cfg.mediaBaseUrl : cfg.mediaBaseUrl);
  // mediaOverrides: URL específica para um arquivo (ex.: vídeo que o jsDelivr recusa).
  const media = files.map((f) => (cfg.mediaOverrides || {})[`${p.id}/${f}`] || `${baseDe(f) || '{mediaBaseUrl}'}/${p.id}/${f}`);
  const when = `${p.date}T${p.time}:00`;
  const future = new Date(`${when}${OFFSET}`).getTime() > now;

  const blocks = [];
  const redes = redesAgendadas(p.id);
  const acao = redes.size === 2 ? 'atualizar' : redes.size === 0 ? 'criar' : 'atualizar+criar';
  if (!cfg.blogId) blocks.push('marca do Disk Pizza ausente no Metricool');
  if (!cfg.mediaBaseUrl) blocks.push('mídia sem URL pública');
  if (p.depends_on && !cfg.liberados[p.depends_on]) blocks.push(`aguarda ${p.depends_on}`);
  if (!future) blocks.push('data no passado');
  if (missingLocal.length) blocks.push('arquivo de mídia ausente');
  if (!v || v.problems.length || !/^OK/.test(v.status)) blocks.push('mídia reprovada na verificação');

  const checks = [];
  const ig = p.caption_instagram, fb = p.caption_facebook;
  checks.push(ig.length <= 2200 && fb.length <= 2200 ? 'texto ≤2200' : '⚠ TEXTO LONGO');
  checks.push(((ig.match(/#\S+/g) || []).length <= 30) ? 'hashtags ok' : '⚠ HASHTAGS >30');
  if (p.photos.length) checks.push(ig.includes('Foto ilustrativa') ? 'rótulo foto ilustrativa' : '⚠ FALTA rótulo ilustrativa');
  if (p.cta === 'forte') checks.push(ig.includes('Peça agora pelo Disk Pizza') ? 'CTA forte' : '⚠ FALTA CTA');
  const copyOk = !checks.some((c) => c.startsWith('⚠'));

  const alt = (p.format === 'carrossel' ? files : [files[0]]).map(() => `${p.on_art}${p.photos.length ? '. Foto ilustrativa de pizza.' : '.'}`);
  const base = { autoPublish: true, descendants: [], draft: false, firstCommentText: '', hasNotReadNotes: false, media, mediaAltText: p.format === 'reel' ? [] : alt, publicationDate: { dateTime: when, timezone: cfg.timezone }, shortener: false, smartLinkData: { ids: [] } };
  const reel = p.format === 'reel';
  for (const net of ['instagram', 'facebook']) {
    const info = { ...base, text: net === 'instagram' ? ig : fb, providers: [{ network: net }] };
    if (net === 'instagram') info.instagramData = { type: reel ? 'REEL' : 'POST', collaborators: [], showReelOnFeed: true, isAiGenerated: false };
    else info.facebookData = { type: reel ? 'REEL' : 'POST' };
    const mid = idAgendado(p.id, net);
    items.push({ id: p.id, network: net, acao: mid ? 'atualizar' : 'criar', metricoolId: mid, bloqueios: blocks, call: { blogId: cfg.blogId || '{blogId}', date: `${when}${OFFSET}`, info } });
  }

  rows.push({
    id: p.id, acao, date: p.date, weekday: p.weekday, time: p.time, format: p.format + (p.slides ? ` (${p.slides})` : ''),
    crop: v ? v.status + (v.video && !String(v.video).startsWith('ok') ? ` · ${v.video}` : v && v.video ? ` · ${v.video}` : '') : 'SEM VERIFICAÇÃO',
    copy: Array.from(ig.split('\n')[0]).slice(0, 70).join(''), copyOk, checks: checks.join(', '), blocks,
  });
}

const ready = rows.filter((r) => !r.blocks.length).length;
const byBlock = {};
rows.forEach((r) => r.blocks.forEach((b) => (byBlock[b] = (byBlock[b] || 0) + 1)));

fs.writeFileSync(path.join(DIR, 'payload-lote.json'), JSON.stringify({
  meta: { gerado_em: new Date().toISOString(), posts: posts.length, chamadas: items.length, blogId: cfg.blogId, mediaBaseUrl: cfg.mediaBaseUrl, aviso: 'Rascunho. Nada agendado. Cada item vira uma chamada createScheduledPost (info deve ser enviado como string JSON).' },
  items,
}, null, 2) + '\n');

const md = [
  '# Tabela de validação — antes de agendar no Metricool',
  '',
  `Gerada em ${new Date().toLocaleString('pt-BR', { timeZone: cfg.timezone })} (Brasília). **Nada foi agendado.** ${posts.length} posts, ${items.length} chamadas (uma por rede: Instagram e Facebook).`,
  '',
  `**Prontos para agendar agora: ${ready} de ${posts.length}.** Bloqueios: ${Object.entries(byBlock).map(([k, n]) => `${k} (${n})`).join(' · ') || 'nenhum'}.`,
  '',
  '| ID | Ação | Data | Dia | Hora | Formato | Crop / mídia | Copy (início) | Checagens de texto | Bloqueio |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.acao} | ${r.date} | ${r.weekday} | ${r.time} | ${r.format} | ${r.crop} | ${r.copy.replace(/\|/g, '/')} | ${r.checks} | ${r.blocks.join('; ') || '—'} |`),
  '',
  '## Regra de confirmação',
  '',
  'Antes de qualquer agendamento em massa o assistente mostra esta tabela e **só segue se você digitar exatamente `Y`**. Qualquer outra resposta cancela.',
  '',
].join('\n');
fs.writeFileSync(path.join(DIR, 'tabela-validacao.md'), md);
const csv = ['id;data;dia;hora;formato;crop_midia;copy;checagens;bloqueio', ...rows.map((r) => [r.id, r.date, r.weekday, r.time, r.format, r.crop, r.copy, r.checks, r.blocks.join('; ')].map((s) => `"${String(s).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
fs.writeFileSync(path.join(DIR, 'tabela-validacao.csv'), '﻿' + csv + '\r\n');

console.log(`posts: ${posts.length} | chamadas: ${items.length} | prontos agora: ${ready}`);
console.log('bloqueios:', JSON.stringify(byBlock));
console.log('copy com problema:', rows.filter((r) => !r.copyOk).map((r) => r.id).join(', ') || 'nenhum');
