import { describe, it, expect } from "vitest";
import { drawPresagio, PRESAGIOS } from "@/lib/huesos-presagios";

describe("presagios de generala", () => {
  it("siempre devuelve un presagio válido (hash sin signo)", () => {
    for (let i = 0; i < 5000; i++) {
      const p = drawPresagio(`g1:${1700000000000 + i * 137}`);
      expect(p, `semilla ${i}`).toBeDefined();
      expect(PRESAGIOS.some((x: { id: string }) => x.id === p.id)).toBe(true);
      expect(typeof p.title).toBe("string");
    }
  });

  it("cubre todos los presagios con semillas variadas", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) seen.add(drawPresagio(`s${i}`).id);
    expect(seen.size).toBe(PRESAGIOS.length);
  });
});
