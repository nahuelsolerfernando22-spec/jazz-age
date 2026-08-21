import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("ruleta.tsx assets — Clara canon", () => {
  const src = readFileSync(resolve(__dirname, "../routes/ruleta.tsx"), "utf8");

  it("importa el retrato canónico de Clara", () => {
    expect(src).toMatch(/clara-portrait\.webp/);
  });

  it("usa a Clara como anfitriona in-game", () => {
    expect(src).toMatch(/npcId="clara"/);
    expect(src).toMatch(/CLARA_MOOD\[mood\]/);
  });

  it("no contiene referencias legacy (Luciera/Vivienne)", () => {
    const lower = src.toLowerCase();
    expect(lower).not.toContain("vivienne");
    expect(lower).not.toContain("luciera");
    expect(lower).not.toContain("lucera");
  });
});
