// Bagatelle engine — geometría, física constante, tablero, niveles.
// Todo pure/serializable, sin dependencias de React ni assets.

export const W = 100;
export const H = 160;
export const PLAYFIELD_BOTTOM = 154;
export const SLOT_LEFT = 10;
export const SLOT_RIGHT = 90;
export const BALL_R = 1.7;
export const FLIPPER_LEN = 15;
export const FLIPPER_HALF_THICK = 1.55;
export const FLIPPER_REST = 0.34;
export const FLIPPER_UP = -0.62;
export const FLIPPER_SPEED = 26;

export const FIXED_DT = 1 / 120;
export const MAX_FRAME_DT = 0.05;
export const MAX_PHYSICS_STEPS_PER_FRAME = 8;
export const PIVOT_L = { x: 37, y: 139 };
export const PIVOT_R = { x: 63, y: 139 };

export type BossId = "reina" | "corvina" | "cuervo";
export interface LevelMeta {
  level: number;
  name: string;
  gravityMul: number;
  curseBoost: number;
  jackpotBoost: number;
  ballHalo: string;
  ribbonTone: string;
  speedCap: number;
  bounceMul: number;
  eventFreqMul: number;
  magnetAvail: boolean;
  dropRewardMul: number;
  boss?: { id: BossId; name: string; rule: string };
}

export const LEVELS: LevelMeta[] = [
  {
    level: 1,
    name: "Iniciática",
    gravityMul: 1.0,
    curseBoost: 0.0,
    jackpotBoost: 0,
    ballHalo: "oklch(0.84 0.15 82 / 0.30)",
    ribbonTone: "oklch(0.72 0.10 75)",
    speedCap: 200,
    bounceMul: 1.0,
    eventFreqMul: 1.0,
    magnetAvail: false,
    dropRewardMul: 1.0,
  },
  {
    level: 2,
    name: "Bruma",
    gravityMul: 1.05,
    curseBoost: 0.1,
    jackpotBoost: 5,
    ballHalo: "oklch(0.82 0.16 70 / 0.32)",
    ribbonTone: "oklch(0.75 0.12 65)",
    speedCap: 210,
    bounceMul: 1.02,
    eventFreqMul: 1.05,
    magnetAvail: false,
    dropRewardMul: 1.1,
  },
  {
    level: 3,
    name: "La Reina",
    gravityMul: 1.1,
    curseBoost: 0.2,
    jackpotBoost: 15,
    ballHalo: "oklch(0.78 0.20 30 / 0.36)",
    ribbonTone: "oklch(0.55 0.18 25)",
    speedCap: 220,
    bounceMul: 1.04,
    eventFreqMul: 1.15,
    magnetAvail: true,
    dropRewardMul: 1.5,
    boss: {
      id: "reina",
      name: "La Reina de Copas",
      rule: "Maldiciones cuentan doble. Drop-bank paga 1.5×.",
    },
  },
  {
    level: 4,
    name: "Mercurio",
    gravityMul: 1.15,
    curseBoost: 0.15,
    jackpotBoost: 20,
    ballHalo: "oklch(0.86 0.10 210 / 0.34)",
    ribbonTone: "oklch(0.65 0.14 220)",
    speedCap: 225,
    bounceMul: 1.05,
    eventFreqMul: 1.15,
    magnetAvail: true,
    dropRewardMul: 1.2,
  },
  {
    level: 5,
    name: "Estaño",
    gravityMul: 1.2,
    curseBoost: 0.2,
    jackpotBoost: 30,
    ballHalo: "oklch(0.86 0.12 250 / 0.36)",
    ribbonTone: "oklch(0.60 0.15 260)",
    speedCap: 235,
    bounceMul: 1.07,
    eventFreqMul: 1.25,
    magnetAvail: true,
    dropRewardMul: 1.3,
  },
  {
    level: 6,
    name: "Corvina",
    gravityMul: 1.25,
    curseBoost: 0.3,
    jackpotBoost: 45,
    ballHalo: "oklch(0.55 0.20 320 / 0.40)",
    ribbonTone: "oklch(0.45 0.22 330)",
    speedCap: 245,
    bounceMul: 1.1,
    eventFreqMul: 1.35,
    magnetAvail: true,
    dropRewardMul: 2.0,
    boss: {
      id: "corvina",
      name: "Madame Corvina",
      rule: "Bola más pesada. Drop-bank paga 2×. Imán errático.",
    },
  },
  {
    level: 7,
    name: "Ámbar",
    gravityMul: 1.3,
    curseBoost: 0.25,
    jackpotBoost: 60,
    ballHalo: "oklch(0.85 0.18 60 / 0.40)",
    ribbonTone: "oklch(0.70 0.16 55)",
    speedCap: 255,
    bounceMul: 1.12,
    eventFreqMul: 1.45,
    magnetAvail: true,
    dropRewardMul: 1.6,
  },
  {
    level: 8,
    name: "Cobre",
    gravityMul: 1.35,
    curseBoost: 0.3,
    jackpotBoost: 80,
    ballHalo: "oklch(0.75 0.18 45 / 0.42)",
    ribbonTone: "oklch(0.60 0.18 40)",
    speedCap: 265,
    bounceMul: 1.14,
    eventFreqMul: 1.55,
    magnetAvail: true,
    dropRewardMul: 1.8,
  },
  {
    level: 9,
    name: "Cuervo",
    gravityMul: 1.42,
    curseBoost: 0.4,
    jackpotBoost: 110,
    ballHalo: "oklch(0.30 0.10 320 / 0.55)",
    ribbonTone: "oklch(0.32 0.14 320)",
    speedCap: 275,
    bounceMul: 1.18,
    eventFreqMul: 1.7,
    magnetAvail: true,
    dropRewardMul: 2.5,
    boss: {
      id: "cuervo",
      name: "El Cuervo Hambriento",
      rule: "Toda maldición te descuenta apuesta extra. Imán agresivo.",
    },
  },
  {
    level: 10,
    name: "Oro Sangre",
    gravityMul: 1.5,
    curseBoost: 0.5,
    jackpotBoost: 150,
    ballHalo: "oklch(0.95 0.20 82 / 0.55)",
    ribbonTone: "oklch(0.85 0.18 78)",
    speedCap: 285,
    bounceMul: 1.22,
    eventFreqMul: 1.9,
    magnetAvail: true,
    dropRewardMul: 3.0,
  },
];

