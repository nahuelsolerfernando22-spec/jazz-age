import { test, expect, Route } from "@playwright/test";
import { ALL_ROUTES } from "./routes";

/**
 * Emula "modo avión" en Android: bloquea cualquier request a hosts externos
 * cada juego renderiza sin depender de internet.
 *
 * Ejecuta:  bunx playwright test e2e/offline-airplane.spec.ts
 */

const EXTERNAL_HOSTS = ["supabase.co", "supabase.in"];

const GAME_ROUTES = [...ALL_ROUTES];

test.use({
  viewport: { width: 375, height: 812 }, // pantalla de celular
});

test.describe("APK offline · modo avión", () => {
  test.beforeEach(async ({ context }) => {
    // Bloquea cualquier host externo. Requests locales (localhost / bundle) pasan.
    await context.route("**/*", (route: Route) => {
      const url = route.request().url();
      if (EXTERNAL_HOSTS.some((h) => url.includes(h))) {
        return route.abort();
      }
      return route.continue();
    });
  });

  for (const path of GAME_ROUTES) {
    test(`renderiza ${path} sin internet`, async ({ page }) => {
      const blocked: string[] = [];
      page.on("requestfailed", (req) => {
        const u = req.url();
        if (EXTERNAL_HOSTS.some((h) => u.includes(h))) blocked.push(u);
      });

      const resp = await page.goto(`http://localhost:8080${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      expect(resp?.ok(), `respuesta HTTP para ${path}`).toBeTruthy();
      // La página monta algo — evitamos el placeholder blanco.
      await expect(page.locator("body")).not.toHaveText("", { timeout: 5000 });
      // Ninguna imagen crítica debe quedar rota.
      const brokenImgs = await page.$$eval("img", (imgs) =>
        imgs
          .filter(
            (img) =>
              (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth === 0,
          )
          .map((img) => (img as HTMLImageElement).src),
      );
      expect(brokenImgs, `imágenes rotas en ${path}`).toEqual([]);
      // Reportamos si algún request externo intentó salir.
      expect(blocked, `requests externos bloqueados en ${path}`).toEqual([]);
    });
  }
});
