import { rngFromSeed } from "@/lib/rng";
export type LevelShape =
  | "cuadrado"
  | "doble"
  | "diamante"
  | "piramide"
  | "dragon"
  | "calavera"
  | "fortaleza"
  | "torre"
  | "ala"
  | "coliseo"
  | "laberinto"
  | "gran-dragon"
  | "catedral"
  | "trono"
  | "cuervo"
  | "cripta"
  | "obelisco"
  | "zigurat"
  | "constelacion"
  | "abismo"
  | "corona"
  | "espejo"
  | "colmena"
  | "guillotina"
  | "muralla"
  | "reloj"
  | "arana"
  | "mascara"
  | "vortice"
  | "fin"
  | "espina"
  | "escalera"
  | "ojo"
  | "trebol"
  | "cuchilla"
  | "reloj-parado"
  | "corazon"
  | "sarcofago"
  | "puerta"
  | "nemesis"
  | "mariposa"
  | "rueda"
  | "serpiente";

export interface TilePos {
  x: number;
  y: number;
  z: number;
}

export interface SealConfig {
  count: number;
  strength: number;
}

export interface RotConfig {
  count: number;
  seconds: number;
}

export interface GateConfig {
  count: number;
  unlockAt: number;
}

export interface LevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  shape: LevelShape;
  positions: TilePos[];
  charTrios: number;
  specials: {
    bebidas: number;
    vicios: number;
    armas: number;
    tesoros: number;
    joyas?: number;
    suerte?: number;
    mascaras?: number;
    sombras?: number;
    reliquias?: number;
    pecados?: number;
  };
  starThresholds: [number, number, number];
  traySize?: number;
  reshuffleLimit?: number;
  seals?: SealConfig;
  rot?: RotConfig;
  gates?: GateConfig;
  timeLimit?: number;
  undoLimit?: number;
  matchSize?: 2 | 3 | 4;
  boss?: boolean;
  bossQuote?: string;
  practice?: boolean;
}

const rect = (out: TilePos[], xs: [number, number], ys: [number, number], z: number) => {
  for (let y = ys[0]; y < ys[1]; y++) for (let x = xs[0]; x < xs[1]; x++) out.push({ x, y, z });
};

function diamondLayer(d: number, z: number, ox = 0, oy = 0): TilePos[] {
  const out: TilePos[] = [];
  const r = (d - 1) / 2;
  for (let y = 0; y < d; y++) {
    for (let x = 0; x < d; x++) {
      if (Math.abs(x - r) + Math.abs(y - r) <= r) out.push({ x: x + ox, y: y + oy, z });
    }
  }
  return out;
}

function ensureEven(positions: TilePos[]): TilePos[] {
  if (positions.length % 2 === 1) positions.pop();
  return positions;
}

function ensureDivisible(positions: TilePos[], m: number): TilePos[] {
  if (m <= 1) return positions;
  const drop = positions.length % m;
  if (drop === 0) return positions;

  return positions.slice(0, positions.length - drop);
}

function buildPyramidSmall(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 6], [0, 5], 0);
  rect(out, [1, 5], [1, 4], 1);
  rect(out, [2, 4], [1, 3], 2);
  return ensureEven(out);
}

function buildTortugaDoble(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 9], [0, 5], 0);

  rect(out, [0, 4], [1, 4], 1);
  rect(out, [5, 9], [1, 4], 1);

  rect(out, [1, 3], [1, 3], 2);
  rect(out, [6, 8], [1, 3], 2);

  out.push({ x: 1, y: 1, z: 3 });
  out.push({ x: 7, y: 1, z: 3 });

  return ensureEven(out);
}

function buildDiamondStack(): TilePos[] {
  const out: TilePos[] = [];
  out.push(...diamondLayer(9, 0));
  out.push(...diamondLayer(7, 1, 1, 1));
  out.push(...diamondLayer(5, 2, 2, 2));
  out.push(...diamondLayer(3, 3, 3, 3));
  out.push({ x: 4, y: 4, z: 4 });
  return ensureEven(out);
}

function buildPyramidBig(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 8], [0, 6], 0);
  rect(out, [1, 7], [1, 5], 1);
  rect(out, [2, 6], [1, 5], 2);
  rect(out, [3, 5], [2, 4], 3);
  rect(out, [3, 5], [2, 3], 4);
  return ensureEven(out);
}

function buildDragonStack(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 13; x++) {
      if ((x === 0 || x === 12) && (y === 0 || y === 4)) continue;
      out.push({ x, y, z: 0 });
    }
  }

  for (let y = 1; y < 4; y++) for (let x = 2; x < 11; x++) out.push({ x, y, z: 1 });

  for (let y = 1; y < 3; y++) for (let x = 3; x < 10; x++) out.push({ x, y, z: 2 });

  for (let x = 4; x < 9; x++) out.push({ x, y: 1, z: 3 });

  for (let x = 5; x < 8; x++) out.push({ x, y: 1, z: 4 });

  return ensureEven(out);
}

function buildSkullStack(): TilePos[] {
  const map = [
    "0111111111110",
    "1111111111111",
    "1111111111111",
    "1111111111111",
    "1110111011101",
    "1111111111111",
    "1111111111111",
    "0111111111110",
    "0011111111100",
    "0101010101010",
  ];
  const out: TilePos[] = [];
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === "1") out.push({ x, y, z: 0 });
    }
  }

  for (let y = 1; y < 6; y++) for (let x = 2; x < 11; x++) out.push({ x, y, z: 1 });

  for (let y = 2; y < 5; y++) for (let x = 3; x < 10; x++) out.push({ x, y, z: 2 });

  for (let y = 2; y < 4; y++) for (let x = 5; x < 8; x++) out.push({ x, y, z: 3 });

  out.push({ x: 6, y: 2, z: 4 });
  return ensureEven(out);
}

function buildFortress(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 12], [0, 7], 0);
  rect(out, [1, 11], [1, 6], 1);
  rect(out, [2, 10], [1, 6], 2);
  rect(out, [3, 9], [2, 5], 3);
  rect(out, [4, 8], [2, 4], 4);
  return ensureEven(out);
}

function buildTower(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 10], [0, 6], 0);
  rect(out, [1, 9], [1, 5], 1);
  rect(out, [2, 8], [1, 5], 2);
  rect(out, [3, 7], [1, 5], 3);
  rect(out, [3, 7], [2, 4], 4);
  rect(out, [4, 6], [2, 4], 5);
  out.push({ x: 4, y: 2, z: 6 }, { x: 5, y: 2, z: 6 });
  return ensureEven(out);
}

function buildBrokenWing(): TilePos[] {
  const out: TilePos[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 15; x++) {
      if ((x === 0 || x === 14) && (y === 0 || y === 4)) continue;
      if (x === 7 && (y === 0 || y === 4)) continue;
      out.push({ x, y, z: 0 });
    }
  }
  for (let y = 1; y < 4; y++) for (let x = 1; x < 7; x++) out.push({ x, y, z: 1 });
  for (let y = 1; y < 4; y++) for (let x = 8; x < 14; x++) out.push({ x, y, z: 1 });
  for (let y = 2; y < 3; y++) for (let x = 2; x < 6; x++) out.push({ x, y, z: 2 });
  for (let y = 2; y < 3; y++) for (let x = 9; x < 13; x++) out.push({ x, y, z: 2 });
  return ensureEven(out);
}