export const LEVEL_KEY = "bagatelle:level:v2";
export const LEVEL_PROG_KEY = "bagatelle:levelprog:v2";
export const LEVEL_ADVANCE = 3;

export function synthLevelMeta(lv: number): LevelMeta {
  const base = LEVELS[(lv - 1) % LEVELS.length];
  const P = Math.floor((lv - 1) / LEVELS.length);
  const scale = 1 + P * 0.11;
  const isBoss = lv % 10 === 0;
  return {
    ...base,
    level: lv,
    name: `Vigilia · Ronda ${lv}`,
    gravityMul: Math.min(2.4, base.gravityMul * scale),
    curseBoost: Math.min(1.6, base.curseBoost + 0.08 * P),
    jackpotBoost: base.jackpotBoost + 50 * P,
    speedCap: Math.min(380, base.speedCap + 15 * P),
    bounceMul: Math.min(1.7, base.bounceMul + 0.03 * P),
    eventFreqMul: Math.min(3.5, base.eventFreqMul + 0.15 * P),
    dropRewardMul: Math.min(8, base.dropRewardMul + 0.35 * P),
    magnetAvail: true,
    boss: isBoss
      ? {
          id: "cuervo",
          name: `Vigilia · Escalón P.${P + 1}`,
          rule: `Ronda ${lv}: todo más rápido, más caro, más brillante. La casa dejó de sonreír.`,
        }
      : undefined,
  };
}

export const getLevelMeta = (lv: number): LevelMeta =>
  lv <= LEVELS.length ? LEVELS[Math.max(0, lv - 1)] : synthLevelMeta(lv);

export type WallKind = "rail" | "guide" | "sling-left" | "sling-right";
export interface Seg {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  kind: WallKind;
}

