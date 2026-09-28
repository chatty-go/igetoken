// 构建期生成分享卡片用的二维码 PNG（同源静态资源，避免运行时跨域污染 canvas）。
// 每个平台一张，路径 public/share/qr/<slug>.png，另生成站点根回退 public/share/qr-site.png。
// ⚡ 增量模式（2026-09-28）：QR 内容 = 固定 URL（由 slug/id 决定），文件已存在即跳过；
//    opts（尺寸/配色）变更或需强制全量重画时用 `node scripts/gen-qr.mjs --force`。
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SITE = 'https://igetoken.com';
const opts = { margin: 1, width: 512, color: { dark: '#0f172a', light: '#ffffff' } };
const force = process.argv.includes('--force');

const models = JSON.parse(fs.readFileSync(path.join(root, 'src/data/models.json'), 'utf8'));
const deals = JSON.parse(fs.readFileSync(path.join(root, 'src/data/deals.json'), 'utf8'));
const qrDir = path.join(root, 'public/share/qr');
fs.mkdirSync(qrDir, { recursive: true });

let generated = 0, skipped = 0;
async function gen(file, url) {
  if (!force && fs.existsSync(file) && fs.statSync(file).size > 0) { skipped++; return; }
  await QRCode.toFile(file, url, opts);
  generated++;
}
for (const p of models) {
  await gen(path.join(qrDir, `${p.slug}.png`), `${SITE}/models/${p.slug}/`);
}
for (const d of deals) {
  await gen(path.join(qrDir, `${d.id}.png`), `${SITE}/deals/${d.id}/`);
}
await gen(path.join(root, 'public/share/qr-site.png'), SITE);
console.log(`[gen-qr] generated ${generated}, skipped ${skipped} (existing)${force ? ' [FORCE]' : ''}`);