function buildColiseo(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 14; x++) {
      const inRing = x < 2 || x > 11 || y < 2 || y > 6;
      if (inRing) out.push({ x, y, z: 0 });
    }
  }

  for (let y = 3; y < 6; y++) for (let x = 3; x < 11; x++) out.push({ x, y, z: 0 });

  for (let y = 2; y < 7; y++) {
    for (let x = 2; x < 12; x++) {
      const inner = x > 3 && x < 10 && y > 2 && y < 6;
      if (!inner) out.push({ x, y, z: 1 });
    }
  }

  const pillars: [number, number][] = [
    [2, 2],
    [11, 2],
    [2, 6],
    [11, 6],
  ];
  for (const [px, py] of pillars) {
    out.push({ x: px, y: py, z: 2 });
    out.push({ x: px, y: py, z: 3 });
    out.push({ x: px, y: py, z: 4 });
  }
  return ensureEven(out);
}

function buildLaberinto(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 3; y < 6; y++) for (let x = 0; x < 15; x++) out.push({ x, y, z: 0 });
  for (let x = 6; x < 9; x++)
    for (let y = 0; y < 9; y++) if (y < 3 || y > 5) out.push({ x, y, z: 0 });

  const islands: [number, number][][] = [
    [
      [1, 4],
      [2, 4],
      [1, 3],
      [2, 3],
    ],
    [
      [12, 4],
      [13, 4],
      [12, 5],
      [13, 5],
    ],
    [
      [7, 1],
      [7, 0],
      [6, 1],
      [8, 1],
    ],
    [
      [7, 7],
      [7, 8],
      [6, 7],
      [8, 7],
    ],
  ];
  for (const isl of islands) for (const [x, y] of isl) out.push({ x, y, z: 1 });

  for (let y = 3; y < 6; y++) for (let x = 6; x < 9; x++) out.push({ x, y, z: 2 });

  out.push({ x: 7, y: 4, z: 3 }, { x: 7, y: 4, z: 4 });
  return ensureEven(out);
}

function buildGranDragon(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 17; x++) {
      if ((x === 0 || x === 16) && (y === 0 || y === 5)) continue;
      out.push({ x, y, z: 0 });
    }
  }

  for (let y = 1; y < 5; y++) for (let x = 2; x < 15; x++) out.push({ x, y, z: 1 });

  for (let y = 2; y < 4; y++) for (let x = 4; x < 13; x++) out.push({ x, y, z: 2 });

  for (let x = 5; x < 12; x++) out.push({ x, y: 2, z: 3 });

  out.push({ x: 5, y: 2, z: 4 }, { x: 11, y: 2, z: 4 });

  out.push({ x: 8, y: 2, z: 4 }, { x: 8, y: 2, z: 5 });
  return ensureEven(out);
}

function buildCatedral(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 13], [0, 7], 0);

  rect(out, [1, 12], [1, 6], 1);

  rect(out, [3, 10], [2, 5], 2);
  rect(out, [4, 9], [2, 5], 3);

  rect(out, [5, 8], [3, 4], 4);

  for (let z = 1; z <= 6; z++) {
    out.push({ x: 0, y: 0, z });
    out.push({ x: 12, y: 6, z });
  }
  return ensureEven(out);
}

function buildTrono(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 16], [0, 9], 0);
  rect(out, [1, 15], [1, 8], 1);
  rect(out, [2, 14], [1, 8], 2);
  rect(out, [3, 13], [2, 7], 3);
  rect(out, [4, 12], [2, 7], 4);
  rect(out, [5, 11], [3, 6], 5);
  rect(out, [6, 10], [3, 6], 6);
  rect(out, [7, 9], [4, 5], 7);
  return ensureEven(out);
}

function buildCuervo(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 15], [0, 7], 0);

  rect(out, [0, 5], [1, 6], 1);

  rect(out, [10, 15], [1, 6], 1);

  rect(out, [6, 9], [1, 6], 1);

  rect(out, [6, 9], [2, 5], 2);

  rect(out, [6, 9], [3, 4], 3);

  out.push({ x: 7, y: 3, z: 4 });
  return ensureEven(out);
}

function buildCripta(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 6], [0, 6], 0);
  rect(out, [8, 14], [0, 6], 0);

  rect(out, [6, 8], [2, 4], 0);

  rect(out, [1, 5], [1, 5], 1);
  rect(out, [9, 13], [1, 5], 1);

  rect(out, [2, 4], [2, 4], 2);
  rect(out, [10, 12], [2, 4], 2);

  rect(out, [2, 4], [2, 4], 3);
  rect(out, [10, 12], [2, 4], 3);
  return ensureEven(out);
}

function buildObelisco(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 8], [0, 8], 0);
  rect(out, [1, 7], [1, 7], 1);
  rect(out, [1, 7], [1, 7], 2);
  rect(out, [2, 6], [2, 6], 3);
  rect(out, [2, 6], [2, 6], 4);
  rect(out, [3, 5], [3, 5], 5);
  rect(out, [3, 5], [3, 5], 6);
  out.push({ x: 3, y: 3, z: 7 }, { x: 4, y: 4, z: 7 });
  return ensureEven(out);
}

function buildZigurat(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 14], [0, 10], 0);
  rect(out, [1, 13], [1, 9], 1);
  rect(out, [2, 12], [1, 9], 2);
  rect(out, [3, 11], [2, 8], 3);
  rect(out, [4, 10], [2, 8], 4);
  rect(out, [5, 9], [3, 7], 5);
  rect(out, [6, 8], [3, 7], 6);
  rect(out, [6, 8], [4, 6], 7);
  return ensureEven(out);
}

function buildConstelacion(): TilePos[] {
  const out: TilePos[] = [];

  const islands: [number, number][] = [
    [0, 0],
    [6, 0],
    [12, 0],
    [0, 6],
    [6, 6],
    [12, 6],
  ];
  for (const [ox, oy] of islands) rect(out, [ox, ox + 3], [oy, oy + 3], 0);

  for (let y = 1; y <= 1; y++) {
    for (let x = 3; x < 6; x++) out.push({ x, y, z: 0 });
    for (let x = 9; x < 12; x++) out.push({ x, y, z: 0 });
    for (let x = 3; x < 6; x++) out.push({ x, y: y + 6, z: 0 });
    for (let x = 9; x < 12; x++) out.push({ x, y: y + 6, z: 0 });
  }

  for (let x = 1; x <= 1; x++) {
    for (let y = 3; y < 6; y++) out.push({ x, y, z: 0 });
    for (let y = 3; y < 6; y++) out.push({ x: x + 6, y, z: 0 });
    for (let y = 3; y < 6; y++) out.push({ x: x + 12, y, z: 0 });
  }

  for (const [ox, oy] of islands) {
    out.push({ x: ox + 1, y: oy + 1, z: 1 });
    out.push({ x: ox + 1, y: oy + 1, z: 2 });
  }

  out.push({ x: 7, y: 7, z: 3 }, { x: 7, y: 7, z: 4 });
  return ensureEven(out);
}

function buildAbismo(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 18], [0, 11], 0);
  rect(out, [1, 17], [1, 10], 1);
  rect(out, [2, 16], [1, 10], 2);
  rect(out, [3, 15], [2, 9], 3);
  rect(out, [4, 14], [2, 9], 4);
  rect(out, [5, 13], [3, 8], 5);
  rect(out, [6, 12], [3, 8], 6);
  rect(out, [7, 11], [4, 7], 7);
  rect(out, [8, 10], [4, 7], 8);
  out.push({ x: 8, y: 5, z: 9 }, { x: 9, y: 5, z: 9 });
  return ensureEven(out);
}

