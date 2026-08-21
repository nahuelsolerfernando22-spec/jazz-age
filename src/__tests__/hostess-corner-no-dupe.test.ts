import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROUTES_DIR = join(process.cwd(), "src", "routes");

function readRoute(name: string): string {
  return readFileSync(join(ROUTES_DIR, name), "utf8");
}

const ROUTE_FILES = readdirSync(ROUTES_DIR).filter(
  (f) => f.endsWith(".tsx") && !f.startsWith("__"),
);

const HOSTESS_NPCS = [
  "bettie",
  "madge",
  "pilar",
  "eulalia",
  "jade",
  "zelda",
  "luciera",
  "daphne",
  "lola",
  "opal",
  "vita",
  "salome",
  "rosa",
];
const HOSTESS_ASSET_RE = new RegExp(
  `from\\s+["']@/assets/(?:${HOSTESS_NPCS.join("|")})[-_][^"']*\\.(?:webp|avif)["']`,
  "i",
);

// Rutas donde el retrato grande está declarado en un subcomponente que
// sólo se monta dentro de un wrapper desktop-only (p.ej. `desktop-rail
// hidden xl:block`), por lo que en móvil sólo se ve el medallón.
const DESKTOP_ONLY_SUBCOMPONENT_ROUTES = new Set(["chinchon.tsx"]);

function rendersOwnHostess(src: string): boolean {
  if (hasMobileVisiblePortrait(src)) return true;

  const importRe = new RegExp(
    `import\\s+(\\w+)\\s+from\\s+["']@/assets/(?:${HOSTESS_NPCS.join("|")})[-_][^"']*\\.(?:webp|avif)["']`,
    "gi",
  );
  const bindings: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(src))) bindings.push(m[1]);
  if (bindings.length === 0) return false;

  return bindings.some((name) => {
    const useRe = new RegExp(
      `(?:<img[^>]+src=\\{[^}]*\\b${name}\\b|\\b(?:portrait|src|image|imageUrl)\\s*=\\s*\\{[^}]*\\b${name}\\b)`,
    );
    return useRe.test(src);
  });
}

// El retrato grande sólo cuenta como "duplicado" si es visible en móvil.
// Las rutas actuales lo envuelven en `desktop-rail` o `hidden lg:block`,
// de modo que en móvil sólo se ve el medallón del corner.
function hasMobileVisiblePortrait(src: string): boolean {
  const cards = [...src.matchAll(/<\s*NpcPortraitCard[\s>]/g)];
  if (cards.length === 0) return false;
  return cards.some((m) => {
    const before = src.slice(Math.max(0, m.index! - 400), m.index!);
    const desktopOnly = /desktop-rail|hidden\s+(?:md|lg|xl):block/.test(before);
    return !desktopOnly;
  });
}

describe("SingleHostessCorner — regresión de duplicado", () => {
  it("ninguna ruta con retrato propio monta también el corner sin backdropOnly", () => {
    const offenders: string[] = [];
    for (const file of ROUTE_FILES) {
      const src = readRoute(file);
      const cornerCall = src.match(/useSingleHostessCorner\([^)]*\)/g);
      if (!cornerCall || !rendersOwnHostess(src)) continue;
      if (DESKTOP_ONLY_SUBCOMPONENT_ROUTES.has(file)) continue;
      for (const call of cornerCall) {
        if (!/backdropOnly\s*:\s*true/.test(call) && !/mobileOnly\s*:\s*true/.test(call)) {
          offenders.push(`${file} → ${call}`);
        }
      }
    }
    expect(offenders, `Rutas duplicando anfitriona:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("cada ruta llama al hook a lo sumo una vez por juego", () => {
    const dupes: string[] = [];
    for (const file of ROUTE_FILES) {
      const src = readRoute(file);
      const calls = src.match(/useSingleHostessCorner\(\s*"([^"]+)"/g) ?? [];
      const ids = calls.map((c) => c.match(/"([^"]+)"/)?.[1] ?? "");
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) dupes.push(`${file}: hook duplicado para "${id}"`);
        seen.add(id);
      }
    }
    expect(dupes, `Duplicados:\n${dupes.join("\n")}`).toEqual([]);
  });

  // Nota: la aserción "corner completo + NpcPortraitCard" quedó cubierta
  // por el primer caso arriba, que ya usa la heurística mobile-visible.
});
