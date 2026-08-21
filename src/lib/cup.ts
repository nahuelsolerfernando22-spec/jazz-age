/**
 * El Torneo del Cuervo: cuatro rondas de eliminación directa contra los
 * pesos pesados de la casa. Ganás las cuatro y te llevás el título de esa
 * mesa; perdés una y el torneo se cierra (siempre podés anotarte de nuevo,
 * con otro cuadro y otros rivales).
 *
 * Todo vive en el dispositivo: no hace falta conexión.
 */

export const CUP_ROUNDS = [
  { id: 0, nombre: "Ronda del Puerto", corto: "Puerto" },
  { id: 1, nombre: "Cuartos de Final", corto: "Cuartos" },
  { id: 2, nombre: "Semifinal", corto: "Semi" },
  { id: 3, nombre: "La Final", corto: "Final" },
] as const;

export const CUP_TOTAL_ROUNDS = CUP_ROUNDS.length;

/** Bolsa que paga cada ronda ganada (fichas). */
export const CUP_PURSE = [150, 300, 600, 1500];

export interface CupGame {
  id: string;
  nombre: string;
  ruta: string;
  /** Cómo se gana una ronda, en una línea, para la ficha del torneo. */
  criterio: string;
}

/** Mesas que admiten torneo: todas las que se ganan o se pierden. */
export const CUP_GAMES: CupGame[] = [
  {
    id: "truco",
    nombre: "Mentira Criolla",
    ruta: "/truco",
    criterio: "Ganás la partida a 15 y pasás de ronda.",
  },
  {
    id: "chinchon",
    nombre: "El Corte Sucio",
    ruta: "/chinchon",
    criterio: "Cortá antes que te corten: la partida decide la ronda.",
  },
  {
    id: "blackjack",
    nombre: "Filo de Veintiuno",
    ruta: "/tables",
    criterio: "Cerrá la mesa en verde para pasar de ronda.",
  },
  {
    id: "escoba",
    nombre: "Barrido de Quince",
    ruta: "/escoba",
    criterio: "Sumá más puntos que la casa en la partida.",
  },
  {
    id: "dados",
    nombre: "Cinco Huesos",
    ruta: "/dados",
    criterio: "Planilla contra planilla: el total manda.",
  },
  {
    id: "sindicato",
    nombre: "El Sindicato",
    ruta: "/sindicato",
    criterio: "Quedate con el mapa antes que los otros capos.",
  },
  {
    id: "mahjong",
    nombre: "Marfil Paciente",
    ruta: "/mahjong",
    criterio: "Limpiá el tablero para seguir en el cuadro.",
  },
];

export const CUP_GAME_BY_ID: Record<string, CupGame> = Object.fromEntries(
  CUP_GAMES.map((g) => [g.id, g]),
);

export interface CupRival {
  nombre: string;
  apodo: string;
  /** 0..3: cuánta cabeza tiene. Sube ronda a ronda. */
  garra: number;
}

const RIVALES: CupRival[] = [
  { nombre: "Black Bettie", apodo: "la que no pestañea", garra: 1 },
  { nombre: "Pilar Solís", apodo: "La Baraja", garra: 2 },
  { nombre: "Eulalia", apodo: "boca de truco", garra: 2 },
  { nombre: "Jade", apodo: "Ojo de Dragón", garra: 3 },
  { nombre: "Tito Cabrera", apodo: "el Fiado", garra: 1 },
  { nombre: "Madge", apodo: "mano de hierro", garra: 2 },
  { nombre: "Rufino Paz", apodo: "el Contador", garra: 2 },
  { nombre: "La Viuda", apodo: "dueña del último turno", garra: 3 },
  { nombre: "Cacho Miranda", apodo: "puño de muelle", garra: 1 },
  { nombre: "Doña Amparo", apodo: "la Prestamista", garra: 3 },
  { nombre: "El Turco", apodo: "vende humo", garra: 1 },
  { nombre: "Simón Vega", apodo: "el Cronómetro", garra: 2 },
  { nombre: "Nelly Braun", apodo: "la Suiza", garra: 2 },
  { nombre: "Ramón Ocampo", apodo: "dedo lento", garra: 1 },
  { nombre: "La Gallega", apodo: "reparte y calla", garra: 3 },
  { nombre: "Beto Iriarte", apodo: "el Muelle", garra: 1 },
  { nombre: "Ada Zunino", apodo: "memoria de fichas", garra: 3 },
  { nombre: "El Uruguayo", apodo: "cara de piedra", garra: 2 },
  { nombre: "Ceferino", apodo: "el Sacristán", garra: 1 },
  { nombre: "Perla Vidal", apodo: "manos de seda", garra: 2 },
  { nombre: "Don Ismael", apodo: "el Patrón", garra: 3 },
];

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Cuadro de 4 rivales, determinista por semilla: cada torneo es distinto. */
export function sortearCuadro(seed: string): CupRival[] {
  const pool = [...RIVALES];
  const out: CupRival[] = [];
  let h = hash(seed);
  for (let ronda = 0; ronda < CUP_TOTAL_ROUNDS; ronda++) {
    // La garra mínima sube con la ronda: la final la juega un pesado.
    const minGarra = ronda >= 3 ? 3 : ronda >= 2 ? 2 : 1;
    const candidatos = pool.filter((r) => r.garra >= minGarra);
    const lista = candidatos.length ? candidatos : pool;
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const pick = lista[h % lista.length];
    out.push({ ...pick, garra: Math.max(pick.garra, ronda) });
    pool.splice(pool.indexOf(pick), 1);
  }
  return out;
}

