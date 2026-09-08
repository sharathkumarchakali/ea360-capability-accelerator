import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const outDir = path.resolve("screenshots/explorer");
fs.mkdirSync(outDir, { recursive: true });
const viewports = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "390x844", width: 390, height: 844 },
];
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4174";

async function prepare(page) {
  await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(800);
  const card = page.locator("button.demo-entry-card").first();
  if (await card.count()) {
    await card.click({ timeout: 5000 });
    await page.waitForTimeout(600);
  }
  const exit = page.locator(".guided-demo-bar button", { hasText: /^Exit$/i }).first();
  if (await exit.count()) {
    await exit.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => { location.hash = "explorer"; });
  await page.waitForTimeout(1200);
  const depth2 = page.locator(".explorer-rail .explorer-segmented button", { hasText: /^2$/ }).first();
  if (await depth2.count() && await depth2.isVisible()) {
    await depth2.click().catch(() => {});
    await page.waitForTimeout(700);
  }
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true }).catch(() =>
    chromium.launch({ channel: "msedge", headless: true }),
  );
  const results = [];
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await prepare(page);
    const metrics = await page.evaluate(() => {
      const main = document.querySelector("main.main");
      const explorer = document.querySelector(".relationship-explorer");
      const body = document.querySelector(".explorer-body");
      const canvas = document.querySelector(".explorer-canvas-wrap");
      const mobile = document.querySelector(".explorer-mobile");
      const chips = document.querySelectorAll(".etype-chip");
      const nodes = document.querySelectorAll(".rf-entity-node");
      const mobileVisible = mobile && getComputedStyle(mobile).display !== "none";
      const desktopVisible = canvas && getComputedStyle(canvas).display !== "none";
      const bodyW = body ? body.getBoundingClientRect().width : 0;
      const canvasW = canvas && desktopVisible ? canvas.getBoundingClientRect().width : 0;
      return {
        hasExplorer: !!explorer,
        pageOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        mainOverflowY: main ? main.scrollHeight > main.clientHeight + 2 : null,
        explorerHeight: explorer ? Math.round(explorer.getBoundingClientRect().height) : null,
        canvasWidth: Math.round(canvasW),
        bodyWidth: Math.round(bodyW),
        canvasPct: bodyW && canvasW ? Math.round((canvasW / bodyW) * 1000) / 10 : null,
        chipCount: chips.length,
        nodeCount: nodes.length,
        mobileList: !!mobileVisible,
        desktopGraph: !!desktopVisible,
      };
    });
    const file = path.join(outDir, `explorer-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    results.push({ viewport: vp.name, file, ...metrics });
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(outDir, "metrics.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });