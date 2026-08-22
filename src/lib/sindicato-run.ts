import { rngFromSeed, rngInt, rngShuffle } from "@/lib/rng";

export interface Talisman {
  id: string;
  nombre: string;
  icono: string;
  efecto: string;
}

export interface NaipeExtra {
  id: string;
  nombre: string;
  icono: string;
  efecto: string;
}

export const TALISMANES: Talisman[] = [
  {
    id: "anillo-rubi",
    nombre: "Anillo de Rubí",
    icono: "◈",
    efecto: "+1 dado al defender tus sectores.",
  },
  {
    id: "reloj-parado",
    nombre: "Reloj Parado",
    icono: "◍",
    efecto: "Los bonos de barrio cuentan doble.",
  },
  {
    id: "cuervo-embalsamado",
    nombre: "Cuervo Embalsamado",
    icono: "♠",
    efecto: "Revivís una vez y repetís la oleada.",
  },
  {
    id: "puro-apagado",
    nombre: "Puro Apagado",
    icono: "▮",
    efecto: "+2 refuerzos al abrir cada turno.",
  },
  {
    id: "llave-maestra",
    nombre: "Llave Maestra",
    icono: "⚿",
    efecto: "Los sectores vecinos cuestan 1 tropa menos de asalto.",
  },
  {
    id: "dado-cargado",
    nombre: "Dado Cargado",
    icono: "◆",
    efecto: "Tu peor dado de asalto se descarta una vez por turno.",
  },
  {
    id: "libreta-negra",
    nombre: "Libreta Negra",
    icono: "▤",
    efecto: "Ves las tropas enemigas del primer turno de cada oleada.",
  },
  {
    id: "moneda-doblada",
    nombre: "Moneda Doblada",
    icono: "◉",
    efecto: "+25 fichas por sector conquistado.",
  },
  {
    id: "cigarrera-plata",
    nombre: "Cigarrera de Plata",
    icono: "▰",
    efecto: "+1 vida para esta noche.",
  },
  {
    id: "lupa-detective",
    nombre: "Lupa de Detective",
    icono: "🔍",
    efecto: "Ves el objetivo secreto del rival.",
  },
  {
    id: "whisky-reserva",
    nombre: "Whisky Reserva",
    icono: "🥃",
    efecto: "Primer asalto del turno gana +1 a los dados.",
  },
];

export const NAIPES_EXTRA: NaipeExtra[] = [
  {
    id: "extorsion",
    nombre: "Extorsión",
    icono: "✎",
    efecto: "Robás 3 tropas de un sector enemigo vecino.",
  },
  {
    id: "doble-agente",
    nombre: "Doble Agente",
    icono: "◐",
    efecto: "Un sector enemigo con 1 tropa cambia de dueño.",
  },
  {
    id: "contrabando",
    nombre: "Contrabando",
    icono: "▣",
    efecto: "Canjeás un naipe cualquiera por 4 refuerzos.",
  },
  {
    id: "toque-de-queda",
    nombre: "Toque de Queda",
    icono: "☾",
    efecto: "El rival no puede asaltar en su próximo turno.",
  },
  {
    id: "delator",
    nombre: "Delator",
    icono: "☗",
    efecto: "Robás un naipe al rival con más sectores.",
  },
  {
    id: "sabotaje",
    nombre: "Sabotaje",
    icono: "🧨",
    efecto: "Eliminás la mitad de las tropas de un sector enemigo (mínimo 2).",
  },
];

export const CAPOS = [
  { nombre: "El Turco", regla: "Sus sectores nunca bajan de 2 tropas." },
  { nombre: "La Viuda", regla: "Roba un naipe tuyo al comenzar cada ronda." },
  { nombre: "Don Aníbal", regla: "Recibe +3 refuerzos por turno." },
];

/** Oleadas que dura una noche del Sindicato. */
export const OLAS_TOTALES = 5;

const TITULOS_ASALTO = [
  "Asalto al muelle",
  "Redada nocturna",
  "Pelea de callejón",
  "Toma del tranvía",
  "Golpe al depósito",
  "Cobro en el cabaret",
];

export interface OlaConfig {
  ola: number;
  titulo: string;
  /** bandas en la mesa, incluido el jugador */
  rivales: number;
  /** tropas extra con las que arranca cada bot */
  ventajaBot: number;
  /** sectores a controlar para superar la oleada */
  objetivo: number;
  esCapo: boolean;
  capo?: { nombre: string; regla: string };
  /** semilla del mapa procedural de esta oleada */
  mapSeed: string;
  /** sectores del mapa generado */
  sectores: number;
}

/** Dificultad y mapa de cada oleada de la noche. */
export function configOla(seed: string, ola: number): OlaConfig {
  const rng = rngFromSeed(`sindicato-ola:${seed}:${ola}`);
  const esCapo = ola === OLAS_TOTALES;
  // La ciudad nunca es la misma: la base crece con la oleada, pero cada run
  // la corre unos sectores para arriba o para abajo.
  const base = 16 + (ola - 1) * 3;
  const sectores = Math.max(12, Math.min(34, base + rngInt(rng, -4, 5)));
  const rivales = esCapo ? 2 : Math.min(5, 2 + Math.floor(ola / 1.5));
  const ventajaBot = esCapo ? 4 + ola * 2 : Math.floor((ola - 1) * 1.6);
  const reparto = Math.ceil(sectores / rivales);
  const objetivo = Math.max(
    4,
    Math.min(sectores - 2, reparto + (esCapo ? 6 : 3) + Math.floor(ola / 2)),
  );
  const capo = esCapo ? CAPOS[rngInt(rng, 0, CAPOS.length - 1)] : undefined;
  return {
    ola,
    titulo: esCapo
      ? `Ajuste de cuentas: ${capo!.nombre}`
      : TITULOS_ASALTO[rngInt(rng, 0, TITULOS_ASALTO.length - 1)],
    rivales,
    ventajaBot,
    objetivo,
    esCapo,
    capo,
    mapSeed: `${seed}-ola${ola}`,
    sectores,
  };
}

/** Botín que se ofrece al superar una oleada. */
export function ofrecerRecompensa(seed: string, ola: number) {
  const rng = rngFromSeed(`recompensa:${seed}:${ola}`);
  return {
    talismanes: rngShuffle(rng, TALISMANES).slice(0, 2),
    naipes: rngShuffle(rng, NAIPES_EXTRA).slice(0, 2),
  };
}

/** Favores del Cuervo que deja una noche según hasta dónde llegó. */
export function favoresDeRun(olasSuperadas: number, gano: boolean): number {
  return olasSuperadas * 10 + (gano ? 40 : 0);
}