export function cupRoundName(round: number): string {
  return CUP_ROUNDS[Math.min(round, CUP_TOTAL_ROUNDS - 1)].nombre;
}

/* ─────────────────────────  Recompensas por ronda  ───────────────────── */

export interface CupRoundReward {
  /** Fichas que paga la ronda. */
  fichas: number;
  /** Extra acumulable que se guarda en la vitrina del cuadro. */
  extra: string;
  /** Puntos de tabla que suma la ronda. */
  puntos: number;
}

/** Cada ronda ganada paga y además deja algo en la mesa: se acumula todo. */
export const CUP_ROUND_REWARDS: CupRoundReward[] = [
  { fichas: CUP_PURSE[0], extra: "Ficha de bronce", puntos: 10 },
  { fichas: CUP_PURSE[1], extra: "Naipe marcado", puntos: 25 },
  { fichas: CUP_PURSE[2], extra: "Anillo de la casa", puntos: 45 },
  { fichas: CUP_PURSE[3], extra: "Corona del Cuervo", puntos: 80 },
];

/** Bono por barrer el cuadro sin caer, encima de las cuatro bolsas. */
export const CUP_SWEEP_BONUS = 1000;

/* ─────────────────────────  Torneos programados  ─────────────────────── */

export interface CupSchedule {
  /** Timestamp de apertura. */
  at: number;
  gameId: string;
}

const SLOT_MS = 6 * 60 * 60 * 1000; // cuatro llamados por día

/** Próximos torneos programados: la casa abre mesa cada seis horas. */
export function cupSchedule(now = Date.now(), count = 4): CupSchedule[] {
  const first = Math.ceil(now / SLOT_MS) * SLOT_MS;
  const out: CupSchedule[] = [];
  for (let i = 0; i < count; i++) {
    const at = first + i * SLOT_MS;
    const idx = Math.floor(at / SLOT_MS) % CUP_GAMES.length;
    out.push({ at, gameId: CUP_GAMES[idx].id });
  }
  return out;
}

/** Cuenta regresiva legible ("2 h 14 m"). */
export function cupCountdown(target: number, now = Date.now()): string {
  const ms = Math.max(0, target - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h} h ${m} m`;
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m} m ${s} s`;
}

/* ─────────────────────────  Cupos y reintentos  ──────────────────────── */

/** Anotadas por día y reintentos por cuadro. */
export const CUP_ENTRIES_PER_DAY = 3;
export const CUP_RETRIES_PER_DAY = 2;

