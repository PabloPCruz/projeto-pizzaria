// Texto das artes (o que aparece escrito na imagem). A legenda de cada post fica em calendario/posts.json.
// Só entram fatos já presentes no site/cardápio da loja. Sem preço, desconto ou italiano.
// layout: 'photo' (foto + faixa da marca) | 'text' | 'size' | 'step' | 'list'
// cta: 'forte' (Peça agora pelo Disk Pizza) | 'suave' (Monte a sua pelo link na bio) | null

// Posts de feed com foto: subtítulo da faixa (ingredientes conforme menu.data.ts).
const FEED_PHOTO_SUB = {
  X01: 'Hoje abrimos das 18h às 23h',
  P01: 'Abrimos às 18h e vamos até as 23h',
  P05: 'Mussarela, tomate, parmesão e manjericão',
  P06: 'Hoje abrimos das 18h às 23h',
  P10: 'Mussarela, brócolis e bacon · opção com catupiry',
  P12: 'Misture salgado e doce na mesma pizza',
  P14: 'Mussarela, catupiry, gorgonzola, provolone e bacon',
  P15: 'Domingo fechamos · hoje abrimos 18h às 23h',
  P16: 'Digite o CEP ao finalizar o pedido',
  P19: 'Mussarela, peperone e azeitona',
  P21: 'Calabresa com mussarela · abrimos às 18h',
  P22: 'Promoção todos os dias',
  P24: 'Para a turma toda ficar com o seu sabor',
  P26: 'Mussarela, frango, bacon, tomate e catupiry',
  P29: 'Mussarela, calabresa, pimentão, ovos, bacon e pimenta',
  P30: 'Pizza e bebida para a noite',
  P31: 'Mussarela, frango e brócolis',
  P34: 'Mussarela, bolonhesa, pimentão, ovos e catupiry',
  P37: 'Hoje abrimos das 18h às 23h',
  P39: 'Mussarela, catupiry, gorgonzola, provolone e bacon',
  P41: 'Hoje abrimos das 18h às 23h',
  P46: 'Leite condensado, chocolate ao leite e chocolate branco',
  P49: 'Pizzaria de família em Curitiba',
  P50: 'Chocolate ao leite, doce de leite e granulado',
  P54: 'Mussarela, lombo defumado e milho',
};

