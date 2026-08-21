import { warmImages } from "@/lib/asset-manager";
import mahjongSheet1 from "@/assets/mahjong-tiles-sheet.webp";
import mahjongSheet2 from "@/assets/mahjong-tiles-sheet-2.webp";
import mahjongSheet3 from "@/assets/mahjong-tiles-sheet-3.webp";
import mahjongSheet4 from "@/assets/mahjong-tiles-sheet-4.webp";
import mahjongSheet5 from "@/assets/mahjong-tiles-sheet-5.webp";
import mahjongSpec1 from "@/assets/mahjong-specials-sheet.webp";
import mahjongSpec2 from "@/assets/mahjong-specials-sheet-2.webp";
import mahjongSpec3 from "@/assets/mahjong-specials-sheet-3.webp";
import mahjongSpec4 from "@/assets/mahjong-specials-sheet-4.webp";
import mahjongSpec5 from "@/assets/mahjong-specials-sheet-5.webp";

export const MAHJONG_CHAR_SHEETS = [
  mahjongSheet1,
  mahjongSheet2,
  mahjongSheet3,
  mahjongSheet4,
  mahjongSheet5,
] as const;

export const MAHJONG_SPEC_SHEETS = [
  mahjongSpec1,
  mahjongSpec2,
  mahjongSpec3,
  mahjongSpec4,
  mahjongSpec5,
] as const;

export const MAHJONG_CRITICAL_SHEETS = [
  mahjongSheet1,
  mahjongSheet2,
  mahjongSheet3,
  mahjongSheet4,
  mahjongSheet5,
  mahjongSpec1,
  mahjongSpec2,
  mahjongSpec3,
  mahjongSpec4,
  mahjongSpec5,
] as const;

export const JADE_LINES = {
  idle: [
    "Sentate. Tres iguales y desaparecen — como los problemas que no se nombran.",
    "Cuidá la bandeja. Cuando se llena, el dragón ya no espera.",
    "El mahjong premia al que mira sin parpadear.",
  ],
  trio: [
    "Trío limpio. El viento del este te sonríe.",
    "Tres fichas en silencio. Así se respeta la mesa.",
    "Bien visto. Mis tías de Cantón hubieran asentido.",
  ],
  win: [
    "Vaciaste el tablero. Esta noche el dragón come en tu mano.",
    "Mirá vos. Casi me hacés bajar la guardia.",
  ],
  lost: [
    "La bandeja te ganó. La casa cobra en silencio.",
    "Demasiada prisa, poco trío. Volvé cuando aprendas a esperar.",
  ],
};

export const LIN_LINES = {
  idle: [
    "Jade duerme la siesta. Esta noche el viento del este lo soplo yo.",
    "Cada ficha es un trazo. Mové la mano sin temblar.",
    "Tinta, papel, marfil — los tres callan mejor que un confesor.",
  ],
  trio: [
    "Trío firme. Pluma seca, ojo limpio.",
    "Así se escribe un nombre en la mesa.",
    "Tres iguales. El pincel ya no duda.",
  ],
  win: [
    "Vaciaste la bandeja. Le diré a Jade que no se confíe.",
    "Bonito gesto. Mañana lo cuento como leyenda.",
  ],
  lost: [
    "La bandeja te tragó. La tinta también se derrama.",
    "Otra vez será. El viento del este no perdona a los apurados.",
  ],
};

export function pickLine<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Precarga sólo las hojas de sprites que el tablero actual usa.
 *
 * Decodificar las 10 hojas cuesta ~100 MB de RAM en la WebView de Android y
 * es la causa de los tirones al abrir una partida: un nivel usa como mucho
 * una hoja de personajes y una de especiales por grupo.
 */
export async function preloadMahjongSheets(urls?: readonly string[]): Promise<boolean> {
  if (typeof window === "undefined") return true;
  const list = urls && urls.length > 0 ? urls : MAHJONG_CRITICAL_SHEETS;
  return warmImages(list, {
    priority: 1,
    fetchPriority: "high",
    decoding: "async",
    timeoutMs: 2200,
  });
}

/** Hojas realmente presentes en el tablero (dedupe estable para efectos). */
export function sheetsInUse(
  tiles: ReadonlyArray<{ variant?: string; sheet?: number; removed?: boolean }>,
): string[] {
  const set = new Set<string>();
  for (const t of tiles) {
    if (t.removed) continue;
    const idx = t.sheet ?? 0;
    const url = t.variant === "special" ? MAHJONG_SPEC_SHEETS[idx] : MAHJONG_CHAR_SHEETS[idx];
    if (url) set.add(url);
  }
  return Array.from(set).sort();
}
