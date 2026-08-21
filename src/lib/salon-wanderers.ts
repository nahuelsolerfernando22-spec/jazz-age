import seamus from "@/assets/wanderers/seamus.webp";
import bram from "@/assets/wanderers/bram.webp";
import hovannes from "@/assets/wanderers/hovannes.webp";
import gabriela from "@/assets/wanderers/gabriela.webp";
import murph from "@/assets/wanderers/murph.webp";
import castellano from "@/assets/wanderers/castellano.webp";
import otto from "@/assets/wanderers/otto.webp";
import lucia from "@/assets/wanderers/lucia.webp";
import fausto from "@/assets/wanderers/fausto.webp";
import salma from "@/assets/wanderers/salma.webp";
import barnaby from "@/assets/wanderers/barnaby.webp";
import cyril from "@/assets/wanderers/cyril.webp";
import chen from "@/assets/wanderers/chen.webp";
import zeke from "@/assets/wanderers/zeke.webp";
import ursula from "@/assets/wanderers/ursula.webp";
import dulcinea from "@/assets/wanderers/dulcinea.webp";
import grigor from "@/assets/wanderers/grigor.webp";
import sammy from "@/assets/wanderers/sammy.webp";
import corvina from "@/assets/wanderers/corvina.webp";

export type ChallengeGame =
  "tables" | "dados" | "chinchon" | "truco" | "ruleta" | "bagatelle" | "mahjong" | "escoba";

export const CHALLENGE_ROUTE: Record<ChallengeGame, string> = {
  tables: "/tables",
  dados: "/dados",
  chinchon: "/chinchon",
  truco: "/truco",
  ruleta: "/ruleta",
  bagatelle: "/bagatelle",
  mahjong: "/mahjong",
  escoba: "/escoba",
};

export const CHALLENGE_LABEL: Record<ChallengeGame, string> = {
  tables: "Filo de Veintiuno",
  dados: "Cinco Huesos",
  chinchon: "El Corte Sucio",
  truco: "Mentira Criolla",
  ruleta: "La Rueda del Cuervo",
  bagatelle: "Clavo y Suerte",
  mahjong: "Marfil Paciente",
  escoba: "Barrido de Quince",
};

export type Wanderer = {
  id: string;
  name: string;
  portrait: string;
  mood: "smug" | "ebrio" | "nervioso" | "serio" | "flirty";
  personality: string;
  lines: string[];
  challenge: ChallengeGame;
  challengeLine: string;
};

