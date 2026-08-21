// E2E — Habilidades especiales del Mahjong (Android offline).
//
// Valida que cada habilidad (Mezclar, Pista, Imán, Espacio, Devolver,
// Deshacer) se habilite/deshabilite según el estado del tablero y la bandeja,
// que consuma su carga al usarse y que la barra no se apriete ni desborde en
// 360x800, 390x844 y tablet.
//
// Correr con:
//   bunx playwright test mahjong-skills --project=chromium-android-375

import { test, expect, type Page, type Locator } from "@playwright/test";

const SKILLS = ["Mezclar", "Pista", "Imán", "Espacio", "Devolver", "Deshacer"] as const;

function skill(page: Page, name: string): Locator {
  return page.locator(`button[data-skill="${name}"]`);
}

/** Cierra intros / hojas modales que tapen el tablero. */
async function dismissOverlays(page: Page) {
  for (let i = 0; i < 4; i++) {
    const closers = page.locator('button[aria-label="Cerrar tutorial"]');
    const n = await closers.count();
    if (!n) break;
    try {
      await closers.first().click({ timeout: 1200 });
      await page.waitForTimeout(400);
    } catch {
      break;
    }
  }
}

/** Abre la fila completa de habilidades (en mobile hay un botón "Más"). */
async function expandSkills(page: Page) {
  const more = page.getByRole("button", { name: /Ver más acciones/i });
  if (await more.count()) {
    if (await more.first().isVisible()) {
      await more.first().click();
      await page.waitForTimeout(300);
    }
  }
}

