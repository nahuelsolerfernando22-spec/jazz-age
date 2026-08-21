export type FactionId = "cuervo" | "escarlata" | "muelle" | "olivo" | "cofradia";

export interface Faction {
  id: FactionId;
  nombre: string;
  lema: string;
  color: string;
  sello: string;
  /** Refuerzos extra al comenzar cada turno */
  reinforceBonus: number;
  /** Dados que mejora el Soborno */
  bribeDice: number;
  /** Tropas que aporta el Golpe de Mano */
  surpriseTroops: number;
  /** Refuerzos extra al canjear un trío */
  tradeBonus: number;
  /** Texto del efecto de facción para la mesa de reglas */
  efecto: string;
}

export const FACCIONES: Faction[] = [
  {
    id: "cuervo",
    nombre: "Casa del Cuervo",
    lema: "La banca nunca duerme",
    color: "#c9a84c",
    sello: "♠",
    reinforceBonus: 1,
    bribeDice: 1,
    surpriseTroops: 3,
    tradeBonus: 0,
    efecto: "Renta de la casa: +1 refuerzo al abrir cada turno.",
  },
  {
    id: "escarlata",
    nombre: "Los Escarlata",
    lema: "Primero el plomo, después la charla",
    color: "#A83A3A",
    sello: "♥",
    reinforceBonus: 0,
    bribeDice: 2,
    surpriseTroops: 3,
    tradeBonus: 0,
    efecto: "Mano firme: el Soborno mejora 2 dados en vez de 1.",
  },
  {
    id: "muelle",
    nombre: "Muelle Azul",
    lema: "Todo lo que entra, pasa por acá",
    color: "#3E7C8C",
    sello: "♦",
    reinforceBonus: 0,
    bribeDice: 1,
    surpriseTroops: 3,
    tradeBonus: 1,
    efecto: "Contrabando: +1 refuerzo por cada canje de naipes.",
  },
  {
    id: "olivo",
    nombre: "Rama de Olivo",
    lema: "Se negocia con las manos llenas",
    color: "#6B7A3A",
    sello: "♣",
    reinforceBonus: 0,
    bribeDice: 1,
    surpriseTroops: 5,
    tradeBonus: 0,
    efecto: "Golpe pesado: el Golpe de Mano deja 5 tropas en vez de 3.",
  },
  {
    id: "cofradia",
    nombre: "La Cofradía",
    lema: "Nadie sabe quién manda",
    color: "#5B4B8A",
    sello: "◈",
    reinforceBonus: 0,
    bribeDice: 1,
    surpriseTroops: 3,
    tradeBonus: 2,
    efecto: "Red de contactos: +2 refuerzos por cada canje de naipes.",
  },
];

export const FACCION_POR_ID: Record<string, Faction> = Object.fromEntries(
  FACCIONES.map((f) => [f.id, f]),
);

export function faccionDe(id?: string): Faction {
  return (id && FACCION_POR_ID[id]) || FACCIONES[0];
}

export interface CardRule {
  titulo: string;
  icono: string;
  regla: string;
}

export const REGLAS_NAIPES: CardRule[] = [
  {
    titulo: "Trío de zonas",
    icono: "🃏",
    regla:
      "Tres naipes con el mismo símbolo o los tres distintos se canjean por refuerzos. Cada canje vale más que el anterior (4, 7, 10, 13...).",
  },
  {
    titulo: "Zona propia",
    icono: "📍",
    regla:
      "Si canjeás el naipe de un sector que ya controlás, ese sector recibe +2 tropas al instante.",
  },
  {
    titulo: "Soborno",
    icono: "💰",
    regla: "Durante el turno, tu mejor dado de asalto sube +1. Se gasta al usarse.",
  },
  {
    titulo: "Chivato",
    icono: "👁️",
    regla: "Revela las tropas enemigas del tablero hasta el fin de tu turno.",
  },
  {
    titulo: "Golpe de Mano",
    icono: "⚡",
    regla:
      "Refuerza al instante el sector propio seleccionado. Necesitás elegir sector antes de jugarla.",
  },
  {
    titulo: "Botín de guerra",
    icono: "🏴",
    regla: "Conquistar un sector en tu turno te entrega un naipe nuevo del mazo.",
  },
];
