// Renderiza HTML em JPEG com o Chrome sem interface (tamanho exato). Usado por gerar-midia.js e preview-layout.js.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const n = require('../midia/nucleo.js');

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  .filter(Boolean).find((p) => fs.existsSync(p));

// Fundo magenta de sentinela: se o Chrome entregar a captura com uma faixa sem pintar, ela aparece magenta e o render é refeito.
const SENTINELA = [255, 0, 255];
const pagina = (w, h, inner) =>
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${n.BASE_CSS}html,body{width:${w}px;height:${h}px;background:rgb(${SENTINELA})}</style><body>${inner}</body></html>`;

/** Conta pixels quase iguais à cor de sentinela (amostragem de 1 a cada 4 px por linha e coluna). */
async function pixelsSemPintar(png) {
  const { data, info } = await n.sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let k = 0;
  for (let y = 0; y < info.height; y += 4) {
    for (let x = 0; x < info.width; x += 4) {
      const i = (y * info.width + x) * 3;
      if (data[i] > 240 && data[i + 1] < 20 && data[i + 2] > 240) k++;
    }
  }
  return k;
}

function chrome(htmlPath, pngPath, w, h) {
  return new Promise((resolve, reject) => {
    if (!CHROME) return reject(new Error('Chrome/Edge não encontrado (defina a variável CHROME).'));
    fs.rmSync(pngPath, { force: true });
    const p = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--no-first-run',
      '--run-all-compositor-stages-before-draw', `--window-size=${w},${h}`, `--screenshot=${pngPath}`, '--virtual-time-budget=8000', n.url(htmlPath)], { stdio: 'ignore' });
    p.on('error', reject);
    p.on('exit', () => (fs.existsSync(pngPath) ? resolve() : reject(new Error('Chrome não gerou ' + pngPath))));
  });
}

/** Renderiza `inner` (HTML do canvas) para `out` (JPEG w x h). `tmpBase` = caminho sem extensão para os temporários. */
async function renderizar(inner, w, h, out, tmpBase) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.mkdirSync(path.dirname(tmpBase), { recursive: true });
  fs.writeFileSync(tmpBase + '.html', pagina(w, h, inner));
  let falhas = 0;
  for (;;) {
    await chrome(tmpBase + '.html', tmpBase + '.png', w, h);
    const k = await pixelsSemPintar(tmpBase + '.png');
    if (!k) break;
    if (++falhas >= 4) throw new Error(`${k} pontos sem pintar após ${falhas} tentativas (layout deixa área sem fundo?)`);
  }
  const meta = await n.sharp(tmpBase + '.png').metadata();
  let img = n.sharp(tmpBase + '.png');
  if (meta.width !== w || meta.height !== h) img = img.extract({ left: 0, top: 0, width: Math.min(w, meta.width), height: Math.min(h, meta.height) });
  await img.removeAlpha().jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(out);
  fs.rmSync(tmpBase + '.png', { force: true });
}

/** Carrega todos os layouts de midia/layouts/*.js (cada arquivo exporta um layout ou uma lista). */
function carregarLayouts() {
  const dir = path.join(__dirname, '..', 'midia', 'layouts');
  const mapa = {};
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) {
    const mod = require(path.join(dir, f));
    for (const l of Array.isArray(mod) ? mod : [mod]) {
      if (!l || !l.id || typeof l.render !== 'function') throw new Error(`${f}: layout sem id/render`);
      if (mapa[l.id]) throw new Error(`layout duplicado: ${l.id} (${f})`);
      if (!['feed', 'story'].includes(l.formato)) throw new Error(`${l.id}: formato deve ser feed ou story`);
      mapa[l.id] = { ...l, arquivo: f };
    }
  }
  return mapa;
}

const DIM = { feed: [1080, 1080], story: [1080, 1920] };

module.exports = { renderizar, carregarLayouts, DIM, CHROME };
