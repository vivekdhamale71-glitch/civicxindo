// Injects the prerendered landing page into dist/index.html.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const { render } = await import(pathToFileURL(path.resolve("dist-ssr/entry-server.js")).href);
const file = "dist/index.html";
const html = readFileSync(file, "utf8");
const base = process.env.BASE_PATH || "/";
const app = render(base);
if (!html.includes('<div id="root"></div>')) throw new Error("root placeholder not found");
writeFileSync(file, html.replace('<div id="root"></div>', `<div id="root">${app}</div>`));
// GitHub Pages serves 404.html for unknown paths: give it the client-rendered shell so deep links work.
writeFileSync("dist/404.html", html);
console.log(`prerendered / (${(app.length / 1024).toFixed(1)} KiB of HTML)`);
process.exit(0);
