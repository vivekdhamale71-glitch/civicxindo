// Fetches freely licensed, on-topic photos from Wikimedia Commons for each scheme,
// converts them to WebP (800×450) plus a tiny blurred placeholder, and records attribution.
// Usage: node scripts/fetch-scheme-images.mjs [schemeId ...]   (re-run per scheme to try the next candidate with --skip=N)
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const UA = "civicXindo-demo-build/1.0 (open-source demo; image attribution recorded)";
const OUT = "public/images/schemes";
const META = "src/data/scheme-images.json";
const OK_LICENSES = /^(CC0|Public domain|PD|CC BY(-SA)? ?\d|CC BY(-SA)?$)/i;

const QUERIES = {
  "sch-vidya": "students classroom India school",
  "sch-krishi": "farmer paddy field India",
  "sch-vayo": "elderly woman village India",
  "sch-griha": "rural house construction India village",
  "sch-janani": "anganwadi mother child India",
  "sch-kaushal": "vocational training India workshop students",
  "sch-samarth": "wheelchair India",
  "sch-arogya": "primary health centre India",
  "sch-udaan": "school girls bicycle India",
  "sch-yantra": "tractor field India",
  "sch-sahara": "women self help group India",
  "sch-shramik": "construction workers India",
  "sch-matsya": "fishing boats Kerala beach",
};

const args = process.argv.slice(2);
const skip = Number((args.find((a) => a.startsWith("--skip=")) || "--skip=0").split("=")[1]);
const qArg = args.find((a) => a.startsWith("--q="));
const ids = args.filter((a) => !a.startsWith("--"));
const targets = ids.length ? ids : Object.keys(QUERIES);
mkdirSync(OUT, { recursive: true });
mkdirSync("src/data", { recursive: true });
const meta = existsSync(META) ? JSON.parse(readFileSync(META, "utf8")) : {};
const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function api(params) {
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({ format: "json", origin: "*", ...params });
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  return r.json();
}

for (const id of targets) {
  const q = qArg ? qArg.slice(4) : QUERIES[id];
  const res = await api({
    action: "query", generator: "search", gsrsearch: `${q} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "30",
    prop: "imageinfo", iiprop: "url|size|extmetadata|mime", iiurlwidth: "1200",
  });
  const pages = Object.values(res.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const good = pages.filter((p) => {
    const ii = p.imageinfo?.[0];
    if (!ii || !/jpeg|png|webp/.test(ii.mime)) return false;
    const lic = ii.extmetadata?.LicenseShortName?.value ?? "";
    const artist = ii.extmetadata?.Artist?.value ?? "";
    // Skip photos published by politicians' or government publicity accounts.
    if (/narendra modi|prime minister|pib|government of india/i.test(artist)) return false;
    return OK_LICENSES.test(lic) && ii.width >= 1000 && ii.width / ii.height >= 1.2 && ii.width / ii.height <= 2.2;
  });
  if (args.includes("--list")) { good.slice(0, 10).forEach((p, i) => console.log(`${id} [${i}] ${p.title}`)); continue; }
  const pick = good[skip];
  if (!pick) { console.log(`${id}: no suitable image (skip=${skip}, ${good.length} candidates)`); continue; }
  const ii = pick.imageinfo[0];
  const buf = Buffer.from(await (await fetch(ii.thumburl || ii.url, { headers: { "User-Agent": UA } })).arrayBuffer());
  await sharp(buf).resize(800, 450, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toFile(`${OUT}/${id}.webp`);
  const tiny = await sharp(buf).resize(16, 9, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
  const m = ii.extmetadata;
  meta[id] = {
    src: `images/schemes/${id}.webp`,
    placeholder: `data:image/webp;base64,${tiny.toString("base64")}`,
    title: pick.title.replace(/^File:/, ""),
    artist: strip(m.Artist?.value) || "Unknown",
    license: m.LicenseShortName?.value,
    licenseUrl: m.LicenseUrl?.value || "",
    source: ii.descriptionurl,
  };
  console.log(`${id}: ${pick.title} — ${meta[id].license} — ${meta[id].artist}`);
}
if (!args.includes("--list")) writeFileSync(META, JSON.stringify(meta, null, 1));