export type ObstacleKind = "peg" | "post" | "bumper" | "target" | "spinner" | "gong";
export interface Obstacle {
  x: number;
  y: number;
  r: number;
  kind: ObstacleKind;
  label?: string;
}

export const OBSTACLES: Obstacle[] = [
  { x: 21, y: 26, r: 1.8, kind: "post", label: "A" },
  { x: 50, y: 22, r: 1.8, kind: "post", label: "C" },
  { x: 79, y: 26, r: 1.8, kind: "post", label: "B" },

  { x: 28, y: 34, r: 4.8, kind: "bumper", label: "♠" },
  { x: 50, y: 34, r: 5.1, kind: "target", label: "★" },
  { x: 72, y: 34, r: 4.8, kind: "bumper", label: "♣" },
  { x: 35, y: 57, r: 4.7, kind: "bumper", label: "♥" },
  { x: 65, y: 57, r: 4.7, kind: "bumper", label: "♦" },
  { x: 50, y: 87, r: 5.6, kind: "target", label: "CUERVO" },

  { x: 22, y: 79, r: 2.6, kind: "spinner", label: "↻" },
  { x: 78, y: 79, r: 2.6, kind: "spinner", label: "↺" },

  { x: 50, y: 66, r: 2.9, kind: "gong", label: "☼" },

  ...[16, 24, 32, 42, 58, 68, 76, 84].map((x) => ({ x, y: 44, r: 1.1, kind: "peg" as const })),
  ...[20, 28, 36, 46, 54, 62, 72, 80].map((x) => ({ x, y: 51, r: 1.05, kind: "peg" as const })),
  ...[16, 32, 42, 58, 68, 84].map((x) => ({ x, y: 65, r: 1.15, kind: "peg" as const })),
  ...[28, 36, 46, 54, 62, 72].map((x) => ({ x, y: 72, r: 1.1, kind: "peg" as const })),
  ...[18, 26, 34, 42, 58, 66, 74, 82].map((x) => ({ x, y: 93, r: 1.15, kind: "peg" as const })),
  ...[22, 30, 38, 46, 54, 62, 70, 78].map((x) => ({ x, y: 100, r: 1.1, kind: "peg" as const })),
  ...[19, 27, 35, 43, 57, 65, 73, 81].map((x) => ({ x, y: 108, r: 1.2, kind: "peg" as const })),

  { x: 16, y: 116, r: 1.4, kind: "post" },
  { x: 84, y: 116, r: 1.4, kind: "post" },
  { x: 24, y: 123, r: 1.25, kind: "post" },
  { x: 76, y: 123, r: 1.25, kind: "post" },
  { x: 29, y: 129, r: 1.2, kind: "post" },
  { x: 71, y: 129, r: 1.2, kind: "post" },
];