function buildCorona(): TilePos[] {
  const out: TilePos[] = [];
  for (let y = 0; y < 11; y++) {
    for (let x = 0; x < 16; x++) {
      const outer = x < 2 || x > 13 || y < 2 || y > 8;
      if (outer) out.push({ x, y, z: 0 });
    }
  }

  const towers: [number, number][] = [
    [0, 0],
    [15, 0],
    [0, 10],
    [15, 10],
  ];
  for (const [x, y] of towers) {
    for (let z = 1; z <= 5; z++) out.push({ x, y, z });
  }
  return ensureEven(out);
}

function buildEspejo(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 8], [0, 9], 0);
  rect(out, [1, 7], [1, 8], 1);
  rect(out, [2, 6], [2, 7], 2);
  rect(out, [3, 5], [3, 6], 3);

  rect(out, [10, 18], [1, 10], 0);
  rect(out, [11, 17], [2, 9], 1);
  rect(out, [12, 16], [3, 8], 2);
  rect(out, [13, 15], [4, 7], 3);

  out.push({ x: 8, y: 4, z: 0 }, { x: 9, y: 5, z: 0 }, { x: 8, y: 5, z: 0 }, { x: 9, y: 4, z: 0 });
  return ensureEven(out);
}

function buildColmena(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 0; y < 9; y++) {
    const start = y % 2;
    for (let x = start; x < 14; x += 1) out.push({ x, y, z: 0 });
  }

  for (let y = 1; y < 8; y += 2) for (let x = 2; x < 12; x += 2) out.push({ x, y, z: 1 });
  for (let y = 3; y < 6; y += 2) for (let x = 4; x < 10; x += 2) out.push({ x, y, z: 2 });

  out.push({ x: 6, y: 4, z: 3 }, { x: 7, y: 4, z: 3 });
  return ensureEven(out);
}

function buildGuillotina(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 18], [0, 5], 0);

  for (let z = 1; z <= 6; z++) out.push({ x: 0, y: 0, z }, { x: 0, y: 4, z });

  for (let z = 1; z <= 6; z++) out.push({ x: 17, y: 0, z }, { x: 17, y: 4, z });

  for (let x = 1; x < 17; x++) out.push({ x, y: 2, z: 6 });

  rect(out, [4, 14], [1, 4], 1);
  rect(out, [6, 12], [2, 3], 2);
  return ensureEven(out);
}

function buildMuralla(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 20], [0, 8], 0);
  rect(out, [1, 19], [1, 7], 1);
  rect(out, [2, 18], [1, 7], 2);
  rect(out, [3, 17], [2, 6], 3);
  rect(out, [4, 16], [2, 6], 4);
  rect(out, [6, 14], [3, 5], 5);
  rect(out, [8, 12], [3, 5], 6);
  return ensureEven(out);
}

function buildReloj(): TilePos[] {
  const out: TilePos[] = [];

  out.push(...diamondLayer(11, 0));

  out.push(...diamondLayer(9, 1, 1, 1));

  out.push(...diamondLayer(5, 2, 3, 3));
  out.push(...diamondLayer(3, 3, 4, 4));
  out.push({ x: 5, y: 5, z: 4 }, { x: 5, y: 5, z: 5 });
  return ensureEven(out);
}

function buildArana(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [6, 10], [4, 8], 0);
  rect(out, [6, 10], [4, 8], 1);
  rect(out, [7, 9], [5, 7], 2);
  out.push({ x: 7, y: 5, z: 3 }, { x: 8, y: 6, z: 3 });

  const patas: [number, number][][] = [
    [
      [0, 5],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
    ],
    [
      [0, 6],
      [1, 6],
      [2, 6],
      [3, 6],
      [4, 6],
    ],
    [
      [11, 5],
      [12, 5],
      [13, 5],
      [14, 5],
      [15, 5],
    ],
    [
      [11, 6],
      [12, 6],
      [13, 6],
      [14, 6],
      [15, 6],
    ],
    [
      [6, 0],
      [6, 1],
      [6, 2],
      [6, 3],
    ],
    [
      [9, 0],
      [9, 1],
      [9, 2],
      [9, 3],
    ],
    [
      [6, 8],
      [6, 9],
      [6, 10],
      [6, 11],
    ],
    [
      [9, 8],
      [9, 9],
      [9, 10],
      [9, 11],
    ],
  ];
  for (const pata of patas) for (const [x, y] of pata) out.push({ x, y, z: 0 });
  return ensureEven(out);
}

function buildMascara(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 15; x++) {
      const leftEye = x >= 3 && x <= 5 && y >= 2 && y <= 3;
      const rightEye = x >= 9 && x <= 11 && y >= 2 && y <= 3;
      if (leftEye || rightEye) continue;
      out.push({ x, y, z: 0 });
    }
  }

  rect(out, [2, 13], [0, 2], 1);

  rect(out, [1, 5], [4, 6], 1);
  rect(out, [10, 14], [4, 6], 1);

  for (let z = 1; z <= 5; z++) {
    out.push({ x: 7, y: 4, z });
    out.push({ x: 7, y: 5, z });
  }

  for (let x = 5; x < 10; x++) out.push({ x, y: 0, z: 2 });
  return ensureEven(out);
}

function buildVortice(): TilePos[] {
  const out: TilePos[] = [];

  out.push(...diamondLayer(13, 0));
  out.push(...diamondLayer(11, 1, 1, 1));
  out.push(...diamondLayer(9, 2, 2, 2));
  out.push(...diamondLayer(7, 3, 3, 3));
  out.push(...diamondLayer(5, 4, 4, 4));
  out.push(...diamondLayer(3, 5, 5, 5));
  out.push({ x: 6, y: 6, z: 6 });
  return ensureEven(out);
}

function buildFin(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 22], [0, 11], 0);
  rect(out, [1, 21], [1, 10], 1);
  rect(out, [2, 20], [1, 10], 2);
  rect(out, [3, 19], [2, 9], 3);
  rect(out, [4, 18], [2, 9], 4);
  rect(out, [6, 16], [3, 8], 5);
  rect(out, [7, 15], [3, 8], 6);
  rect(out, [9, 13], [4, 7], 7);
  rect(out, [10, 12], [4, 7], 8);
  out.push({ x: 10, y: 5, z: 9 }, { x: 11, y: 5, z: 9 });
  out.push({ x: 10, y: 5, z: 10 });
  return ensureEven(out);
}

function buildEspina(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 7], [0, 9], 0);
  rect(out, [1, 6], [1, 8], 1);
  rect(out, [2, 5], [1, 8], 2);
  rect(out, [3, 4], [2, 7], 3);

  rect(out, [9, 16], [0, 9], 0);
  rect(out, [10, 15], [1, 8], 1);
  rect(out, [11, 14], [1, 8], 2);
  rect(out, [12, 13], [2, 7], 3);

  rect(out, [7, 9], [3, 6], 0);
  return ensureEven(out);
}

function buildEscalera(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 16; x++) {
      if (x >= 7 && x <= 8 && y >= 3 && y <= 4) continue;
      out.push({ x, y, z: 0 });
    }

  for (let y = 1; y < 7; y++)
    for (let x = 2; x < 14; x++) {
      if (x >= 6 && x <= 9 && y >= 2 && y <= 4) continue;
      out.push({ x, y, z: 1 });
    }

  rect(out, [4, 12], [2, 6], 2);

  rect(out, [6, 10], [3, 5], 3);
  return ensureEven(out);
}

