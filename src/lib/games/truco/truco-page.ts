import {
  cantarEnvido,
  cantarFlor,
  cantarTruco,
  irseAlMazo,
  pasarReclamoEnvido,
  playCard,
  reclamarEnvido,
  responderEnvido,
  responderFlor,
  responderTruco,
  startHand,
  type Card,
  type EnvidoLevel,
  type GameState,
  type Player,
  type Suit,
} from "@/lib/games/truco/truco";

// ---------- Card art ----------
const CARD_ART = import.meta.glob("@/assets/chinchon-v2/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const BY_STEM: Record<string, string> = {};
const ALL_DECK_URLS: string[] = [];

for (const path in CARD_ART) {
  const stem = path.split("/").pop()?.split(".")[0];
  if (stem) {
    BY_STEM[stem] = CARD_ART[path];
    ALL_DECK_URLS.push(CARD_ART[path]);
  }
}


// Las figuras del mazo español llegan como 10/11/12 pero el arte está guardado
// como sota/caballo/rey (y bastos 8/9 sólo existe en su versión "-clean").
// Sin este puente algunas cartas salían con el dorso puesto.
const FIGURE_STEM: Record<string, string> = { "10": "sota", "11": "caballo", "12": "rey" };
function stemFor(suit: string, rank: number | string): string[] {
  const r = String(rank);
  const out = [`${suit}-${r}`];
  const fig = FIGURE_STEM[r];
  if (fig) out.push(`${suit}-${fig}`);
  out.push(`${suit}-${r}-clean`);
  return out;
}
function resolveArt(suit: string, rank: number | string): string {
  for (const s of stemFor(suit, rank)) if (BY_STEM[s]) return BY_STEM[s];
  return BY_STEM["card-back"] || "";
}

export function cardArt(card: Card | { suit: string; rank: number | string }): string {
  return resolveArt(card.suit, card.rank);
}

let _ac: AudioContext | null = null;
export function closeTrucoAudio() {
  if (_ac) {
    void _ac.close();
  }
  _ac = null;
}

export function playCantoSfx(kind: string) {
  if (typeof window === "undefined") return;
  try {
    if (_ac && _ac.state === "closed") _ac = null;
    _ac ??= new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const ac = _ac;
    const now = ac.currentTime;
    const freqs: Record<string, number[]> = {
      envido: [392, 523],
      truco: [330, 415, 494],
      flor: [523, 659, 784],
      card: [180],
      tick: [1400],
      resolved: [660, 880],
      quiero: [523, 784],
      noquiero: [440, 293],
      handwin: [523, 659, 784, 1046],
      handlose: [392, 311, 233],
      mazo: [220, 165],
    };
    const seq = freqs[kind] ?? [440];
    seq.forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      const short = kind === "card" || kind === "tick" || kind === "resolved";
      o.type = kind === "card" ? "sine" : kind === "tick" ? "square" : "triangle";
      o.frequency.value = f;
      const t0 = now + i * (kind === "tick" ? 0.04 : 0.09);
      const peak =
        kind === "card" ? 0.05 : kind === "tick" ? 0.035 : kind === "resolved" ? 0.07 : 0.12;
      const dur =
        kind === "tick" ? 0.05 : kind === "card" ? 0.12 : kind === "resolved" ? 0.14 : 0.22;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g).connect(ac.destination);
      o.start(t0);
      o.stop(t0 + (short ? 0.15 : 0.25));
    });
  } catch {
    /* noop */
  }
}

export type SavedMode = "solo";

export type Action =
  | { t: "play"; who: Player; cardId: string }
  | { t: "envido"; who: Player; level: string }
  | { t: "truco"; who: Player; level?: string }
  | { t: "flor"; who: Player }
  | { t: "reclamar"; who: Player }
  | { t: "pasarReclamo"; who: Player }
  | { t: "respTruco"; who: Player; ok: boolean }
  | { t: "respEnvido"; who: Player; ok: boolean; playerDeclared?: number; aiLieRate?: number }
  | { t: "respFlor"; who: Player; act: string }
  | { t: "mazo"; who: Player }
  | { t: "init"; g: GameState }
  | { t: "nextHand" }
  | { t: "hydrate"; g: GameState; flor?: boolean; mode?: SavedMode }
  | { t: "surrender"; who?: Player }
  | {
      t: "start";
      flor: boolean;
      goal?: number;
      mode?: SavedMode;
      pointGoal?: number;
      aiName?: string;
    };

