// Texto das artes (o que aparece escrito na imagem). A legenda de cada post fica em calendario/posts.json.
// Só entram fatos já presentes no site/cardápio da loja. Sem preço, desconto ou italiano.
// layout (tipo de conteúdo): 'photo' | 'text' | 'size' | 'step' | 'list'
//   + interativos (v2.1, ver layouts/CATALOGO.md): 'quiz' | 'versus' | 'checklist' | 'grade' | 'frase' | 'fluxo' | 'curiosidade'
// cta: 'forte' (Peça agora pelo Disk Pizza) | 'suave' (Monte a sua pelo link na bio) | null

// Posts de feed com foto única: subtítulo da faixa (ingredientes conforme menu.data.ts).
const FEED_PHOTO_SUB = {
  X01: 'Hoje abrimos das 18h às 23h',
  P01: 'Abrimos às 18h e vamos até as 23h',
  P05: 'Mussarela, tomate, parmesão e manjericão',
  P10: 'Mussarela, brócolis e bacon · opção com catupiry',
  P12: 'Misture salgado e doce na mesma pizza',
  P19: 'Mussarela, peperone e azeitona',
  P26: 'Mussarela, frango, bacon, tomate e catupiry',
  P29: 'Mussarela, calabresa, pimentão, ovos, bacon e pimenta calabresa',
  P31: 'Mussarela, frango e brócolis',
  P37: 'Bolonhesa para um, Marguerita para outro',
  P46: 'Também é borda: Chocolate ao Leite com Chocolate Branco',
  P50: 'Chocolate ao leite, doce de leite e granulado',
  P54: 'Mussarela, lombo defumado e milho',
};

