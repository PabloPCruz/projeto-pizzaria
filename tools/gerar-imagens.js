// Gera as variantes leves das imagens do site (WebP). Rodar da raiz do projeto: npm i --no-save sharp && node tools/gerar-imagens.js
// - Logo: recorte do conteúdo (com margem de 8 px) em 160, 320 e 640 px + PNG de reserva.
// - Fotos dos sabores: 192, 320, 640 e 960 px (nome-LARGURA.webp). Se a foto original for menor que a largura,
//   a variante sai no tamanho original (nunca amplia): o descritor do srcset fica um pouco otimista, sem perda de qualidade.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const fmt = (n) => (n / 1024).toFixed(0) + ' KB';

/** Conteúdo do logo original (1080×1080, 83% transparente) com 8 px de margem. */
const LOGO_CROP = { left: 160, top: 118, width: 788, height: 660 };
const LOGO_WIDTHS = [160, 320, 640];
const FLAVOR_WIDTHS = [192, 320, 640, 960];

(async () => {
  const logoSrc = path.join(ROOT, 'src/assets/img/logo-pizzaria.png');
  for (const w of LOGO_WIDTHS) {
    await sharp(logoSrc)
      .extract(LOGO_CROP)
      .resize({ width: w })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(path.join(ROOT, `src/assets/img/logo-crop-${w}.webp`));
  }
  await sharp(logoSrc)
    .extract(LOGO_CROP)
    .resize({ width: 640 })
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(path.join(ROOT, 'src/assets/img/logo-crop-640.png'));
  for (const f of ['logo-crop-160.webp', 'logo-crop-320.webp', 'logo-crop-640.webp', 'logo-crop-640.png']) {
    console.log(f, fmt(fs.statSync(path.join(ROOT, 'src/assets/img', f)).size));
  }

  const dir = path.join(ROOT, 'src/assets/img-flavors');
  let before = 0;
  let after = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.(jpe?g)$/i.test(file)) continue;
    before += fs.statSync(path.join(dir, file)).size;
    const name = file.replace(/\.(jpe?g)$/i, '');
    for (const w of FLAVOR_WIDTHS) {
      const out = path.join(dir, `${name}-${w}.webp`);
      await sharp(path.join(dir, file)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
      after += fs.statSync(out).size;
    }
  }
  console.log('originais', fmt(before), '→ variantes WebP', FLAVOR_WIDTHS.join('/'), fmt(after));
})();
