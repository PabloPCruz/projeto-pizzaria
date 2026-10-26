// Prévia de um layout com conteúdos de exemplo (títulos curtos e longos, com e sem CTA) em várias paletas.
// Uso: node marketing/tools/preview-layout.js <layoutId> [--paletas carvao,creme] [--saida pasta]
// Saída: marketing/midia/_trabalho/preview/<layoutId>/*.jpg e folha.jpg (miniaturas de tudo). Não mexe em processada/.
const fs = require('fs');
const path = require('path');
const n = require('../midia/nucleo.js');
const { renderizar, carregarLayouts, DIM } = require('./lib-render.js');

const args = process.argv.slice(2);
const id = args[0];
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const layouts = carregarLayouts();
if (!id || !layouts[id]) { console.error(`layout? disponíveis: ${Object.keys(layouts).join(', ')}`); process.exit(1); }
const L = layouts[id];
const paletas = (arg('--paletas') || (L.paletas || ['carvao', 'creme', 'tomate']).join(',')).split(',');
const outDir = arg('--saida') || path.join(n.ROOT, 'marketing', 'midia', '_trabalho', 'preview', id);

const EX = {
  foto: [
    { tipo: 'photo', title: 'Marguerita', sub: 'Mussarela, tomate, parmesão e manjericão', photo: 'margherita', cta: 'forte' },
    { tipo: 'photo', title: 'Sexta 13? Azar é ficar sem pizza', sub: 'Mussarela, catupiry, gorgonzola, provolone e bacon', photo: 'quatro-queijos-bacon', cta: 'forte', idx: '2/4' },
    { tipo: 'photo', title: 'Tradicional: Romana', sub: 'Mussarela, presunto, tomate e parmesão', photo: 'presunto', cta: null, idx: '3/4' },
  ],
  texto: [
    { tipo: 'text', eyebrow: 'Feriado', title: 'Hoje a gente abre', lines: ['Das 18h às 23h', 'Monte a sua pizza pelo site'], cta: 'suave' },
    { tipo: 'text', eyebrow: 'Black Friday', title: 'A nossa promoção é todos os dias', lines: ['Sem esperar data para pedir a sua pizza do jeito que gosta.'], cta: null, deslize: true, idx: '1/4' },
    { tipo: 'size', eyebrow: 'Tamanho', title: 'Gigante', big: '16', bigLabel: 'fatias', lines: ['4 sabores', 'Qual é o seu?'], cta: 'forte', idx: '6/6' },
    { tipo: 'step', n: '2', title: 'Confira', lines: ['Revise o carrinho e informe o seu CEP'], idx: '3/4' },
    { tipo: 'list', eyebrow: 'Chocolate', title: 'Chocolates', lines: ['Chocolate ao Leite', 'Chocolate Branco', 'Ao Leite com Branco (o Bem Casado)'], idx: '4/5' },
  ],
  storyFoto: [
    { tipo: 'photo', title: 'Quatro Queijos com Bacon', photo: 'quatro-queijos-bacon' },
    { tipo: 'photo', title: 'Nachos', photo: 'nachos' },
  ],
  storyTexto: [
    { tipo: 'text', eyebrow: 'Sábado', title: 'Salgada de um lado, doce do outro', lines: [] },
    { tipo: 'text', eyebrow: 'Simples', title: 'Monte, confira e envie', lines: ['Pelo WhatsApp, sem cadastro'] },
  ],
  cta: [{ tipo: 'cta' }],
  // formatos interativos (layouts/interativos.js): cada layout filtra pelos seus tipos
  interativo: [
    { tipo: 'quiz', eyebrow: 'Quiz', title: 'Qual massa combina com você?', opcoes: ['Fina', 'Média', 'Grossa'], lines: ['Responda nos comentários'], cta: null },
    { tipo: 'quiz', eyebrow: 'Quiz da sexta', title: 'Se a sua sexta-feira fosse uma pizza, qual seria o sabor dela?', opcoes: ['Calabresa com cebola', 'Quatro queijos com bacon', 'Brigadeiro com granulado', 'Portuguesa caprichada'], lines: ['Responda nos comentários'], cta: 'forte', idx: '1/3', deslize: true },
    { tipo: 'quiz', eyebrow: 'Quiz', title: 'Pizza boa tem borda…', opcoes: ['Recheada', 'Fininha', 'Crocante', 'Dobrada'], lines: ['Responda nos comentários'], cta: 'suave', idx: '2/3' },
    { tipo: 'versus', title: 'Borda de Catupiry ou de Nutella?', opcoes: ['Catupiry', 'Nutella'], lines: ['Vote nos comentários'], cta: null },
    { tipo: 'versus', eyebrow: 'Este ou aquele', title: 'Salgada ou doce?', fotos: ['calabresa', 'brigadeiro'], opcoes: ['Salgada', 'Doce'], lines: ['Vote nos comentários'], cta: 'forte' },
    { tipo: 'versus', title: 'No domingo à noite, qual é a sua pedida para fechar o fim de semana?', opcoes: ['Pizza salgada gigante', 'Pizza doce média'], lines: ['Comente A ou B'], cta: 'suave', idx: '2/4', deslize: true },
    { tipo: 'checklist', eyebrow: 'Sexta à noite', title: 'Noite de pizza perfeita', lines: ['Pizza gigante com 4 sabores', 'Borda recheada', 'Refri 2L para a turma', 'Filme escolhido', 'A turma reunida'], cta: null },
    { tipo: 'checklist', eyebrow: 'Antes de pedir', title: 'Tudo pronto para o pedido mais caprichado da semana?', lines: ['Escolha o tamanho', 'Divida os sabores', 'Confira o carrinho'], cta: 'forte', idx: '2/3', deslize: true },
    { tipo: 'checklist', eyebrow: 'Kit pizza', title: 'Lista do sábado', lines: ['Pizza média de calabresa', 'Pizza doce de brigadeiro', 'Borda de catupiry', 'Refri 2L', 'Guardanapo de sobra', 'Sofá liberado'], cta: 'suave', idx: '1/2' },
    { tipo: 'grade', title: 'Caça-sabores', palavras: ['CALABRESA', 'PORTUGUESA', 'NACHOS', 'BROCOLIS', 'CONFETE', 'PEPERONE'], lines: ['Ache os 6 sabores do nosso cardápio'], cta: null },
    { tipo: 'grade', eyebrow: 'Desafio', title: 'Caça-palavras da pizzaria mais gostosa da cidade', palavras: ['MUSSARELA', 'BACON', 'MILHO', 'CATUPIRY', 'ORÉGANO'], lines: ['Ache as 5 palavras escondidas'], cta: 'forte', idx: '1/2', deslize: true },
    { tipo: 'grade', title: 'Ache os sabores doces', palavras: ['BRIGADEIRO', 'CONFETE', 'MORANGO', 'BANANA', 'ROMEU', 'JULIETA', 'CHOCOLATE', 'SUSPIRO'], lines: ['Ache as 8 palavras doces'], cta: 'suave', idx: '2/2' },
    { tipo: 'frase', eyebrow: 'Verdades', title: 'Quem pede a gigante nunca se arrepende.', sub: '— todo mundo, sexta à noite', cta: null },
    { tipo: 'frase', title: 'A dieta começa na segunda. Hoje é sexta, e sexta tem pizza com a turma toda.', cta: 'forte' },
    { tipo: 'frase', eyebrow: 'Fato', title: 'Sobrou pizza? Nunca ouvimos falar disso.', sub: '— a turma toda', cta: 'suave', idx: '3/4', deslize: true },
    { tipo: 'fluxo', eyebrow: 'Como funciona', title: 'Do clique à sua porta', lines: ['Monte no site', 'Envie pelo WhatsApp', 'A loja confirma', 'Chega na sua casa'], cta: null },
    { tipo: 'fluxo', eyebrow: 'Passo a passo', title: 'Pedir a sua pizza ficou mais simples do que escolher o sabor', lines: ['Escolha tamanho e sabores', 'Confira o carrinho e o CEP', 'Envie e aguarde a confirmação'], cta: 'forte' },
    { tipo: 'fluxo', eyebrow: 'Como pedir', title: 'Cinco passos', lines: ['Escolha o tamanho', 'Monte os sabores', 'Confira o carrinho', 'Envie pelo WhatsApp', 'Chega na sua casa'], cta: 'suave', idx: '1/3', deslize: true },
    { tipo: 'curiosidade', eyebrow: 'Você sabia?', title: 'Na pizza Gigante cabem até 4 sabores', lines: ['São 16 fatias: dá para agradar a turma toda.'], cta: null },
    { tipo: 'curiosidade', eyebrow: 'Você sabia?', title: 'A Marguerita leva as cores da bandeira da Itália', lines: ['Manjericão, mussarela e tomate: verde, branco e vermelho.', 'Uma homenagem que virou clássico no mundo todo.', 'Aqui no cardápio ela se chama Marguerita.'], cta: 'forte', idx: '2/3' },
    { tipo: 'curiosidade', title: 'Brigadeiro também vira pizza', lines: ['E com granulado por cima.'], cta: 'suave', idx: '1/4', deslize: true },
  ],
};
const TIPOS_INTERATIVOS = ['quiz', 'versus', 'checklist', 'grade', 'frase', 'fluxo', 'curiosidade'];
const interativo = (L.tipos || []).some((t) => TIPOS_INTERATIVOS.includes(t));
const exemplos = interativo ? EX.interativo : L.formato === 'story'
  ? (L.usa === 'foto' ? EX.storyFoto : L.usa === 'cta' ? EX.cta : L.usa === 'texto' ? EX.storyTexto : [...EX.storyFoto, ...EX.storyTexto])
  : (L.usa === 'foto' ? EX.foto : L.usa === 'texto' ? EX.texto : [...EX.foto, ...EX.texto]);