// Posts de feed sem foto única, formatos interativos e todos os slides dos carrosséis (cada item é um slide 1080x1080).
const SLIDES = {
  // ── outubro / novembro ──
  P03: [
    { layout: 'quiz', eyebrow: 'Quiz da massa', title: 'Qual massa tem a sua cara?', opcoes: ['Fina', 'Média', 'Grossa'], lines: ['Responda nos comentários: A, B ou C'], deslize: true },
    { layout: 'curiosidade', eyebrow: 'Novidade', title: 'Agora você escolhe a massa', lines: ['Fina, média ou grossa: uma massa por pizza.', 'Fica no passo “Massa”, entre Sabores e Borda.'] },
    { layout: 'text', eyebrow: 'Sem preferência?', title: 'Tudo bem', lines: ['A pizza sai com a massa padrão da casa.'], cta: 'suave' },
  ],
  P04: [
    { layout: 'text', eyebrow: 'Guia de tamanhos', title: 'Quantas fatias cabem na sua noite?', lines: ['Conte as fatias e os sabores'], deslize: true },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Pequena', big: '4', bigLabel: 'fatias', lines: ['1 sabor'] },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Média', big: '6', bigLabel: 'fatias', lines: ['2 sabores'] },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Grande', big: '8', bigLabel: 'fatias', lines: ['3 sabores'] },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Big', big: '12', bigLabel: 'fatias', lines: ['3 sabores'] },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Gigante', big: '16', bigLabel: 'fatias', lines: ['4 sabores', 'Salve para a próxima noite de pizza'], cta: 'forte' },
  ],
  P06: [
    { layout: 'versus', eyebrow: 'Halloween', title: 'Doçura ou travessura?', opcoes: ['Doçura: Confete', 'Travessura: Mexicana'], fotos: ['confete', 'mexicana'], lines: ['Vote nos comentários'], cta: 'forte' },
  ],
  P07: [{ layout: 'text', eyebrow: 'Feriado', title: 'Hoje a gente abre', lines: ['Das 18h às 23h'], cta: 'suave' }],
  P08: [
    { layout: 'grade', eyebrow: 'Caça-palavras', title: 'Ache os 6 sabores', palavras: ['CALABRESA', 'NACHOS', 'CONFETE', 'BOLONHESA', 'PEPERONE', 'ATUM'], lines: ['Na horizontal e na vertical', 'Comente quantos você achou'], cta: 'suave' },
  ],
  P09: [
    { layout: 'curiosidade', eyebrow: 'Você sabia?', title: '4 das 7 bordas são doces', lines: ['E vale borda doce em pizza salgada.'], deslize: true },
    { layout: 'list', eyebrow: 'Salgadas', title: '3 bordas de queijo', lines: ['Catupiry', 'Catupiry com Cheddar', 'Cheddar'] },
    { layout: 'list', eyebrow: 'Doces', title: '4 bordas doces', lines: ['Nutella', 'Chocolate ao Leite', 'Chocolate Branco', 'Ao Leite com Branco'], cta: 'forte' },
  ],
  P13: [
    { layout: 'checklist', eyebrow: 'Checklist', title: 'Noite de pizza perfeita', lines: ['Sofá reservado', 'Filme ou jogo escolhido', 'Turma avisada', 'Sabores decididos (sem briga)', 'Pedido enviado pelo WhatsApp'], cta: 'suave' },
  ],
  P14: [{ layout: 'frase', eyebrow: 'Sexta 13', title: 'Azar mesmo é ficar sem pizza.', sub: 'Hoje abrimos das 18h às 23h', cta: 'forte' }],
  P15: [{ layout: 'text', eyebrow: 'Feriado no domingo', title: 'Domingo a gente descansa', lines: ['Hoje abrimos das 18h às 23h', 'A pizza do feriado é hoje'], cta: 'forte' }],
  P16: [
    { layout: 'fluxo', eyebrow: 'Entrega grátis', title: 'Até 3 km da loja: confira pelo CEP', lines: ['Monte o pedido no site', 'Digite o CEP ao finalizar', 'Até 3 km da loja: entrega grátis', 'Fora do raio: a loja informa a taxa no WhatsApp'], cta: 'forte' },
  ],
  P17: [
    { layout: 'text', eyebrow: 'Doces', title: 'Qual doce fecha a sua noite?', lines: ['Vote: 1, 2 ou 3'], deslize: true },
    { layout: 'photo', photo: 'brigadeiro', title: '1. Brigadeiro', sub: 'Chocolate ao leite, doce de leite e granulado' },
    { layout: 'photo', photo: 'confete', title: '2. Confete', sub: 'Chocolate ao leite, confete e leite condensado' },
    { layout: 'photo', photo: 'bem-casado', title: '3. Bem Casado', sub: 'Leite condensado, chocolate ao leite e chocolate branco', cta: 'forte' },
  ],
  P18: [{ layout: 'text', eyebrow: '20 de novembro', title: 'Dia da Consciência Negra', lines: ['Uma data para refletir sobre a história, a luta e a contribuição do povo negro para o Brasil.', 'Hoje abrimos das 18h às 23h.'], cta: null }],
  P20: [
    { layout: 'quiz', eyebrow: 'Black Friday', title: 'Qual é o seu perfil?', opcoes: ['Carrinho cheio desde segunda', 'Só olho e não compro nada', 'Fujo das filas', 'Só monto carrinho de pizza'], lines: ['Responda nos comentários com a letra'], cta: 'suave' },
  ],
  P21: [
    { layout: 'checklist', eyebrow: 'Black Friday', title: 'O carrinho que vale a pena', lines: ['Tamanho escolhido', 'Sabores decididos (até 4 na Gigante)', 'Massa do seu jeito', 'Borda recheada', 'Bebida para acompanhar'], cta: 'forte' },
  ],
  P22: [{ layout: 'frase', eyebrow: 'Black Friday', title: 'Sem contagem regressiva. Sem letra miúda. Só pizza.', sub: 'Hoje abrimos das 18h às 23h', cta: 'forte' }],

  // ── dezembro ──
  P24: [{ layout: 'frase', eyebrow: 'Confraternização', title: 'Todo grupo tem aquele que organiza tudo.', sub: 'Marque essa pessoa nos comentários', cta: 'suave' }],
  P25: [
    { layout: 'curiosidade', eyebrow: 'Você sabia?', title: 'Cada pizza do pedido pode ter a sua massa', lines: ['Fina, média ou grossa, pizza por pizza.'], deslize: true },
    { layout: 'list', eyebrow: 'Exemplo', title: 'Um pedido, três massas', lines: ['Pizza 1: massa fina', 'Pizza 2: massa média', 'Pizza 3: massa grossa'] },
    { layout: 'step', n: '3', title: 'Passo “Massa”', lines: ['Entre Sabores e Borda, no montador'], cta: 'forte' },
  ],
  P28: [
    { layout: 'quiz', eyebrow: 'Pergunta 1', title: 'Mussarela, carne moída, cheddar e doritos', opcoes: ['Nachos', 'Mexicana', 'Bolonhesa'], lines: ['Qual é o sabor?'], deslize: true },
    { layout: 'quiz', eyebrow: 'Pergunta 2', title: 'Mussarela, palmito e ervilha', opcoes: ['Portuguesa', 'Paulista', 'Caipira'], lines: ['Qual é o sabor?'] },
    { layout: 'quiz', eyebrow: 'Pergunta 3', title: 'Chocolate ao leite, coco ralado e leite condensado', opcoes: ['Prestígio', 'Confete', 'Bem Casado'], lines: ['Qual é o sabor?'] },
    { layout: 'curiosidade', eyebrow: 'Respostas', title: '1A · 2B · 3A', lines: ['Nachos, Paulista e Prestígio.', 'Quantas você acertou?'], cta: 'suave' },
  ],
  P30: [
    { layout: 'versus', eyebrow: 'Verão', title: 'Refri de 2L ou latinha?', opcoes: ['2L para dividir', 'Latinha para cada um'], lines: ['Vote nos comentários'], cta: 'forte' },
  ],
  P32: [
    { layout: 'checklist', eyebrow: 'Checklist de dezembro', title: 'Confraternização sem cozinha', lines: ['Lista de quem vai', 'Um sabor para cada um', 'Várias pizzas no mesmo carrinho', 'Bebidas no pedido', 'Pedido enviado pelo WhatsApp'], cta: 'suave' },
  ],
  P33: [
    { layout: 'text', eyebrow: 'Tradicionais', title: 'Clássicos que nunca saem de moda', lines: ['Qual é o seu?'], deslize: true },
    { layout: 'photo', photo: 'mussarela-tomate', title: 'Mussarela', sub: 'Mussarela e tomate' },
    { layout: 'photo', photo: 'presunto', title: 'Romana', sub: 'Mussarela, presunto, tomate e parmesão' },
    { layout: 'photo', photo: 'margherita', title: 'Marguerita', sub: 'Mussarela, tomate, parmesão e manjericão', cta: 'forte' },
  ],
  P34: [
    { layout: 'curiosidade', eyebrow: 'Você sabia?', title: 'A Bolonhesa tem 3 versões no cardápio', lines: ['Bolonhesa', 'Bolonhesa Especial', 'Bolonhesa Catu-Cheddar'], cta: 'forte' },
  ],
  P36: [{ layout: 'list', eyebrow: 'Fim de ano', title: 'Nossos horários', lines: ['24/12 · 18h às 23h', '25/12 · 18h às 23h', '31/12 · 18h às 23h', '01/01 · 18h às 23h'], cta: 'suave' }],
  P38: [{ layout: 'text', eyebrow: 'Natal', title: 'Feliz Natal', lines: ['Que a mesa tenha fartura e o coração, carinho.', 'Hoje abrimos das 18h às 23h.'], cta: null }],
  P39: [{ layout: 'frase', eyebrow: 'Pós-Natal', title: 'A cozinha pediu folga. A gente cobre.', sub: 'Hoje abrimos das 18h às 23h', cta: 'forte' }],
  P40: [{ layout: 'frase', eyebrow: 'Complete a frase', title: 'Em 2027, eu quero mais pizza de ________', sub: 'Responda nos comentários', cta: 'suave' }],
  P41: [
    { layout: 'checklist', eyebrow: 'Réveillon', title: 'Checklist da virada', lines: ['Roupa escolhida', 'Lista de metas para 2027', 'Pizza salgada para a noite', 'Pizza doce para brindar', 'Pedido feito antes das 23h'], cta: 'forte' },
  ],

  // ── janeiro ──
  P42: [{ layout: 'text', eyebrow: 'Ano Novo', title: 'Feliz 2027', lines: ['Que o ano comece com a mesa cheia.', 'Hoje abrimos das 18h às 23h.'], cta: null }],
  P44: [
    { layout: 'quiz', eyebrow: 'Férias', title: 'Quem escolhe o sabor na sua casa?', opcoes: ['Eu, claro', 'Quem pega o celular primeiro', 'As crianças', 'Ninguém se decide'], lines: ['Responda nos comentários: A, B, C ou D'], cta: 'suave' },
  ],
  P45: [{ layout: 'frase', eyebrow: 'Borda de Nutella', title: 'Toda fatia merece um final feliz.', sub: 'Escolha no passo “Borda” do montador', cta: 'forte' }],
  P48: [
    { layout: 'versus', eyebrow: 'Enquete', title: 'Time massa fina ou massa grossa?', opcoes: ['Massa fina', 'Massa grossa'], lines: ['Vote nos comentários (a média também vale)'], cta: 'suave' },
  ],
  P49: [
    { layout: 'curiosidade', eyebrow: 'Desde 2015', title: 'Disk Pizza em números', lines: ['Pizzaria de família em Curitiba, desde 2015.'], deslize: true },
    { layout: 'size', eyebrow: 'No cardápio', title: 'Tradicionais, especiais e doces', big: '71', bigLabel: 'sabores', lines: ['Qual é o seu favorito?'] },
    { layout: 'size', eyebrow: 'Na Gigante', title: 'Até 4 sabores', big: '16', bigLabel: 'fatias', lines: ['7 bordas', '3 massas'], cta: 'suave' },
  ],
  P52: [
    { layout: 'grade', eyebrow: 'Caça-palavras 2', title: 'Ache os 7 ingredientes', palavras: ['CATUPIRY', 'CHEDDAR', 'NUTELLA', 'BACON', 'MILHO', 'PALMITO', 'LOMBO'], lines: ['Na horizontal e na vertical', 'Comente quantos você achou'], cta: 'suave' },
  ],
  P53: [
    { layout: 'checklist', eyebrow: 'Férias', title: 'Kit maratona de série', lines: ['Série escolhida (sem spoiler)', 'Pizza Big: 12 fatias, 3 sabores', 'Borda recheada', 'Refri de 2L no carrinho', 'Celular no silencioso'], cta: 'forte' },
  ],
};

