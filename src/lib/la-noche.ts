/**
 * Modo "La Noche": una corrida roguelike que encadena cinco mesas y termina
 * en la mesa del Dueño.
 *
 * Cada corrida usa una semilla propia: el orden de las mesas, los eventos del
 * pasillo y los talismanes ofrecidos salen de ahí. Todo lo que juntes se
 * acumula hasta el cierre, así que la mesa del Dueño se juega con la noche
 * entera encima.
 */
import { rngFromSeed, rngShuffle } from "@/lib/rng";

export interface NocheMesa {
  gameId: string;
  label: string;
  route: string;
  /** Lo que pide la casa en esa mesa. */
  pedido: string;
  /** Mesa final: paga triple y define la noche. */
  jefe?: boolean;
}

export interface Talisman {
  id: string;
  nombre: string;
  efecto: string;
  /** Fichas extra por mesa ganada mientras esté en la mano. */
  bonoFichas: number;
  /** Multiplicador sobre el pago de cada mesa ganada. */
  mult?: number;
  /** Perdona una derrota: esa mesa se cobra igual. */
  seguro?: boolean;
}

const POZO_MESAS: NocheMesa[] = [
  { gameId: "truco", label: "Mentira Criolla", route: "/truco", pedido: "Ganá la mano larga." },
  {
    gameId: "truco-parejas",
    label: "Truco en Parejas",
    route: "/truco-parejas",
    pedido: "Ganá con tu socio a 15.",
  },
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
  {
    id: "herradura",
    nombre: "Herradura torcida",
    efecto: "Perdona una derrota: esa mesa se cobra igual.",
    bonoFichas: 20,
    seguro: true,
  },
  {
    id: "espejo",
    nombre: "Espejo rajado",
    efecto: "Multiplica por 1.3 el pago de cada mesa ganada.",
    bonoFichas: 0,
    mult: 1.3,
  },
  {
    id: "as-manga",
    nombre: "As en la manga",
    efecto: "Multiplica por 1.5 el pago, pero no suma fichas fijas.",
    bonoFichas: 0,
    mult: 1.5,
  },
  { id: "cigarrera", nombre: "Cigarrera de nácar", efecto: "65 fichas extra por mesa ganada.", bonoFichas: 65 },
  { id: "dado-cargado", nombre: "Dado cargado", efecto: "100 fichas extra por mesa ganada.", bonoFichas: 100 },
  {
    id: "escapulario",
    nombre: "Escapulario del croupier",
    efecto: "Perdona una derrota y suma 45 fichas por mesa.",
    bonoFichas: 45,
    seguro: true,
  },
  { id: "llave", nombre: "Llave del sótano", efecto: "85 fichas extra por mesa ganada.", bonoFichas: 85 },
  {
    id: "medalla",
    nombre: "Medalla del Dueño",
    efecto: "Multiplica por 1.2 y suma 40 fichas por mesa.",
    bonoFichas: 40,
    mult: 1.2,
  },
];

/** Mesas comunes antes del Dueño. */
export const NOCHE_MESAS = 5;
/** Mesas totales de la corrida, contando la del Dueño. */
export const NOCHE_TOTAL = NOCHE_MESAS + 1;
/** Premio de la casa por cerrar la noche completa. */
export const NOCHE_PREMIO = 1200;
/** Premio extra por ganarle al Dueño. */
export const NOCHE_PREMIO_JEFE = 1800;
/** Fichas base por cada mesa ganada. */
export const NOCHE_PAGO_MESA = 120;
/** La mesa del Dueño paga triple. */
export const NOCHE_MULT_JEFE = 3;

/* ---------------- Eventos del pasillo ---------------- */

export interface NocheEfecto {
  /** Fichas fijas que entran (o salen, si es negativo). */
  fichas?: number;
  /** Probabilidad de que salga mal (0..1). Si sale mal, se pierde `castigo`. */
  riesgo?: number;
  castigo?: number;
  premio?: number;
  /** Suma un talismán extra a la mano (se elige del pozo libre). */
  talismanExtra?: boolean;
  /** Salta la elección de talismán de este pasillo. */
  sinTalisman?: boolean;
}

export interface NocheOpcion {
  id: string;
  label: string;
  detalle: string;
  efecto: NocheEfecto;
}

export interface NocheEvento {
  id: string;
  titulo: string;
  texto: string;
  opciones: NocheOpcion[];
}