function buildOjo(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 13; x++) {
      const dx = x - 6,
        dy = y - 6;
      const r2 = dx * dx + dy * dy;
      if (r2 <= 36 && r2 >= 20) out.push({ x, y, z: 0 });
    }
  }

  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 13; x++) {
      const dx = x - 6,
        dy = y - 6;
      const r2 = dx * dx + dy * dy;
      if (r2 <= 12) out.push({ x, y, z: 1 });
    }
  }

  rect(out, [5, 8], [5, 8], 2);
  rect(out, [5, 8], [5, 8], 3);
  out.push({ x: 6, y: 6, z: 4 }, { x: 6, y: 6, z: 5 });
  return ensureEven(out);
}

function buildTrebol(): TilePos[] {
  const out: TilePos[] = [];

  const petals: [number, number][] = [
    [0, 0],
    [11, 0],
    [0, 7],
    [11, 7],
  ];
  for (const [ox, oy] of petals) {
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const cornerX = ox === 0 ? x : 3 - x;
        const cornerY = oy === 0 ? y : 3 - y;
        if (cornerX + cornerY === 0) continue;
        out.push({ x: ox + x, y: oy + y, z: 0 });
      }

    for (let y = 1; y < 3; y++)
      for (let x = 1; x < 3; x++) out.push({ x: ox + x, y: oy + y, z: 1 });
  }

  rect(out, [5, 10], [4, 7], 0);
  rect(out, [6, 9], [4, 7], 1);
  rect(out, [6, 9], [5, 6], 2);
  out.push({ x: 7, y: 5, z: 3 });
  return ensureEven(out);
}

function buildCuchilla(): TilePos[] {
  const out: TilePos[] = [];

  rect(out, [0, 20], [0, 6], 0);
  rect(out, [2, 18], [1, 5], 1);
  rect(out, [4, 16], [1, 5], 2);

  for (let z = 1; z <= 5; z++) {
    out.push({ x: 0, y: 0, z }, { x: 0, y: 5, z });
    out.push({ x: 19, y: 0, z }, { x: 19, y: 5, z });
  }

  for (let x = 1; x < 19; x++) out.push({ x, y: 2, z: 5 }, { x, y: 3, z: 5 });
  return ensureEven(out);
}

function buildRelojParado(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 4; y < 7; y++) for (let x = 0; x < 11; x++) out.push({ x, y, z: 0 });
  for (let x = 4; x < 7; x++)
    for (let y = 0; y < 11; y++) if (y < 4 || y > 6) out.push({ x, y, z: 0 });

  for (let y = 3; y < 8; y++)
    for (let x = 3; x < 8; x++) {
      const dx = x - 5,
        dy = y - 5;
      if (dx * dx + dy * dy <= 4) out.push({ x, y, z: 1 });
    }

  rect(out, [4, 7], [4, 7], 2);
  rect(out, [4, 7], [4, 7], 3);
  out.push({ x: 5, y: 5, z: 4 });
  return ensureEven(out);
}

function buildCorazon(): TilePos[] {
  const out: TilePos[] = [];

  for (let y = 0; y < 11; y++) {
    for (let x = 0; x < 11; x++) {
      const dist = Math.abs(x - 5) + Math.abs(y - 5);
      if (dist > 5) continue;
      if (x === 5 && (y === 4 || y === 5 || y === 6)) continue;
      out.push({ x, y, z: 0 });
    }
  }

  for (let y = 1; y < 4; y++) for (let x = 2; x < 5; x++) out.push({ x, y, z: 1 });
  for (let y = 1; y < 4; y++) for (let x = 6; x < 9; x++) out.push({ x, y, z: 1 });

  rect(out, [4, 7], [6, 9], 1);
  rect(out, [4, 7], [7, 9], 2);
  out.push({ x: 5, y: 8, z: 3 });
  return ensureEven(out);
}

function buildSarcofago(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 18], [0, 6], 0);
  rect(out, [1, 17], [1, 5], 1);
  rect(out, [2, 16], [1, 5], 2);
  rect(out, [4, 14], [2, 4], 3);
  rect(out, [6, 12], [2, 4], 4);
  rect(out, [8, 10], [2, 4], 5);
  return ensureEven(out);
}

function buildPuerta(): TilePos[] {
  const out: TilePos[] = [];

  for (let z = 0; z <= 6; z++)
    for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) out.push({ x, y, z });

  for (let z = 0; z <= 6; z++)
    for (let y = 0; y < 4; y++) for (let x = 11; x < 14; x++) out.push({ x, y, z });

  for (let y = 0; y < 4; y++) for (let x = 3; x < 11; x++) out.push({ x, y, z: 0 });
  rect(out, [4, 10], [0, 4], 1);
  rect(out, [5, 9], [1, 3], 2);
  out.push({ x: 6, y: 1, z: 3 }, { x: 7, y: 2, z: 3 });
  return ensureEven(out);
}

function buildNemesis(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 24], [0, 12], 0);
  rect(out, [1, 23], [1, 11], 1);
  rect(out, [2, 22], [1, 11], 2);
  rect(out, [3, 21], [2, 10], 3);
  rect(out, [4, 20], [2, 10], 4);
  rect(out, [6, 18], [3, 9], 5);
  rect(out, [7, 17], [3, 9], 6);
  rect(out, [9, 15], [4, 8], 7);
  rect(out, [10, 14], [4, 8], 8);
  rect(out, [11, 13], [5, 7], 9);
  out.push({ x: 11, y: 5, z: 10 }, { x: 12, y: 5, z: 10 });
  return ensureEven(out);
}

function makeStarThresholds(
  charTrios: number,
  specials: number,
  matchSize: number,
): [number, number, number] {
  const mult = matchSize === 4 ? 2.2 : matchSize === 3 ? 1.5 : 1;
  const base = (charTrios * 30 + specials * 60) * mult;
  return [Math.round(base * 0.55), Math.round(base * 0.85), Math.round(base * 1.15)];
}

function build(
  id: string,
  order: number,
  title: string,
  subtitle: string,
  shape: LevelShape,
  positions: TilePos[],
  specials: LevelDef["specials"],
  extras: {
    traySize?: number;
    reshuffleLimit?: number;
    seals?: SealConfig;
    matchSize?: 2 | 3 | 4;
    rot?: RotConfig;
    gates?: GateConfig;
    timeLimit?: number;
    undoLimit?: number;
    boss?: boolean;
    bossQuote?: string;
    practice?: boolean;
  } = {},
): LevelDef {
  const matchSize = extras.matchSize ?? 2;
  const trimmed = ensureDivisible(positions, matchSize);
  const totalSpecials =
    specials.bebidas +
    specials.vicios +
    specials.armas +
    specials.tesoros +
    (specials.joyas ?? 0) +
    (specials.suerte ?? 0) +
    (specials.mascaras ?? 0) +
    (specials.sombras ?? 0) +
    (specials.reliquias ?? 0) +
    (specials.pecados ?? 0);
  const charTrios = trimmed.length / matchSize - totalSpecials;
  if (!Number.isInteger(charTrios) || charTrios < 0) {
    throw new Error(
      `Nivel ${id} inválido: posiciones=${trimmed.length} specials=${totalSpecials} matchSize=${matchSize}`,
    );
  }

  const trayFloor = matchSize + 1;
  const traySize = Math.max(trayFloor, extras.traySize ?? 4);
  return {
    id,
    order,
    title,
    subtitle,
    shape,
    positions: trimmed,
    charTrios,
    specials,
    starThresholds: makeStarThresholds(charTrios, totalSpecials, matchSize),
    reshuffleLimit: extras.reshuffleLimit,
    seals: extras.seals,
    rot: extras.rot,
    gates: extras.gates,
    timeLimit: extras.timeLimit,
    undoLimit: extras.undoLimit ?? 3,
    traySize,
    matchSize,
    boss: extras.boss,
    bossQuote: extras.bossQuote,
    practice: extras.practice,
  };
}

