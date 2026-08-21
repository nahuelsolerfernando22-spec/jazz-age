export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

export const SUIT_COLOR: Record<Suit, "red" | "black"> = {
  hearts: "red",
  diamonds: "red",
  clubs: "black",
  spades: "black",
};

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export const RANK_LABEL: Record<Rank, string> = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};

export const RANK_FILE: Record<Rank, string> = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};

export const SUIT_FILE: Record<Suit, string> = {
  hearts: "H",
  diamonds: "D",
  clubs: "C",
  spades: "S",
};

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Record<Suit, Card[]>;
  tableau: Card[][];
  moves: number;
  won: boolean;
}

function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}-${rank}`, suit, rank, faceUp: false });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealNewGame(seed?: number): GameState {
  const rng = seed != null ? mulberry32(seed) : Math.random;
  const deck = shuffle(freshDeck(), rng);
  const tableau: Card[][] = Array.from({ length: 7 }, () => []);

  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++], faceUp: row === col };
      tableau[col].push(card);
    }
  }
  return {
    stock: deck.slice(idx).map((c) => ({ ...c, faceUp: false })),
    waste: [],
    foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
    tableau,
    moves: 0,
    won: false,
  };
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function canStackOnTableau(moving: Card, target: Card | null): boolean {
  if (!moving.faceUp) return false;
  if (target == null) return moving.rank === 13;
  if (!target.faceUp) return false;
  if (SUIT_COLOR[moving.suit] === SUIT_COLOR[target.suit]) return false;
  return moving.rank === target.rank - 1;
}

export function canStackOnFoundation(moving: Card, suitStack: Card[]): boolean {
  if (!moving.faceUp) return false;
  if (suitStack.length === 0) return moving.rank === 1;
  const top = suitStack[suitStack.length - 1];
  return moving.suit === top.suit && moving.rank === top.rank + 1;
}

function clone(state: GameState): GameState {
  return {
    stock: state.stock.map((c) => ({ ...c })),
    waste: state.waste.map((c) => ({ ...c })),
    foundations: {
      hearts: state.foundations.hearts.map((c) => ({ ...c })),
      diamonds: state.foundations.diamonds.map((c) => ({ ...c })),
      clubs: state.foundations.clubs.map((c) => ({ ...c })),
      spades: state.foundations.spades.map((c) => ({ ...c })),
    },
    tableau: state.tableau.map((col) => col.map((c) => ({ ...c }))),
    moves: state.moves,
    won: state.won,
  };
}

function flipTopIfNeeded(col: Card[]) {
  if (col.length > 0 && !col[col.length - 1].faceUp) {
    col[col.length - 1].faceUp = true;
  }
}

export function drawFromStock(state: GameState, count = 1): GameState {
  const s = clone(state);
  if (s.stock.length === 0) {
    s.stock = s.waste.reverse().map((c) => ({ ...c, faceUp: false }));
    s.waste = [];
  } else {
    const n = Math.max(1, Math.min(count, s.stock.length));
    for (let i = 0; i < n; i++) {
      const card = s.stock.pop()!;
      card.faceUp = true;
      s.waste.push(card);
    }
  }
  s.moves += 1;
  return s;
}

export type SourceLocation =
  | { kind: "waste" }
  | { kind: "tableau"; col: number; index: number }
  | { kind: "foundation"; suit: Suit };

export type TargetLocation = { kind: "tableau"; col: number } | { kind: "foundation"; suit: Suit };

export function sliceSource(state: GameState, src: SourceLocation): Card[] | null {
  if (src.kind === "waste") {
    const top = state.waste[state.waste.length - 1];
    return top ? [top] : null;
  }
  if (src.kind === "foundation") {
    const top = state.foundations[src.suit][state.foundations[src.suit].length - 1];
    return top ? [top] : null;
  }

  const col = state.tableau[src.col];
  if (src.index < 0 || src.index >= col.length) return null;

  const slice = col.slice(src.index);
  if (slice.some((c) => !c.faceUp)) return null;
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1];
    const curr = slice[i];
    if (SUIT_COLOR[prev.suit] === SUIT_COLOR[curr.suit]) return null;
    if (curr.rank !== prev.rank - 1) return null;
  }
  return slice;
}

export function tryMove(
  state: GameState,
  src: SourceLocation,
  dst: TargetLocation,
): GameState | null {
  const slice = sliceSource(state, src);
  if (!slice || slice.length === 0) return null;

  if (dst.kind === "foundation") {
    if (slice.length !== 1) return null;
    const card = slice[0];
    if (card.suit !== dst.suit) return null;
    if (!canStackOnFoundation(card, state.foundations[dst.suit])) return null;
  } else {
    const targetCol = state.tableau[dst.col];
    const targetTop = targetCol[targetCol.length - 1] ?? null;
    if (!canStackOnTableau(slice[0], targetTop)) return null;
  }

  const next = clone(state);

  if (src.kind === "waste") {
    next.waste.pop();
  } else if (src.kind === "foundation") {
    next.foundations[src.suit].pop();
  } else {
    next.tableau[src.col].splice(src.index);
    flipTopIfNeeded(next.tableau[src.col]);
  }

  if (dst.kind === "foundation") {
    next.foundations[dst.suit].push({ ...slice[0], faceUp: true });
  } else {
    for (const c of slice) next.tableau[dst.col].push({ ...c, faceUp: true });
  }

  next.moves += 1;
  next.won = isWon(next);
  return next;
}

export function isWon(state: GameState): boolean {
  return SUITS.every((s) => state.foundations[s].length === 13);
}

export function autoSendToFoundation(state: GameState, src: SourceLocation): GameState | null {
  const slice = sliceSource(state, src);
  if (!slice || slice.length !== 1) return null;
  const card = slice[0];
  return tryMove(state, src, { kind: "foundation", suit: card.suit });
}

/** Envía a las pilas todo lo que se pueda desde el descarte y las cimas del tableau. */
export function autoFoundationPass(state: GameState): GameState {
  let g = state;
  for (let i = 0; i < 60; i++) {
    const cands: SourceLocation[] = [];
    if (g.waste.length > 0) cands.push({ kind: "waste" });
    for (let col = 0; col < g.tableau.length; col++) {
      const c = g.tableau[col];
      if (c.length > 0 && c[c.length - 1].faceUp) {
        cands.push({ kind: "tableau", col, index: c.length - 1 });
      }
    }
    let moved = false;
    for (const s of cands) {
      const nxt = autoSendToFoundation(g, s);
      if (nxt) {
        g = nxt;
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }
  return g;
}

/** La mano está resuelta: todo boca arriba, sólo falta subir cartas a las pilas. */
export function isAutoCompletable(state: GameState): boolean {
  if (state.won) return false;
  if (state.stock.length > 0) return false;
  if (state.waste.length > 1) return false;
  return state.tableau.every((col) => col.every((c) => c.faceUp));
}

/** Resuelve una mano ya destapada subiendo todo a las pilas. */
export function autoComplete(state: GameState): GameState {
  let g = state;
  for (let i = 0; i < 200; i++) {
    const next = autoFoundationPass(g);
    if (next === g || next.moves === g.moves) {
      if (g.waste.length === 0 && g.stock.length > 0) {
        g = drawFromStock(g, 1);
        continue;
      }
      break;
    }
    g = next;
    if (g.won) break;
  }
  return g;
}

export type Hostess = "jade";
const ROTATION_MS = 4 * 60 * 60 * 1000;

export function currentSolitaireHostess(now: number = Date.now()): {
  active: Hostess;
  off: Hostess;
  next: Date;
} {
  const block = Math.floor(now / ROTATION_MS);
  const active: Hostess = "jade";
  const off: Hostess = "jade";
  const next = new Date((block + 1) * ROTATION_MS);
  return { active, off, next };
}

export type Cue = "idle" | "draw" | "stuck" | "win";

const JADE_LINES: Record<Cue, string[]> = {
  idle: [
    "Respirá hondo. El mazo escucha al que sabe esperar.",
    "Cuatro pilas, cuatro estaciones. Cada as a su tiempo.",
    "Movés vos. Yo solo cuido la mesa.",
    "El silencio también es una jugada.",
    "No fuerces la carta. Dejá que ella te elija.",
  ],
  draw: [
    "Del mazo viene lo que faltaba. O no.",
    "Otra carta. Escuchala antes de moverla.",
    "El mazo respira. Vos también, encanto.",
    "Voltea. Lo que no ves, ya está decidido.",
  ],
  stuck: [
    "Te frenaste. Mirá las columnas de nuevo, sin apuro.",
    "Rojo sobre negro. Negro sobre rojo. Empezá por ahí.",
    "Si dudás, contá los ases. Están cerca.",
    "Paciencia. La mesa siempre da una salida.",
  ],
  win: [
    "Cuatro pilas ordenadas. La casa te saluda.",
    "Cerraste limpio. Guardá esa calma para la próxima.",
    "Bien jugado. El té está tibio todavía.",
    "Ordenaste el mazo. Poca gente sabe hacerlo.",
  ],
};

export function pickHostessLine(hostess: Hostess, cue: Cue, seed: number = Date.now()): string {
  const pool = JADE_LINES[cue];
  return pool[Math.abs(seed) % pool.length];
}