export function reducer(state: GameState | null, action: Action): GameState | null {
  if (action.t === "init") return action.g;
  if (action.t === "hydrate") return action.g ?? null;
  if (action.t === "start") {
    return startHand(null, action.flor, action.pointGoal ?? action.goal ?? 30, Math.random, action.aiName ?? "Eulalia");
  }
  if (!state) return null;

  switch (action.t) {
    case "nextHand": {
      if (state.winner) return state;
      return startHand(state, state.florEnabled, state.pointGoal);
    }
    case "play":
      return playCard(state, action.who, action.cardId);
    case "truco":
      return cantarTruco(state, action.who);
    case "respTruco":
      return responderTruco(state, action.who, action.ok);
    case "envido":
      return cantarEnvido(state, action.who, action.level as EnvidoLevel);
    case "respEnvido":
      return responderEnvido(state, action.who, action.ok, {
        playerDeclared: action.playerDeclared,
        aiLieRate: action.aiLieRate,
      });
    case "flor":
      return cantarFlor(state, action.who);
    case "respFlor":
      return responderFlor(state, action.who, action.act as "achicar" | "subir" | "noquiero");
    case "reclamar":
      return reclamarEnvido(state, action.who);
    case "pasarReclamo":
      return pasarReclamoEnvido(state);
    case "mazo":
      return irseAlMazo(state, action.who);
    case "surrender": {
      const who = action.who ?? "you";
      const loser: Player = who;
      return {
        ...state,
        winner: loser === "you" ? "ai" : "you",
        hand: {
          ...state.hand,
          handOver: true,
          pending: null,
          log: [...state.hand.log, loser === "you" ? "Te retirás de la mesa." : "Se retira."],
        },
      };
    }
    default:
      return state;
  }
}

export type ZoomLevel = 0.85 | 1.0 | 1.15 | 1.3;
export const ZOOM_STEPS: ZoomLevel[] = [0.85, 1.0, 1.15, 1.3];

// Persistencia real: Android puede matar el proceso en segundo plano y sin
// esto el jugador perdía la mano al volver.
const SAVE_KEY = "cuervo:truco:live:v2";
const ZOOM_KEY = "cuervo:truco:zoom:v1";

export function loadSave(): { g: GameState; flor: boolean; mode: SavedMode } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { g: GameState; flor: boolean; at: number };
    if (!data?.g || data.g.winner) return null;
    // Una mano vieja no interesa: si pasó una semana, arrancamos limpio.
    if (Date.now() - (data.at ?? 0) > 1000 * 60 * 60 * 24 * 7) return null;
    return { g: data.g, flor: !!data.flor, mode: "solo" };
  } catch {
    return null;
  }
}

export function saveGame(g: GameState | null, flor: boolean | null, _mode: SavedMode = "solo") {
  if (typeof window === "undefined") return;
  try {
    if (!g || g.winner) {
      window.localStorage.removeItem(SAVE_KEY);
      return;
    }
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ g, flor: !!flor, at: Date.now() }));
  } catch {
    /* cuota o modo privado */
  }
}

export function loadZoom(): ZoomLevel {
  if (typeof window === "undefined") return 1.0;
  const raw = Number(window.localStorage.getItem(ZOOM_KEY));
  return (ZOOM_STEPS as number[]).includes(raw) ? (raw as ZoomLevel) : 1.0;
}

export function saveZoom(z: ZoomLevel) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ZOOM_KEY, String(z));
  } catch {
    /* noop */
  }
}

export function eulaliaLine(_g: GameState | null): string {
  return "Sentate, criatura.";
}

export interface TrucoRivalJitter {
  weights: Record<string, number>;
  paceFactor: number;
}

export function trucoRivalJitter(_handKey: string, _nemesis: unknown): TrucoRivalJitter {
  return { weights: {}, paceFactor: 1.0 };
}