// Reels: cada cena vira um quadro 1080x1920; o FFmpeg junta com zoom suave e transição.
// t: 'text' (título e linhas) | 'photo' (foto com legenda) | 'cta' (fechamento). Total de 10 a 18 s.
const CTA_SCENE = { t: 'cta', dur: 3 };
const REELS = {
  X02: [
    { t: 'text', eyebrow: 'Hoje', title: 'Quinta tem pizza', lines: ['Abrimos às 18h'], dur: 2.5 },
    { t: 'photo', photo: 'frango-brocolis', title: 'Fran-Brócolis', dur: 2.5 },
    { t: 'photo', photo: 'mexicana', title: 'Mexicana', dur: 2.5 },
    { t: 'photo', photo: 'calabresa', title: 'Calabresa', dur: 2.5 },
    CTA_SCENE,
  ],
  P02: [
    { t: 'text', eyebrow: 'Prazer', title: 'Disk Pizza', lines: ['Pizzaria de família', 'Curitiba · desde 2015'], dur: 2.5 },
    { t: 'photo', photo: 'bolonhesa', title: 'Tradicionais, especiais e doces', dur: 3 },
    { t: 'photo', photo: 'quatro-queijos-bacon', title: 'Do pequeno ao gigante', dur: 3 },
    { t: 'photo', photo: 'lombo-milho', title: 'Misture salgado e doce', dur: 3 },
    { t: 'photo', photo: 'frango-bacon-catupiry', title: 'Segunda a sábado · 18h às 23h', dur: 3 },
    CTA_SCENE,
  ],
  // Fluxo "do clique à sua porta" (15,5 s)
  P11: [
    { t: 'text', eyebrow: 'Como pedir', title: 'Do clique à sua porta', lines: ['Em 4 passos'], dur: 2.5 },
    { t: 'photo', photo: 'nachos', title: '1. Monte do seu jeito', dur: 2.5 },
    { t: 'photo', photo: 'quatro-queijos-bacon', title: '2. Confira o carrinho e o CEP', dur: 2.5 },
    { t: 'text', eyebrow: 'Passo 3', title: 'Envie pelo WhatsApp', lines: ['A loja confirma com você', 'Sem cadastro'], dur: 2.5 },
    { t: 'photo', photo: 'presunto', title: '4. Pizza na sua porta', dur: 2.5, zoomOut: true },
    CTA_SCENE,
  ],
  // Jogo "pare o vídeo" (15,5 s): cenas de foto rápidas
  P23: [
    { t: 'text', eyebrow: 'Jogo de sábado', title: 'Pare o vídeo!', lines: ['O sabor que aparecer é o seu pedido de hoje'], dur: 3 },
    { t: 'photo', photo: 'calabresa', title: 'Calabresa', dur: 1.5 },
    { t: 'photo', photo: 'bolonhesa', title: 'Bolonhesa', dur: 1.5 },
    { t: 'photo', photo: 'mussarela-tomate', title: 'Mussarela', dur: 1.5 },
    { t: 'photo', photo: 'frango-brocolis', title: 'Fran-Brócolis', dur: 1.5 },
    { t: 'photo', photo: 'nachos', title: 'Nachos', dur: 1.5 },
    { t: 'text', eyebrow: 'E aí?', title: 'Qual saiu para você?', lines: ['Conta nos comentários'], dur: 2 },
    CTA_SCENE,
  ],
  // Guia: uma Gigante, 4 sabores (16,8 s)
  P27: [
    { t: 'text', eyebrow: 'Confraternização', title: 'Cada um quer um sabor?', lines: ['A Gigante resolve'], dur: 2.5 },
    { t: 'photo', photo: 'portuguesa', title: 'Sabor 1: Portuguesa', dur: 2.2 },
    { t: 'photo', photo: 'quatro-queijos-bacon', title: 'Sabor 2: Quatro Queijos com Bacon', dur: 2.2 },
    { t: 'photo', photo: 'lombo-milho', title: 'Sabor 3: Lombo com Milho', dur: 2.2 },
    { t: 'photo', photo: 'confete', title: 'Sabor 4: Confete', dur: 2.2 },
    { t: 'text', eyebrow: 'Gigante', title: '16 fatias, até 4 sabores', lines: ['Qual seria a sua combinação?'], dur: 2.5 },
    CTA_SCENE,
  ],
  // Humor: quem é quem na mesa de Natal (15,8 s)
  P35: [
    { t: 'text', eyebrow: 'Natal', title: 'Quem é quem na mesa de Natal?', lines: [], dur: 2.5 },
    { t: 'photo', photo: 'calabresa', title: 'O tio que só pede Calabresa', dur: 2.5 },
    { t: 'photo', photo: 'margherita', title: 'A tia que não abre mão da Marguerita', dur: 2.5 },
    { t: 'photo', photo: 'bem-casado', title: 'Quem já vai direto no doce', dur: 2.5 },
    { t: 'text', eyebrow: 'Na Gigante', title: 'Até 4 sabores', lines: ['Todo mundo representado', 'Marque a sua família'], dur: 2.8 },
    CTA_SCENE,
  ],
  // Este ou aquele, edição verão (15,2 s)
  P43: [
    { t: 'text', eyebrow: 'Verão', title: 'Este ou aquele?', lines: ['Edição sábado de sol'], dur: 2.2 },
    { t: 'text', eyebrow: 'Este ou aquele', title: 'Praia ou piscina?', lines: [], dur: 2 },
    { t: 'text', eyebrow: 'Este ou aquele', title: 'Refri de 2L ou latinha?', lines: [], dur: 2 },
    { t: 'photo', photo: 'peperone', title: 'Peperone...', dur: 2 },
    { t: 'photo', photo: 'mussarela-tomate', title: '...ou Mussarela?', dur: 2 },
    { t: 'text', eyebrow: 'Sua vez', title: 'Responda nos comentários', lines: ['Hoje abrimos às 18h'], dur: 2 },
    CTA_SCENE,
  ],
  // Você sabia? Salgada e doce na mesma pizza (14 s)
  P47: [
    { t: 'text', eyebrow: 'Você sabia?', title: 'Salgada e doce na mesma pizza', lines: ['Pode!'], dur: 3 },
    { t: 'photo', photo: 'peperone', title: 'De um lado, Peperone', dur: 2.5 },
    { t: 'photo', photo: 'brigadeiro', title: 'Do outro, Brigadeiro', dur: 2.5 },
    { t: 'text', eyebrow: 'A partir da média', title: '2, 3 ou 4 sabores', lines: ['Média: 2 · Grande e Big: 3 · Gigante: 4'], dur: 3 },
    CTA_SCENE,
  ],
  // Fluxo: monte a sua em 6 passos (14,6 s)
  P51: [
    { t: 'text', eyebrow: 'Montador', title: 'Monte a sua em 6 passos', lines: [], dur: 2.2 },
    { t: 'photo', photo: 'presunto', title: '1. Tamanho · 2. Sabores', dur: 2.5 },
    { t: 'text', eyebrow: 'Passo 3', title: 'Massa', lines: ['Fina, média ou grossa'], dur: 2.2 },
    { t: 'text', eyebrow: 'Passos 4 e 5', title: 'Borda e extras', lines: ['7 bordas · observações'], dur: 2.2 },
    { t: 'photo', photo: 'lombo-milho', title: '6. Revise e envie pelo WhatsApp', dur: 2.5 },
    CTA_SCENE,
  ],
};

module.exports = { FEED_PHOTO_SUB, SLIDES, REELS };
