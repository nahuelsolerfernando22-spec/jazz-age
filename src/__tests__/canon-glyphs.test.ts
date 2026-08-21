import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = ["✦", "✧", "✨", "🌟", "⭐", "🔮", "🪄"];

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", "__tests__"]);
const IGNORED_FILES = new Set(["routeTree.gen.ts", "canon-glyphs.test.ts"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (!IGNORED_DIRS.has(name)) walk(p, out);
    } else if (/\.(ts|tsx|css)$/.test(name) && !IGNORED_FILES.has(name)) {
      out.push(p);
    }
  }
  return out;
}

describe("canon glyphs", () => {
  it("no usa glifos con estética IA (sparkles, bola de cristal, varita)", () => {
    const files = walk("src");
    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const glyph of FORBIDDEN) {
        if (content.includes(glyph)) {
          offenders.push(`${file} contiene "${glyph}"`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
