// End-to-end test of the connected flow against a running preview.
// Usage: node tests/e2e/flow.cjs [baseUrl]   (default http://localhost:4173)
// Needs Chrome at CHROME_PATH (default /usr/bin/google-chrome).
const puppeteer = require("puppeteer-core");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const B = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
let failures = 0;
const check = (label, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
  if (!ok) failures++;
};

async function clickText(page, text, sel = "button") {
  const ok = await page.evaluate((text, sel) => {
    const el = [...document.querySelectorAll(sel)].find((b) => b.textContent.trim().includes(text) && !b.disabled && b.offsetParent !== null);
    if (el) { el.click(); return true; }
    return false;
  }, text, sel);
  if (!ok) throw new Error("No clickable: " + text);
  await sleep(500);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.setViewport({ width: 1280, height: 900 });

  // Installability can't be evaluated in an incognito context, so check it in the default one.
  const plain = await browser.newPage();
  await plain.goto(B + "/", { waitUntil: "networkidle0" });
  await sleep(2500);
  const inst = (await (await plain.target().createCDPSession()).send("Page.getInstallabilityErrors")).installabilityErrors;
  check("PWA installable", inst.length === 0, JSON.stringify(inst));
  await plain.close();

  await page.goto(B + "/", { waitUntil: "networkidle0" });
  await sleep(2500);
  check("Service worker registered", await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())));
  check("Download app button visible", await page.evaluate(() => [...document.querySelectorAll("button")].some((x) => x.innerText.includes("Download app") && x.offsetParent)));
  await page.evaluate(() => { const s = JSON.parse(localStorage["cx-settings"]); s.state.installDismissedAt = Date.now(); localStorage["cx-settings"] = JSON.stringify(s); });

  await page.goto(B + "/login?next=/apply/sch-udaan", { waitUntil: "networkidle0" });
  await sleep(800);
  await clickText(page, "Priya Sharma");
  await sleep(800);
  await page.keyboard.type("123456");
  await sleep(2500);
  check("Citizen login with any OTP", page.url().endsWith("/apply/sch-udaan"), page.url());

  await clickText(page, "Next"); await sleep(600);
  await page.type("#f-q_institution", "Fergusson College (demo)");
  await clickText(page, "Next"); await sleep(1500);
  await page.evaluate(() => { const li = [...document.querySelectorAll("li")].find((l) => l.innerText.includes("Residence certificate")); [...li.querySelectorAll("button")].find((b) => b.innerText.includes("Upload")).click(); });
  await sleep(800);
  const inputs = await page.$$('input[type="file"]');
  await inputs[inputs.length - 2].uploadFile(require("path").resolve(__dirname, "../../public/icons/icon-192.png"));
  await sleep(2200);
  await clickText(page, "Save to wallet");
  await sleep(1000);
  const attached = await page.evaluate(() => [...document.querySelectorAll("li")].filter((l) => l.querySelector("[id^='f-d_']")).every((l) => l.innerText.includes("Attached")));
  check("All required documents attached", attached);
  await clickText(page, "Next"); await sleep(800);
  await clickText(page, "Confirm details"); await sleep(800);
  await page.click("#f-declared");
  await clickText(page, "Submit application");
  await sleep(2500);
  const ref = await page.evaluate(() => document.body.innerText.match(/CXI\/2026\/UKS\/\d+/)?.[0]);
  check("Application submitted with reference", !!ref, ref);

  await page.goto(B + "/track", { waitUntil: "networkidle0" });
  await sleep(26000);
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(1500);
  const appId = await page.evaluate((ref) => [...document.querySelectorAll('a[href*="/track/"]')].find((a) => a.innerText.includes(ref))?.getAttribute("href").split("/").pop(), ref);
  const row = await page.evaluate((ref) => [...document.querySelectorAll("li")].find((l) => l.innerText.includes(ref))?.innerText || "", ref);
  check("Auto-verified by simulated back office", row.includes("Auto-verified"));

  await page.goto(B + "/gov/login", { waitUntil: "networkidle0" });
  await sleep(800);
  await clickText(page, "Sunita Kulkarni");
  await sleep(1500);
  await page.goto(B + "/gov/case/" + appId, { waitUntil: "networkidle0" });
  await sleep(1500);
  await clickText(page, "Recommend");
  await sleep(2000);
  check("District officer recommends; next file opens", !page.url().endsWith(appId));

  await page.goto(B + "/gov/login", { waitUntil: "networkidle0" });
  await sleep(800);
  await clickText(page, "Vikram Rao");
  await sleep(2000);
  await page.select("#san-scheme", "sch-udaan");
  await sleep(600);
  await page.evaluate(() => { [...document.querySelectorAll("label")].find((l) => l.innerText.includes("Priya Sharma"))?.querySelector("button")?.click(); });
  await sleep(500);
  await clickText(page, "Create payment batch");
  await sleep(2500);
  await clickText(page, "Release payment");
  await sleep(4000);
  check("Batch released, beneficiary credited", (await page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText || "")).includes("All beneficiaries have been credited"));
  await clickText(page, "Done").catch(() => {});

  await page.goto(B + "/track/" + appId, { waitUntil: "networkidle0" });
  await sleep(2500);
  check("Citizen sees credited amount", await page.evaluate(() => document.querySelector("main").innerText.includes("credited to your account")));
  check("Approval stamp shown", await page.evaluate(() => document.body.innerHTML.includes("APPROVED")));

  await page.goto(B + "/grievances", { waitUntil: "networkidle0" });
  await sleep(1200);
  await page.setOfflineMode(true);
  await sleep(800);
  check("Offline banner", (await page.evaluate(() => document.querySelector('[role="status"]')?.innerText || "")).includes("You are offline"));
  const opt = await page.$eval("#g-app option:nth-child(2)", (o) => o.value);
  await page.select("#g-app", opt);
  await page.type("#g-subject", "Payment query");
  await page.type("#g-desc", "Please confirm the date of the next instalment.");
  await clickText(page, "Submit grievance");
  await sleep(1200);
  await page.setOfflineMode(false);
  await sleep(1500);
  check("Queued item sent on reconnect", (await page.evaluate(() => [...document.querySelectorAll('[role="status"]')].map((e) => e.innerText).join(" "))).includes("1 items sent"));

  await page.goto(B + "/", { waitUntil: "networkidle0" });
  await sleep(1500);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.trim() === "हिं").click());
  await sleep(1200);
  check("Instant switch to Hindi", await page.evaluate(() => document.documentElement.lang === "hi" && document.body.innerText.includes("अपनी पात्रता जाँचें")));

  await page.goto(B + "/schemes/sch-vidya", { waitUntil: "networkidle0" });
  await sleep(1500);
  check("Deep link renders", await page.evaluate(() => /Vidya Setu|विद्या सेतु/.test(document.body.innerText)));
  check("No console errors", errors.length === 0, JSON.stringify(errors));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("FAILED", e.message); process.exit(1); });