function buildMariposa(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 5], [0, 4], 0);
  rect(out, [6, 11], [0, 4], 0);
  out.push({ x: 5, y: 1, z: 0 }, { x: 5, y: 2, z: 0 });
  rect(out, [1, 4], [1, 3], 1);
  rect(out, [7, 10], [1, 3], 1);
  return ensureEven(out);
}

function buildRueda(): TilePos[] {
  const out: TilePos[] = [];
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const inCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      if (!inCenter) out.push({ x, y, z: 0 });
    }
  }
  return ensureEven(out);
}

function buildSerpiente(): TilePos[] {
  const out: TilePos[] = [];
  rect(out, [0, 8], [0, 1], 0);
  rect(out, [0, 8], [2, 3], 0);
  rect(out, [0, 8], [4, 5], 0);
  out.push({ x: 7, y: 1, z: 0 }, { x: 0, y: 3, z: 0 });
  out.push({ x: 3, y: 2, z: 1 }, { x: 4, y: 2, z: 1 });
  return ensureEven(out);
}

export const LEVELS: LevelDef[] = [
  build(
    "l1",
    1,
    "Mesa de Iniciación",
    "46 fichas · 3 capas",
    "cuadrado",
    buildPyramidSmall(),
    {
      bebidas: 1,
      vicios: 0,
      armas: 0,
      tesoros: 0,
    },
    { undoLimit: 3, timeLimit: 300 },
  ),
  build(
    "l2",
    2,
    "Tortuga Doble",
    "78 fichas · 3 sellos · 5 mezclas",
    "doble",
    buildTortugaDoble(),
    { bebidas: 1, vicios: 1, armas: 0, tesoros: 0 },
    { reshuffleLimit: 5, seals: { count: 3, strength: 3 }, undoLimit: 3, timeLimit: 330 },
  ),
  build(
    "l3",
    3,
    "Diamante del Crupier",
    "84 fichas · 6 sellos · 90 s",
    "diamante",
    buildDiamondStack(),
    { bebidas: 1, vicios: 1, armas: 0, tesoros: 0 },
    { reshuffleLimit: 4, seals: { count: 6, strength: 4 }, undoLimit: 3, timeLimit: 240 },
  ),
  build(
    "l4",
    4,
    "Pirámide del Cuervo",
    "tríos · 8 sellos · reloj 4′",
    "piramide",
    buildPyramidBig(),
    { bebidas: 1, vicios: 1, armas: 1, tesoros: 0 },
    {
      reshuffleLimit: 3,
      seals: { count: 8, strength: 4 },
      matchSize: 3,
      undoLimit: 3,
      timeLimit: 240,
    },
  ),
  build(
    "l5",
    5,
    "Dragón Carmesí",
    "tríos · 12 sellos · reloj 5′",
    "dragon",
    buildDragonStack(),
    { bebidas: 1, vicios: 1, armas: 1, tesoros: 0 },
    {
      reshuffleLimit: 3,
      seals: { count: 12, strength: 5 },
      matchSize: 3,
      undoLimit: 2,
      timeLimit: 300,
    },
  ),
  build(
    "l6",
    6,
    "Calavera de la Casa",
    "tríos · 18 sellos · reloj 5′ · 3 podridas",
    "calavera",
    buildSkullStack(),
    { bebidas: 1, vicios: 1, armas: 1, tesoros: 1 },
    {
      reshuffleLimit: 2,
      seals: { count: 18, strength: 6 },
      matchSize: 3,
      undoLimit: 2,
      timeLimit: 300,
      rot: { count: 3, seconds: 22 },
    },
  ),
  build(
    "l7",
    7,
    "Fortaleza del Ala Negra",
    "tríos · 22 sellos · reloj 6′ · 4 podridas",
    "fortaleza",
    buildFortress(),
    { bebidas: 1, vicios: 1, armas: 1, tesoros: 1 },
    {
      reshuffleLimit: 2,
      seals: { count: 22, strength: 6 },
      matchSize: 3,
      undoLimit: 2,
      timeLimit: 360,
      rot: { count: 4, seconds: 20 },
    },
  ),
  build(
    "l8",
    8,
    "Torre del Cuervo",
    "cuartetos · 24 sellos · reloj 7′ · 4 podridas",
    "torre",
    buildTower(),
    { bebidas: 1, vicios: 1, armas: 1, tesoros: 1 },
    {
      reshuffleLimit: 1,
      seals: { count: 24, strength: 7 },
      matchSize: 4,
      undoLimit: 2,
      timeLimit: 420,
      rot: { count: 4, seconds: 20 },
    },
  ),
  build(
    "l9",
    9,
    "Ala Rota",
    "cuartetos · 28 sellos · reloj 7′ · 5 podridas",
    "ala",
    buildBrokenWing(),
    { bebidas: 1, vicios: 1, armas: 1, tesoros: 1 },
    {
      reshuffleLimit: 1,
      seals: { count: 28, strength: 8 },
      matchSize: 4,
      undoLimit: 2,
      timeLimit: 420,
      rot: { count: 5, seconds: 18 },
    },
  ),
  build(
    "l10",
    10,
    "Coliseo del Cuervo",
    "cuartetos · 26 sellos · reloj 8′ · 6 podridas",
    "coliseo",
    buildColiseo(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2 },
    {
      reshuffleLimit: 2,
      seals: { count: 26, strength: 6 },
      matchSize: 4,
      undoLimit: 2,
      timeLimit: 480,
      rot: { count: 6, seconds: 18 },
    },
  ),
  build(
    "l11",
    11,
    "Laberinto de Marfil",
    "cuartetos · 24 sellos · reloj 7′ · 6 podridas",
    "laberinto",
    buildLaberinto(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2 },
    {
      reshuffleLimit: 1,
      seals: { count: 24, strength: 8 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 420,
      rot: { count: 6, seconds: 16 },
    },
  ),
  build(
    "l12",
    12,
    "Gran Dragón",
    "cuartetos · 32 sellos · reloj 9′ · 7 podridas",
    "gran-dragon",
    buildGranDragon(),
    { bebidas: 2, vicios: 2, armas: 3, tesoros: 3 },
    {
      reshuffleLimit: 1,
      seals: { count: 32, strength: 9 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 540,
      rot: { count: 7, seconds: 16 },
    },
  ),
  build(
    "l13",
    13,
    "Catedral del Silencio",
    "cuartetos · 34 sellos · sin mezclas · reloj 9′",
    "catedral",
    buildCatedral(),
    { bebidas: 3, vicios: 3, armas: 3, tesoros: 3 },
    {
      reshuffleLimit: 0,
      seals: { count: 34, strength: 9 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 540,
      rot: { count: 8, seconds: 14 },
    },
  ),
  build(
    "l14",
    14,
    "Trono del Cuervo",
    "cuartetos · 44 sellos · reloj 12′ · 10 podridas",
    "trono",
    buildTrono(),
    { bebidas: 4, vicios: 4, armas: 4, tesoros: 4 },
    {
      reshuffleLimit: 0,
      seals: { count: 44, strength: 10 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 720,
      rot: { count: 10, seconds: 14 },
    },
  ),
  build(
    "l15",
    15,
    "Cuervo Real",
    "cuartetos · 30 sellos · 3 hojas · 8 podridas · reloj 8′",
    "cuervo",
    buildCuervo(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2, joyas: 2, suerte: 2 },
    {
      reshuffleLimit: 1,
      seals: { count: 30, strength: 8 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 480,
      rot: { count: 8, seconds: 14 },
    },
  ),
  build(
    "l16",
    16,
    "Cripta de Marfil",
    "cuartetos · 34 sellos · 10 podridas · reloj 9′",
    "cripta",
    buildCripta(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2, joyas: 3, suerte: 3 },
    {
      reshuffleLimit: 1,
      seals: { count: 34, strength: 9 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 540,
      rot: { count: 10, seconds: 13 },
    },
  ),
  build(
    "l17",
    17,
    "Obelisco Rojo",
    "cuartetos · 38 sellos · 10 podridas · reloj 10′",
    "obelisco",
    buildObelisco(),
    { bebidas: 2, vicios: 2, armas: 3, tesoros: 3, joyas: 3, suerte: 3 },
    {
      reshuffleLimit: 1,
      seals: { count: 38, strength: 9 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 600,
      rot: { count: 10, seconds: 12 },
    },
  ),
  build(
    "l18",
    18,
    "Zigurat del Cuervo",
    "cuartetos · 42 sellos · sin mezclas · 12 podridas · reloj 11′",
    "zigurat",
    buildZigurat(),
    { bebidas: 3, vicios: 3, armas: 3, tesoros: 3, joyas: 4, suerte: 4 },
    {
      reshuffleLimit: 0,
      seals: { count: 42, strength: 10 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 660,
      rot: { count: 12, seconds: 12 },
    },
  ),
  build(
    "l19",
    19,
    "Constelación Negra",
    "cuartetos · 40 sellos · 12 podridas · reloj 10′ · 0 undo",
    "constelacion",
    buildConstelacion(),
    { bebidas: 3, vicios: 3, armas: 3, tesoros: 3, joyas: 4, suerte: 4 },
    {
      reshuffleLimit: 0,
      seals: { count: 40, strength: 10 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 600,
      rot: { count: 12, seconds: 11 },
    },
  ),
  build(
    "l20",
    20,
    "Abismo del Cuervo",
    "cuartetos · 60 sellos · sin undo · reloj 15′ · 15 podridas",
    "abismo",
    buildAbismo(),
    { bebidas: 4, vicios: 4, armas: 4, tesoros: 4, joyas: 5, suerte: 5 },
    {
      reshuffleLimit: 0,
      seals: { count: 60, strength: 12 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 900,
      rot: { count: 15, seconds: 10 },
    },
  ),

  build(
    "l21",
    21,
    "Corona del Cuervo",
    "cuartetos · 4 torretas · 40 sellos · reloj 10′",
    "corona",
    buildCorona(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2, joyas: 2, suerte: 2, mascaras: 2, sombras: 2 },
    {
      reshuffleLimit: 1,
      seals: { count: 40, strength: 10 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 600,
      rot: { count: 10, seconds: 12 },
    },
  ),
  build(
    "l22",
    22,
    "Espejo Roto",
    "cuartetos · dos mitades desalineadas · reloj 10′",
    "espejo",
    buildEspejo(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2, joyas: 2, suerte: 2, mascaras: 3, sombras: 3 },
    {
      reshuffleLimit: 0,
      seals: { count: 44, strength: 11 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 600,
      rot: { count: 12, seconds: 11 },
    },
  ),
  build(
    "l23",
    23,
    "Colmena de Marfil",
    "cuartetos · patrón hexagonal · 14 podridas · reloj 9′",
    "colmena",
    buildColmena(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2, joyas: 2, suerte: 2, mascaras: 3, sombras: 3 },
    {
      reshuffleLimit: 0,
      seals: { count: 42, strength: 11 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 540,
      rot: { count: 14, seconds: 11 },
    },
  ),
  build(
    "l24",
    24,
    "Guillotina del Cuervo",
    "cuartetos · hoja apilada · 12 podridas · reloj 10′",
    "guillotina",
    buildGuillotina(),
    { bebidas: 2, vicios: 2, armas: 3, tesoros: 3, joyas: 2, suerte: 2, mascaras: 3, sombras: 3 },
    {
      reshuffleLimit: 0,
      seals: { count: 48, strength: 12 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 600,
      rot: { count: 12, seconds: 10 },
    },
  ),

  build(
    "l25",
    25,
    "🞮 Muralla del Cuervo 🞮",
    "JEFE · muro macizo · bandeja de 3 · sin mezclas · sin undo · reloj 12′",
    "muralla",
    buildMuralla(),
    { bebidas: 3, vicios: 3, armas: 3, tesoros: 3, joyas: 3, suerte: 3, mascaras: 4, sombras: 4 },
    {
      reshuffleLimit: 0,
      seals: { count: 55, strength: 13 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 720,
      rot: { count: 18, seconds: 9 },
      traySize: 5,
      boss: true,
      bossQuote: "«No pasa nadie sin dejar algo en la casa.»",
    },
  ),
  build(
    "l26",
    26,
    "Reloj Roto",
    "cuartetos · reloj interno acelerado · 15 podridas · reloj 8′",
    "reloj",
    buildReloj(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2, joyas: 3, suerte: 3, mascaras: 2, sombras: 2 },
    {
      reshuffleLimit: 0,
      seals: { count: 40, strength: 10 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 480,
      rot: { count: 15, seconds: 9 },
    },
  ),
  build(
    "l27",
    27,
    "Araña Deco",
    "cuartetos · 8 patas · 16 podridas · reloj 9′",
    "arana",
    buildArana(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2, joyas: 2, suerte: 2, mascaras: 2, sombras: 2 },
    {
      reshuffleLimit: 0,
      seals: { count: 46, strength: 11 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 540,
      rot: { count: 16, seconds: 9 },
    },
  ),
  build(
    "l28",
    28,
    "Máscara del Cuervo",
    "cuartetos · huecos + pico · 18 podridas · reloj 10′",
    "mascara",
    buildMascara(),
    { bebidas: 2, vicios: 2, armas: 2, tesoros: 2, joyas: 3, suerte: 3, mascaras: 4, sombras: 4 },
    {
      reshuffleLimit: 0,
      seals: { count: 50, strength: 12 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 600,
      rot: { count: 18, seconds: 8 },
    },
  ),
  build(
    "l29",
    29,
    "Vórtice Deco",
    "cuartetos · anillos concéntricos · 20 podridas · reloj 10′",
    "vortice",
    buildVortice(),
    { bebidas: 2, vicios: 2, armas: 3, tesoros: 3, joyas: 3, suerte: 3, mascaras: 4, sombras: 4 },
    {
      reshuffleLimit: 0,
      seals: { count: 52, strength: 13 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 600,
      rot: { count: 20, seconds: 8 },
    },
  ),

  build(
    "l30",
    30,
    "🞮 El Cuervo Final 🞮",
    "JEFE · coliseo doble · 70 sellos · bandeja de 4 · sin nada · reloj 18′",
    "fin",
    buildFin(),
    { bebidas: 5, vicios: 5, armas: 5, tesoros: 5, joyas: 5, suerte: 5, mascaras: 5, sombras: 5 },
    {
      reshuffleLimit: 0,
      seals: { count: 70, strength: 14 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 1080,
      rot: { count: 24, seconds: 8 },
      traySize: 4,
      boss: true,
      bossQuote: "«El Cuervo no repite invitación. Ganás o desaparecés.»",
    },
  ),

  build(
    "l31",
    31,
    "Doble Espina",
    "cuartetos · dos peines · 45 sellos · 15 podridas · reloj 10′",
    "espina",
    buildEspina(),
    {
      bebidas: 2,
      vicios: 2,
      armas: 2,
      tesoros: 2,
      joyas: 2,
      suerte: 2,
      mascaras: 2,
      sombras: 2,
      reliquias: 2,
      pecados: 2,
    },
    {
      reshuffleLimit: 1,
      seals: { count: 45, strength: 11 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 600,
      rot: { count: 15, seconds: 10 },
    },
  ),
  build(
    "l32",
    32,
    "Escalera Rota",
    "cuartetos · escalones desalineados · 48 sellos · reloj 10′",
    "escalera",
    buildEscalera(),
    {
      bebidas: 2,
      vicios: 2,
      armas: 2,
      tesoros: 2,
      joyas: 2,
      suerte: 2,
      mascaras: 2,
      sombras: 2,
      reliquias: 3,
      pecados: 3,
    },
    {
      reshuffleLimit: 0,
      seals: { count: 48, strength: 12 },
      matchSize: 4,
      undoLimit: 1,
      timeLimit: 600,
      rot: { count: 16, seconds: 10 },
    },
  ),
  build(
    "l33",
    33,
    "Ojo del Cuervo",
    "cuartetos · anillo + iris · 50 sellos · reloj 9′",
    "ojo",
    buildOjo(),
    {
      bebidas: 2,
      vicios: 2,
      armas: 2,
      tesoros: 2,
      joyas: 3,
      suerte: 3,
      mascaras: 3,
      sombras: 3,
      reliquias: 3,
      pecados: 3,
    },
    {
      reshuffleLimit: 0,
      seals: { count: 50, strength: 12 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 540,
      rot: { count: 18, seconds: 9 },
    },
  ),
  build(
    "l34",
    34,
    "Trébol Torcido",
    "cuartetos · 4 pétalos · 4 puertas · reloj 10′",
    "trebol",
    buildTrebol(),
    {
      bebidas: 2,
      vicios: 2,
      armas: 2,
      tesoros: 2,
      joyas: 2,
      suerte: 2,
      mascaras: 2,
      sombras: 2,
      reliquias: 2,
      pecados: 2,
    },
    {
      reshuffleLimit: 0,
      seals: { count: 46, strength: 12 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 600,
      rot: { count: 16, seconds: 9 },
      gates: { count: 4, unlockAt: 6 },
    },
  ),
  build(
    "l35",
    35,
    "Cuchilla del Cuervo",
    "cuartetos · hoja horizontal larga · 52 sellos · reloj 10′",
    "cuchilla",
    buildCuchilla(),
    {
      bebidas: 2,
      vicios: 2,
      armas: 3,
      tesoros: 3,
      joyas: 2,
      suerte: 2,
      mascaras: 3,
      sombras: 3,
      reliquias: 3,
      pecados: 3,
    },
    {
      reshuffleLimit: 0,
      seals: { count: 52, strength: 13 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 600,
      rot: { count: 18, seconds: 9 },
    },
  ),
  build(
    "l36",
    36,
    "Reloj Detenido",
    "cuartetos · cruz cardinal · 6 puertas · reloj 9′",
    "reloj-parado",
    buildRelojParado(),
    {
      bebidas: 2,
      vicios: 2,
      armas: 2,
      tesoros: 2,
      joyas: 2,
      suerte: 2,
      mascaras: 2,
      sombras: 2,
      reliquias: 2,
      pecados: 2,
    },
    {
      reshuffleLimit: 0,
      seals: { count: 50, strength: 13 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 540,
      rot: { count: 18, seconds: 8 },
      gates: { count: 6, unlockAt: 8 },
    },
  ),
  build(
    "l37",
    37,
    "Corazón Roto",
    "cuartetos · corazón partido · 55 sellos · reloj 10′",
    "corazon",
    buildCorazon(),
    {
      bebidas: 2,
      vicios: 2,
      armas: 2,
      tesoros: 2,
      joyas: 2,
      suerte: 2,
      mascaras: 2,
      sombras: 2,
      reliquias: 2,
      pecados: 2,
    },
    {
      reshuffleLimit: 0,
      seals: { count: 55, strength: 13 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 600,
      rot: { count: 20, seconds: 8 },
    },
  ),

  build(
    "l38",
    38,
    "🞮 Sarcófago del Cuervo 🞮",
    "JEFE · pirámide alargada · bandeja de 5 · sin nada · 22 podridas · reloj 12′",
    "sarcofago",
    buildSarcofago(),
    {
      bebidas: 3,
      vicios: 3,
      armas: 3,
      tesoros: 3,
      joyas: 3,
      suerte: 3,
      mascaras: 3,
      sombras: 3,
      reliquias: 4,
      pecados: 4,
    },
    {
      reshuffleLimit: 0,
      seals: { count: 60, strength: 14 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 720,
      rot: { count: 22, seconds: 8 },
      traySize: 5,
      gates: { count: 6, unlockAt: 10 },
      boss: true,
      bossQuote: "«Cerrá los ojos. No mires las manos del Cuervo abrir el sarcófago.»",
    },
  ),
  build(
    "l39",
    39,
    "Puerta del Cuervo",
    "cuartetos · dos torres · 8 puertas · reloj 11′",
    "puerta",
    buildPuerta(),
    {
      bebidas: 2,
      vicios: 2,
      armas: 2,
      tesoros: 2,
      joyas: 3,
      suerte: 3,
      mascaras: 3,
      sombras: 3,
      reliquias: 3,
      pecados: 3,
    },
    {
      reshuffleLimit: 0,
      seals: { count: 55, strength: 13 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 660,
      rot: { count: 20, seconds: 8 },
      gates: { count: 8, unlockAt: 12 },
    },
  ),

  build(
    "l40",
    40,
    "🞮 Nemesis 🞮",
    "JEFE FINAL · coliseo triple · 10 puertas · bandeja de 5 · reloj 20′",
    "nemesis",
    buildNemesis(),
    {
      bebidas: 5,
      vicios: 5,
      armas: 5,
      tesoros: 5,
      joyas: 5,
      suerte: 5,
      mascaras: 5,
      sombras: 5,
      reliquias: 5,
      pecados: 5,
    },
    {
      reshuffleLimit: 0,
      seals: { count: 80, strength: 15 },
      matchSize: 4,
      undoLimit: 0,
      timeLimit: 1200,
      rot: { count: 28, seconds: 7 },
      traySize: 5,
      gates: { count: 10, unlockAt: 15 },
      boss: true,
      bossQuote: "«Nadie sale del salón sin dejar su nombre grabado. Empezá.»",
    },
  ),
  build(
    "l41",
    41,
    "Mariposa Serena",
    "mesa libre · sin sellos · sin reloj",
    "mariposa",
    buildMariposa(),
    { bebidas: 1, vicios: 1, armas: 0, tesoros: 0 },
    { reshuffleLimit: 6, undoLimit: 6, practice: true },
  ),
  build(
    "l42",
    42,
    "Rueda del Cuervo",
    "mesa libre · anillo simétrico",
    "rueda",
    buildRueda(),
    { bebidas: 1, vicios: 1, armas: 0, tesoros: 0 },
    { reshuffleLimit: 5, undoLimit: 5, practice: true },
  ),
  build(
    "l43",
    43,
    "Serpiente de Latón",
    "mesa libre · sendero sinuoso",
    "serpiente",
    buildSerpiente(),
    { bebidas: 1, vicios: 0, armas: 0, tesoros: 0 },
    { reshuffleLimit: 5, undoLimit: 5, practice: true },
  ),
];

// ── Variación roguelike del trazado ──────────────────────────────────────────
// Cada vigilia (run) espeja el tablero de forma determinista según su semilla,
// así el mismo nivel nunca se juega dos veces con el mismo recorrido.
let LAYOUT_VARIANT = "";
const VARIANT_CACHE = new Map<string, LevelDef>();

export function setLayoutVariant(seed: string): void {
  if (seed === LAYOUT_VARIANT) return;
  LAYOUT_VARIANT = seed;
  VARIANT_CACHE.clear();
}

function applyVariant(lv: LevelDef): LevelDef {
  if (!LAYOUT_VARIANT) return lv;
  const key = `${LAYOUT_VARIANT}:${lv.id}`;
  const hit = VARIANT_CACHE.get(key);
  if (hit) return hit;
  const rng = rngFromSeed(`mahjong-layout:${key}`);
  const mirrorX = rng() < 0.5;
  const mirrorY = rng() < 0.5;
  let maxX = 0;
  let maxY = 0;
  for (const p of lv.positions) {
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const positions =
    mirrorX || mirrorY
      ? lv.positions.map((p) => ({
          x: mirrorX ? maxX - p.x : p.x,
          y: mirrorY ? maxY - p.y : p.y,
          z: p.z,
        }))
      : lv.positions;
  const out: LevelDef = { ...lv, positions };
  VARIANT_CACHE.set(key, out);
  return out;
}

/**
 * Recorrido de una vigilia: por cada piso se sortea un tablero dentro de la
 * banda de dificultad correspondiente, de modo que dos runs nunca compartan
 * la misma secuencia de mesas.
 */
export function runRouteIds(seed: string, floors = 10): string[] {
  const pool = LEVELS.filter((l) => !l.practice).sort((a, b) => a.order - b.order);
  const rng = rngFromSeed(`mahjong-route:${seed}`);
  const band = pool.length / floors;
  const used = new Set<string>();
  const route: string[] = [];
  for (let f = 0; f < floors; f++) {
    const lo = Math.floor(f * band);
    const hi = Math.max(lo, Math.floor((f + 1) * band) - 1);
    const slice = pool.slice(lo, hi + 1).filter((l) => !used.has(l.id));
    const pick = (slice.length ? slice : pool)[Math.floor(rng() * (slice.length || pool.length))];
    used.add(pick.id);
    route.push(pick.id);
  }
  return route;
}

export function getLevel(id: string): LevelDef {
  const lv = LEVELS.find((l) => l.id === id);
  if (lv) return applyVariant(lv);
  const m = /^l(\d+)$/.exec(id);
  if (m) {
    const order = Number(m[1]);
    if (order > LEVELS.length) return applyVariant(getOrSynthLevel(order));
  }
  throw new Error(`Nivel desconocido: ${id}`);
}

export function computeStars(level: LevelDef, score: number): 0 | 1 | 2 | 3 {
  const [s1, s2, s3] = level.starThresholds;
  if (score >= s3) return 3;
  if (score >= s2) return 2;
  if (score >= s1) return 1;
  return 0;
}

const SYNTH_CACHE = new Map<string, LevelDef>();

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function synthLevel(order: number): LevelDef {
  const base = LEVELS[(order - 1) % LEVELS.length];

  const P = Math.floor((order - 1) / LEVELS.length);
  const scale = 1 + P * 0.32;

  const baseMatch = base.matchSize ?? 2;
  const matchSize: 2 | 3 | 4 =
    P >= 2 && order % 5 === 0 ? 4 : P >= 1 && order % 3 === 0 ? 3 : baseMatch;

  const rawSpecials: LevelDef["specials"] = {
    bebidas: clamp((base.specials.bebidas ?? 1) + P, 1, 6),
    vicios: clamp((base.specials.vicios ?? 1) + P, 1, 6),
    armas: clamp((base.specials.armas ?? 1) + P, 1, 6),
    tesoros: clamp((base.specials.tesoros ?? 1) + P, 1, 6),
    joyas: clamp((base.specials.joyas ?? 0) + Math.max(1, P), 0, 6),
    suerte: clamp((base.specials.suerte ?? 0) + Math.max(1, P), 0, 6),
    mascaras: clamp((base.specials.mascaras ?? 0) + Math.max(1, P), 0, 6),
    sombras: clamp((base.specials.sombras ?? 0) + Math.max(1, P), 0, 6),
    reliquias: clamp((base.specials.reliquias ?? 0) + Math.max(1, P), 0, 6),
    pecados: clamp((base.specials.pecados ?? 0) + Math.max(1, P), 0, 6),
  };

  const positionsCount = base.positions.length - (base.positions.length % matchSize);
  const maxSpecials = Math.max(0, Math.floor(positionsCount / matchSize) - 6);
  const specials = { ...rawSpecials };
  const keys = Object.keys(specials) as (keyof LevelDef["specials"])[];
  let total = keys.reduce((a, k) => a + (specials[k] ?? 0), 0);
  while (total > maxSpecials) {
    keys.sort((a, b) => (specials[b] ?? 0) - (specials[a] ?? 0));
    const k = keys[0];
    if ((specials[k] ?? 0) <= 0) break;
    specials[k] = (specials[k] ?? 0) - 1;
    total--;
  }

  const seals: SealConfig = {
    count: clamp(Math.round((base.seals?.count ?? 20) * scale) + P * 4, 8, 160),
    strength: clamp((base.seals?.strength ?? 5) + P, 3, 24),
  };
  const rot: RotConfig = {
    count: clamp(Math.round((base.rot?.count ?? 6) * scale) + P * 2, 2, 60),
    seconds: clamp(Math.round((base.rot?.seconds ?? 15) - P), 4, 30),
  };
  const gates: GateConfig = {
    count: clamp((base.gates?.count ?? 2) + P, 1, 20),
    unlockAt: clamp((base.gates?.unlockAt ?? 6) + P, 4, 40),
  };
  const timeLimit = base.timeLimit
    ? Math.max(180, Math.round(base.timeLimit / (1 + 0.14 * P)))
    : Math.max(240, 900 - P * 40);

  const isBoss = order % 10 === 0;
  return build(
    `l${order}`,
    order,
    isBoss ? `🞮 Vigilia · Ronda ${order} 🞮` : `Vigilia · Ronda ${order}`,
    `escalón P.${P + 1} · ${matchSize === 4 ? "cuartetos" : matchSize === 3 ? "tríos" : "pares"} · ${seals.count} sellos · ${gates.count} puertas`,
    base.shape,
    base.positions,
    specials,
    {
      reshuffleLimit: 0,
      seals,
      rot,
      gates,
      timeLimit,
      undoLimit: 0,
      matchSize,
      traySize: base.traySize,
      boss: isBoss,
      bossQuote: isBoss
        ? `«Ronda ${order}. Ya perdí la cuenta de tu deuda, encanto — pero el Cuervo no.»`
        : undefined,
    },
  );
}

function getOrSynthLevel(order: number): LevelDef {
  const id = `l${order}`;
  const hit = SYNTH_CACHE.get(id);
  if (hit) return hit;
  const lv = synthLevel(order);
  SYNTH_CACHE.set(id, lv);
  return lv;
}

export function nextLevelId(id: string): string {
  const cur = getLevel(id);
  return `l${cur.order + 1}`;
}

export function isVigilia(id: string): boolean {
  const m = /^l(\d+)$/.exec(id);
  return !!m && Number(m[1]) > LEVELS.length;
}