export const WANDERERS: Wanderer[] = [
  {
    id: "seamus-forastero",
    name: "Seamus",
    portrait: seamus,
    mood: "serio",
    personality: "Ex-matón irlandés que ya no quiere pelea, sólo whisky y una silla en el rincón.",
    lines: ["Otra ronda.", "Salud, forastero.", "Sentate. Callá.", "El puño descansa."],
    challenge: "tables",
    challengeLine: "Blackjack. Ya.",
  },
  {
    id: "bram-el-callado",
    name: "Bram",
    portrait: bram,
    mood: "nervioso",
    personality:
      "Contador tuberculoso que apuesta ajeno y mira los dados como si le fueran a hablar.",
    lines: ["Vos jugás.", "Yo miro.", "Los dados no mienten.", "Contá otra vez."],
    challenge: "dados",
    challengeLine: "Tirá los dados.",
  },
  {
    id: "hovannes-viejo",
    name: "Hovannes",
    portrait: hovannes,
    mood: "smug",
    personality: "Viejo tahúr armenio que aprendió póker en tres puertos y no perdona un farol.",
    lines: ["Cartas o nada.", "Sin trucos.", "Sentate, chico.", "Aprendí en Odessa."],
    challenge: "tables",
    challengeLine: "Veintiuno, ahora.",
  },
  {
    id: "gabriela-la-perdida",
    name: "Gabriela",
    portrait: gabriela,
    mood: "ebrio",
    personality: "Heredera venida a menos que gasta la última pulsera en una noche de escoba.",
    lines: ["¿Otra copa?", "Quince y me la llevo.", "Perdés seguro.", "Mi anillo… ¿dónde?"],
    challenge: "escoba",
    challengeLine: "Escoba, guapo.",
  },
  {
    id: "murph-el-mentiroso",
    name: "Murph",
    portrait: murph,
    mood: "smug",
    personality:
      "Estibador del puerto con la boca más rápida del Cuervo — miente por deporte, no por plata.",
    lines: ["Miento siempre.", "¿Me creés?", "Cubilete, dale.", "Palabra de Murph."],
    challenge: "truco",
    challengeLine: "Truco. Vos primero.",
  },
  {
    id: "castellano-el-truquero",
    name: "El Castellano",
    portrait: castellano,
    mood: "smug",
    personality:
      "Rioplatense de traje raído que canta truco como quien reza — nunca lo hace en voz baja.",
    lines: ["Truco.", "Envido.", "Callate y jugá.", "Son buenas."],
    challenge: "truco",
    challengeLine: "Truco. Ya mismo.",
  },
  {
    id: "otto-el-aleman",
    name: "Otto",
    portrait: otto,
    mood: "serio",
    personality: "Ingeniero prusiano exiliado que sólo confía en la matemática de la ruleta.",
    lines: ["Sin ruido.", "La ruleta manda.", "Apostá o andate.", "El cero también existe."],
    challenge: "ruleta",
    challengeLine: "Ruleta. Rojo o negro.",
  },
  {
    id: "lucia-la-fugitiva",
    name: "Lucía",
    portrait: lucia,
    mood: "nervioso",
    personality:
      "Costurera que huye de un marido cobrador y calcula las cartas más rápido que su miedo.",
    lines: ["No mirés atrás.", "Chinchón, rápido.", "Perdí todo ayer.", "Cerrá la puerta."],
    challenge: "chinchon",
    challengeLine: "Chinchón, ya.",
  },
  {
    id: "fausto-el-griego",
    name: "Fausto",
    portrait: fausto,
    mood: "smug",
    personality:
      "Marino griego que jura haber inventado la bagatelle y cobra tragos por enseñar el truco.",
    lines: ["Bagatelle, chico.", "Vos primero.", "La bolita elige.", "Aprendí en El Pireo."],
    challenge: "bagatelle",
    challengeLine: "Bagatelle. Dale.",
  },
  {
    id: "salma-la-guantera",
    name: "Salma",
    portrait: salma,
    mood: "flirty",
    personality:
      "Vendedora de guantes de raso que juega mahjong mejor de lo que aparenta y sonríe cuando gana.",
    lines: ["Mahjong, cielo.", "Sentate acá.", "Perdé bonito.", "Mis guantes ganan."],
    challenge: "mahjong",
    challengeLine: "Mahjong conmigo.",
  },
  {
    id: "barnaby-el-empapado",
    name: "Barnaby",
    portrait: barnaby,
    mood: "ebrio",
    personality:
      "Periodista de La Gaceta que llegó a cubrir una redada y se quedó tres años bebiendo.",
    lines: ["Hipo y cartas.", "No me caí.", "Servime otra.", "Mañana lo escribo."],
    challenge: "escoba",
    challengeLine: "Escoba. Y whisky.",
  },
  {
    id: "cyril-cabeza-fria",
    name: "Big Cyril",
    portrait: cyril,
    mood: "serio",
    personality:
      "Ex-boxeador retirado que hace de segurata silencioso y cuenta cartas mientras vigila.",
    lines: ["Dos cartas.", "Sin charla.", "Cobro primero.", "La puerta está atrás."],
    challenge: "tables",
    challengeLine: "Blackjack. Sentate.",
  },
  {
    id: "chen-el-imperturbable",
    name: "Mister Chen",
    portrait: chen,
    mood: "smug",
    personality:
      "Comerciante de té con dedos largos y paciencia infinita — nunca pestañea en mahjong.",
    lines: ["Veo tu mano.", "Respirá lento.", "Ficha pequeña.", "El viento del este."],
    challenge: "mahjong",
    challengeLine: "Mahjong. Sin temblar.",
  },
  {
    id: "zeke-diente-de-oro",
    name: "Zeke",
    portrait: zeke,
    mood: "flirty",
    personality:
      "Trompetista suplente del Quartet que apuesta las propinas de la noche antes de guardarlas.",
    lines: ["Sonreí primero.", "Póker fino.", "Brillás poco.", "Mi diente vale más."],
    challenge: "chinchon",
    challengeLine: "Chinchón. Con swing.",
  },
  {
    id: "ursula-la-madrina",
    name: "Doña Úrsula",
    portrait: ursula,
    mood: "serio",
    personality:
      "Viuda del Sastre que administraba tres pensiones y ahora reparte lecciones de chinchón.",
    lines: ["Derecha la espalda.", "Contá bien.", "No protestés.", "Yo enterré peores."],
    challenge: "chinchon",
    challengeLine: "Chinchón. Sin llorar.",
  },
  {
    id: "dulcinea-beso-envenenado",
    name: "Dulcinea",
    portrait: dulcinea,
    mood: "flirty",
    personality:
      "Corista de gira suspendida que reparte besos como fichas y siempre apuesta al rojo.",
    lines: ["Besá la suerte.", "Mirá mis manos.", "Perdés lindo.", "Al rojo, cielo."],
    challenge: "ruleta",
    challengeLine: "Ruleta, corazón.",
  },
  {
    id: "grigor-el-paria",
    name: "Grigor",
    portrait: grigor,
    mood: "nervioso",
    personality: "Refugiado sin papeles que vive del mendrugo y sabe todos los tells del cubilete.",
    lines: ["No me sigas.", "Escucho pasos.", "Tengo monedas.", "Nadie me vio entrar."],
    challenge: "truco",
    challengeLine: "Truco. Sin testigos.",
  },
  {
    id: "sammy-dos-reales",
    name: "Sammy",
    portrait: sammy,
    mood: "smug",
    personality:
      "Estafador de feria que hace trucos de moneda y jura que los cinco huesos son cuestión de muñeca.",
    lines: ["Mirá esta moneda.", "Te gano fácil.", "No pestañees.", "Dos reales, chico."],
    challenge: "dados",
    challengeLine: "Cinco Huesos. Una tirada.",
  },
];