const EVENTOS: NocheEvento[] = [
  {
    id: "prestamista",
    titulo: "El prestamista del pasillo",
    texto: "Un tipo de sobretodo te ofrece plata fresca. Nadie presta gratis en esta casa.",
    opciones: [
      {
        id: "tomar",
        label: "Tomar el adelanto",
        detalle: "+320 fichas ahora, pero te quedás sin talismán en este pasillo.",
        efecto: { fichas: 320, sinTalisman: true },
      },
      {
        id: "rechazar",
        label: "Seguir de largo",
        detalle: "Elegís talismán normalmente.",
        efecto: {},
      },
    ],
  },
  {
    id: "trastienda",
    titulo: "Partida en la trastienda",
    texto: "Se juega una mano rápida atrás de la cortina. Puede salir cara.",
    opciones: [
      {
        id: "entrar",
        label: "Entrar a la mano",
        detalle: "60% de sacar 500 fichas, 40% de perder 250.",
        efecto: { riesgo: 0.4, premio: 500, castigo: 250 },
      },
      { id: "mirar", label: "Mirar desde la puerta", detalle: "+80 fichas por la data que juntás.", efecto: { fichas: 80 } },
    ],
  },
  {
    id: "encargado",
    titulo: "El encargado te cruza",
    texto: "Quiere su parte de lo que venís ganando. O algo a cambio.",
    opciones: [
      {
        id: "pagar",
        label: "Pagarle la coima",
        detalle: "-180 fichas, pero te suelta un talismán extra.",
        efecto: { fichas: -180, talismanExtra: true },
      },
      { id: "negar", label: "Hacerte el otario", detalle: "70% de zafar, 30% de perder 200 fichas.", efecto: { riesgo: 0.3, castigo: 200 } },
    ],
  },
  {
    id: "vestuario",
    titulo: "Puerta del vestuario",
    texto: "Alguien dejó un bolso abierto. Adentro brilla algo de latón.",
    opciones: [
      {
        id: "manotear",
        label: "Manotear lo que haya",
        detalle: "50% talismán extra, 50% te ven y perdés 150 fichas.",
        efecto: { riesgo: 0.5, castigo: 150, talismanExtra: true },
      },
      { id: "cerrar", label: "Cerrar el bolso", detalle: "+120 fichas de propina del dueño del bolso.", efecto: { fichas: 120 } },
    ],
  },
  {
    id: "barra",
    titulo: "Vuelta en la barra",
    texto: "La casa invita. Tomar afloja la mano, pero también la cabeza.",
    opciones: [
      { id: "tomar", label: "Aceptar la vuelta", detalle: "+200 fichas y sin talismán este pasillo.", efecto: { fichas: 200, sinTalisman: true } },
      { id: "agua", label: "Pedir agua", detalle: "Elegís talismán con la cabeza fría.", efecto: {} },
    ],
  },
  {
    id: "apuesta-lateral",
    titulo: "Apuesta lateral",
    texto: "Dos parroquianos discuten quién gana la próxima mesa. Te invitan a poner.",
    opciones: [
      {
        id: "poner",
        label: "Poner a favor tuyo",
        detalle: "65% de ganar 420 fichas, 35% de perder 220.",
        efecto: { riesgo: 0.35, premio: 420, castigo: 220 },
      },
      { id: "pasar", label: "No poner nada", detalle: "Seguís derecho al talismán.", efecto: {} },
    ],
  },
];

export function nuevaSemilla(): string {
  return `noche:${Date.now().toString(36)}:${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Cinco mesas comunes más la mesa del Dueño al final. */
export function armarNoche(seed: string): NocheMesa[] {
  const rng = rngFromSeed(seed);
  const orden = rngShuffle(rng, POZO_MESAS);
  const comunes = orden.slice(0, NOCHE_MESAS);
  const base = orden[NOCHE_MESAS] ?? orden[0]!;
  const jefe: NocheMesa = {
    ...base,
    label: `Mesa del Dueño · ${base.label}`,
    pedido: `${base.pedido} Y esta vez mira él.`,
    jefe: true,
  };
  return [...comunes, jefe];
}

/** Tres talismanes distintos para elegir después de la mesa `paso`. */
export function ofertaTalismanes(seed: string, paso: number, yaTengo: string[]): Talisman[] {
  const rng = rngFromSeed(`${seed}:talisman:${paso}`);
  const libres = TALISMANES.filter((t) => !yaTengo.includes(t.id));
  const pozo = libres.length >= 3 ? libres : TALISMANES;
  return rngShuffle(rng, pozo).slice(0, 3);
}

/** Evento de pasillo después de la mesa `paso`. */
export function eventoDeNoche(seed: string, paso: number): NocheEvento {
  const rng = rngFromSeed(`${seed}:evento:${paso}`);
  return rngShuffle(rng, EVENTOS)[0]!;
}

/** Talismán suelto que regala un evento. */
export function talismanRegalado(seed: string, paso: number, yaTengo: string[]): Talisman | null {
  const rng = rngFromSeed(`${seed}:regalo:${paso}`);
  const libres = TALISMANES.filter((t) => !yaTengo.includes(t.id));
  if (!libres.length) return null;
  return rngShuffle(rng, libres)[0]!;
}

export function bonoDeTalismanes(ids: string[]): number {
  return ids.reduce((sum, id) => sum + (TALISMANES.find((t) => t.id === id)?.bonoFichas ?? 0), 0);
}

export function multDeTalismanes(ids: string[]): number {
  return ids.reduce((m, id) => m * (TALISMANES.find((t) => t.id === id)?.mult ?? 1), 1);
}

/** Cuántas derrotas puede perdonar la mano actual. */
export function segurosDeTalismanes(ids: string[]): number {
  return ids.filter((id) => TALISMANES.find((t) => t.id === id)?.seguro).length;
}

/** Pago de una mesa ganada con la mano actual. */
export function pagoDeMesa(ids: string[], jefe: boolean): number {
  const base = (NOCHE_PAGO_MESA + bonoDeTalismanes(ids)) * (jefe ? NOCHE_MULT_JEFE : 1);
  return Math.round(base * multDeTalismanes(ids));
}
