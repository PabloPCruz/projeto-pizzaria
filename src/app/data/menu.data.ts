import {
  Crust,
  Drink,
  FlavorCategory,
  PizzaFlavor,
  PizzaSize,
} from '../interfaces/pizza-menu.interface';

/**
 * Cardápio transcrito das imagens em src/assets/sabores-whats.
 * Itens marcados com "CONFERIR" divergem do que parece correto no cardápio impresso
 * e foram mantidos como estão até a loja confirmar.
 */

export const PIZZA_SIZES: readonly PizzaSize[] = [
  { id: 'pequena', label: 'Pequena', maxFlavors: 1, slices: 4 },
  { id: 'media', label: 'Média', maxFlavors: 2, slices: 6 },
  { id: 'grande', label: 'Grande', maxFlavors: 3, slices: 8 },
  { id: 'big', label: 'Big', maxFlavors: 3, slices: 12 },
  { id: 'gigante', label: 'Gigante', maxFlavors: 4, slices: 16 },
];

export const CRUSTS: readonly Crust[] = [
  { id: 'catupiry', label: 'Catupiry' },
  { id: 'catupiry-cheddar', label: 'Catupiry com Cheddar' },
  { id: 'cheddar', label: 'Cheddar' },
  { id: 'nutella', label: 'Nutella' },
  { id: 'chocolate-ao-leite', label: 'Chocolate ao Leite' },
  { id: 'chocolate-branco', label: 'Chocolate Branco' },
  { id: 'chocolate-ao-leite-branco', label: 'Chocolate ao Leite com Chocolate Branco' },
];

export const DRINKS: readonly Drink[] = [
  { id: 'coca-2l', label: 'Coca-Cola 2L', group: 'refrigerante' },
  { id: 'coca-zero-2l', label: 'Coca-Cola Zero 2L', group: 'refrigerante' },
  { id: 'fanta-2l', label: 'Fanta 2L', group: 'refrigerante' },
  { id: 'guarana-2l', label: 'Guaraná 2L', group: 'refrigerante' },
  { id: 'sprite-2l', label: 'Sprite 2L', group: 'refrigerante' },
  { id: 'kuat-2l', label: 'Kuat 2L', group: 'refrigerante' },
  { id: 'kuat-1-5l', label: 'Kuat 1,5L', group: 'refrigerante' },
  { id: 'coca-600ml', label: 'Coca-Cola 600ml', group: 'refrigerante' },
  { id: 'coca-lata', label: 'Coca-Cola lata', group: 'refrigerante' },
  { id: 'brahma-lata', label: 'Cerveja Brahma lata', group: 'cerveja' },
];

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function flavor(
  category: FlavorCategory,
  name: string,
  ingredients: string,
  optionHint?: string,
  image?: string
): PizzaFlavor {
  const result: PizzaFlavor = { id: slugify(`${category}-${name}`), name, category, ingredients };
  if (optionHint) result.optionHint = optionHint;
  if (image) result.image = image;
  return result;
}

