import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "store-screenshots");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.SHOT_URL ?? "http://localhost:8080";

const SHOTS = [
  { name: "01-hub", path: "/single" },
  { name: "02-truco", path: "/truco" },
  { name: "03-torneo", path: "/torneo" },
  { name: "04-sindicato", path: "/sindicato" },
  { name: "05-mahjong", path: "/mahjong" },
  { name: "06-blackjack", path: "/blackjack" },
  { name: "07-solitario", path: "/solitario" },
  { name: "08-logros", path: "/logros" },
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  for (const shot of SHOTS) {
    try {
      await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1200);
      const file = resolve(OUT, `${shot.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`✓ ${shot.name} → ${file}`);
    } catch (err) {
      console.error(`✗ ${shot.name}:`, err.message);
    }
  }

  await browser.close();
  console.log(`\nListo. Capturas en ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
