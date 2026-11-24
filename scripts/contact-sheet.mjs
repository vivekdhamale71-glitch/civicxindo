// Builds a labelled grid of the scheme images for visual review. Usage: node scripts/contact-sheet.mjs out.png
import sharp from "sharp";
import { readdirSync } from "node:fs";
const dir = "public/images/schemes";
const files = readdirSync(dir).filter((f) => f.endsWith(".webp")).sort();
const W = 400, H = 225, cols = 4, rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(files.map(async (f, i) => {
  const img = await sharp(`${dir}/${f}`).resize(W, H).toBuffer();
  const label = Buffer.from(`<svg width="${W}" height="28"><rect width="100%" height="100%" fill="black" opacity=".7"/><text x="8" y="19" font-size="16" font-family="sans-serif" fill="white">${f}</text></svg>`);
  const tile = await sharp(img).composite([{ input: label, top: 0, left: 0 }]).toBuffer();
  return { input: tile, left: (i % cols) * W, top: Math.floor(i / cols) * H };
}));
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: "#ccc" } }).composite(tiles).png().toFile(process.argv[2]);