const TRADICIONAIS: PizzaFlavor[] = [
  flavor('tradicional', 'Frango com Calabresa Ralada', 'Mussarela, frango, calabresa ralada, ovos, bacon e catupiry'),
  flavor('tradicional', 'Frango Catupiry', 'Mussarela, frango e catupiry', undefined, 'assets/img-flavors/frango-com-catupiry.jpg'),
  flavor('tradicional', 'Fran-Palha', 'Mussarela, frango, catupiry e batata palha'),
  flavor('tradicional', 'Frango com Cheddar', 'Mussarela, frango e cheddar'),
  flavor('tradicional', 'Fran-Brócolis', 'Mussarela, frango e brócolis', undefined, 'assets/img-flavors/frango-brocolis.jpg'),
  flavor('tradicional', 'Quatro Queijos', 'Mussarela, gorgonzola, provolone e catupiry', undefined, 'assets/img-flavors/quatro-queijos.jpg'),
  flavor('tradicional', 'Quatro Queijos com Bacon', 'Mussarela, catupiry, gorgonzola, provolone e bacon', undefined, 'assets/img-flavors/quatro-queijos-bacon.jpg'),
  flavor('tradicional', 'Carijó', 'Mussarela, frango, milho e ovos'),
  flavor('tradicional', 'Americana', 'Mussarela, calabresa, bacon, ovos e cebola'),
  flavor('tradicional', 'Mussarela', 'Mussarela e tomate', undefined, 'assets/img-flavors/mussarela-tomate.jpg'),
  flavor('tradicional', 'Brócolis', 'Mussarela, brócolis e bacon', 'Opção catupiry', 'assets/img-flavors/brocolis.jpg'),
  flavor('tradicional', 'Baiana', 'Mussarela, calabresa ralada, molho de pimenta, ovos e cebola'),
  flavor('tradicional', 'Bolonhesa', 'Mussarela e molho bolonhesa', undefined, 'assets/img-flavors/bolonhesa.jpg'),
  flavor('tradicional', 'Bolonhesa Catu-Cheddar', 'Mussarela, carne moída, catupiry e cheddar'),
  flavor('tradicional', 'Quatro Queijos com Calabresa', 'Mussarela, gorgonzola, provolone, catupiry e calabresa'),
  flavor('tradicional', 'Quatro Queijos com Lombo', 'Mussarela, gorgonzola, provolone, catupiry e lombo'),
  flavor('tradicional', 'Quatro Queijos com Calabresa e Lombo', 'Mussarela, catupiry, provolone, gorgonzola, calabresa e lombo'),
  flavor('tradicional', 'Calabresa', 'Mussarela e calabresa', 'Opção cebola ou catupiry', 'assets/img-flavors/calabresa.jpg'),
  flavor('tradicional', 'Calabresa Catu-Cheddar', 'Mussarela, calabresa, catupiry e cheddar'),
  flavor('tradicional', 'Marguerita', 'Mussarela, tomate, parmesão e manjericão', undefined, 'assets/img-flavors/margherita.jpg'),
  flavor('tradicional', 'Milho com Bacon', 'Mussarela, milho e bacon'),
  flavor('tradicional', 'Paulista', 'Mussarela, palmito e ervilha'),
  flavor('tradicional', 'Romana', 'Mussarela, presunto, tomate e parmesão', undefined, 'assets/img-flavors/presunto.jpg'),
  flavor('tradicional', 'Napolitana', 'Mussarela, tomate e parmesão', undefined, 'assets/img-flavors/mussarela-tomate.jpg'),
  flavor('tradicional', 'Crocante', 'Mussarela, bacon, catupiry e batata palha'),
  flavor('tradicional', 'Crocante Catu-Cheddar', 'Mussarela, bacon, catupiry, cheddar e batata palha'),
  flavor('tradicional', 'Calabresa com Champignon', 'Mussarela, calabresa e champignon'),
  // CONFERIR: no cardápio impresso "Calabresa c/ Tomate" traz "Mussarela e lombo defumado".
  flavor('tradicional', 'Calabresa com Tomate', 'Mussarela e lombo defumado'),
  flavor('tradicional', 'Lombo com Calabresa', 'Mussarela, lombo, calabresa e catupiry'),
  flavor('tradicional', 'Lombo com Bacon', 'Mussarela, lombo, bacon e ovos'),
  flavor('tradicional', 'Alho com Bacon', 'Mussarela, alho e bacon'),
  flavor('tradicional', 'Siciliana', 'Mussarela, calabresa ralada, cebola, tomate e catupiry'),
  flavor('tradicional', 'Portuguesa', 'Mussarela, presunto, ovos, ervilha, milho, cebola e azeitona', undefined, 'assets/img-flavors/portuguesa.jpeg'),
  flavor('tradicional', 'Francesa', 'Mussarela, presunto, cebola, manjericão e creme de leite', undefined, 'assets/img-flavors/presunto.jpg'),
  // CONFERIR: ingredientes cobertos por tarja branca no cardápio impresso.
  flavor('tradicional', 'Presunto Misto', ''),
  flavor('tradicional', 'Lombo com Milho', 'Mussarela, lombo defumado e milho', 'Opção catupiry', 'assets/img-flavors/lombo-milho.jpg'),
];

