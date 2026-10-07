// Gera src/fonts.css (fontes auto-hospedadas: so os subconjuntos latin e latin-ext) a partir dos pacotes @fontsource-variable. Rodar da raiz: node tools/gerar-fontes.js
const fs = require('fs');

const FONTS = [
  { pkg: 'inter', family: 'Inter', slug: 'inter' },
  { pkg: 'playfair-display', family: 'Playfair Display', slug: 'playfair-display' },
];

let out = `/* Fontes auto-hospedadas (variáveis, WOFF2). Gerado de @fontsource-variable/*: só os subconjuntos latin e latin-ext.
   O navegador baixa o latin-ext só se a página usar um desses caracteres (unicode-range). */\n`;

for (const { pkg, family, slug } of FONTS) {
  const css = fs.readFileSync(`node_modules/@fontsource-variable/${pkg}/wght.css`, 'utf8');
  for (const subset of ['latin-ext', 'latin']) {
    const re = new RegExp(`/\\* ${slug}-${subset}-wght-normal \\*/\\s*@font-face\\s*\\{([^}]*)\\}`);
    const match = css.match(re);
    if (!match) throw new Error(`bloco não encontrado: ${slug}-${subset}`);
    const body = match[1]
      .replace(/font-family:[^;]+;/, `font-family: '${family}';`)
      .replace(/src:\s*url\(\.\/files\/([^)]+)\)[^;]*;/, `src: url('../node_modules/@fontsource-variable/${pkg}/files/$1') format('woff2');`)
      .trim()
      .split('\n')
      .map((l) => '  ' + l.trim())
      .join('\n');
    out += `\n/* ${family} — ${subset} */\n@font-face {\n${body}\n}\n`;
  }
}
fs.writeFileSync('src/fonts.css', out);
console.log(out);
