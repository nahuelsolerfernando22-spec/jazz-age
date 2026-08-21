import { test, expect, Route } from "@playwright/test";
import { ALL_ROUTES } from "./routes";

/**
 * Variante WebKit (motor de Safari iOS) del audit offline.
 * Ejecutar con:
 *   bunx playwright test e2e/offline-webkit-iphone.spec.ts --project=webkit-iphone-390
 *
 * Verifica el mismo contrato que el spec chromium:
 *   - 0 requests externos
 *   - 0 imágenes rotas
 *   - sin overflow horizontal ni clipping fuera de viewport
 * pero corriéndolo en WebKit para cubrir el binario que usa la WKWebView
 * de iOS (y, por afinidad, el motor de Chrome-on-iOS que hereda WebKit).
 */

const EXTERNAL_HOSTS = [
  "supabase.co",
  "supabase.in",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net",
  "unpkg.com",
];

const GAME_ROUTES = [...ALL_ROUTES];

test.describe("WebKit iPhone · offline parity", () => {
  test.beforeEach(async ({ context }) => {
    await context.route("**/*", (route: Route) => {
      const url = route.request().url();
      if (EXTERNAL_HOSTS.some((h) => url.includes(h))) return route.abort();
      return route.continue();
    });
  });

  for (const path of GAME_ROUTES) {
    test(`webkit offline ${path}`, async ({ page }) => {
      const external: string[] = [];
      page.on("request", (req) => {
        const u = req.url();
        if (EXTERNAL_HOSTS.some((h) => u.includes(h))) external.push(u);
      });

      const resp = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 20000 });
      expect(resp?.ok(), `HTTP ${path}`).toBeTruthy();

      // Clipping visual: elementos con contenido que se salen del viewport.
      const clipping = await page.evaluate(() => {
        const vw = window.innerWidth;
        const problems: { tag: string; cls: string; left: number; right: number }[] = [];
        // Muestreamos paneles / cards / grids / articles: los layouts principales.
        const nodes = document.querySelectorAll<HTMLElement>(
          "main, section, article, aside, [class*='card'], [class*='panel'], [class*='grid']",
        );
        nodes.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width < 40 || r.height < 40) return;
          if (r.left < -1 || r.right > vw + 1) {
            problems.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || "").toString().slice(0, 80),
              left: Math.round(r.left),
              right: Math.round(r.right),
            });
          }
        });
        return problems;
      });

      const brokenImgs = await page.$$eval("img", (imgs) =>
        imgs
          .filter(
            (img) =>
              (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth === 0,
          )
          .map((img) => (img as HTMLImageElement).src),
      );

      expect(external, `requests externos en ${path}`).toEqual([]);
      expect(brokenImgs, `imágenes rotas en ${path}`).toEqual([]);
      expect(clipping, `clipping fuera de viewport en ${path}`).toEqual([]);
    });
  }
});