const ESPECIAIS: PizzaFlavor[] = [
  flavor('especial', 'Alemã', 'Mussarela, calabresa, tomate, provolone, catupiry e cheddar'),
  flavor('especial', 'Atum', 'Mussarela, atum, cebola e ovos'),
  flavor('especial', 'À Moda da Casa', 'Mussarela, champignon, tomate, milho, palmito, ervilha, ovos, bacon e azeitona'),
  flavor('especial', 'Tomate Seco Especial', 'Mussarela, peperone, calabresa, tomate seco e champignon'),
  flavor('especial', 'Calabresa Especial', 'Mussarela, calabresa ralada, lombo, bacon, ovos, carne moída e catupiry'),
  flavor('especial', 'Nachos', 'Mussarela, carne moída, cheddar e doritos', undefined, 'assets/img-flavors/nachos.jpg'),
  flavor('especial', 'Frango Especial', 'Mussarela, frango, bacon, tomate e catupiry', undefined, 'assets/img-flavors/frango-bacon-catupiry.jpg'),
  flavor('especial', 'Mexicana', 'Mussarela, calabresa, pimentão, ovos, bacon e pimenta calabresa', undefined, 'assets/img-flavors/mexicana.jpg'),
  // CONFERIR: o cardápio impresso lista "ninho" (provavelmente "milho").
  flavor('especial', 'Mista', 'Mussarela, bacon, champignon, ervilha, lombo, ninho e palmito'),
  flavor('especial', 'Peperone', 'Mussarela, peperone e azeitona', undefined, 'assets/img-flavors/peperone.jpg'),
  flavor('especial', 'Pizzaiolo', 'Mussarela, calabresa, frango, palmito, milho e catupiry'),
  flavor('especial', 'Lombo Especial', 'Mussarela, lombo, palmito, bacon, ovos, milho, catupiry e cheddar'),
  flavor('especial', 'Bacon Especial', 'Mussarela, calabresa, bacon, ovos, tomate e catupiry'),
  flavor('especial', 'Canadense', 'Mussarela, lombo, tomate, palmito, cebola, bacon, azeitona e creme de leite'),
  flavor('especial', 'Caipira', 'Mussarela, frango, milho, palmito, bacon e ovos'),
  flavor('especial', 'Camponesa', 'Mussarela, milho, tomate, bacon, ovos e cheddar'),
  flavor('especial', 'Bolonhesa Especial', 'Mussarela, molho bolonhesa, pimentão, ovos e catupiry', undefined, 'assets/img-flavors/bolonhesa.jpg'),
  flavor('especial', 'Portuguesa Especial', 'Mussarela, presunto, bacon, ovos, palmito, ervilha, milho, cebola e azeitona'),
  flavor('especial', 'Poderosa', 'Mussarela, peperone, tomate seco, champignon e gorgonzola'),
  flavor('especial', 'Seis Queijos', 'Mussarela, provolone, gorgonzola, cheddar, catupiry e parmesão'),
  flavor('especial', 'Strogonoff', 'Mussarela, strogonoff de carne e batata palha'),
  flavor('especial', 'Tomate Seco', 'Mussarela, tomate seco e champignon'),
];

const DOCES: PizzaFlavor[] = [
  flavor('doce', 'Banana', 'Mussarela, creme de leite, banana, canela e leite condensado'),
  flavor('doce', 'Brigadeiro', 'Chocolate ao leite, doce de leite e chocolate granulado', undefined, 'assets/img-flavors/brigadeiro.jpg'),
  flavor('doce', 'Bem Casado', 'Leite condensado, chocolate ao leite e chocolate branco', undefined, 'assets/img-flavors/bem-casado.jpg'),
  flavor('doce', 'Choconana', 'Mussarela, creme de leite, banana, chocolate ao leite e leite condensado'),
  flavor('doce', 'Confete', 'Chocolate ao leite, confete e leite condensado', undefined, 'assets/img-flavors/confete.jpg'),
  flavor('doce', 'Paçoca', 'Leite condensado, chocolate ao leite e paçoca'),
  flavor('doce', 'Prestígio', 'Chocolate ao leite, coco ralado e leite condensado'),
  flavor('doce', 'Romeu e Julieta', 'Mussarela, creme de leite, goiaba e leite condensado'),
  flavor('doce', 'Chocolate', 'Leite condensado e chocolate ao leite', 'Opção chocolate branco'),
  flavor('doce', 'Sonho de Valsa', 'Leite condensado, chocolate ao leite e sonho de valsa'),
  flavor('doce', 'Chocolate com Morango', 'Leite condensado, chocolate ao leite, morango e suspiro', undefined, 'assets/img-flavors/chocolate-morango.jpg'),
  flavor('doce', 'Banana com Nutella', 'Mussarela, leite condensado, banana e tiras de nutella'),
  flavor('doce', 'Ouro Branco', 'Leite condensado, chocolate ao leite e ouro branco'),
];

