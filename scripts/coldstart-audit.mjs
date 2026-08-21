import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const BASE = process.env.SMOKE_URL ?? "http://localhost:8080";
const BUDGET_MS = Number(process.env.COLDSTART_BUDGET_MS ?? 2500);

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["Pixel 5"],
    offline: true,
  });
  const page = await context.newPage();

  await context.setOffline(false);
  const t0 = Date.now();
  await page.goto(`${BASE}/single`, { waitUntil: "networkidle" });
  await page.waitForSelector("main, [data-hub-ready], a[href^='/']", { timeout: 8000 });
  const warmMs = Date.now() - t0;

  await context.setOffline(true);
  const t1 = Date.now();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("main, [data-hub-ready], a[href^='/']", { timeout: 10000 });
  const coldMs = Date.now() - t1;

  console.log(JSON.stringify({ warmMs, coldMs, budgetMs: BUDGET_MS }, null, 2));

  await browser.close();
  if (coldMs > BUDGET_MS) {
    console.error(`FAIL: cold-start ${coldMs}ms > ${BUDGET_MS}ms`);
    process.exit(1);
  }
  console.log(`OK: cold-start ${coldMs}ms ≤ ${BUDGET_MS}ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
