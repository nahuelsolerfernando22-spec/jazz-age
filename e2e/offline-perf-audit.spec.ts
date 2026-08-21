import { test, expect, Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { ALL_ROUTES } from "./routes";

/**
 * Auditoría completa offline:
 *  1) Mide tiempo de primer render (FCP / domcontentloaded) por ruta.
 *  2) Confirma 0 requests externos por ruta.
 *  3) Verifica UI móvil sin overflow horizontal en 375 / 390 / 414 / 428.
 *  4) Ejecuta un pase con throttling 3G y otro 4G para validar que la
 *     precarga offline no rompe la experiencia con internet.
 *
 * Ejecuta: bunx playwright test e2e/offline-perf-audit.spec.ts
 * Reporte: e2e/reports/offline-perf-report.json
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

const MOBILE_VIEWPORTS = [
  { name: "iphone-se-375", width: 375, height: 812 },
  { name: "pixel-390", width: 390, height: 844 },
  { name: "iphone-plus-414", width: 414, height: 896 },
  { name: "iphone-max-428", width: 428, height: 926 },
];

// perfiles de throttling (bytes/s + latencia ms)
const NETWORK_PROFILES = {
  "3g": {
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
  },
  "4g": {
    downloadThroughput: (9 * 1024 * 1024) / 8,
    uploadThroughput: (9 * 1024 * 1024) / 8,
    latency: 20,
  },
};

const REPORT_DIR = path.resolve("e2e/reports");
fs.mkdirSync(REPORT_DIR, { recursive: true });

type RouteMetric = {
  route: string;
  viewport: string;
  network: string;
  ttfbMs: number;
  domContentLoadedMs: number;
  firstPaintMs: number | null;
  firstContentfulPaintMs: number | null;
  externalRequests: string[];
  overflowX: boolean;
  brokenImages: string[];
  clipped: { tag: string; cls: string; left: number; right: number }[];
  overlaps: { a: string; b: string }[];
};

const collected: RouteMetric[] = [];

test.afterAll(async () => {
  const out = path.join(REPORT_DIR, "offline-perf-report.json");
  fs.writeFileSync(
    out,
    JSON.stringify({ generatedAt: new Date().toISOString(), metrics: collected }, null, 2),
  );

  console.log(`\n📊 reporte offline en ${out} (${collected.length} muestras)\n`);
});

async function auditRoute(
  page: import("@playwright/test").Page,
  route: string,
  viewport: { name: string; width: number; height: number },
  network: string,
) {
  const external: string[] = [];
  page.on("requestfailed", (req) => {
    const u = req.url();
    if (EXTERNAL_HOSTS.some((h) => u.includes(h))) external.push(u);
  });
  page.on("request", (req) => {
    const u = req.url();
    if (EXTERNAL_HOSTS.some((h) => u.includes(h))) external.push(u);
  });

  const t0 = Date.now();
  const resp = await page.goto(`http://localhost:8080${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  const domContentLoadedMs = Date.now() - t0;
  expect(resp?.ok(), `HTTP ${route}`).toBeTruthy();

  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    const paint = performance.getEntriesByType("paint");
    const fp = paint.find((p) => p.name === "first-paint")?.startTime ?? null;
    const fcp = paint.find((p) => p.name === "first-contentful-paint")?.startTime ?? null;
    return {
      ttfb: nav ? nav.responseStart - nav.requestStart : 0,
      firstPaint: fp,
      firstContentfulPaint: fcp,
    };
  });

  const overflowX = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );

  // Clipping visual + solapamientos entre paneles hermanos.
  const layoutIssues = await page.evaluate(() => {
    const vw = window.innerWidth;
    const clipped: { tag: string; cls: string; left: number; right: number }[] = [];
    const overlaps: { a: string; b: string }[] = [];

    const panels = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main, section, article, aside, [class*='card'], [class*='panel'], [role='region']",
      ),
    ).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width >= 60 && r.height >= 60;
    });

    // Clipping: rect fuera de viewport.
    panels.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.left < -1 || r.right > vw + 1) {
        clipped.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 80),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }
    });

    // Solapamiento entre hermanos directos (indica layout roto en mobile).
    const parents = new Map<Element, HTMLElement[]>();
    panels.forEach((el) => {
      if (!el.parentElement) return;
      const arr = parents.get(el.parentElement) ?? [];
      arr.push(el);
      parents.set(el.parentElement, arr);
    });
    parents.forEach((siblings) => {
      for (let i = 0; i < siblings.length; i++) {
        for (let j = i + 1; j < siblings.length; j++) {
          const a = siblings[i].getBoundingClientRect();
          const b = siblings[j].getBoundingClientRect();
          const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          const area = overlapX * overlapY;
          const minArea = Math.min(a.width * a.height, b.width * b.height);
          if (minArea > 0 && area / minArea > 0.4) {
            overlaps.push({
              a: (siblings[i].className || siblings[i].tagName).toString().slice(0, 60),
              b: (siblings[j].className || siblings[j].tagName).toString().slice(0, 60),
            });
          }
        }
      }
    });

    return { clipped, overlaps };
  });

  const brokenImages = await page.$$eval("img", (imgs) =>
    imgs
      .filter(
        (img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth === 0,
      )
      .map((img) => (img as HTMLImageElement).src),
  );

  collected.push({
    route,
    viewport: viewport.name,
    network,
    ttfbMs: Math.round(perf.ttfb),
    domContentLoadedMs,
    firstPaintMs: perf.firstPaint,
    firstContentfulPaintMs: perf.firstContentfulPaint,
    externalRequests: external,
    overflowX,
    brokenImages,
    clipped: layoutIssues.clipped,
    overlaps: layoutIssues.overlaps,
  });

  expect(external, `requests externos en ${route} @ ${viewport.name}/${network}`).toEqual([]);
  expect(brokenImages, `imágenes rotas en ${route} @ ${viewport.name}`).toEqual([]);
  expect(overflowX, `overflow horizontal en ${route} @ ${viewport.name}`).toBeFalsy();
  expect(layoutIssues.clipped, `clipping fuera de viewport en ${route} @ ${viewport.name}`).toEqual(
    [],
  );
  expect(layoutIssues.overlaps, `solapamiento de paneles en ${route} @ ${viewport.name}`).toEqual(
    [],
  );
}

test.describe("Offline · 0 requests externos + FCP por ruta @ 375", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ context }) => {
    await context.route("**/*", (route: Route) => {
      const url = route.request().url();
      if (EXTERNAL_HOSTS.some((h) => url.includes(h))) return route.abort();
      return route.continue();
    });
  });

  for (const route of GAME_ROUTES) {
    test(`offline ${route}`, async ({ page }) => {
      await auditRoute(page, route, MOBILE_VIEWPORTS[0], "offline");
    });
  }
});

test.describe("UI móvil · sin overflow en 390/414/428", () => {
  test.beforeEach(async ({ context }) => {
    await context.route("**/*", (route: Route) => {
      const url = route.request().url();
      if (EXTERNAL_HOSTS.some((h) => url.includes(h))) return route.abort();
      return route.continue();
    });
  });

  for (const vp of MOBILE_VIEWPORTS.slice(1)) {
    for (const route of GAME_ROUTES) {
      test(`${vp.name} ${route}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await auditRoute(page, route, vp, "offline");
      });
    }
  }
});

test.describe("Throttling · 3G y 4G con precarga offline activa", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const [profileName, profile] of Object.entries(NETWORK_PROFILES)) {
    test(`${profileName} · muestra de rutas clave`, async ({ page, context }) => {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", { offline: false, ...profile });

      const sample = ["/", "/despacho", "/bar", "/mentirosos", "/mahjong", "/tables"];
      for (const route of sample) {
        await auditRoute(page, route, MOBILE_VIEWPORTS[1], profileName);
      }
    });
  }
});
