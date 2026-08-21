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
