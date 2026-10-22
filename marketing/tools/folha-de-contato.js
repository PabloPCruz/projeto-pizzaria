// Monta folhas de contato (miniaturas) da mídia processada para revisão visual.
// Uso: node marketing/tools/folha-de-contato.js <pasta de saída> [tamanho da miniatura em px]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const sharp = require(path.join(ROOT, 'node_modules', 'sharp'));
const IN = path.join(ROOT, 'marketing', 'midia', 'processada');
const outDir = process.argv[2];
const T = Number(process.argv[3] || 270);
const COLS = 6, ROWS = 4;

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  for (const id of fs.readdirSync(IN).sort()) {
    const d = path.join(IN, id);
    if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.jpg')).sort()) files.push({ id, f, p: path.join(d, f) });
  }
  const per = COLS * ROWS;
  for (let s = 0; s * per < files.length; s++) {
    const chunk = files.slice(s * per, (s + 1) * per);
    const comps = [];
    for (let i = 0; i < chunk.length; i++) {
      const m = await sharp(chunk[i].p).metadata();
      const h = Math.round((T * m.height) / m.width);
      const buf = await sharp(chunk[i].p).resize(T, Math.min(h, 480)).toBuffer();
      const x = (i % COLS) * (T + 6), y = Math.floor(i / COLS) * (500 + 22);
      const label = Buffer.from(`<svg width="${T}" height="20"><rect width="100%" height="100%" fill="#000"/><text x="3" y="15" font-size="13" fill="#fff" font-family="Arial">${chunk[i].id}/${chunk[i].f}</text></svg>`);
      comps.push({ input: buf, left: x, top: y }, { input: label, left: x, top: y + Math.min(h, 480) });
    }
    await sharp({ create: { width: COLS * (T + 6), height: ROWS * 522, channels: 3, background: '#333' } })
      .composite(comps).jpeg({ quality: 85 }).toFile(path.join(outDir, `folha-${String(s + 1).padStart(2, '0')}.jpg`));
  }
  console.log(`${files.length} arquivos, ${Math.ceil(files.length / per)} folhas em ${outDir}`);
})();
