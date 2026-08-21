import mapaNoirFinal from "@/assets/mapa-sindicato-arte.jpg";

export type BarrioId = "puerto" | "bajo" | "casino" | "rojo" | "alta" | "rieles";

export interface Point {
  x: number;
  y: number;
}

export interface Barrio {
  id: BarrioId;
  nombre: string;
  color: string;
  bonus: number;
}

export interface Territorio {
  id: string;
  nombre: string;
  barrio: BarrioId;
  points: Point[];
  vecinos: string[];
}

export const BARRIOS: Barrio[] = [
  { id: "puerto", nombre: "PUERTO OSCURO", color: "#C68A3E", bonus: 7 },
  { id: "bajo", nombre: "BAJO FONDO", color: "#A83A3A", bonus: 5 },
  { id: "casino", nombre: "DISTRITO CASINO", color: "#3E7C8C", bonus: 5 },
  { id: "rojo", nombre: "DISTRITO ROJO", color: "#6B7A3A", bonus: 5 },
  { id: "alta", nombre: "ZONA ALTA", color: "#5B4B8A", bonus: 7 },
  { id: "rieles", nombre: "LOS RIELES", color: "#4A4A4A", bonus: 5 },
];

export const TERRITORIOS: Territorio[] = [
  // 1. PUERTO OSCURO (Northwest Quadrant - 0-38x, 0-50y)
  {
    id: "puerto-1",
    nombre: "Dique Norte",
    barrio: "puerto",
    points: [
      { x: 5, y: 5 },
      { x: 35, y: 5 },
      { x: 35, y: 15 },
      { x: 5, y: 15 },
    ],
    vecinos: ["puerto-2", "puerto-6", "bajo-1"],
  },
  {
    id: "puerto-2",
    nombre: "Aduana Vieja",
    barrio: "puerto",
    points: [
      { x: 5, y: 15 },
      { x: 35, y: 15 },
      { x: 35, y: 30 },
      { x: 5, y: 30 },
    ],
    vecinos: ["puerto-1", "puerto-3", "bajo-2"],
  },
  {
    id: "puerto-3",
    nombre: "Grúa Mayor",
    barrio: "puerto",
    points: [
      { x: 5, y: 30 },
      { x: 25, y: 30 },
      { x: 25, y: 45 },
      { x: 5, y: 45 },
    ],
    vecinos: ["puerto-2", "puerto-4", "bajo-3"],
  },
  {
    id: "puerto-4",
    nombre: "Depósito 12",
    barrio: "puerto",
    points: [
      { x: 25, y: 30 },
      { x: 35, y: 30 },
      { x: 35, y: 45 },
      { x: 25, y: 45 },
    ],
    vecinos: ["puerto-3", "puerto-5", "casino-3"],
  },
  {
    id: "puerto-5",
    nombre: "Hangar Naval",
    barrio: "puerto",
    points: [
      { x: 20, y: 45 },
      { x: 35, y: 45 },
      { x: 35, y: 50 },
      { x: 20, y: 50 },
    ],
    vecinos: ["puerto-4", "puerto-6", "rieles-1"],
  },
  {
    id: "puerto-6",
    nombre: "Astilleros",
    barrio: "puerto",
    points: [
      { x: 5, y: 45 },
      { x: 20, y: 45 },
      { x: 20, y: 50 },
      { x: 5, y: 50 },
    ],
    vecinos: ["puerto-1", "puerto-5", "puerto-7"],
  },
  {
    id: "puerto-7",
    nombre: "Muelles Bajos",
    barrio: "puerto",
    points: [
      { x: 2, y: 10 },
      { x: 5, y: 10 },
      { x: 5, y: 50 },
      { x: 2, y: 50 },
    ],
    vecinos: ["puerto-6", "rieles-3", "rieles-1"],
  },

  // 2. BAJO FONDO (North Central Quadrant - 38-65x, 0-50y)
  {
    id: "bajo-1",
    nombre: "Andén Tres",
    barrio: "bajo",
    points: [
      { x: 40, y: 5 },
      { x: 62, y: 5 },
      { x: 62, y: 15 },
      { x: 40, y: 15 },
    ],
    vecinos: ["puerto-1", "bajo-2", "alta-1"],
  },
  {
    id: "bajo-2",
    nombre: "Lonja Central",
    barrio: "bajo",
    points: [
      { x: 40, y: 15 },
      { x: 62, y: 15 },
      { x: 62, y: 30 },
      { x: 40, y: 30 },
    ],
    vecinos: ["bajo-1", "bajo-3", "puerto-2"],
  },
  {
    id: "bajo-3",
    nombre: "Callejón Niebla",
    barrio: "bajo",
    points: [
      { x: 40, y: 30 },
      { x: 50, y: 30 },
      { x: 50, y: 45 },
      { x: 40, y: 45 },
    ],
    vecinos: ["bajo-2", "puerto-3", "bajo-4"],
  },
  {
    id: "bajo-4",
    nombre: "Antro Parias",
    barrio: "bajo",
    points: [
      { x: 50, y: 30 },
      { x: 62, y: 30 },
      { x: 62, y: 45 },
      { x: 50, y: 45 },
    ],
    vecinos: ["bajo-3", "bajo-5", "casino-4"],
  },
  {
    id: "bajo-5",
    nombre: "Taberna Sorda",
    barrio: "bajo",
    points: [
      { x: 40, y: 45 },
      { x: 50, y: 45 },
      { x: 50, y: 50 },
      { x: 40, y: 50 },
    ],
    vecinos: ["bajo-4", "bajo-6", "rojo-1"],
  },
  {
    id: "bajo-6",
    nombre: "Bunker 44",
    barrio: "bajo",
    points: [
      { x: 50, y: 45 },
      { x: 62, y: 45 },
      { x: 62, y: 50 },
      { x: 50, y: 50 },
    ],
    vecinos: ["bajo-2", "bajo-5", "alta-6"],
  },
  {
    id: "bajo-7",
    nombre: "Pasadizo",
    barrio: "bajo",
    points: [
      { x: 38, y: 5 },
      { x: 40, y: 5 },
      { x: 40, y: 50 },
      { x: 38, y: 50 },
    ],
    vecinos: ["bajo-5", "rojo-3", "casino-5"],
  },

  // 3. DISTRITO CASINO (Northeast Quadrant - 65-100x, 0-50y)
  {
    id: "casino-1",
    nombre: "Gran Casino",
    barrio: "casino",
    points: [
      { x: 67, y: 5 },
      { x: 95, y: 5 },
      { x: 95, y: 15 },
      { x: 67, y: 15 },
    ],
    vecinos: ["casino-2", "alta-5"],
  },
  {
    id: "casino-2",
    nombre: "Hotel Royale",
    barrio: "casino",
    points: [
      { x: 67, y: 15 },
      { x: 95, y: 15 },
      { x: 95, y: 30 },
      { x: 67, y: 30 },
    ],
    vecinos: ["casino-1", "casino-6"],
  },
  {
    id: "casino-3",
    nombre: "Paseo Oro",
    barrio: "casino",
    points: [
      { x: 67, y: 30 },
      { x: 80, y: 30 },
      { x: 80, y: 45 },
      { x: 67, y: 45 },
    ],
    vecinos: ["puerto-4", "bajo-3", "casino-4"],
  },
  {
    id: "casino-4",
    nombre: "Club Jazz",
    barrio: "casino",
    points: [
      { x: 80, y: 30 },
      { x: 95, y: 30 },
      { x: 95, y: 45 },
      { x: 80, y: 45 },
    ],
    vecinos: ["casino-3", "bajo-4", "casino-5"],
  },
  {
    id: "casino-5",
    nombre: "Teatro Lírico",
    barrio: "casino",
    points: [
      { x: 67, y: 45 },
      { x: 80, y: 45 },
      { x: 80, y: 50 },
      { x: 67, y: 50 },
    ],
    vecinos: ["casino-4", "bajo-7", "rieles-2"],
  },
  {
    id: "casino-6",
    nombre: "Banca Central",
    barrio: "casino",
    points: [
      { x: 80, y: 45 },
      { x: 95, y: 45 },
      { x: 95, y: 50 },
      { x: 80, y: 50 },
    ],
    vecinos: ["casino-2", "casino-7", "rojo-2"],
  },
  {
    id: "casino-7",
    nombre: "Galerías",
    barrio: "casino",
    points: [
      { x: 64, y: 5 },
      { x: 67, y: 5 },
      { x: 67, y: 50 },
      { x: 64, y: 50 },
    ],
    vecinos: ["casino-6", "rojo-1"],
  },

  // 4. LOS RIELES (Southwest Quadrant - 0-38x, 50-100y)
  {
    id: "rieles-1",
    nombre: "Vagón Correo",
    barrio: "rieles",
    points: [
      { x: 5, y: 55 },
      { x: 35, y: 55 },
      { x: 35, y: 65 },
      { x: 5, y: 65 },
    ],
    vecinos: ["puerto-5", "puerto-7", "rieles-2"],
  },
  {
    id: "rieles-2",
    nombre: "El Tribunal",
    barrio: "rieles",
    points: [
      { x: 5, y: 65 },
      { x: 35, y: 65 },
      { x: 35, y: 80 },
      { x: 5, y: 80 },
    ],
    vecinos: ["rieles-1", "casino-5", "rieles-3"],
  },
  {
    id: "rieles-3",
    nombre: "Galpón 13",
    barrio: "rieles",
    points: [
      { x: 5, y: 80 },
      { x: 20, y: 80 },
      { x: 20, y: 95 },
      { x: 5, y: 95 },
    ],
    vecinos: ["rieles-2", "puerto-7", "rieles-4"],
  },
  {
    id: "rieles-4",
    nombre: "Camposanto",
    barrio: "rieles",
    points: [
      { x: 20, y: 80 },
      { x: 35, y: 80 },
      { x: 35, y: 95 },
      { x: 20, y: 95 },
    ],
    vecinos: ["rieles-3", "rieles-5"],
  },
  {
    id: "rieles-5",
    nombre: "Feria Local",
    barrio: "rieles",
    points: [
      { x: 5, y: 95 },
      { x: 20, y: 95 },
      { x: 20, y: 99 },
      { x: 5, y: 99 },
    ],
    vecinos: ["rieles-4", "rieles-2", "rieles-6"],
  },
  {
    id: "rieles-6",
    nombre: "Puente Lágr.",
    barrio: "rieles",
    points: [
      { x: 20, y: 95 },
      { x: 35, y: 95 },
      { x: 35, y: 99 },
      { x: 20, y: 99 },
    ],
    vecinos: ["rieles-5", "rojo-6", "alta-3"],
  },
  {
    id: "rieles-7",
    nombre: "Canódromo",
    barrio: "rieles",
    points: [
      { x: 2, y: 55 },
      { x: 5, y: 55 },
      { x: 5, y: 99 },
      { x: 2, y: 99 },
    ],
    vecinos: ["rieles-4", "rieles-5"],
  },

  // 5. ZONA ALTA (South Central Quadrant - 38-65x, 50-100y)
  {
    id: "alta-1",
    nombre: "Muelles Este",
    barrio: "alta",
    points: [
      { x: 40, y: 55 },
      { x: 62, y: 55 },
      { x: 62, y: 65 },
      { x: 40, y: 65 },
    ],
    vecinos: ["bajo-1", "alta-2"],
  },
  {
    id: "alta-2",
    nombre: "Estación N.",
    barrio: "alta",
    points: [
      { x: 40, y: 65 },
      { x: 62, y: 65 },
      { x: 62, y: 80 },
      { x: 40, y: 80 },
    ],
    vecinos: ["alta-1", "alta-6", "casino-1"],
  },
  {
    id: "alta-3",
    nombre: "Puente Hierro",
    barrio: "alta",
    points: [
      { x: 40, y: 80 },
      { x: 50, y: 80 },
      { x: 50, y: 95 },
      { x: 40, y: 95 },
    ],
    vecinos: ["rojo-5", "alta-4", "rieles-6"],
  },
  {
    id: "alta-4",
    nombre: "Grúa Oxidada",
    barrio: "alta",
    points: [
      { x: 50, y: 80 },
      { x: 62, y: 80 },
      { x: 62, y: 95 },
      { x: 50, y: 95 },
    ],
    vecinos: ["alta-3", "alta-7"],
  },
  {
    id: "alta-5",
    nombre: "Palco VIP",
    barrio: "alta",
    points: [
      { x: 40, y: 95 },
      { x: 50, y: 95 },
      { x: 50, y: 99 },
      { x: 40, y: 99 },
    ],
    vecinos: ["casino-1", "alta-2"],
  },
  {
    id: "alta-6",
    nombre: "Mansión Alta",
    barrio: "alta",
    points: [
      { x: 50, y: 95 },
      { x: 62, y: 95 },
      { x: 62, y: 99 },
      { x: 50, y: 99 },
    ],
    vecinos: ["alta-2", "bajo-6", "alta-7"],
  },
  {
    id: "alta-7",
    nombre: "Club Privado",
    barrio: "alta",
    points: [
      { x: 38, y: 55 },
      { x: 40, y: 55 },
      { x: 40, y: 99 },
      { x: 38, y: 99 },
    ],
    vecinos: ["alta-6", "alta-4", "rojo-1"],
  },

  // 6. DISTRITO ROJO (South East Quadrant - 65-100x, 50-100y)
  {
    id: "rojo-1",
    nombre: "Reserva Fed.",
    barrio: "rojo",
    points: [
      { x: 67, y: 55 },
      { x: 95, y: 55 },
      { x: 95, y: 65 },
      { x: 67, y: 65 },
    ],
    vecinos: ["bajo-5", "casino-7", "rojo-2", "rojo-3"],
  },
  {
    id: "rojo-2",
    nombre: "El Claustro",
    barrio: "rojo",
    points: [
      { x: 67, y: 65 },
      { x: 95, y: 65 },
      { x: 95, y: 80 },
      { x: 67, y: 80 },
    ],
    vecinos: ["casino-6", "rojo-1", "rojo-7"],
  },
  {
    id: "rojo-3",
    nombre: "Empeños Oro",
    barrio: "rojo",
    points: [
      { x: 67, y: 80 },
      { x: 80, y: 80 },
      { x: 80, y: 95 },
      { x: 67, y: 95 },
    ],
    vecinos: ["bajo-7", "rojo-1", "rojo-4"],
  },
  {
    id: "rojo-4",
    nombre: "Cervecería",
    barrio: "rojo",
    points: [
      { x: 80, y: 80 },
      { x: 95, y: 80 },
      { x: 95, y: 95 },
      { x: 80, y: 95 },
    ],
    vecinos: ["rojo-3", "rojo-5", "rojo-7"],
  },
  {
    id: "rojo-5",
    nombre: "Sastrería",
    barrio: "rojo",
    points: [
      { x: 67, y: 95 },
      { x: 80, y: 95 },
      { x: 80, y: 99 },
      { x: 67, y: 99 },
    ],
    vecinos: ["rojo-4", "rojo-6", "alta-3"],
  },
  {
    id: "rojo-6",
    nombre: "Ópera",
    barrio: "rojo",
    points: [
      { x: 80, y: 95 },
      { x: 95, y: 95 },
      { x: 95, y: 99 },
      { x: 80, y: 99 },
    ],
    vecinos: ["rojo-3", "rojo-5", "rieles-6"],
  },
  {
    id: "rojo-7",
    nombre: "Citas Privadas",
    barrio: "rojo",
    points: [
      { x: 64, y: 55 },
      { x: 67, y: 55 },
      { x: 67, y: 99 },
      { x: 64, y: 99 },
    ],
    vecinos: ["rojo-2", "rojo-4"],
  },
];

export const MAP_IMAGE_URL = mapaNoirFinal;

export const TERRITORIOS_POR_ID: Record<string, Territorio> = Object.fromEntries(
  TERRITORIOS.map((t) => [t.id, t]),
);

export const TERRITORIOS_POR_BARRIO: Record<BarrioId, Territorio[]> = BARRIOS.reduce(
  (acc, barrio) => {
    acc[barrio.id] = TERRITORIOS.filter((t) => t.barrio === barrio.id);
    return acc;
  },
  {} as Record<BarrioId, Territorio[]>,
);

export function sonVecinos(a: string, b: string): boolean {
  return TERRITORIOS_POR_ID[a]?.vecinos.includes(b) ?? false;
}
