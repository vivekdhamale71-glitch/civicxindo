// Usage: node tests/e2e/screenshot.cjs <url> <out.png> [width] [height]
const puppeteer = require("puppeteer-core");
(async () => {
  const [url, out, w = 1440, h = 900] = process.argv.slice(2);
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: +w, height: +h, isMobile: +w < 768, hasTouch: +w < 768, deviceScaleFactor: +w < 768 ? 2 : 1 });
  await p.evaluateOnNewDocument(() => { sessionStorage.setItem("cx-splash", "1"); });
  await p.goto(url, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 2000));
  await p.evaluate(() => window.scrollTo(0, document.querySelector("#app-title")?.getBoundingClientRect().top + scrollY - 200 || 0));
  await new Promise((r) => setTimeout(r, 1200));
  await p.screenshot({ path: out });
  await b.close();
})();
