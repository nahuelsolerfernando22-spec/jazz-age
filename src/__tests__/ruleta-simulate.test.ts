import { describe, it, expect } from "vitest";
import {
  ANNOUNCED_BETS,
  colorOf,
  computeBallTargetAngle,
  computeWheelTargetAngle,
  currentStreak,
  dailyHotNumber,
  EURO_ORDER,
  N,
  numberUnderPointer,
} from "@/lib/roulette-math";

function seededRng(seed: number) {
  let t = seed >>> 0 || 1;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

describe("ruleta · 100 giros", () => {
  it("numberUnderPointer coincide con el número apuntado por computeWheelTarget", () => {
    const rng = seededRng(0xabc123);
    const rejects: { n: number; got: number }[] = [];
    for (let i = 0; i < 100; i++) {
      const n = EURO_ORDER[Math.floor(rng() * N)];

      const wheel0 = (rng() - 0.5) * 720;
      const ball0 = (rng() - 0.5) * 720;
      const wheel1 = computeWheelTargetAngle(wheel0, n, 6);
      const ball1 = computeBallTargetAngle(ball0, 9);
      const under = numberUnderPointer(wheel1, ball1);
      if (under !== n) rejects.push({ n, got: under });
    }
    expect(rejects, "round-trip wheel/ball → número").toEqual([]);
  });

  it("historial: currentStreak nunca reporta racha inconsistente con colorOf", () => {
    const rng = seededRng(0xdeadf00d);
    const history: number[] = [];
    for (let i = 0; i < 100; i++) {
      const n = EURO_ORDER[Math.floor(rng() * N)];
      history.unshift(n);
      const st = currentStreak(history);
      if (!st) {
        expect(colorOf(history[0])).toBe("green");
        continue;
      }

      for (let k = 0; k < st.len; k++) {
        expect(colorOf(history[k])).toBe(st.color);
      }
      if (history.length > st.len) {
        expect(colorOf(history[st.len])).not.toBe(st.color);
      }
    }
  });

  it("apuestas anunciadas: números válidos, sin duplicados dentro del grupo", () => {
    for (const [name, arr] of Object.entries(ANNOUNCED_BETS)) {
      const set = new Set(arr);
      expect(set.size, `${name} sin duplicados`).toBe(arr.length);
      for (const n of arr) {
        expect((EURO_ORDER as readonly number[]).includes(n), `${name}: ${n} en la rueda`).toBe(
          true,
        );
      }
    }

    const cover = new Set<number>();
    let dupes = 0;
    for (const grp of [ANNOUNCED_BETS.voisins, ANNOUNCED_BETS.tiers, ANNOUNCED_BETS.orphelins]) {
      for (const n of grp) {
        if (cover.has(n)) dupes++;
        cover.add(n);
      }
    }
    expect(dupes, "voisins/tiers/orphelins disjuntos").toBe(0);
    expect(cover.size, "cubren los 37 números").toBe(N);
  });

  it("dailyHotNumber es determinista y siempre está en la rueda", () => {
    for (let day = 0; day < 100; day++) {
      const n = dailyHotNumber(day);
      expect((EURO_ORDER as readonly number[]).includes(n)).toBe(true);
      expect(dailyHotNumber(day)).toBe(n);
    }
  });
});
