// Usage: node tests/e2e/shots.cjs <baseUrl> <outDir> <w> <citizen|guest> path1 path2 ...
const puppeteer = require("puppeteer-core");
(async () => {
  const [B, out, w, who, ...paths] = process.argv.slice(2);
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  const mobile = +w < 768;
  await p.setViewport({ width: +w, height: mobile ? 812 : 900, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  await p.evaluateOnNewDocument((who) => {
    sessionStorage.setItem("cx-splash", "1");
    localStorage.setItem("cx-settings", JSON.stringify({ state: { lang: "en", theme: "light", contrast: "normal", textSize: "md", visits: 1, installDismissedAt: Date.now(), seenStamps: [] }, version: 0 }));
    localStorage.setItem("cx-session", JSON.stringify({ state: { citizenId: who === "citizen" ? "cit-priya" : null, officialId: who.startsWith("off") ? who.split(":")[0] : null, role: who.startsWith("off") ? who.split(":")[1] : null }, version: 0 }));
  }, who);
  for (const path of paths) {
    await p.goto(B + path, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1800));
    const name = `${out}/${w}-${who.split(":")[0]}${path.replace(/[/?=&]/g, "_") || "_home"}.png`;
    await p.screenshot({ path: name, fullPage: true });
    console.log(name);
  }
  await b.close();
})();
