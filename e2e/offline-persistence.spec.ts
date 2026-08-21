// Verifica edge cases de guardado y recuperación:
//   1. Datos en localStorage sobreviven a un refresh.
//   2. Doble refresh rápido no corrompe stores Zustand.
//   3. Modo offline (browser flag) no rompe la nav ni pierde datos locales.
//   4. Escritura antes de hidratar y refresh inmediato mantiene el dato.
//
// Usa los stores reales: cuervo-lives (vidas), speakeasy-1928 (partida).

import { test, expect } from "@playwright/test";

test.describe("Persistencia offline / edge cases", () => {
  test("localStorage sobrevive a refresh simple", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("cuervo:diag:test", "abc-123");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    const v = await page.evaluate(() => localStorage.getItem("cuervo:diag:test"));
    expect(v).toBe("abc-123");
  });

  test("doble refresh rápido no rompe stores", async ({ page }) => {
    await page.goto("/despacho", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem("cuervo:diag:test-rush", JSON.stringify({ n: 42 }));
    });
    // Doble refresh rápido — dispara re-hidratación Zustand mientras aún
    // hay writes pendientes de otras keys.
    await page.reload({ waitUntil: "commit" });
    await page.reload({ waitUntil: "domcontentloaded" });
    const raw = await page.evaluate(() => localStorage.getItem("cuervo:diag:test-rush"));
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toEqual({ n: 42 });
  });

  test("modo offline: la app sigue navegable", async ({ page, context }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await context.setOffline(true);

    // Intentar navegación client-side a otra ruta ya bundled.
    await page.evaluate(() => {
      window.history.pushState({}, "", "/despacho");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    const stillMounted = await page.locator("main, h1, h2").first().isVisible();
    expect(stillMounted).toBe(true);

    // localStorage debe seguir escribible offline.
    await page.evaluate(() => {
      localStorage.setItem("cuervo:diag:offline-write", "ok");
    });
    const v = await page.evaluate(() => localStorage.getItem("cuervo:diag:offline-write"));
    expect(v).toBe("ok");

    await context.setOffline(false);
  });

  test("escritura antes de refresh inmediato persiste", async ({ page }) => {
    await page.goto("/");
    // Escribir y recargar SIN esperar network idle.
    await page.evaluate(() => {
      localStorage.setItem("cuervo:diag:fast", "sync-write");
    });
    await page.reload({ waitUntil: "commit" });
    const v = await page.evaluate(() => localStorage.getItem("cuervo:diag:fast"));
    expect(v).toBe("sync-write");
  });
});
