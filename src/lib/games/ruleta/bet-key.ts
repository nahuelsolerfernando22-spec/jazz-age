import type { BetKind } from "@/lib/roulette-math";

export function betKey(k: BetKind): string {
  switch (k.kind) {
    case "color":
      return `c:${k.color}`;
    case "parity":
      return `p:${k.even ? "e" : "o"}`;
    case "highLow":
      return `h:${k.high ? "hi" : "lo"}`;
    case "dozen":
      return `d:${k.idx}`;
    case "column":
      return `col:${k.idx}`;
    case "number":
      return `n:${k.n}`;
    case "combo":
      return `cb:${k.combo}:${k.nums.join("-")}`;
  }
}
