// "La Apuesta de Clara": antes de cada giro, Clara canta su corazonada y el
// jugador decide si la acompaña o la desafía. La ganancia depende de la
// probabilidad real de la corazonada, no de un multiplicador inventado.
import { colorOf, N } from "@/lib/roulette-math";

export type ClaraClaimKind = "color" | "paridad" | "docena" | "mitad" | "vecinos";

export interface ClaraClaim {
  kind: ClaraClaimKind;
  /** Números que hacen ganar la corazonada. */
  nums: number[];
  /** Texto que canta Clara. */
  frase: string;
  /** Etiqueta corta para el chip. */
  etiqueta: string;
  /** Cuán segura se la ve (0-1). Solo teatro, no cambia el pago. */
  seguridad: number;
}

const rango = (a: number, b: number) => {
  const out: number[] = [];
  for (let i = a; i <= b; i += 1) out.push(i);
  return out;
};

const COLOR_NUMS = (c: "red" | "black") =>
  rango(1, N - 1).filter((n) => colorOf(n) === c);

const VECINOS_ORDEN = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

/** Genera la corazonada de Clara de forma determinista para un giro dado. */
export function generarCorazonada(rand: () => number): ClaraClaim {
  const tipo = rand();
  const seguridad = 0.35 + rand() * 0.6;

  if (tipo < 0.28) {
    const rojo = rand() < 0.5;
    return {
      kind: "color",
      nums: COLOR_NUMS(rojo ? "red" : "black"),
      frase: rojo
        ? "Esta noche la rueda tiene sangre. Va al rojo."
        : "Huele a luto. Sale negro, hacéme caso.",
      etiqueta: rojo ? "ROJO" : "NEGRO",
      seguridad,
    };
  }

  if (tipo < 0.52) {
    const par = rand() < 0.5;
    return {
      kind: "paridad",
      nums: rango(1, N - 1).filter((n) => (n % 2 === 0) === par),
      frase: par
        ? "La bolita viene de a dos. Par, sin vueltas."
        : "Hoy nada se reparte parejo. Impar.",
      etiqueta: par ? "PAR" : "IMPAR",
      seguridad,
    };
  }

  if (tipo < 0.76) {
    const d = Math.floor(rand() * 3);
    const desde = d * 12 + 1;
    return {
      kind: "docena",
      nums: rango(desde, desde + 11),
      frase: [
        "La primera docena está caliente, la vengo mirando.",
        "El medio de la mesa, ahí anda la plata.",
        "Los números grandes. Los ricos siempre caen últimos.",
      ][d]!,
      etiqueta: `${d + 1}ª DOCENA`,
      seguridad,
    };
  }

  if (tipo < 0.9) {
    const baja = rand() < 0.5;
    return {
      kind: "mitad",
      nums: baja ? rango(1, 18) : rango(19, 36),
      frase: baja
        ? "Abajo, con los que trabajamos. 1 al 18."
        : "Arriba, con los que mandan. 19 al 36.",
      etiqueta: baja ? "1–18" : "19–36",
      seguridad,
    };
  }

  // Vecinos: cinco casillas contiguas de la rueda. Poca chance, buen pago.
  const centro = Math.floor(rand() * VECINOS_ORDEN.length);
  const nums: number[] = [];
  for (let i = -2; i <= 2; i += 1) {
    const idx = (centro + i + VECINOS_ORDEN.length) % VECINOS_ORDEN.length;
    nums.push(VECINOS_ORDEN[idx]!);
  }
  return {
    kind: "vecinos",
    nums,
    frase: `Me juego el sueldo: cae cerca del ${VECINOS_ORDEN[centro]}.`,
    etiqueta: `VECINOS DEL ${VECINOS_ORDEN[centro]}`,
    seguridad: 0.85 + rand() * 0.15,
  };
}

export type LadoClara = "acompañar" | "desafiar";

/** Multiplicador total devuelto (incluye la ficha apostada). */
export function multiplicadorClara(claim: ClaraClaim, lado: LadoClara): number {
  const p = claim.nums.length / N;
  const prob = lado === "acompañar" ? p : 1 - p;
  if (prob <= 0) return 0;
  // 4% de comisión de la casa: Clara no regala nada.
  const bruto = (1 / prob) * 0.96;
  return Math.max(1.05, Math.round(bruto * 100) / 100);
}

export function resolverApuestaClara(
  claim: ClaraClaim,
  lado: LadoClara,
  n: number,
): { acertoClara: boolean; gano: boolean } {
  const acertoClara = claim.nums.includes(n);
  return { acertoClara, gano: lado === "acompañar" ? acertoClara : !acertoClara };
}

/** Registro honesto de la puntería de Clara, persistido entre sesiones. */
export interface LegajoClara {
  corazonadas: number;
  aciertos: number;
  acompanadas: number;
  desafios: number;
  fichasNetas: number;
}

const KEY = "cuervo:ruleta:legajoClara:v1";

export const LEGAJO_VACIO: LegajoClara = {
  corazonadas: 0,
  aciertos: 0,
  acompanadas: 0,
  desafios: 0,
  fichasNetas: 0,
};

export function leerLegajoClara(): LegajoClara {
  if (typeof window === "undefined") return { ...LEGAJO_VACIO };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...LEGAJO_VACIO };
    const parsed = JSON.parse(raw) as Partial<LegajoClara>;
    return { ...LEGAJO_VACIO, ...parsed };
  } catch {
    return { ...LEGAJO_VACIO };
  }
}

export function guardarLegajoClara(l: LegajoClara): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(l));
  } catch {
    /* noop */
  }
}

export function punteriaClara(l: LegajoClara): number | null {
  if (l.corazonadas < 3) return null;
  return Math.round((l.aciertos / l.corazonadas) * 100);
}

export function frasePosGiro(acertoClara: boolean, gano: boolean): string {
  if (acertoClara && gano) return "Te dije. La rueda me habla al oído.";
  if (acertoClara && !gano) return "Desconfiaste de mí y mirá cómo te fue.";
  if (!acertoClara && gano) return "Bueno… me leíste. No te acostumbres.";
  return "Erré yo y perdiste vos. Empatamos en desgracia.";
}
