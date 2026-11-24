// Lists any HTTP errors while visiting routes, before and after the service worker takes control.
const puppeteer = require("puppeteer-core");
(async () => {
  const B = process.argv[2];
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  let phase = "first-visit";
  p.on("response", (r) => { if (r.status() >= 400) console.log(phase, r.status(), r.url(), r.fromServiceWorker() ? "(from SW)" : ""); });
  await p.goto(B + "/", { waitUntil: "networkidle0" });
  await p.evaluate(() => navigator.serviceWorker.ready);
  await new Promise((r) => setTimeout(r, 3000));
  phase = "sw-active";
  for (const path of ["/schemes", "/login", "/schemes/sch-vidya", "/gov/login"]) {
    await p.goto(B + path, { waitUntil: "networkidle0" });
    const ok = await p.evaluate(() => document.querySelector("main") !== null);
    console.log(phase, path, "rendered:", ok);
  }
  await b.close();
})();
