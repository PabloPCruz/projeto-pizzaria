// Gera os ícones do site a partir do logo (favicon, ícone do iPhone/Android, ícones do manifesto).
// Rodar da raiz: npm i --no-save sharp && node tools/gerar-icones.js
// O logo inteiro é ilegível em 16 px: o ícone usa só a chama e a pizza (parte de cima do logo) sobre o carvão do site.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BG = { r: 15, g: 15, b: 15, alpha: 1 }; // ink-900 (#0f0f0f)
const SRC = path.join(ROOT, 'src/assets/img/logo-pizzaria.png');
/** Chama + pizza do logo original (1080×1080). */
const GLYPH = { left: 282, top: 112, width: 545, height: 545 };

async function icon(size, padding = 0.1) {
  const inner = Math.round(size * (1 - padding * 2));
  const glyph = await sharp(SRC).extract(GLYPH).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** .ico com imagens PNG dentro (aceito por todos os navegadores atuais). */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

(async () => {
  const out = path.join(ROOT, 'src/assets/icons');
  fs.mkdirSync(out, { recursive: true });
  const write = (name, buf) => {
    fs.writeFileSync(path.join(out, name), buf);
    console.log(name, (buf.length / 1024).toFixed(1) + ' KB');
  };

  write('favicon-32.png', await icon(32, 0.04));
  write('apple-touch-icon.png', await icon(180, 0.12)); // sem transparência (o iOS pinta de preto)
  write('icon-192.png', await icon(192, 0.12));
  write('icon-512.png', await icon(512, 0.12));

  const ico = buildIco([
    { size: 48, data: await icon(48, 0.04) },
    { size: 32, data: await icon(32, 0.04) },
    { size: 16, data: await icon(16, 0.02) },
  ]);
  fs.writeFileSync(path.join(ROOT, 'public/favicon.ico'), ico);
  console.log('public/favicon.ico', (ico.length / 1024).toFixed(1) + ' KB');
})();