const filtrados = L.tipos ? exemplos.filter((e) => L.tipos.includes(e.tipo)) : exemplos;

(async () => {
  const [w, h] = DIM[L.formato];
  const files = [];
  for (const pal of paletas) {
    for (let i = 0; i < filtrados.length; i++) {
      const inner = await L.render(filtrados[i], { n, p: n.paleta(pal), post: { id: 'PREVIEW', date: '2026-11-06' }, variante: arg('--variante') });
      const out = path.join(outDir, `${pal}-${i + 1}.jpg`);
      await renderizar(inner, w, h, out, path.join(outDir, '_tmp', `${pal}-${i + 1}`));
      files.push(out);
    }
  }
  // folha de miniaturas
  const T = L.formato === 'story' ? 220 : 300, TH = L.formato === 'story' ? 391 : 300, COLS = Math.min(files.length, 5);
  const rows = Math.ceil(files.length / COLS);
  const comps = [];
  for (let i = 0; i < files.length; i++) {
    comps.push({ input: await n.sharp(files[i]).resize(T, TH).toBuffer(), left: (i % COLS) * (T + 8), top: Math.floor(i / COLS) * (TH + 8) });
  }
  await n.sharp({ create: { width: COLS * (T + 8), height: rows * (TH + 8), channels: 3, background: '#444' } }).composite(comps).jpeg({ quality: 85 }).toFile(path.join(outDir, 'folha.jpg'));
  fs.rmSync(path.join(outDir, '_tmp'), { recursive: true, force: true });
  console.log(`${files.length} prévias em ${outDir} (veja folha.jpg)`);
})().catch((e) => { console.error(e); process.exit(1); });