async function openBoard(page: Page) {
  await page.goto("/mahjong");
  await page.waitForLoadState("networkidle");
  await dismissOverlays(page);
  const start = page.getByRole("button", { name: "Empezar partida" });
  if (await start.count()) {
    await start
      .first()
      .click({ timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(1200);
  }
  // La partida arranca cuando "Pista" queda habilitada.
  await expect(skill(page, "Pista")).toBeEnabled({ timeout: 20_000 });
  await expandSkills(page);
}

/** Toca fichas del tablero hasta meter `n` en la bandeja. */
async function tapTiles(page: Page, n: number) {
  const tiles = page.locator('button[data-tile-id][data-tile-free="1"]');
  const total = await tiles.count();
  let tapped = 0;
  for (let i = 0; i < total && tapped < n; i++) {
    const t = tiles.nth(i);
    if (!(await t.isVisible().catch(() => false))) continue;
    if (await t.isDisabled().catch(() => false)) continue;
    await t.click({ timeout: 1500, force: true }).catch(() => {});
    await page.waitForTimeout(180);
    tapped++;
  }
  return tapped;
}

test.describe("Mahjong · habilidades especiales", () => {
  test("cada habilidad existe, es accesible y respeta su estado", async ({ page }) => {
    await openBoard(page);

    for (const name of SKILLS) {
      const btn = skill(page, name);
      await expect(btn, `falta la habilidad ${name}`).toHaveCount(1);

      // Accesibilidad: nombre accesible legible y target táctil >= 44px.
      const label = await btn.getAttribute("aria-label");
      expect(label, `${name} sin aria-label`).toBeTruthy();
      expect(label!.toLowerCase()).toContain(name.toLowerCase());

      const box = await btn.boundingBox();
      if (box) {
        expect.soft(box.width, `${name} muy angosto`).toBeGreaterThanOrEqual(44);
        expect.soft(box.height, `${name} muy bajo`).toBeGreaterThanOrEqual(44);
      }
    }

    // Con la bandeja vacía, "Devolver" y "Deshacer" tienen que estar bloqueados.
    await expect(skill(page, "Devolver")).toBeDisabled();
    await expect(skill(page, "Deshacer")).toBeDisabled();
    // "Pista" siempre disponible en partida en curso.
    await expect(skill(page, "Pista")).toBeEnabled();
  });

  test("Imán y Espacio se consumen y quedan deshabilitados", async ({ page }) => {
    await openBoard(page);

    const magnet = skill(page, "Imán");
    if (await magnet.isEnabled()) {
      await magnet.click();
      await page.waitForTimeout(700);
      await expect(magnet, "Imán debería agotarse tras 1 uso").toBeDisabled();
    }

    const slot = skill(page, "Espacio");
    if (await slot.isEnabled()) {
      await slot.click();
      await page.waitForTimeout(700);
      await expect(slot, "Espacio debería agotarse tras 1 uso").toBeDisabled();
    }
  });

  test("Mezclar descuenta su contador sin desbordar el badge", async ({ page }) => {
    await openBoard(page);
    const shuffle = skill(page, "Mezclar");
    const before = (await shuffle.getAttribute("aria-label")) ?? "";

    if (await shuffle.isEnabled()) {
      await shuffle.click();
      await page.waitForTimeout(900);
      const after = (await shuffle.getAttribute("aria-label")) ?? "";
      // O bien bajó el contador, o bien la habilidad quedó agotada.
      const consumed = after !== before || !(await shuffle.isEnabled());
      expect(consumed, "Mezclar no registró el uso").toBeTruthy();
    }

    // El badge no puede salirse del botón.
    const btnBox = await shuffle.boundingBox();
    const badge = shuffle.locator("span[aria-hidden]").last();
    if (btnBox && (await badge.count())) {
      const bb = await badge.boundingBox();
      if (bb) {
        expect(bb.x + bb.width).toBeLessThanOrEqual(btnBox.x + btnBox.width + 8);
        expect(bb.width).toBeLessThanOrEqual(56);
      }
    }
  });

  test("Devolver y Deshacer se habilitan al llenar la bandeja", async ({ page }) => {
    await openBoard(page);
    const tapped = await tapTiles(page, 2);
    test.skip(tapped === 0, "No se pudieron tocar fichas en este layout");
    await page.waitForTimeout(500);

    const undo = skill(page, "Deshacer");
    const back = skill(page, "Devolver");

    // Al menos una de las dos tiene que reaccionar al historial/bandeja.
    const anyEnabled = (await undo.isEnabled()) || (await back.isEnabled());
    expect(anyEnabled, "Ni Deshacer ni Devolver se habilitaron tras jugar").toBeTruthy();

    if (await undo.isEnabled()) {
      const before = (await undo.getAttribute("aria-label")) ?? "";
      await undo.click();
      await page.waitForTimeout(600);
      const after = (await undo.getAttribute("aria-label")) ?? "";
      expect(after, "Deshacer no consumió uso").not.toBe(before);
    }
  });

  test("la barra no se apretuja en 360x800, 390x844 ni tablet", async ({ page }) => {
    for (const vp of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 800, height: 1280 },
    ]) {
      await page.setViewportSize(vp);
      await openBoard(page);

      const bar = page.getByRole("group", { name: "Habilidades especiales" });
      await expect(bar).toBeVisible();

      const boxes: { name: string; x: number; y: number; w: number; h: number }[] = [];
      for (const name of SKILLS) {
        const btn = skill(page, name);
        if (!(await btn.count())) continue;
        if (!(await btn.isVisible().catch(() => false))) continue;
        const b = await btn.boundingBox();
        if (b) boxes.push({ name, x: b.x, y: b.y, w: b.width, h: b.height });
      }

      // Sin solapes horizontales entre botones de la misma fila.
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const sameRow = Math.abs(a.y - b.y) < 10;
          if (!sameRow) continue;
          const gap = b.x > a.x ? b.x - (a.x + a.w) : a.x - (b.x + b.w);
          expect(
            gap,
            `${a.name} y ${b.name} se pisan en ${vp.width}x${vp.height}`,
          ).toBeGreaterThanOrEqual(4);
        }
      }

      // Ningún botón puede quedar recortado en altura.
      for (const b of boxes) {
        expect(b.h, `${b.name} aplastado en ${vp.width}`).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
