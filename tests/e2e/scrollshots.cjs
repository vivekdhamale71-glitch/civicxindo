// Viewport screenshots while scrolling down a page (what a phone user actually sees).
// Usage: node tests/e2e/scrollshots.cjs <url> <outPrefix> <citizen|guest> [screens=3] [width=375]
const puppeteer = require("puppeteer-core");
(async () => {
  const [url, out, who = "guest", n = 3, w = 375] = process.argv.slice(2);
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  const mobile = +w < 768;
  await p.setViewport({ width: +w, height: mobile ? 812 : 900, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  await p.evaluateOnNewDocument((who) => {
    sessionStorage.setItem("cx-splash", "1");
    localStorage.setItem("cx-settings", JSON.stringify({ state: { lang: "en", theme: "light", contrast: "normal", textSize: "md", visits: 1, installDismissedAt: Date.now(), seenStamps: [] }, version: 0 }));
    localStorage.setItem("cx-session", JSON.stringify({ state: { citizenId: who === "citizen" ? "cit-priya" : null, officialId: null, role: null }, version: 0 }));
  }, who);
  await p.goto(url, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1800));
  for (let i = 0; i < +n; i++) {
    await p.evaluate((i) => window.scrollTo(0, i * (window.innerHeight - 140)), i);
    await new Promise((r) => setTimeout(r, 900));
    await p.screenshot({ path: `${out}-${i}.png` });
  }
  await b.close();
})();