import { getSalonConfig } from "@/lib/salon-config";

const DAY_MS = 86_400_000;
const HOUR_MS = 60 * 60 * 1000;

function seedIndex(offset = 0): number {
  const now = Date.now();
  const bandMs = Math.max(0.25, getSalonConfig().wandererBandHours) * HOUR_MS;
  const day = Math.floor(now / DAY_MS);
  const band = Math.floor(now / bandMs);
  return (day * 31 + band * 7 + offset) >>> 0;
}

function pickN<T>(pool: T[], n: number, seed: number): T[] {
  const arr = [...pool];
  const out: T[] = [];
  let s = seed || 1;
  for (let i = 0; i < n && arr.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % arr.length;
    out.push(arr.splice(idx, 1)[0]);
  }
  return out;
}

export function pickWanderersForNow(count?: 2 | 3): Wanderer[] {
  const n = count ?? getSalonConfig().wandererCount;
  return pickN(WANDERERS, n, seedIndex());
}

export const CORVINA_CAMEO_PORTRAIT = corvina;

export type CorvinaCameo = {
  tableIdx: number;
  whisper: string;
};

const CORVINA_WHISPERS = [
  "El Cuervo te mira.",
  "Perdé con estilo.",
  "Hay puertas que no se abren dos veces.",
  "Vi tu suerte. No brilla.",
  "Bebé rápido. Y andate.",
];

export function getCorvinaCameoForToday(tableCount = 4): CorvinaCameo | null {
  const pct = getSalonConfig().corvinaCameoPct;
  if (pct <= 0) return null;
  const day = Math.floor(Date.now() / DAY_MS);
  const h = (day * 2654435761) >>> 0;
  if (h % 100 >= pct) return null;
  const tableIdx = h % tableCount;
  const whisper = CORVINA_WHISPERS[(h >>> 3) % CORVINA_WHISPERS.length];
  return { tableIdx, whisper };
}

const SEEN_KEY = "salon:wanderers:seen:v1";

type SeenMap = { day: number; ids: Record<string, true> };

function readSeen(): SeenMap {
  if (typeof window === "undefined") return { day: 0, ids: {} };
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return { day: 0, ids: {} };
    const parsed = JSON.parse(raw) as SeenMap;
    const today = Math.floor(Date.now() / DAY_MS);
    if (parsed.day !== today) return { day: today, ids: {} };
    return parsed;
  } catch {
    return { day: Math.floor(Date.now() / DAY_MS), ids: {} };
  }
}

export function hasSeenWanderer(id: string): boolean {
  return !!readSeen().ids[id];
}

export function markWandererSeen(id: string) {
  if (typeof window === "undefined") return;
  const cur = readSeen();
  cur.ids[id] = true;
  cur.day = Math.floor(Date.now() / DAY_MS);
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(cur));
  } catch {}
}
