#!/usr/bin/env node
/**
 * Auditoría offline de APK: recorre todas las pantallas con la red externa
 * cortada (modo avión), mide FPS y memoria durante partidas largas y escribe
 * un reporte con el estado de cada pantalla.
 *
 *   node scripts/offline-playthrough.mjs
 *   REPORT_DIR=/tmp/qa node scripts/offline-playthrough.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const ORIGIN = process.env.QA_ORIGIN ?? "http://localhost:8080";
const REPORT_DIR = process.env.REPORT_DIR ?? "/tmp/qa-offline";
const SHOTS_DIR = `${REPORT_DIR}/pantallas`;
const LONG_SESSION_MS = Number(process.env.QA_SESSION_MS ?? 20_000);

const SHELL_ROUTES = [
  "/",
  "/single",
  "/tables",
  "/duelo",
  "/encargos",
  "/progreso",
  "/logros",
  "/estadisticas",
  "/diario",
  "/dificultad",
  "/reglas",
  "/ajustes",
  "/privacidad",
];
const GAME_ROUTES = [
  "/truco",
  "/chinchon",
  "/escoba",
  "/blackjack",
  "/poker",
  "/ruleta",
  "/dados",
  "/slots",
  "/solitario",
  "/sudoku",
  "/mahjong",
  "/bagatelle",
];

const IGNORED_CONSOLE = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[vite\]/i,
  /Service ?Worker/i,
];

function isLocal(url) {
  return (
    url.startsWith(ORIGIN) ||
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("about:")
  );
}

async function auditRoute(context, route) {
  const page = await context.newPage();
  const errors = [];
  const external = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((rx) => rx.test(text))) return;
    errors.push(text.slice(0, 200));
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${String(err).slice(0, 200)}`));
  page.on("request", (req) => {
    if (!isLocal(req.url())) external.push(req.url().slice(0, 120));
  });

  let status = "ok";
  try {
    const res = await page.goto(`${ORIGIN}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    if (res && res.status() >= 400) status = `http ${res.status()}`;
    await page.waitForTimeout(2200);
  } catch (e) {
    status = `navegación: ${String(e).slice(0, 120)}`;
  }

  // Métricas de layout: nada debe desbordar la pantalla ni scrollear en vertical.
  const layout = await page
    .evaluate(() => {
      const d = document.documentElement;
      return {
        overflowY: d.scrollHeight - d.clientHeight,
        overflowX: d.scrollWidth - d.clientWidth,
        empty: (document.body.innerText ?? "").trim().length < 12,
      };
    })
    .catch(() => ({ overflowY: 0, overflowX: 0, empty: true }));

  const slug = route === "/" ? "vestibulo" : route.replace(/\//g, "-").replace(/^-/, "");
  await page.screenshot({ path: `${SHOTS_DIR}/${slug}.png` }).catch(() => {});
  await page.close();

  return { route, status, errors, external, layout, shot: `pantallas/${slug}.png` };
}

/** Partida larga: mide FPS y crecimiento del heap con interacción continua. */
async function longSession(context, route) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err).slice(0, 160)));
  await page.goto(`${ORIGIN}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1500);

  const heapBefore = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);

  await page.evaluate(() => {
    window.__fps = { frames: 0, long: 0, start: performance.now() };
    const tick = () => {
      window.__fps.frames++;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      new PerformanceObserver((list) => {
        window.__fps.long += list.getEntries().length;
      }).observe({ entryTypes: ["longtask"] });
    } catch {}
  });

  // Interacción continua: tap sobre controles visibles del juego.
  const deadline = Date.now() + LONG_SESSION_MS;
  while (Date.now() < deadline) {
    const targets = page.locator("button:visible:not([disabled])");
    const n = await targets.count().catch(() => 0);
    if (n > 0) {
      const i = Math.floor(Math.random() * Math.min(n, 12));
      await targets
        .nth(i)
        .click({ timeout: 900, noWaitAfter: true })
        .catch(() => {});
    }
    await sleep(450);
  }

  const fps = await page.evaluate(() => {
    const s = window.__fps;
    const secs = (performance.now() - s.start) / 1000;
    return { fps: +(s.frames / secs).toFixed(1), longTasks: s.long };
  });

  await page.evaluate(() => {
    if (typeof window.gc === "function") window.gc();
  });
  await page.waitForTimeout(800);
  const heapAfter = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);
  const timers = await page.evaluate(() => document.querySelectorAll("*").length);
  await page.close();

  return {
    route,
    fps: fps.fps,
    longTasks: fps.longTasks,
    heapBeforeMB: +(heapBefore / 1048576).toFixed(1),
    heapAfterMB: +(heapAfter / 1048576).toFixed(1),
    growthMB: +((heapAfter - heapBefore) / 1048576).toFixed(1),
    nodes: timers,
    errors,
  };
}

async function main() {
  mkdirSync(SHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--js-flags=--expose-gc", "--enable-precise-memory-info"],
  });
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
  });

  // Modo avión: cualquier host que no sea el bundle local se corta.
  await context.route("**/*", (route) => {
    if (isLocal(route.request().url())) return route.continue();
    return route.abort();
  });

  const screens = [];
  for (const route of [...SHELL_ROUTES, ...GAME_ROUTES]) {
    const r = await auditRoute(context, route);
    screens.push(r);
    const bad = r.status !== "ok" || r.errors.length || r.external.length || r.layout.empty;
    console.log(`${bad ? "FALLO" : "ok   "} ${route}`);
  }

  const perf = [];
  const perfRoutes = (process.env.QA_PERF_ROUTES ?? "/truco,/mahjong,/bagatelle,/ruleta").split(
    ",",
  );
  for (const route of perfRoutes) {
    const r = await longSession(context, route);
    perf.push(r);
    console.log(`perf ${route}: ${r.fps} fps · heap ${r.heapBeforeMB}→${r.heapAfterMB} MB`);
  }

  await browser.close();

  const failing = screens.filter(
    (s) => s.status !== "ok" || s.errors.length || s.external.length || s.layout.empty,
  );
  const lines = [];
  lines.push("# Reporte de juego offline (APK)\n");
  lines.push(
    `Fecha: ${new Date().toISOString().slice(0, 16).replace("T", " ")} · Pantalla 360x800 @3x · Red externa bloqueada\n`,
  );
  lines.push(
    `**Resultado:** ${screens.length - failing.length}/${screens.length} pantallas sin fallos.\n`,
  );
  lines.push("## Pantallas\n");
  lines.push("| Pantalla | Estado | Errores JS | Pedidos a internet | Scroll vertical |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const s of screens) {
    lines.push(
      `| ${s.route} | ${s.status === "ok" && !s.errors.length && !s.external.length ? "sin fallos" : "revisar"} | ${s.errors.length} | ${s.external.length} | ${s.layout.overflowY > 4 ? `${s.layout.overflowY}px` : "no"} |`,
    );
  }
  lines.push("\n## Rendimiento en partidas largas\n");
  lines.push("| Juego | FPS medio | Tareas largas | Heap inicial | Heap final | Crecimiento |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const p of perf) {
    lines.push(
      `| ${p.route} | ${p.fps} | ${p.longTasks} | ${p.heapBeforeMB} MB | ${p.heapAfterMB} MB | ${p.growthMB} MB |`,
    );
  }
  if (failing.length) {
    lines.push("\n## Detalle de incidencias\n");
    for (const f of failing) {
      lines.push(`### ${f.route}`);
      if (f.status !== "ok") lines.push(`- estado: ${f.status}`);
      for (const e of f.errors.slice(0, 5)) lines.push(`- error: ${e}`);
      for (const e of f.external.slice(0, 5)) lines.push(`- pedido externo: ${e}`);
      if (f.layout.empty) lines.push("- la pantalla quedó vacía");
      lines.push("");
    }
  }

  writeFileSync(`${REPORT_DIR}/reporte-offline.md`, lines.join("\n"));
  writeFileSync(`${REPORT_DIR}/reporte-offline.json`, JSON.stringify({ screens, perf }, null, 2));
  console.log(`\nReporte: ${REPORT_DIR}/reporte-offline.md`);
  if (failing.length) process.exitCode = 1;
}

main();
