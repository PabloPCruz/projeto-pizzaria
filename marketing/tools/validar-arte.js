// Valida a direção de arte (marketing/midia/arte.json) contra o calendário, o conteúdo e o catálogo de layouts.
// Confere cobertura, compatibilidade (formato/tipo, incluindo os tipos interativos v2.1: quiz, versus, checklist, grade, frase, fluxo, curiosidade), paletas, transições e os critérios de variedade.
// Uso: node marketing/tools/validar-arte.js [caminho/arte.json]   (sai com código 1 se houver erro; não gera nem envia nada)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const M = path.join(ROOT, 'marketing');
const ARTE = JSON.parse(fs.readFileSync(process.argv[2] || path.join(M, 'midia', 'arte.json'), 'utf8'));
const POSTS = JSON.parse(fs.readFileSync(path.join(M, 'calendario', 'posts.json'), 'utf8'));
const { FEED_PHOTO_SUB, SLIDES, REELS } = require(path.join(M, 'midia', 'conteudo.js'));
const CATALOGO = fs.readFileSync(path.join(M, 'midia', 'layouts', 'CATALOGO.md'), 'utf8');

const PUBLICADOS = new Set(['X01', 'X02', 'P01', 'P02']);
const PALETAS = ['carvao', 'creme', 'tomate', 'manjericao', 'ouro', 'noite', 'chocolate'];
const MOVIMENTOS = ['zoom-in', 'zoom-out', 'pan-esquerda', 'pan-direita', 'parado'];
const TRANSICOES = ['fade', 'dissolve', 'slideleft', 'slideright', 'slideup', 'wipeleft', 'wiperight', 'circleopen', 'circleclose', 'radial', 'smoothleft', 'smoothup', 'fadeblack', 'hblur', 'zoomin'];
const MAX_PRINCIPAL = 6;
const MAX_RESERVA = 2;
const MAX_PALETA = 0.25;

const erros = [];
const avisos = [];
const erro = (m) => erros.push(m);