// Posts de feed sem foto e todos os slides dos carrosséis (cada item é um slide 1080x1080).
const SLIDES = {
  P07: [{ layout: 'text', eyebrow: 'Feriado', title: 'Hoje a gente abre', lines: ['Das 18h às 23h', 'Monte a sua pizza pelo site'], cta: 'suave' }],
  P18: [{ layout: 'text', eyebrow: '20 de novembro', title: 'Dia da Consciência Negra', lines: ['Uma data para refletir sobre a história, a luta e a contribuição do povo negro para o Brasil.', 'Hoje abrimos das 18h às 23h.'], cta: null }],
  P20: [{ layout: 'text', eyebrow: 'Black Friday', title: 'A nossa promoção é todos os dias', lines: ['Sem esperar data para pedir a sua pizza do jeito que gosta.'], cta: 'suave' }],
  P28: [{ layout: 'text', eyebrow: 'Desafio de quarta', title: 'Monte a sua Gigante com 4 sabores', lines: ['Conte nos comentários quais você escolheu.'], cta: 'suave' }],
  P36: [{ layout: 'text', eyebrow: 'Natal', title: 'Amanhã é véspera de Natal', lines: ['A gente abre das 18h às 23h.'], cta: 'suave' }],
  P38: [{ layout: 'text', eyebrow: 'Natal', title: 'Feliz Natal', lines: ['Que a mesa tenha fartura e o coração, carinho.', 'Hoje abrimos das 18h às 23h.'], cta: null }],
  P40: [{ layout: 'text', eyebrow: 'Fim de ano', title: 'Qual foi o sabor do seu 2026?', lines: ['Conta nos comentários.'], cta: 'suave' }],
  P42: [{ layout: 'text', eyebrow: 'Ano Novo', title: 'Feliz 2027', lines: ['Que o ano comece com a mesa cheia.', 'Hoje abrimos das 18h às 23h.'], cta: null }],
  P45: [{ layout: 'text', eyebrow: 'Borda do dia', title: 'Borda de Nutella', lines: ['Com pizza salgada ou doce', 'ou escolha uma das outras 6 bordas'], cta: 'forte' }],
  P48: [{ layout: 'text', eyebrow: 'Pergunta', title: 'Time massa fina ou massa grossa?', lines: ['Agora você escolhe a massa no pedido.'], cta: 'suave' }],
  P52: [{ layout: 'text', eyebrow: 'Participe', title: 'Qual sabor merece destaque?', lines: ['Comente o seu favorito.'], cta: 'suave' }],
  P53: [{ layout: 'text', eyebrow: 'Bebidas', title: 'Pizza pede uma bebida', lines: ['Refrigerantes de 2L, Kuat 1,5L, Coca-Cola 600ml, lata e cerveja Brahma'], cta: 'forte' }],

  P03: [
    { layout: 'text', eyebrow: 'Novidade', title: 'Escolha a massa da sua pizza', lines: ['Fina, média ou grossa'], deslize: true },
    { layout: 'list', eyebrow: 'Três opções', title: 'Qual é a sua?', lines: ['Massa fina', 'Massa média', 'Massa grossa'] },
    { layout: 'text', eyebrow: 'Como escolher', title: 'Passo “Massa”', lines: ['No montador, fica entre Sabores e Borda.', 'Uma massa por pizza, sem custo extra.'] },
    { layout: 'text', eyebrow: 'Sem preferência?', title: 'Tudo bem', lines: ['A pizza sai com a massa padrão da casa.'], cta: 'suave' },
  ],
  P04: [
    { layout: 'text', eyebrow: 'Tamanhos', title: 'Do pequeno ao gigante', lines: ['Tem tamanho para cada fome'], deslize: true },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Pequena', big: '4', bigLabel: 'fatias', lines: ['1 sabor'] },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Média', big: '6', bigLabel: 'fatias', lines: ['2 sabores'] },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Grande', big: '8', bigLabel: 'fatias', lines: ['3 sabores'] },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Big', big: '12', bigLabel: 'fatias', lines: ['3 sabores'] },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Gigante', big: '16', bigLabel: 'fatias', lines: ['4 sabores', 'Qual é o seu?'], cta: 'forte' },
  ],
  P08: [
    { layout: 'text', eyebrow: '71 sabores', title: 'Qual pizza tem a sua cara?', lines: ['Tradicionais, especiais e doces'], deslize: true },
    { layout: 'photo', photo: 'nachos', title: 'Especial: Nachos', sub: 'Mussarela, carne moída, cheddar e doritos' },
    { layout: 'photo', photo: 'presunto', title: 'Tradicional: Romana', sub: 'Mussarela, presunto, tomate e parmesão' },
    { layout: 'text', eyebrow: 'Doces', title: '13 sabores doces', lines: ['Conta nos comentários qual você escolheria hoje.'], cta: 'suave' },
  ],
  P09: [
    { layout: 'text', eyebrow: 'Bordas', title: '7 bordas para você escolher', lines: ['Borda recheada é quase uma segunda pizza'], deslize: true },
    { layout: 'list', eyebrow: 'Queijo', title: 'Catupiry e Cheddar', lines: ['Catupiry', 'Catupiry com Cheddar', 'Cheddar'] },
    { layout: 'text', eyebrow: 'Avelã', title: 'Nutella', lines: ['Para quem gosta de terminar a fatia com doce'] },
    { layout: 'list', eyebrow: 'Chocolate', title: 'Chocolates', lines: ['Chocolate ao Leite', 'Chocolate Branco', 'Ao Leite com Branco (o Bem Casado)'] },
    { layout: 'text', eyebrow: 'Sua vez', title: 'Qual você escolhe?', lines: ['Todas ficam no passo “Borda” do montador.'], cta: 'forte' },
  ],
  P13: [
    { layout: 'text', eyebrow: 'Como pedir', title: 'Pedir é simples', lines: ['Em 3 passos, sem cadastro'], deslize: true },
    { layout: 'step', n: '1', title: 'Monte', lines: ['Tamanho, sabores, borda e, se quiser, bebida'] },
    { layout: 'step', n: '2', title: 'Confira', lines: ['Revise o carrinho e informe o seu CEP'] },
    { layout: 'step', n: '3', title: 'Envie', lines: ['O pedido vai pronto pelo WhatsApp e a gente confirma com você'], cta: 'forte' },
  ],
  P17: [
    { layout: 'text', eyebrow: 'Doces', title: 'Fechar a noite com doce', lines: ['13 sabores doces no cardápio'], deslize: true },
    { layout: 'photo', photo: 'brigadeiro', title: 'Brigadeiro', sub: 'Chocolate ao leite, doce de leite e granulado' },
    { layout: 'photo', photo: 'confete', title: 'Confete', sub: 'Chocolate ao leite, confete e leite condensado' },
    { layout: 'photo', photo: 'bem-casado', title: 'Bem Casado', sub: 'Leite condensado, chocolate ao leite e chocolate branco' },
  ],
  P25: [
    { layout: 'text', eyebrow: 'Montador', title: '6 passos, do seu jeito', lines: ['Você controla cada detalhe'], deslize: true },
    { layout: 'step', n: '1', title: 'Tamanho', lines: ['Pequena, Média, Grande, Big ou Gigante'] },
    { layout: 'step', n: '2', title: 'Sabores', lines: ['Misture salgado e doce'] },
    { layout: 'step', n: '3', title: 'Massa', lines: ['Fina, média ou grossa'] },
    { layout: 'step', n: '4', title: 'Borda', lines: ['7 opções, de Catupiry a Nutella'] },
    { layout: 'step', n: '5', title: 'Extras', lines: ['Observações e o que mais precisar'] },
    { layout: 'step', n: '6', title: 'Revisão', lines: ['Confira tudo e envie pelo WhatsApp'], cta: 'forte' },
  ],
  P32: [
    { layout: 'text', eyebrow: 'Fim de ano', title: 'Ninguém quer cozinhar', lines: ['Amigo secreto, confraternização, reunião...'], deslize: true },
    { layout: 'text', eyebrow: 'Para a turma toda', title: 'Pizzas diferentes', lines: ['Cada um escolhe o seu sabor.'] },
    { layout: 'text', eyebrow: 'No mesmo pedido', title: 'Quantas quiser', lines: ['O carrinho aceita quantas pizzas você precisar.'] },
    { layout: 'text', eyebrow: 'Pronto', title: 'Envie pelo WhatsApp', lines: ['Sem cadastro.'], cta: 'suave' },
  ],
  P33: [
    { layout: 'text', eyebrow: 'Clássicos', title: 'Clássicos que nunca saem de moda', lines: ['Com tomate, mussarela e mais'], deslize: true },
    { layout: 'photo', photo: 'mussarela-tomate', title: 'Mussarela', sub: 'Mussarela e tomate' },
    { layout: 'photo', photo: 'presunto', title: 'Romana', sub: 'Mussarela, presunto, tomate e parmesão' },
    { layout: 'photo', photo: 'margherita', title: 'Marguerita', sub: 'Mussarela, tomate, parmesão e manjericão' },
  ],
  P44: [
    { layout: 'text', eyebrow: 'Férias de janeiro', title: 'Cada um no seu sabor', lines: ['Todo mundo feliz na mesma pizza'], deslize: true },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Grande', big: '8', bigLabel: 'fatias', lines: ['3 sabores'] },
    { layout: 'size', eyebrow: 'Tamanho', title: 'Big', big: '12', bigLabel: 'fatias', lines: ['3 sabores'] },
    { layout: 'text', eyebrow: 'Sua vez', title: 'Todo mundo feliz', lines: ['Monte a pizza da família.'], cta: 'suave' },
  ],
};