export const WALLS: Seg[] = (() => {
  const walls: Seg[] = [];
  const cx = 52;
  const cy = 20;
  const rx = 42;
  const ry = 12;
  const n = 18;
  for (let i = 0; i < n; i += 1) {
    const t1 = Math.PI + (Math.PI * i) / n;
    const t2 = Math.PI + (Math.PI * (i + 1)) / n;
    walls.push({
      ax: cx + Math.cos(t1) * rx,
      ay: cy + Math.sin(t1) * ry,
      bx: cx + Math.cos(t2) * rx,
      by: cy + Math.sin(t2) * ry,
      kind: "rail",
    });
  }

  walls.push(
    { ax: 10, ay: 20, bx: 10, by: 122, kind: "rail" },
    { ax: 94, ay: 20, bx: 94, by: 148, kind: "rail" },
    { ax: 84, ay: 27, bx: 84, by: 123, kind: "rail" },
    { ax: 84, ay: 27, bx: 74, by: 41, kind: "guide" },
    { ax: 18, ay: 20, bx: 14, by: 38, kind: "guide" },
    { ax: 50, ay: 20, bx: 50, by: 35, kind: "guide" },
    { ax: 76, ay: 20, bx: 80, by: 38, kind: "guide" },
    { ax: 21, ay: 102, bx: 34, by: 118, kind: "sling-left" },
    { ax: 34, ay: 118, bx: 21, by: 128, kind: "sling-left" },
    { ax: 79, ay: 102, bx: 66, by: 118, kind: "sling-right" },
    { ax: 66, ay: 118, bx: 79, by: 128, kind: "sling-right" },
    { ax: 13, ay: 121, bx: 18, by: 151, kind: "guide" },
    { ax: 81, ay: 121, bx: 73, by: 151, kind: "guide" },
    { ax: 21, ay: 121, bx: 32, by: 140, kind: "guide" },
    { ax: 79, ay: 121, bx: 68, by: 140, kind: "guide" },
    { ax: 10, ay: 122, bx: 16, by: 151, kind: "rail" },
    // Piso del carril de lanzamiento: la bola nunca debe drenarse por el canal
    // del émbolo; rebota y el impulso del carril la devuelve al campo.
    { ax: 84, ay: 149, bx: 95, by: 149, kind: "rail" },
    { ax: 84, ay: 123, bx: 74, by: 151, kind: "rail" },
  );

  const rampL = { cx: 22, cy: 46, rx: 12, ry: 9 };
  for (let i = 0; i < 10; i += 1) {
    const t1 = Math.PI * 1.1 + (Math.PI * 0.55 * i) / 10;
    const t2 = Math.PI * 1.1 + (Math.PI * 0.55 * (i + 1)) / 10;
    walls.push({
      ax: rampL.cx + Math.cos(t1) * rampL.rx,
      ay: rampL.cy + Math.sin(t1) * rampL.ry,
      bx: rampL.cx + Math.cos(t2) * rampL.rx,
      by: rampL.cy + Math.sin(t2) * rampL.ry,
      kind: "guide",
    });
  }

  // El arco derecho debe quedar a la izquierda del carril de lanzamiento (x=84):
  // con cx 78 / rx 12 llegaba a x≈89 y bloqueaba la bola dentro del carril.
  const rampR = { cx: 72, cy: 46, rx: 11, ry: 9 };
  for (let i = 0; i < 10; i += 1) {
    const t1 = Math.PI * 1.35 + (Math.PI * 0.55 * i) / 10;
    const t2 = Math.PI * 1.35 + (Math.PI * 0.55 * (i + 1)) / 10;
    walls.push({
      ax: rampR.cx + Math.cos(t1) * rampR.rx,
      ay: rampR.cy + Math.sin(t1) * rampR.ry,
      bx: rampR.cx + Math.cos(t2) * rampR.rx,
      by: rampR.cy + Math.sin(t2) * rampR.ry,
      kind: "guide",
    });
  }

  const rampC = { cx: 50, cy: 76, rx: 8, ry: 3 };
  for (let i = 0; i < 8; i += 1) {
    const t1 = Math.PI + (Math.PI * i) / 8;
    const t2 = Math.PI + (Math.PI * (i + 1)) / 8;
    walls.push({
      ax: rampC.cx + Math.cos(t1) * rampC.rx,
      ay: rampC.cy + Math.sin(t1) * rampC.ry,
      bx: rampC.cx + Math.cos(t2) * rampC.rx,
      by: rampC.cy + Math.sin(t2) * rampC.ry,
      kind: "guide",
    });
  }

  return walls;
})();

export interface DropTarget {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}
export const DROP_TARGETS: DropTarget[] = [
  { x: 21, y: 41, w: 4.6, h: 2.2, label: "C" },
  { x: 30, y: 41, w: 4.6, h: 2.2, label: "U" },
  { x: 44, y: 44, w: 4.6, h: 2.2, label: "E" },
  { x: 58, y: 44, w: 4.6, h: 2.2, label: "R" },
  { x: 72, y: 41, w: 4.6, h: 2.2, label: "V" },
];

export const MAGNET = { x: 50, y: 20, r: 3.2, pullR: 34, pullForce: 46 };
export const MAGNET_TIME = 2.4;

export function closestOnSeg(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) return { x: ax, y: ay };
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return { x: ax + dx * t, y: ay + dy * t };
}