// --- Catálogo: ids das tabelas `| \`id\` |` por família, variantes declaradas, reserva v1 e interativos (v2.1) ---
// Cada layout recebe `tipos`: os tipos de peça que aceita (photo, text, size, step, list, cta e os interativos).
const TIPOS_TEXTO = ['text', 'size', 'step', 'list'];
const TIPOS_INTERATIVOS = {}; // tipo de conteúdo -> layout(s) do tipo (preenchido pelo catálogo)
const LAYOUTS = {};
let familia = null;
const linhas = CATALOGO.split(/\r?\n/);
for (const linha of linhas) {
  const h = linha.match(/^(#{1,6})\s+(.*)/);
  if (h) {
    const t = h[2].toLowerCase();
    familia = t.includes('interativ') ? 'interativos'
      : h[1] !== '###' ? null
      : t.includes('reels') ? 'stories' : t.includes('tipogr') ? 'tipografia' : t.includes('foto') ? 'fotos' : t.includes('reserva') ? 'reserva' : null;
    continue;
  }
  if (!familia) continue;
  const row = linha.match(/^\|\s*`([a-z0-9-]+)`\s*\|(.*)$/);
  if (row && familia === 'interativos') {
    // | `tipo` | campos | `layout` (...) |
    const tipo = row[1];
    const cols = row[2].split('|');
    const ids = [...(cols[cols.length - 2] || '').matchAll(/`([a-z0-9-]+)`/g)].map((x) => x[1]);
    TIPOS_INTERATIVOS[tipo] = ids;
    for (const id of ids) {
      const L = LAYOUTS[id] || (LAYOUTS[id] = { id, familia, formato: 'feed', usa: 'texto', tipos: [], variantes: [], reserva: false });
      if (!L.tipos.includes(tipo)) L.tipos.push(tipo);
    }
  } else if (row && familia !== 'reserva') {
    const id = row[1];
    const vm = row[2].match(/Variantes?:([^.|]*)/i);
    const variantes = vm ? [...vm[1].matchAll(/`([^`]+)`/g)].map((x) => x[1]) : [];
    const formato = familia === 'stories' ? 'story' : 'feed';
    const usa = familia === 'fotos' ? 'foto' : familia === 'tipografia' ? 'texto'
      : id.startsWith('story-cta') ? 'cta' : id === 'story-tipografico' ? 'texto' : 'foto';
    const tipos = usa === 'foto' ? ['photo'] : usa === 'cta' ? ['cta'] : formato === 'story' ? ['text']
      : id === 'numero-gigante' ? ['size', 'step', 'text'] : TIPOS_TEXTO;
    LAYOUTS[id] = { id, familia, formato, usa, tipos, variantes, reserva: false };
  } else if (familia === 'reserva' && !linha.startsWith('|')) {
    for (const [, id] of linha.matchAll(/`([a-z0-9-]+)`/g)) {
      if (id.includes('/') || id.endsWith('.js')) continue;
      const formato = id.startsWith('story') ? 'story' : 'feed';
      const usa = id === 'story-cta' ? 'cta' : ['story-texto', 'cartao-elegante'].includes(id) ? 'texto' : 'foto';
      const tipos = usa === 'foto' ? ['photo'] : usa === 'cta' ? ['cta'] : formato === 'story' ? ['text'] : TIPOS_TEXTO;
      LAYOUTS[id] = { id, familia: 'reserva', formato, usa, tipos, variantes: [], reserva: true };
    }
  }
}
// "`este-ou-aquele` com `fotos` é `usa: 'ambos'`" (regras extras dos interativos)
for (const linha of linhas) {
  const m = linha.match(/`([a-z0-9-]+)`[^`]*`fotos`[^`]*`usa: 'ambos'`/);
  if (m && LAYOUTS[m[1]]) LAYOUTS[m[1]].usa = 'ambos';
}
if (Object.keys(LAYOUTS).length < 10) erro(`catálogo: só ${Object.keys(LAYOUTS).length} layouts lidos de CATALOGO.md`);
if (Object.keys(TIPOS_INTERATIVOS).length < 7) erro(`catálogo: só ${Object.keys(TIPOS_INTERATIVOS).length} tipos interativos lidos de CATALOGO.md`);
const ehInterativo = (tipo) => Boolean(TIPOS_INTERATIVOS[tipo]);

// Layouts já implementados (midia/layouts/*.js): se declaram `tipos`/`variantes`, também valem.
let IMPL = {};
try { IMPL = require('./lib-render.js').carregarLayouts(); } catch (e) { avisos.push(`layouts implementados não carregados (${e.message}); conferi só pelo catálogo`); }
const naoImpl = Object.keys(LAYOUTS).filter((id) => !IMPL[id]);
if (naoImpl.length) avisos.push(`ainda sem implementação: ${naoImpl.join(', ')}`);

// --- Peças de cada post (mesma regra de gerar-midia.js) ---
function pecas(p) {
  if (p.format === 'reel') return (REELS[p.id] || []).map((c) => (c.t === 'photo' ? 'photo' : c.t === 'cta' ? 'cta' : 'text'));
  if (p.format === 'carrossel' || !p.photos.length || SLIDES[p.id]) return (SLIDES[p.id] || []).map((s) => s.layout || 'text');
  return ['photo'];
}

function compativel(L, tipo) {
  if (tipo === 'cta' && L.usa !== 'cta') return 'cena final pede story-cta-ticket, story-cta-selo ou story-cta';
  if (ehInterativo(tipo) && !L.tipos.includes(tipo)) return `peça ${tipo} usa o layout do tipo (${TIPOS_INTERATIVOS[tipo].join(', ')})`;
  if (!L.tipos.includes(tipo)) return `aceita ${L.tipos.join('/')}, peça é ${tipo}`;
  return null;
}

const alvo = POSTS.filter((p) => !PUBLICADOS.has(p.id)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
const idsPosts = new Set(POSTS.map((p) => p.id));
for (const id of Object.keys(ARTE)) {
  if (!idsPosts.has(id)) erro(`${id}: está em arte.json mas não existe em posts.json`);
  else if (PUBLICADOS.has(id)) erro(`${id}: já publicado, não deve estar em arte.json`);
}

const usoPrincipal = {};
const usoTotal = {};
const usoPaleta = {};
const combos = new Map();
const assinaturasReel = new Map();
const resumo = [];
let usoReserva = 0;

for (const p of alvo) {
  const a = ARTE[p.id];
  if (!a) { erro(`${p.id}: sem entrada em arte.json`); continue; }
  const tipos = pecas(p);
  if (!tipos.length) { erro(`${p.id}: sem conteúdo em conteudo.js`); continue; }
  const formato = p.format === 'reel' ? 'story' : 'feed';
  const chave = p.format === 'reel' ? 'cenas' : 'slides';
  const outra = chave === 'cenas' ? 'slides' : 'cenas';
  if (a[outra]) erro(`${p.id}: use "${chave}", não "${outra}" (formato ${p.format})`);
  let lista = a[chave];
  if (!lista) {
    if (p.format !== 'feed' || !p.photos.length) erro(`${p.id}: precisa de "${chave}" com ${tipos.length} item(ns)`);
    lista = [{}];
  }
  if (lista.length !== tipos.length) erro(`${p.id}: ${lista.length} ${chave} em arte.json, conteúdo tem ${tipos.length}`);

  const efetivas = tipos.map((tipo, i) => {
    const it = lista[i] || {};
    return { tipo, layout: it.layout || a.layout, paleta: it.paleta || a.paleta, variante: it.variante || a.variante, movimento: it.movimento };
  });

  efetivas.forEach((e, i) => {
    const onde = `${p.id} peça ${i + 1}`;
    const L = LAYOUTS[e.layout];
    if (!e.layout) return erro(`${onde}: sem layout`);
    if (!L) return erro(`${onde}: layout "${e.layout}" não existe no catálogo`);
    if (L.formato !== formato) erro(`${onde}: ${e.layout} é ${L.formato}, post é ${formato}`);
    const c = compativel(L, e.tipo);
    if (c) erro(`${onde}: ${e.layout} (${c})`);
    const I = IMPL[e.layout];
    if (I && I.tipos && !I.tipos.includes(e.tipo)) erro(`${onde}: ${e.layout} implementado só aceita ${I.tipos.join('/')}, peça é ${e.tipo}`);
    if (I && e.variante && I.variantes && !I.variantes.includes(e.variante)) erro(`${onde}: ${e.layout} implementado não tem variante "${e.variante}"`);
    if (!PALETAS.includes(e.paleta)) erro(`${onde}: paleta inválida "${e.paleta}"`);
    if (e.variante) {
      if (L.variantes.length && !L.variantes.includes(e.variante)) erro(`${onde}: variante "${e.variante}" não existe em ${e.layout} (${L.variantes.join(', ')})`);
      if (!L.variantes.length) avisos.push(`${onde}: ${e.layout} não declara variantes no catálogo ("${e.variante}" pode ser ignorada)`);
    }
    if (formato === 'story') {
      if (!MOVIMENTOS.includes(e.movimento)) erro(`${onde}: movimento inválido "${e.movimento}"`);
    } else if (e.movimento) erro(`${onde}: "movimento" só vale para Reels`);
    if (L.reserva) usoReserva++;
    usoTotal[e.layout] = (usoTotal[e.layout] || 0) + 1;
  });
  if (a.paleta && !PALETAS.includes(a.paleta)) erro(`${p.id}: paleta base inválida "${a.paleta}"`);

  if (formato === 'story') {
    const tr = a.transicoes || [];
    if (tr.length !== tipos.length - 1) erro(`${p.id}: ${tr.length} transições, esperado ${tipos.length - 1} (cenas - 1)`);
    tr.forEach((t) => { if (!TRANSICOES.includes(t)) erro(`${p.id}: transição inválida "${t}"`); });
    if (new Set(efetivas.map((e) => e.layout)).size < 2) erro(`${p.id}: Reel com um layout de cena só`);
    // Critério 5: nenhum par de Reels com a mesma sequência de cenas, de transições ou de movimentos.
    const sigs = {
      'layouts de cena': efetivas.map((e) => e.layout).join('>'),
      transições: tr.join('>'),
      movimentos: efetivas.map((e) => e.movimento).join('>'),
    };
    for (const [nome, sig] of Object.entries(sigs)) {
      const k = nome + '|' + sig;
      if (assinaturasReel.has(k)) erro(`critério 5: ${p.id} repete a sequência de ${nome} de ${assinaturasReel.get(k)}`);
      assinaturasReel.set(k, p.id);
    }
  } else if (a.transicoes) erro(`${p.id}: "transicoes" só vale para Reels`);

  if (p.format === 'carrossel') {
    if (!a.paleta) erro(`${p.id}: carrossel precisa de paleta base no post`);
    const capa = efetivas[0].layout;
    const internas = efetivas.slice(1).map((e) => e.layout);
    if (new Set(efetivas.map((e) => e.layout)).size < 2) erro(`${p.id}: carrossel precisa de pelo menos 2 layouts`);
    // A capa não se repete nas internas, salvo slides interativos (o tipo obriga o layout, ex.: quiz com 3 perguntas).
    efetivas.slice(1).forEach((e, i) => {
      if (e.layout !== capa) return;
      if (ehInterativo(e.tipo)) avisos.push(`${p.id} slide ${i + 2}: repete o layout da capa (${capa}) porque o tipo ${e.tipo} obriga`);
      else erro(`${p.id}: capa (${capa}) repete layout do slide ${i + 2}`);
    });
  }

  const princ = efetivas[0];
  usoPrincipal[princ.layout] = (usoPrincipal[princ.layout] || 0) + 1;
  usoPaleta[princ.paleta] = (usoPaleta[princ.paleta] || 0) + 1;
  const combo = `${princ.layout}+${princ.paleta}+${princ.variante || '-'}`;
  if (combos.has(combo)) erro(`critério 1: ${p.id} repete a combinação ${combo} de ${combos.get(combo)}`);
  combos.set(combo, p.id);
  resumo.push({ p, layout: princ.layout, paleta: princ.paleta, variante: princ.variante || '', forcado: ehInterativo(princ.tipo) });
}

// Critério 2: posts vizinhos no calendário (incluindo dias seguidos) não repetem layout nem paleta principal.
// Exceção: dois posts interativos do mesmo tipo (o tipo obriga o layout) em dias NÃO seguidos viram aviso.
for (let i = 1; i < resumo.length; i++) {
  const x = resumo[i - 1], y = resumo[i];
  const dias = Math.round((new Date(y.p.date) - new Date(x.p.date)) / 864e5);
  const rot = `${x.p.id} (${x.p.date}) e ${y.p.id} (${y.p.date})${dias === 1 ? ', dias seguidos' : ''}`;
  if (x.layout === y.layout) {
    if (x.forcado && y.forcado && dias > 1) avisos.push(`critério 2: ${rot} com o mesmo layout ${x.layout} (tipo interativo da pauta; dias não seguidos)`);
    else erro(`critério 2: ${rot} com o mesmo layout principal ${x.layout}`);
  }
  if (x.paleta === y.paleta) erro(`critério 2: ${rot} com a mesma paleta principal ${x.paleta}`);
}

// Critério 3: todos os layouts do catálogo em uso; reserva no máximo 2 vezes; nenhum principal acima de 6.
for (const L of Object.values(LAYOUTS)) if (!L.reserva && !usoTotal[L.id]) erro(`critério 3: layout ${L.id} não foi usado`);
if (usoReserva > MAX_RESERVA) erro(`critério 3: layouts de reserva (v1) usados ${usoReserva} vezes (máx. ${MAX_RESERVA})`);
for (const [id, n] of Object.entries(usoPrincipal)) if (n > MAX_PRINCIPAL) erro(`critério 3: ${id} é principal em ${n} posts (máx. ${MAX_PRINCIPAL})`);

// Critério 7: todas as paletas usadas como principal; nenhuma acima de ~25% dos posts.
for (const pal of PALETAS) {
  const n = usoPaleta[pal] || 0;
  if (!n) erro(`critério 7: paleta ${pal} não é principal em nenhum post`);
  if (n > MAX_PALETA * resumo.length) erro(`critério 7: paleta ${pal} em ${n}/${resumo.length} posts (> ${MAX_PALETA * 100}%)`);
}

// Adequação das datas especiais (critério 6, parte verificável).
const R = Object.fromEntries(resumo.map((r) => [r.p.id, r]));
const regra = (id, ok, msg) => { if (R[id] && !ok(R[id])) erro(`critério 6: ${id} ${msg}`); };
regra('P06', (r) => r.paleta === 'noite', 'Halloween pede paleta noite');
regra('P18', (r) => (r.layout === 'celebracao' && r.variante === 'sobrio') || (r.layout === 'poster-tipografico' && r.paleta === 'carvao'), 'Consciência Negra pede celebracao sobrio ou pôster carvao');
for (const id of ['P20', 'P21', 'P22']) regra(id, (r) => ['carvao', 'ouro'].includes(r.paleta) || (r.layout === 'faixa-diagonal'), 'Black Friday pede carvao/ouro (ou faixa-diagonal)');
regra('P35', (r) => ['manjericao', 'tomate'].includes(r.paleta), 'Reel de Natal pede manjericao/tomate');
regra('P38', (r) => r.layout === 'celebracao' && r.variante === 'natal' && ['manjericao', 'tomate'].includes(r.paleta), 'Natal pede celebracao natal manjericao/tomate');
regra('P42', (r) => r.layout === 'celebracao' && r.variante === 'anonovo' && ['noite', 'ouro'].includes(r.paleta), 'Ano Novo pede celebracao anonovo noite/ouro');

// --- Resumo ---
const tabela = (obj, total) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k.padEnd(20)} ${String(v).padStart(3)}${total ? ` (${Math.round((100 * v) / total)}%)` : ''}`).join('\n');
console.log(`Posts conferidos: ${resumo.length} (publicados ignorados: ${[...PUBLICADOS].join(', ')})`);
console.log('\nLayout principal por post:\n' + tabela(usoPrincipal));
console.log('\nUso total por layout (todas as peças):\n' + tabela(usoTotal));
console.log('\nPaleta principal por post:\n' + tabela(usoPaleta, resumo.length));
if (avisos.length) console.log('\nAvisos:\n' + avisos.map((x) => '  ' + x).join('\n'));
if (erros.length) {
  console.log(`\nERROS (${erros.length}):\n` + erros.map((x) => '  ' + x).join('\n'));
  process.exit(1);
}
console.log('\nOK: arte.json passou em todas as verificações.');
