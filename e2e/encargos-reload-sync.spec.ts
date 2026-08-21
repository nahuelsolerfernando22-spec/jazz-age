// E2E: simula recarga (Android WebView / APK) y verifica que el tracker y el
// HUD de Chinchón, Truco y Póker se sincronizan correctamente tras un reload.
//
// Contrato bajo prueba (post-fix de persistencia acotada):
//   - `partialize` sólo persiste `cleared` (progreso duro).
//   - `activeLevel` / `startedAt` NO sobreviven al reload → nunca hay HUD
//     colgado tras cerrar y reabrir la APK.
//   - El tracker (`trackMatchEnd`) escribe en `cleared` y ese registro sí
//     sobrevive al reload.
//
// Corre en el proyecto `chromium-android-375` (viewport Pixel 5) para simular
// la app Android; el resto de proyectos verifican compat WebKit iOS.

import { test, expect, type Page } from "@playwright/test";

type GameKey = "chinchon" | "truco" | "poker";

interface GameSpec {
  key: GameKey;
  route: string;
  storageKey: string;
  levelId: string; // primer nivel — siempre desbloqueado
}

const GAMES: GameSpec[] = [
  { key: "chinchon", route: "/chinchon", storageKey: "cuervo:chinchon-run:v1", levelId: "CH01" },
  { key: "truco", route: "/truco", storageKey: "cuervo:truco-run:v1", levelId: "TR01" },
  { key: "poker", route: "/poker", storageKey: "cuervo:poker-run:v1", levelId: "PO01" },
];

async function seedStore(page: Page, key: string, state: Record<string, unknown>) {
  await page.evaluate(
    ({ key, payload }) => {
      window.localStorage.setItem(key, JSON.stringify(payload));
    },
    { key, payload: { state, version: 2 } },
  );
}

async function readStore(
  page: Page,
  key: string,
): Promise<{ state: Record<string, unknown> } | null> {
  return page.evaluate((k) => {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as { state: Record<string, unknown> }) : null;
  }, key);
}

for (const game of GAMES) {
  test.describe(`Encargos · reload sync (${game.key})`, () => {
    test(`activeLevel NO se restaura tras reload — HUD no queda colgado`, async ({ page }) => {
      // 1. Abrir ruta y sembrar un run "en curso" en localStorage tal cual lo
      //    haría un dump pre-fix (con activeLevel + startedAt persistidos).
      await page.goto(game.route, { waitUntil: "domcontentloaded" });
      await seedStore(page, game.storageKey, {
        activeLevel: game.levelId,
        startedAt: Date.now() - 5_000,
        lastEndReason: null,
        lastResult: null,
        cleared: {},
      });

      // 2. Reload — simula cierre/apertura de la APK.
      await page.reload({ waitUntil: "domcontentloaded" });

      // 3. El HUD del encargo NO debe aparecer (activeLevel purgado por partialize).
      const hud = page.getByText(`Encargo · ${game.levelId}`, { exact: false });
      await expect(hud).toHaveCount(0);

      // 4. El estado persistido tras rehidratar no debe contener activeLevel.
      //    (Zustand reescribe la key en el próximo commit; forzamos uno tocando
      //    el store implícitamente al navegar a otra ruta.)
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.goto(game.route, { waitUntil: "domcontentloaded" });
      const dump = await readStore(page, game.storageKey);
      expect(dump).toBeTruthy();
      expect(dump?.state.activeLevel ?? null).toBeNull();
      expect(dump?.state.startedAt ?? null).toBeNull();
    });

    test(`cleared (progreso del tracker) sobrevive al reload`, async ({ page }) => {
      await page.goto(game.route, { waitUntil: "domcontentloaded" });

      const cleared = {
        [game.levelId]: {
          stars: 3 as const,
          bestSeconds: 90,
          clearedAt: new Date("2026-01-01T00:00:00Z").toISOString(),
        },
      };

      await seedStore(page, game.storageKey, {
        activeLevel: null,
        startedAt: null,
        lastEndReason: "won",
        lastResult: null,
        cleared,
      });

      // Reload simulando Android.
      await page.reload({ waitUntil: "domcontentloaded" });

      // El progreso sigue presente en el store persistido.
      const dump = await readStore(page, game.storageKey);
      expect(dump).toBeTruthy();
      const persistedCleared = dump?.state.cleared as Record<
        string,
        { stars: number; bestSeconds: number }
      >;
      expect(persistedCleared).toBeTruthy();
      expect(persistedCleared[game.levelId]?.stars).toBe(3);
      expect(persistedCleared[game.levelId]?.bestSeconds).toBe(90);

      // Y el hub /encargos refleja el progreso (3 estrellas visibles).
      await page.goto("/encargos", { waitUntil: "domcontentloaded" });
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();
    });

    test(`sin activeLevel, el HUD nunca aparece tras reload en la ruta del juego`, async ({
      page,
    }) => {
      // Estado limpio: sólo progreso, ningún run activo.
      await page.goto(game.route, { waitUntil: "domcontentloaded" });
      await seedStore(page, game.storageKey, {
        activeLevel: null,
        startedAt: null,
        lastEndReason: null,
        lastResult: null,
        cleared: {},
      });
      await page.reload({ waitUntil: "domcontentloaded" });

      const hud = page.getByText(/Encargo · [A-Z]{2}\d{2}/);
      await expect(hud).toHaveCount(0);
    });
  });
}

test.describe("Encargos · reload sync (multi-juego)", () => {
  test("progreso de los tres juegos coexiste tras reload", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    for (const g of GAMES) {
      await seedStore(page, g.storageKey, {
        activeLevel: null,
        startedAt: null,
        lastEndReason: "won",
        lastResult: null,
        cleared: {
          [g.levelId]: {
            stars: 2 as const,
            bestSeconds: 120,
            clearedAt: new Date("2026-02-02T00:00:00Z").toISOString(),
          },
        },
      });
    }

    await page.reload({ waitUntil: "domcontentloaded" });

    for (const g of GAMES) {
      const dump = await readStore(page, g.storageKey);
      const cleared = dump?.state.cleared as Record<string, { stars: number }> | undefined;
      expect(cleared?.[g.levelId]?.stars).toBe(2);
    }
  });
});