export function cupDayKey(date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/* ────────────────────  Rivales que leen tu desempeño  ────────────────── */

/**
 * Ajusta la garra del rival según cómo venís: `rating` va de -1 (te están
 * comiendo) a +1 (los pasás por arriba). Nunca deja la mesa floja ni imposible.
 */
export function ajustarGarra(base: number, rating: number, round: number): number {
  const empuje = Math.round(rating * 2); // -2..+2
  return Math.max(1, Math.min(5, base + empuje + Math.floor(round / 2)));
}

export function garraLabel(garra: number): string {
  if (garra <= 1) return "Tibio";
  if (garra === 2) return "Firme";
  if (garra === 3) return "Pesado";
  if (garra === 4) return "Hueso duro";
  return "De la casa";
}

/* ────────────────────────  Tabla de posiciones  ──────────────────────── */

export interface CupStanding {
  nombre: string;
  puntos: number;
  titulos: number;
  esVos: boolean;
}

const CASA_NOMBRES = RIVALES.map((r) => r.nombre);

/** Tabla por mesa: tus puntos contra los capos de la casa (determinista). */
export function buildStandings(
  gameId: string,
  misPuntos: number,
  misTitulos: number,
  jugador = "Vos",
): CupStanding[] {
  const base = hash(`standings:${gameId}`);
  const filas: CupStanding[] = CASA_NOMBRES.map((nombre) => {
    const h = hash(`${gameId}:${nombre}:${base}`);
    const puntos = 40 + (h % 320);
    return { nombre, puntos, titulos: (h >>> 9) % 4, esVos: false };
  });
  filas.push({ nombre: jugador, puntos: misPuntos, titulos: misTitulos, esVos: true });
  filas.sort((a, b) => b.puntos - a.puntos || b.titulos - a.titulos);
  return filas;
}

/* ───────────────────  Cuadro completo de 16 (estilo llave)  ───────────── */

export const CUP_ENTRANTS = 1 << CUP_TOTAL_ROUNDS; // 16 anotados, 4 rondas

/** Entrada al torneo: lo que cuesta anotarse en cada mesa. */
export const CUP_BUYIN = 200;

/** El pozo lo arma la mesa: todos ponen. */
export function cupPozo(buyin = CUP_BUYIN): number {
  return buyin * CUP_ENTRANTS;
}

export interface CupEntrant {
  nombre: string;
  apodo: string;
  garra: number;
  esVos: boolean;
  /** Récord del rival en el salón (sabor, se muestra al cruzarlo). */
  record: { g: number; p: number };
}

export interface CupBracket {
  entrants: CupEntrant[];
  /** Orden inicial de la llave (índices de `entrants`). */
  order: number[];
  /** Ganadores por ronda: winners[r][m] es índice de `entrants`. */
  winners: number[][];
  buyin: number;
  pozo: number;
}

function rngFrom(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

/** Arma la llave de 16: vos más quince capos de la casa. */
export function buildBracket(
  seed: string,
  jugador: string,
  rating: number,
  buyin = CUP_BUYIN,
): CupBracket {
  const rnd = rngFrom(seed);
  const pool = [...RIVALES];
  // Baraja el pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const rivales = pool.slice(0, CUP_ENTRANTS - 1).map((r) => ({
    nombre: r.nombre,
    apodo: r.apodo,
    garra: Math.max(1, Math.min(5, r.garra + (rnd() < 0.35 ? 1 : 0))),
    esVos: false,
    record: { g: 4 + Math.floor(rnd() * 40), p: 2 + Math.floor(rnd() * 25) },
  }));

  const vos: CupEntrant = {
    nombre: jugador,
    apodo: "vos",
    garra: 3,
    esVos: true,
    record: { g: 0, p: 0 },
  };
  const entrants = [vos, ...rivales];
  const order = entrants.map((_, i) => i);
  // Vos siempre arrancás arriba de la llave: se lee mejor en el celular.
  for (let i = order.length - 1; i > 1; i--) {
    const j = 1 + Math.floor(rnd() * i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  // Los pesados quedan del otro lado: tu rama sube de a poco.
  const mitad = order.slice(0, CUP_ENTRANTS / 2);
  const resto = order.slice(CUP_ENTRANTS / 2);
  mitad.sort((a, b) =>
    entrants[a].esVos ? -1 : entrants[b].esVos ? 1 : entrants[a].garra - entrants[b].garra,
  );

  return {
    entrants: entrants.map((e) =>
      e.esVos ? e : { ...e, garra: Math.max(1, Math.min(5, e.garra + Math.round(rating * 1.5))) },
    ),
    order: [...mitad, ...resto],
    winners: [],
    buyin,
    pozo: cupPozo(buyin),
  };
}

/** Índices de `entrants` que juegan la ronda `r`. */
export function participantsAt(b: CupBracket, r: number): number[] {
  return r === 0 ? b.order : (b.winners[r - 1] ?? []);
}

/** Cruces de la ronda `r` como pares de índices. */
export function matchesAt(b: CupBracket, r: number): Array<[number, number]> {
  const p = participantsAt(b, r);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < p.length; i += 2) out.push([p[i], p[i + 1]]);
  return out;
}

/** Rival del jugador en la ronda `r`, si ya está definido. */
export function rivalAt(b: CupBracket, r: number): CupEntrant | null {
  for (const [a, c] of matchesAt(b, r)) {
    if (b.entrants[a]?.esVos) return b.entrants[c] ?? null;
    if (b.entrants[c]?.esVos) return b.entrants[a] ?? null;
  }
  return null;
}

/**
 * Resuelve la ronda `r` completa: tu cruce lo decide la partida, los otros
 * se juegan solos en las mesas de al lado (peso por garra).
 */
export function resolveRound(b: CupBracket, r: number, ganasteVos: boolean): CupBracket {
  const rnd = rngFrom(`${b.order.join(",")}:${r}:${b.winners.length}`);
  const ganadores = matchesAt(b, r).map(([a, c]) => {
    const ea = b.entrants[a];
    const ec = b.entrants[c];
    if (ea.esVos) return ganasteVos ? a : c;
    if (ec.esVos) return ganasteVos ? c : a;
    const pa = (ea.garra + 1) / (ea.garra + ec.garra + 2);
    return rnd() < pa ? a : c;
  });
  const winners = [...b.winners];
  winners[r] = ganadores;
  return { ...b, winners: winners.slice(0, r + 1) };
}

/** Sigue vivo el jugador en la llave. */
export function playerAlive(b: CupBracket, r: number): boolean {
  return participantsAt(b, r).some((i) => b.entrants[i]?.esVos);
}
