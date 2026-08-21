/**
 * Desafíos de mesa del Sindicato.
 *
 * Cada barrio tiene su propia casa de juego: antes de tirar los dados del
 * asalto, el jugador puede sentarse a la mesa del barrio y disputar una mano
 * rápida. Ganar suma un dado de ataque; perder le regala un dado a la defensa.
 * Así el mapa deja de ser sólo dados: cada zona se siente como la mesa que le
 * corresponde.
 */

export type DesafioTipo = "naipe" | "hueso" | "ruleta" | "suma15" | "carta-alta" | "monte";

export interface DesafioDef {
  /** Barrio al que pertenece la mesa. */
  barrio: string;
  /** Juego del salón con el que se identifica. */
  juego: string;
  titulo: string;
  /** Qué tiene que hacer el jugador, en una línea. */
  consigna: string;
  tipo: DesafioTipo;
}

const DESAFIOS: Record<string, DesafioDef> = {
  puerto: {
    barrio: "puerto",
    juego: "Cinco Huesos",
    titulo: "Huesos en el Dique",
    consigna: "Tirá los huesos: la suma más alta manda en el muelle.",
    tipo: "hueso",
  },
  bajo: {
    barrio: "bajo",
    juego: "Mentira Criolla",
    titulo: "Corte en la Taberna",
    consigna: "Cortá el mazo: naipe más fuerte gana la ronda.",
    tipo: "naipe",
  },
  casino: {
    barrio: "casino",
    juego: "Ruleta del Cuervo",
    titulo: "Giro en el Gran Casino",
    consigna: "Elegí color y que la bocha decida el barrio.",
    tipo: "ruleta",
  },
  rojo: {
    barrio: "rojo",
    juego: "Escoba de Quince",
    titulo: "Quince en el Distrito Rojo",
    consigna: "Sumá quince justo con la carta de la mesa.",
    tipo: "suma15",
  },
  alta: {
    barrio: "alta",
    juego: "Veintiuno del Sótano",
    titulo: "Banca de la Zona Alta",
    consigna: "Acercate a 21 sin pasarte; la casa se planta en 17.",
    tipo: "carta-alta",
  },
  rieles: {
    barrio: "rieles",
    juego: "Monte de la Viuda",
    titulo: "Monte en los Rieles",
    consigna: "Seguí la reina entre tres naipes cruzados.",
    tipo: "monte",
  },
};

const FALLBACK = DESAFIOS.bajo;

export function desafioDeBarrio(barrio: string | undefined): DesafioDef {
  if (!barrio) return FALLBACK;
  return DESAFIOS[barrio] ?? FALLBACK;
}

/** Naipes españoles ordenados de menor a mayor poder de truco. */
export const NAIPES: { label: string; poder: number; valor: number }[] = [
  { label: "4", poder: 1, valor: 4 },
  { label: "5", poder: 2, valor: 5 },
  { label: "6", poder: 3, valor: 6 },
  { label: "7 falso", poder: 4, valor: 7 },
  { label: "10", poder: 5, valor: 10 },
  { label: "11", poder: 6, valor: 10 },
  { label: "12", poder: 7, valor: 10 },
  { label: "1 falso", poder: 8, valor: 1 },
  { label: "2", poder: 9, valor: 2 },
  { label: "3", poder: 10, valor: 3 },
  { label: "7 de oro", poder: 11, valor: 7 },
  { label: "1 de basto", poder: 13, valor: 1 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface DesafioResultado {
  gano: boolean;
  /** Renglón corto que explica cómo terminó la mano. */
  detalle: string;
}

/** Corte de naipes: el más fuerte gana. */
export function resolverNaipe(): DesafioResultado {
  const mio = pick(NAIPES);
  const suyo = pick(NAIPES);
  return {
    gano: mio.poder > suyo.poder,
    detalle: `Tu ${mio.label} contra su ${suyo.label}`,
  };
}

/** Dos huesos por lado; suma más alta gana (empate a la casa). */
export function resolverHueso(): DesafioResultado {
  const d = () => 1 + Math.floor(Math.random() * 6);
  const mios = [d(), d()];
  const suyos = [d(), d()];
  const a = mios[0] + mios[1];
  const b = suyos[0] + suyos[1];
  return { gano: a > b, detalle: `${a} tuyos contra ${b} de la casa` };
}

/** Ruleta a color: 0 es de la banca. */
export function resolverRuleta(apuesta: "rojo" | "negro"): DesafioResultado {
  const n = Math.floor(Math.random() * 37);
  const rojos = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const color = n === 0 ? "cero" : rojos.has(n) ? "rojo" : "negro";
  return { gano: color === apuesta, detalle: `Salió ${n} (${color})` };
}

/** Escoba: la carta elegida debe completar quince con la de la mesa. */
export function resolverSuma15(cartaMesa: number, elegida: number): DesafioResultado {
  const suma = cartaMesa + elegida;
  return {
    gano: suma === 15,
    detalle:
      suma === 15 ? `${cartaMesa} + ${elegida} = quince` : `${cartaMesa} + ${elegida} = ${suma}`,
  };
}

/** Reparte tres cartas de escoba, garantizando que una sirva. */
export function repartirSuma15(): { mesa: number; opciones: number[] } {
  const mesa = 1 + Math.floor(Math.random() * 9);
  const buena = 15 - mesa > 10 ? 10 : 15 - mesa;
  const opciones = [buena];
  while (opciones.length < 3) {
    const c = 1 + Math.floor(Math.random() * 10);
    if (c !== buena && !opciones.includes(c)) opciones.push(c);
  }
  return { mesa, opciones: opciones.sort(() => Math.random() - 0.5) };
}

/** Veintiuno abreviado: el jugador puede pedir una carta más. */
export function resolverVeintiuno(pedir: boolean): DesafioResultado {
  const c = () => 1 + Math.floor(Math.random() * 10);
  let mia = c() + c();
  if (pedir) mia += c();
  let banca = c() + c();
  while (banca < 17) banca += c();
  if (mia > 21) return { gano: false, detalle: `Te pasaste con ${mia}` };
  if (banca > 21) return { gano: true, detalle: `La banca se pasó con ${banca}` };
  return { gano: mia > banca, detalle: `${mia} contra ${banca} de la banca` };
}

/** Monte: una de tres. */
export function resolverMonte(elegida: number, reina: number): DesafioResultado {
  return {
    gano: elegida === reina,
    detalle: elegida === reina ? "La reina estaba ahí" : `La reina estaba en la ${reina + 1}`,
  };
}