// Reels: cada cena vira um quadro 1080x1920; o FFmpeg junta com zoom suave e transição.
// t: 'text' (título e linhas) | 'photo' (foto com legenda) | 'cta' (fechamento)
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
  P11: [
    { t: 'photo', photo: 'nachos', title: 'Já provou pizza de Nachos?', dur: 3.5 },
    { t: 'photo', photo: 'nachos', title: 'Mussarela, carne moída, cheddar e doritos', dur: 3.5, zoomOut: true },
    CTA_SCENE,
  ],
  P23: [
    { t: 'text', eyebrow: 'Sábado', title: '71 sabores', lines: ['Qual é o seu?'], dur: 2.2 },
    { t: 'photo', photo: 'peperone', title: 'Peperone', dur: 2 },
    { t: 'photo', photo: 'brocolis', title: 'Brócolis', dur: 2 },
    { t: 'photo', photo: 'nachos', title: 'Nachos', dur: 2 },
    { t: 'photo', photo: 'bolonhesa', title: 'Bolonhesa', dur: 2 },
    { t: 'photo', photo: 'mexicana', title: 'Mexicana', dur: 2 },
    CTA_SCENE,
  ],
  P27: [
    { t: 'text', eyebrow: 'Doces', title: 'Sobremesa em formato de pizza', lines: [], dur: 2.5 },
    { t: 'photo', photo: 'brigadeiro', title: 'Brigadeiro', dur: 2.5 },
    { t: 'photo', photo: 'confete', title: 'Confete', dur: 2.5 },
    { t: 'photo', photo: 'bem-casado', title: 'Bem Casado', dur: 2.5 },
    { t: 'text', eyebrow: 'Borda', title: 'Nutella ou chocolate', lines: ['Para terminar a fatia'], dur: 2.5 },
    CTA_SCENE,
  ],
  P35: [
    { t: 'text', eyebrow: 'Natal', title: 'Natal em família', lines: ['A família toda reunida'], dur: 2.5 },
    { t: 'photo', photo: 'portuguesa', title: 'Portuguesa', dur: 2.5 },
    { t: 'photo', photo: 'quatro-queijos-bacon', title: 'Quatro Queijos com Bacon', dur: 2.5 },
    { t: 'photo', photo: 'frango-bacon-catupiry', title: 'Frango Especial', dur: 2.5 },
    { t: 'text', eyebrow: 'Sua mesa', title: 'Escolha os sabores de cada um', lines: [], dur: 2.5 },
    CTA_SCENE,
  ],
  P43: [
    { t: 'text', eyebrow: 'Verão', title: 'Sábado de verão pede pizza', lines: [], dur: 2.5 },
    { t: 'photo', photo: 'mussarela-tomate', title: 'Mussarela', dur: 2.5 },
    { t: 'photo', photo: 'peperone', title: 'Peperone', dur: 2.5 },
    { t: 'photo', photo: 'brocolis', title: 'Brócolis', dur: 2.5 },
    { t: 'text', eyebrow: 'Simples', title: 'Monte, confira e envie', lines: ['Pelo WhatsApp, sem cadastro'], dur: 2.5 },
    CTA_SCENE,
  ],
  P47: [
    { t: 'text', eyebrow: 'Sábado', title: 'Salgada de um lado, doce do outro', lines: [], dur: 2.8 },
    { t: 'photo', photo: 'peperone', title: 'Salgada', dur: 2.5 },
    { t: 'photo', photo: 'brigadeiro', title: 'Doce', dur: 2.5 },
    { t: 'text', eyebrow: 'Na mesma pizza', title: 'A partir da média', lines: ['2 sabores ou mais'], dur: 2.5 },
    CTA_SCENE,
  ],
  P51: [
    { t: 'text', eyebrow: 'Montador', title: 'Monte a sua em 6 passos', lines: [], dur: 2.5 },
    { t: 'photo', photo: 'margherita', title: 'Tamanho e sabores', dur: 2.5 },
    { t: 'text', eyebrow: 'Passos 3 a 5', title: 'Massa, borda e extras', lines: ['Tudo do seu jeito'], dur: 2.5 },
    { t: 'photo', photo: 'frango-brocolis', title: 'Revise e envie pelo WhatsApp', dur: 2.5 },
    CTA_SCENE,
  ],
};

module.exports = { FEED_PHOTO_SUB, SLIDES, REELS };
