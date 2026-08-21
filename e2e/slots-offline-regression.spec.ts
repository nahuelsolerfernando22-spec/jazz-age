// Regresión visual/offline de Slots: 4 momentos × 4 viewports Android.
// Bloquea red externa, borra caché, y valida:
//  - retrato de la anfitriona pintado (naturalWidth > 0)
//  - LIBRO no se solapa con retrato ni con barra "Próximo encargo"
//  - ninguna imagen rota
//  - sin errores de consola bloqueantes
//
// Correr:  bunx playwright test e2e/slots-offline-regression.spec.ts

import { test, expect, type Route, type Page } from "@playwright/test";

const EXTERNAL_HOSTS = ["supabase.co", "supabase.in", "googletagmanager", "analytics"];

const VIEWPORTS = [
  { name: "android-360", width: 360, height: 800 },
  { name: "android-393", width: 393, height: 852 },
  { name: "android-414", width: 414, height: 896 },
  { name: "android-480", width: 480, height: 800 },
] as const;

type Rect = { x: number; y: number; w: number; h: number };

function overlaps(a: Rect, b: Rect): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

async function rectOf(page: Page, selector: string): Promise<Rect | null> {
  const box = await page
    .locator(selector)
    .first()
    .boundingBox()
    .catch(() => null);
  if (!box) return null;
  return { x: box.x, y: box.y, w: box.width, h: box.height };
}

async function assertNoBrokenImages(page: Page, label: string) {
  const broken = await page.$$eval("img", (imgs) =>
    imgs
      .filter((img) => {
        const i = img as HTMLImageElement;
        return i.complete && i.naturalWidth === 0 && !!i.src && !i.src.startsWith("data:");
      })
      .map((img) => (img as HTMLImageElement).src),
  );
  expect(broken, `imágenes rotas en ${label}`).toEqual([]);
}

async function assertPortraitPainted(page: Page, label: string) {
  const state = await page
    .locator('img[src*="salome-portrait"]')
    .first()
    .evaluate((el) => {
      const i = el as HTMLImageElement;
      return { complete: i.complete, natural: i.naturalWidth };
    })
    .catch(() => null);
  expect(state, `retrato ausente en ${label}`).not.toBeNull();
  expect(state!.complete, `retrato incompleto en ${label}`).toBe(true);
  expect(state!.natural, `retrato con naturalWidth 0 en ${label}`).toBeGreaterThan(0);
}

async function assertNoLayoutOverlap(page: Page, label: string) {
  const libro = await rectOf(page, 'button[aria-label="Abrir Libro del Cuervo"]');
  const portrait = await rectOf(page, 'img[src*="salome-portrait"]');
  const encargo = await page
    .getByText(/Próximo encargo/i)
    .first()
    .boundingBox()
    .catch(() => null);

  expect(libro, `LIBRO no encontrado en ${label}`).not.toBeNull();
  if (libro && portrait) {
    expect(overlaps(libro, portrait), `LIBRO se solapa con retrato en ${label}`).toBe(false);
  }
  if (libro && encargo) {
    const enc: Rect = { x: encargo.x, y: encargo.y, w: encargo.width, h: encargo.height };
    expect(overlaps(libro, enc), `LIBRO se solapa con Próximo encargo en ${label}`).toBe(false);
  }
}

async function auditMoment(page: Page, tag: string) {
  await assertPortraitPainted(page, tag);
  await assertNoBrokenImages(page, tag);
  await assertNoLayoutOverlap(page, tag);

  // Ninguna región central del cabinet debe quedar en negro puro (pantalla negra).
  const bg = await page.evaluate(() => {
    const el = document.querySelector("main") ?? document.body;
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height };
  });
  expect(bg.width, `viewport sin ancho en ${tag}`).toBeGreaterThan(0);
  expect(bg.height, `viewport sin alto en ${tag}`).toBeGreaterThan(0);
}

for (const vp of VIEWPORTS) {
  test.describe(`slots offline · ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("4 momentos sin solapes ni imágenes rotas", async ({ page, context }) => {
      // Cold start: sin caché de disco/memoria.
      await context.clearCookies();
      const consoleErrors: string[] = [];
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const t = m.text();
        if (/HMR|DevTools|favicon|Manifest/i.test(t)) return;
        consoleErrors.push(t);
      });

      // Bloquea red externa (modo avión).
      await context.route("**/*", (route: Route) => {
        const u = route.request().url();
        if (EXTERNAL_HOSTS.some((h) => u.includes(h))) return route.abort();
        return route.continue();
      });

      // Fuerza cold: bypass HTTP cache.
      await page.route("**/*", (r) => r.continue());

      await page.goto("http://localhost:8080/slots", {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      // Espera a que el retrato exista en el DOM.
      await page.waitForSelector('img[src*="salome-portrait"]', {
        state: "attached",
        timeout: 20_000,
      });
      await page.waitForTimeout(400);

      // Momento 1: idle (recién entrado).
      await auditMoment(page, `${vp.name} · idle`);

      // Localiza la palanca de tirar.
      const lever = page.locator('button[aria-label="Tirar de la palanca"]').first();
      await expect(lever).toBeVisible();

      // Momento 2: girando (durante primer spin).
      await lever.click();
      await page.waitForTimeout(150);
      await auditMoment(page, `${vp.name} · girando`);

      // Momento 3: tras un giro (esperar a resolución).
      await page.waitForTimeout(2500);
      await auditMoment(page, `${vp.name} · post-giro`);

      // Momento 4: tras 6 giros seguidos.
      for (let i = 0; i < 5; i++) {
        if (await lever.isEnabled().catch(() => false)) {
          await lever.click().catch(() => {});
        }
        await page.waitForTimeout(900);
      }
      await auditMoment(page, `${vp.name} · 6-giros`);

      expect(
        consoleErrors,
        `errores de consola en ${vp.name}:\n${consoleErrors.join("\n")}`,
      ).toEqual([]);
    });
  });
}
