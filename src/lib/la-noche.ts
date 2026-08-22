/**
 * Modo "La Noche": una corrida roguelike que encadena cinco mesas distintas.
 *
 * Cada corrida usa una semilla propia: el orden de las mesas, los talismanes
 * ofrecidos entre mesa y mesa y las cuotas de la banca salen de ahí. Los
 * talismanes se acumulan durante toda la noche, así que la última mesa se
 * juega con todo lo que juntaste.
 */
import { rngFromSeed, rngShuffle } from "@/lib/rng";

export interface NocheMesa {
  gameId: string;
  label: string;
  route: string;
  /** Lo que pide la casa en esa mesa. */
  pedido: string;
}

export interface Talisman {
  id: string;
  nombre: string;
  efecto: string;
  /** Fichas extra por mesa ganada mientras esté en la mano. */
  bonoFichas: number;
}

const POZO_MESAS: NocheMesa[] = [
  { gameId: "truco", label: "Mentira Criolla", route: "/truco", pedido: "Ganá la mano larga." },
  { gameId: "chinchon", label: "El Corte Sucio", route: "/chinchon", pedido: "Cortá primero." },
  { gameId: "blackjack", label: "Filo de Veintiuno", route: "/tables", pedido: "Sacale la mesa al croupier." },
  { gameId: "poker", label: "Cara de Piedra", route: "/poker", pedido: "Cerrá el duelo arriba." },
  { gameId: "escoba", label: "Barrido de Quince", route: "/escoba", pedido: "Barré la mesa." },
  { gameId: "dados", label: "Cinco Huesos", route: "/dados", pedido: "Llená la planilla." },
  { gameId: "mahjong", label: "Marfil Paciente", route: "/mahjong", pedido: "Levantá el tablero." },
  { gameId: "solitario", label: "La Mano Muerta", route: "/solitario", pedido: "Cerrá el mazo." },
];

export const TALISMANES: Talisman[] = [
  { id: "dedal", nombre: "Dedal de plomo", efecto: "La casa paga 40 fichas extra por mesa ganada.", bonoFichas: 40 },
  { id: "moneda", nombre: "Moneda mordida", efecto: "60 fichas extra por mesa ganada.", bonoFichas: 60 },
  { id: "naipe", nombre: "Naipe marcado", efecto: "80 fichas extra por mesa ganada.", bonoFichas: 80 },
  { id: "rosario", nombre: "Rosario del puerto", efecto: "50 fichas extra y aguante para la noche.", bonoFichas: 50 },
  { id: "pluma", nombre: "Pluma de cuervo", efecto: "70 fichas extra por mesa ganada.", bonoFichas: 70 },
  { id: "reloj", nombre: "Reloj parado", efecto: "90 fichas extra por mesa ganada.", bonoFichas: 90 },
  { id: "anillo", nombre: "Anillo de latón", efecto: "55 fichas extra por mesa ganada.", bonoFichas: 55 },
  { id: "cuchillo", nombre: "Cuchillo sin filo", efecto: "75 fichas extra por mesa ganada.", bonoFichas: 75 },
];

export const NOCHE_MESAS = 5;
/** Premio de la casa por cerrar la noche completa. */
export const NOCHE_PREMIO = 1200;
/** Fichas base por cada mesa ganada. */
export const NOCHE_PAGO_MESA = 120;

export function nuevaSemilla(): string {
  return `noche:${Date.now().toString(36)}:${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function armarNoche(seed: string): NocheMesa[] {
  const rng = rngFromSeed(seed);
  return rngShuffle(rng, POZO_MESAS).slice(0, NOCHE_MESAS);
}

/** Tres talismanes distintos para elegir después de la mesa `paso`. */
export function ofertaTalismanes(seed: string, paso: number, yaTengo: string[]): Talisman[] {
  const rng = rngFromSeed(`${seed}:talisman:${paso}`);
  const libres = TALISMANES.filter((t) => !yaTengo.includes(t.id));
  const pozo = libres.length >= 3 ? libres : TALISMANES;
  return rngShuffle(rng, pozo).slice(0, 3);
}

export function bonoDeTalismanes(ids: string[]): number {
  return ids.reduce((sum, id) => sum + (TALISMANES.find((t) => t.id === id)?.bonoFichas ?? 0), 0);
}