/**
 * Foto ILUSTRATIVA para os sabores que não têm foto própria: a mais parecida que temos (mesmo grupo de
 * ingredientes principais). A tela mostra "Foto ilustrativa" nesses casos; foto de verdade de cada sabor
 * é só colocar o arquivo e passar o caminho no 5º argumento de flavor(...), que passa a valer.
 * Formato: [arquivo em assets/img-flavors, categoria, nomes dos sabores].
 */
const ILLUSTRATIVE_PHOTOS: readonly [string, FlavorCategory, readonly string[]][] = [
  ['frango-bacon-catupiry.jpg', 'tradicional', ['Frango com Calabresa Ralada']],
  ['frango-com-catupiry.jpg', 'tradicional', ['Fran-Palha', 'Frango com Cheddar', 'Carijó']],
  ['calabresa.jpg', 'tradicional', [
    'Americana', 'Baiana', 'Calabresa Catu-Cheddar', 'Calabresa com Champignon', 'Calabresa com Tomate', 'Lombo com Calabresa',
  ]],
  ['bolonhesa.jpg', 'tradicional', ['Bolonhesa Catu-Cheddar']],
  ['quatro-queijos.jpg', 'tradicional', [
    'Quatro Queijos com Calabresa', 'Quatro Queijos com Lombo', 'Quatro Queijos com Calabresa e Lombo',
  ]],
  ['lombo-milho.jpg', 'tradicional', ['Milho com Bacon']],
  ['margherita.jpg', 'tradicional', ['Paulista']],
  ['quatro-queijos-bacon.jpg', 'tradicional', ['Crocante', 'Crocante Catu-Cheddar', 'Lombo com Bacon', 'Alho com Bacon']],
  ['mexicana.jpg', 'tradicional', ['Siciliana']],
  ['presunto.jpg', 'tradicional', ['Presunto Misto']],

  ['mexicana.jpg', 'especial', ['Alemã']],
  ['margherita.jpg', 'especial', ['Atum']],
  ['portuguesa.jpeg', 'especial', ['À Moda da Casa', 'Mista', 'Canadense', 'Portuguesa Especial']],
  ['mussarela-tomate.jpg', 'especial', ['Tomate Seco Especial', 'Tomate Seco']],
  ['calabresa.jpg', 'especial', ['Calabresa Especial']],
  ['frango-bacon-catupiry.jpg', 'especial', ['Pizzaiolo', 'Caipira']],
  ['lombo-milho.jpg', 'especial', ['Lombo Especial', 'Camponesa']],
  ['quatro-queijos-bacon.jpg', 'especial', ['Bacon Especial']],
  ['peperone.jpg', 'especial', ['Poderosa']],
  ['quatro-queijos.jpg', 'especial', ['Seis Queijos']],
  ['bolonhesa.jpg', 'especial', ['Strogonoff']],

  ['chocolate-morango.jpg', 'doce', ['Banana', 'Choconana', 'Banana com Nutella']],
  ['brigadeiro.jpg', 'doce', ['Paçoca', 'Prestígio', 'Chocolate', 'Sonho de Valsa']],
  ['bem-casado.jpg', 'doce', ['Romeu e Julieta', 'Ouro Branco']],
];

function withIllustrativePhoto(f: PizzaFlavor): PizzaFlavor {
  if (f.image) return f;
  const group = ILLUSTRATIVE_PHOTOS.find(([, category, names]) => category === f.category && names.includes(f.name));
  return group ? { ...f, image: `assets/img-flavors/${group[0]}`, illustrative: true } : f;
}

export const FLAVORS: readonly PizzaFlavor[] = [...TRADICIONAIS, ...ESPECIAIS, ...DOCES].map(withIllustrativePhoto);

export const FLAVOR_CATEGORY_LABELS: Record<FlavorCategory, string> = {
  tradicional: 'Tradicionais',
  especial: 'Especiais',
  doce: 'Doces',
};

/** Sabores em destaque na home: lista explícita dos mais populares e visuais (todos com foto). */
export const FEATURED_FLAVOR_IDS: readonly string[] = [
  'tradicional-calabresa',
  'tradicional-frango-catupiry',
  'tradicional-quatro-queijos',
  'tradicional-portuguesa',
  'tradicional-marguerita',
  'tradicional-brocolis',
  'doce-brigadeiro',
  'doce-chocolate-com-morango',
];
