// E2E — Desbloqueo por rondas de las habilidades del Mahjong.
//
// Regla del juego: en la primera mesa sólo hay Mezclar y Pista. El resto se
// gana superando mesas (Deshacer R2, Imán R3, Espacio R5, Devolver R7).
// Esta suite siembra la progresión guardada y verifica, mesa por mesa, que
// las habilidades bloqueadas no se puedan usar y que las ganadas sí.
//
//   bunx playwright test mahjong-ability-unlocks --project=chromium-android-375

import { test, expect, type Page } from "@playwright/test";

const PROGRESSION_KEY = "cuervo-dorado:mahjong:progression:v1";
const LAST_LEVEL_KEY = "mahjong:save:v2:last";

const UNLOCKS_AT: Record<string, number> = {
  Mezclar: 1,
  Pista: 1,
  Deshacer: 2,
  Imán: 3,
  Espacio: 5,
  Devolver: 7,
};

/** Progresión sintética: mesas l1..lN superadas con estrellas. */
function progression(clearedLevels: number) {
  const perLevel: Record<string, unknown> = {};
  for (let i = 1; i <= clearedLevels; i++) {
    perLevel[`l${i}`] = { stars: 2, bestScore: 500, bestTime: 200, played: 1, won: 1 };
  }
  return { xp: clearedLevels * 300, totalGames: clearedLevels, totalWins: clearedLevels, perLevel };
}

/** Carga /mahjong con N mesas superadas y la mesa `level` como actual. */
async function openWithProgress(page: Page, clearedLevels: number, level: string) {
  await page.goto("/");
  await page.evaluate(
    ([key, value, lastKey, lastValue]) => {
      window.localStorage.setItem(key as string, value as string);
      window.localStorage.setItem(lastKey as string, lastValue as string);
    },
    [PROGRESSION_KEY, JSON.stringify(progression(clearedLevels)), LAST_LEVEL_KEY, level],
  );
  await page.goto("/mahjong");
  await page.waitForLoadState("networkidle");
  // Cerramos el tutorial para que no tape la barra de habilidades.
  for (let i = 0; i < 4; i++) {
    const closer = page.locator('button[aria-label="Cerrar tutorial"]');
    if (!(await closer.count())) break;
    await closer
      .first()
      .click({ timeout: 1200 })
      .catch(() => {});
    await page.waitForTimeout(300);
  }
  const start = page.getByRole("button", { name: "Empezar partida" });
  if (await start.count()) {
    await start
      .first()
      .click({ timeout: 5000 })
      .catch(() => {});
  }
  await expect(page.locator('button[data-skill="Pista"]')).toBeEnabled({ timeout: 20_000 });
  const more = page.getByRole("button", { name: /Ver más acciones/i });
  if ((await more.count()) && (await more.first().isVisible())) {
    await more.first().click();
    await page.waitForTimeout(250);
  }
}

/** Estado de bloqueo leído del DOM para cada habilidad. */
async function lockedMap(page: Page): Promise<Record<string, boolean>> {
  return page.evaluate(() => {
    const out: Record<string, boolean> = {};
    document.querySelectorAll<HTMLElement>("button[data-skill]").forEach((el) => {
      out[el.dataset.skill!] = el.dataset.locked === "true";
    });
    return out;
  });
}

const CASES: { cleared: number; level: string; round: number }[] = [
  { cleared: 0, level: "l1", round: 1 },
  { cleared: 1, level: "l2", round: 2 },
  { cleared: 2, level: "l3", round: 3 },
  { cleared: 4, level: "l5", round: 5 },
  { cleared: 6, level: "l7", round: 7 },
];

test.describe("mahjong — las habilidades se ganan por rondas", () => {
  for (const c of CASES) {
    test(`ronda ${c.round}: sólo abren las habilidades ganadas`, async ({ page }) => {
      await openWithProgress(page, c.cleared, c.level);
      const locked = await lockedMap(page);

      for (const [name, unlocksAt] of Object.entries(UNLOCKS_AT)) {
        expect(locked, `falta la habilidad ${name} en el HUD`).toHaveProperty(name);
        expect(locked[name], `${name} en ronda ${c.round}`).toBe(c.round < unlocksAt);
      }
    });
  }

  test("en la ronda 1 las bloqueadas no responden al tap", async ({ page }) => {
    await openWithProgress(page, 0, "l1");
    for (const name of ["Deshacer", "Imán", "Espacio", "Devolver"]) {
      const btn = page.locator(`button[data-skill="${name}"]`);
      await expect(btn).toBeDisabled();
      await expect(btn).toHaveAttribute("aria-label", /bloqueada/);
      // Un click forzado sobre una habilidad bloqueada no debe hacer nada.
      await btn.click({ force: true, timeout: 2000 }).catch(() => {});
      await expect(btn).toHaveAttribute("data-locked", "true");
    }
  });

  test("superar mesas abre habilidades nuevas sin tocar las viejas", async ({ page }) => {
    await openWithProgress(page, 0, "l1");
    const r1 = await lockedMap(page);
    expect(r1["Deshacer"]).toBe(true);

    await openWithProgress(page, 1, "l2");
    const r2 = await lockedMap(page);
    expect(r2["Deshacer"]).toBe(false);
    expect(r2["Mezclar"]).toBe(false);
    expect(r2["Pista"]).toBe(false);
    expect(r2["Imán"]).toBe(true);

    await openWithProgress(page, 6, "l7");
    const r7 = await lockedMap(page);
    expect(Object.values(r7).every((v) => v === false)).toBe(true);
  });

  test("la habilidad bloqueada muestra en qué ronda se gana", async ({ page }) => {
    await openWithProgress(page, 0, "l1");
    await expect(page.locator('button[data-skill="Deshacer"]')).toHaveAttribute(
      "title",
      /ronda 2/i,
    );
    await expect(page.locator('button[data-skill="Devolver"]')).toHaveAttribute(
      "title",
      /ronda 7/i,
    );
  });
});
