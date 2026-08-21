// Smoke E2E: visita cada ruta principal, captura errores de consola y
// requests fallidos, verifica que hidrata (algún <main> o <h1> visible) y
// no rompe. Detecta regresiones básicas de navegación y estado vacío.
//
// Correr con:
//   bun run e2e -- smoke-routes
//   o: bunx playwright test smoke-routes --project=chromium-android-375

import { test, expect, type ConsoleMessage, type Request } from "@playwright/test";
import { ALL_ROUTES } from "./routes";

// Rutas principales que un jugador puede visitar. Omitimos:
// - camerinos.<npc> (40+ variantes duplicadas)
// - despacho.<seccion> (probamos /despacho, suficiente)
// - qa.*, dev.*, sitemap (herramientas internas)
// - habitaciones/$npc, pasillos/$tier (dinámicas)
const ROUTES = [...ALL_ROUTES];

// Errores conocidos y aceptables (warnings de librerías, mensajes de dev).
const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  /React Router Future Flag/i,
  /Download the React DevTools/i,
  /\[HMR\]/i,
  /favicon/i,
  /Manifest.*icon/i,
];

// Fallos de red esperables (assets CDN opcionales, telemetría).
const IGNORED_NETWORK_PATTERNS: RegExp[] = [
  /\/__l5e\/assets-v1\/.*\.asset\.json/i, // pointers viejos migrados
  /googletagmanager|analytics/i,
];

for (const route of ROUTES) {
  test(`smoke: ${route}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (msg: ConsoleMessage) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORED_CONSOLE_PATTERNS.some((r) => r.test(text))) return;
      consoleErrors.push(text);
    });
    page.on("requestfailed", (req: Request) => {
      const url = req.url();
      if (IGNORED_NETWORK_PATTERNS.some((r) => r.test(url))) return;
      failedRequests.push(`${req.failure()?.errorText ?? "?"} ${url}`);
    });
    page.on("response", (res) => {
      if (res.status() >= 500) {
        const url = res.url();
        if (IGNORED_NETWORK_PATTERNS.some((r) => r.test(url))) return;
        failedRequests.push(`${res.status()} ${url}`);
      }
    });

    await page.goto(route, { waitUntil: "domcontentloaded" });
    // Damos margen a hidratación / fuentes / imágenes de portada.
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {
      /* redes lentas o warmers en curso: no fallamos por esto */
    });

    // La página debe tener al menos un landmark o un heading visible.
    const hasLandmark = await page
      .locator("main, [role=main], h1, h2")
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasLandmark, `sin landmark visible en ${route}`).toBe(true);

    expect(consoleErrors, `errores de consola en ${route}:\n${consoleErrors.join("\n")}`).toEqual(
      [],
    );
    expect(failedRequests, `requests fallidos en ${route}:\n${failedRequests.join("\n")}`).toEqual(
      [],
    );
  });
}
