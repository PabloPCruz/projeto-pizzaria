// Gera as variantes leves das imagens do site (WebP). Rodar da raiz do projeto: npm i --no-save sharp && node tools/gerar-imagens.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const fmt = (n) => (n / 1024).toFixed(0) + ' KB';

(async () => {
  // ---- Logo: recorta o conteúdo (a imagem original tem muito espaço vazio) em vez de recortar por CSS.
  const logoSrc = path.join(ROOT, 'src/assets/img/logo-pizzaria.png');
  const crop = { left: 173, top: 119, width: 767, height: 628 };
  for (const w of [320, 640]) {
    const base = sharp(logoSrc).extract(crop).resize({ width: w });
    await base.clone().webp({ quality: 82, alphaQuality: 90 }).toFile(path.join(ROOT, `src/assets/img/logo-crop-${w}.webp`));
  }
  await sharp(logoSrc)
    .extract(crop)
    .resize({ width: 640 })
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(path.join(ROOT, 'src/assets/img/logo-crop-640.png'));
  for (const f of ['logo-crop-320.webp', 'logo-crop-640.webp', 'logo-crop-640.png']) {
    console.log(f, fmt(fs.statSync(path.join(ROOT, 'src/assets/img', f)).size));
  }

  // ---- Fotos dos sabores: 192 px (miniaturas) e 640 px (cartões), em WebP.
  const dir = path.join(ROOT, 'src/assets/img-flavors');
  let before = 0;
  let after = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.(jpe?g)$/i.test(file)) continue;
    before += fs.statSync(path.join(dir, file)).size;
    const name = file.replace(/\.(jpe?g)$/i, '');
    for (const w of [192, 640]) {
      const out = path.join(dir, `${name}-${w}.webp`);
      await sharp(path.join(dir, file)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
      after += fs.statSync(out).size;
    }
  }
  console.log('originais', fmt(before), '→ variantes WebP (192+640)', fmt(after));
})();
