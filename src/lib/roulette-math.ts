export const EURO_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

export const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export const N = EURO_ORDER.length;
export const SLOT_DEG = 360 / N;

export type Color = "red" | "black" | "green";
export const colorOf = (n: number): Color => (n === 0 ? "green" : REDS.has(n) ? "red" : "black");

export const ANNOUNCED_BETS = {
  voisins: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25] as readonly number[],
  tiers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33] as readonly number[],
  orphelins: [17, 34, 6, 1, 20, 14, 31, 9] as readonly number[],
  jeuZero: [12, 35, 3, 26, 0, 32, 15] as readonly number[],
} as const;

export function dailyHotNumber(day: number): number {
  let h = 2166136261 >>> 0;
  const s = `hotnumber:${day}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % N;
}

export function currentStreak(history: readonly number[]): { color: Color; len: number } | null {
  if (history.length === 0) return null;
  const first = colorOf(history[0]);
  if (first === "green") return null;
  let len = 1;
  for (let i = 1; i < history.length; i++) {
    if (colorOf(history[i]) === first) len++;
    else break;
  }
  return { color: first, len };
}

const mod360 = (a: number) => ((a % 360) + 360) % 360;

export function computeWheelTargetAngle(
  currentWheelAngle: number,
  n: number,
  baseSpinsTurns = 6,
): number {
  const idx = (EURO_ORDER as readonly number[]).indexOf(n);
  if (idx < 0) throw new Error(`number ${n} not in EURO_ORDER`);
  const targetMod = mod360(-idx * SLOT_DEG);
  const currentMod = mod360(currentWheelAngle);
  const delta = mod360(targetMod - currentMod);
  return currentWheelAngle + baseSpinsTurns * 360 + delta;
}

export function computeBallTargetAngle(currentBallAngle: number, ccwSpinsTurns = 9): number {
  const ballMod = mod360(currentBallAngle);
  return currentBallAngle - ccwSpinsTurns * 360 - ballMod;
}

export function numberUnderPointer(wheelAngle: number, ballAngle: number): number {
  const ballPos = mod360(ballAngle);

  const localAng = mod360(ballPos - wheelAngle);

  const idx = Math.round(localAng / SLOT_DEG) % N;
  return EURO_ORDER[(idx + N) % N];
}

export type BetKind =
  | { kind: "color"; color: "red" | "black" }
  | { kind: "parity"; even: boolean }
  | { kind: "highLow"; high: boolean }
  | { kind: "dozen"; idx: 1 | 2 | 3 }
  | { kind: "column"; idx: 1 | 2 | 3 }
  | { kind: "number"; n: number }
  | { kind: "combo"; combo: ComboKind; nums: number[] };

export function payoutFor(bet: BetKind, n: number, hotNumber?: number): number {
  switch (bet.kind) {
    case "color":
      return colorOf(n) === bet.color ? 2 : 0;
    case "parity":
      if (n === 0) return 0;
      return (n % 2 === 0) === bet.even ? 2 : 0;
    case "highLow":
      if (n === 0) return 0;
      return (bet.high ? n >= 19 : n <= 18) ? 2 : 0;
    case "dozen": {
      if (n === 0) return 0;
      const lo = (bet.idx - 1) * 12 + 1;
      const hi = bet.idx * 12;
      return n >= lo && n <= hi ? 3 : 0;
    }
    case "column": {
      if (n === 0) return 0;
      const r = n % 3;
      const match = bet.idx === 3 ? r === 0 : r === bet.idx;
      return match ? 3 : 0;
    }
    case "number":
      if (n !== bet.n) return 0;
      return hotNumber !== undefined && n === hotNumber ? 50 : 36;
    case "combo":
      return bet.nums.includes(n) ? COMBO_PAYOUT[bet.combo] : 0;
  }
}

/* ── Apuestas combinadas (split, calle, cuadro, línea) ─────────────────── */

export type ComboKind = "split" | "street" | "corner" | "line";

export const COMBO_PAYOUT: Record<ComboKind, number> = {
  split: 18,
  street: 12,
  corner: 9,
  line: 6,
};

export const COMBO_LABEL: Record<ComboKind, string> = {
  split: "Split",
  street: "Calle",
  corner: "Cuadro",
  line: "Línea",
};

/** Todos los grupos válidos del paño para un tipo de apuesta combinada. */
export function comboGroups(kind: ComboKind): number[][] {
  // r:1..3 fila (1 = fila alta del paño), c:0..11 columna. La fila 3 de la
  // primera columna es el 1, así que el desplazamiento es 4-r y nunca cae en 0.
  const cell = (r: number, c: number) => c * 3 + (4 - r);
  const out: number[][] = [];
  if (kind === "split") {
    for (let c = 0; c < 12; c++) {
      for (let r = 1; r <= 2; r++) out.push([cell(r, c), cell(r + 1, c)]);
    }
    for (let c = 0; c < 11; c++) {
      for (let r = 1; r <= 3; r++) out.push([cell(r, c), cell(r, c + 1)]);
    }
  } else if (kind === "street") {
    for (let c = 0; c < 12; c++) out.push([cell(1, c), cell(2, c), cell(3, c)]);
  } else if (kind === "corner") {
    for (let c = 0; c < 11; c++) {
      for (let r = 1; r <= 2; r++) {
        out.push([cell(r, c), cell(r + 1, c), cell(r, c + 1), cell(r + 1, c + 1)]);
      }
    }
  } else {
    for (let c = 0; c < 11; c++) {
      out.push([
        cell(1, c),
        cell(2, c),
        cell(3, c),
        cell(1, c + 1),
        cell(2, c + 1),
        cell(3, c + 1),
      ]);
    }
  }
  return out.map((g) => [...g].sort((a, b) => a - b));
}

export function comboLabel(kind: ComboKind, nums: readonly number[]): string {
  return `${COMBO_LABEL[kind]} ${nums.join("-")}`;
}
