// Generates PWA icons from the original civicXindo mark (24 thin spokes, double ring).
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";

function mark(cx, cy, r, color, sw) {
  const spokes = [];
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI * 2) / 24;
    const r1 = r * 0.3;
    const r2 = i % 2 === 0 ? r * 0.86 : r * 0.74;
    spokes.push(`<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`);
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw * 1.6}"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="none" stroke="${color}" stroke-width="${sw * 1.4}"/>${spokes.join("")}`;
}

function icon(size, maskable) {
  const scale = maskable ? 0.3 : 0.36;
  const r = size * scale;
  const rad = maskable ? 0 : size * 0.22;
  const band = size * 0.035;
  const by = size * (maskable ? 0.78 : 0.84);
  const bw = size * 0.4;
  const bx = (size - bw) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rad}" fill="#1B2A4A"/>
  ${mark(size / 2, size * 0.47, r, "#FFFFFF", size * 0.012)}
  <rect x="${bx}" y="${by}" width="${bw / 3}" height="${band}" fill="#FF9933"/>
  <rect x="${bx + bw / 3}" y="${by}" width="${bw / 3}" height="${band}" fill="#FFFFFF"/>
  <rect x="${bx + (2 * bw) / 3}" y="${by}" width="${bw / 3}" height="${band}" fill="#138808"/>
</svg>`;
}

mkdirSync("public/icons", { recursive: true });
const jobs = [
  ["public/icons/icon-192.png", icon(192, false)],
  ["public/icons/icon-512.png", icon(512, false)],
  ["public/icons/icon-512-maskable.png", icon(512, true)],
  ["public/icons/apple-touch-icon.png", icon(180, true)],
];
for (const [file, svg] of jobs) await sharp(Buffer.from(svg)).png().toFile(file);
writeFileSync(
  "public/favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1B2A4A"/>${mark(32, 32, 22, "#FFFFFF", 1.6)}</svg>`,
);
console.log("icons written");
