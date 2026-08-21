import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SINGLE_GAMES } from "@/lib/single-games";

const ROUTES_DIR = join(process.cwd(), "src", "routes");

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("modo juego limpio", () => {
  const root = read("src/routes/__root.tsx");

  it("marca body[data-clean-game] cuando la ruta es una mesa", () => {
    expect(root).toMatch(/cleanGame|data-clean-game/);
    expect(root).toMatch(/isGameRoute\s*\(/);
  });

  it("no monta chrome opcional flotante dentro de las mesas", () => {
    const lines = root.split("\n");
    for (const comp of ["OfflineBadge", "OfflineReadyIndicator", "PwaPrompts", "MusicToggle"]) {
      const idxs = lines
        .map((l, i) => (new RegExp(`<\\s*${comp}\\b`).test(l) && !/^\s*import\b/.test(l) ? i : -1))
        .filter((i) => i >= 0);
      expect(idxs.length, `${comp} debería montarse al menos una vez`).toBeGreaterThan(0);
      for (const i of idxs) {
        const window = lines.slice(Math.max(0, i - 15), i + 2).join("\n");
        expect(window, `${comp} debe estar gateado por !inGame`).toMatch(/!inGame/);
      }
    }
  });

  it("styles.css oculta chrome secundario cuando body[data-clean-game]", () => {
    const css = read("src/styles.css");
    expect(css).toMatch(/body\[data-clean-game="1"\][^{]*\[data-secondary-chrome\]/);
    expect(css).toMatch(/body\[data-clean-game="1"\][^{]*\[data-cd-fab\]/);
  });

  it("GameSwitcherFab no está montado globalmente (solo definido)", () => {
    const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".tsx"));
    for (const f of files) {
      const src = readFileSync(join(ROUTES_DIR, f), "utf8");
      expect(src, `${f} no debe montar <GameSwitcherFab />`).not.toMatch(/<\s*GameSwitcherFab\b/);
    }
  });

  it("cada mesa monta su retrato de anfitriona en el layout del juego", () => {
    for (const g of SINGLE_GAMES) {
      // Los modos meta (mapa de conquista) no son mesas: no llevan anfitriona.
      if (g.category === "meta") continue;
      const routeFile = g.to.replace(/^\//, "") + ".tsx";
      const src = readFileSync(join(ROUTES_DIR, routeFile), "utf8");
      const hasPortrait =
        /<\s*NpcPortraitCard\b/.test(src) ||
        /useSingleHostessCorner\s*\(/.test(src) ||
        /HostessHudStrip\b/.test(src) ||
        /HostessMoodImage\b/.test(src);
      expect(hasPortrait, `${routeFile} debe mostrar el retrato de la anfitriona`).toBe(true);
    }
  });
});
