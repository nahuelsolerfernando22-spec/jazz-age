import type { LevelDef } from "@/lib/games/mahjong/mahjong-levels";

export type MahjongPresagioId =
  "rot_vivo" | "guardias_dobles" | "manos_atadas" | "bendicion_dorada";

export interface MahjongPresagio {
  id: MahjongPresagioId;
  title: string;
  omen: string;
  effect: string;
}

export const MAHJONG_PRESAGIOS: MahjongPresagio[] = [
  {
    id: "rot_vivo",
    title: "La Podredumbre Viva",
    omen: "«Lo podrido busca compañía. Contagia todo lo que toca.»",
    effect: "Al caer, una podrida infecta a una vecina libre.",
  },
  {
    id: "guardias_dobles",
    title: "Los Guardias Dobles",
    omen: "«El Cuervo dobla las cadenas. Ábrelas con paciencia.»",
    effect: "+2 sellos al iniciar, cada uno pide un eslabón extra.",
  },
  {
    id: "manos_atadas",
    title: "Manos Atadas",
    omen: "«No hay marcha atrás esta noche.»",
    effect: "−2 undos, −1 mezcla. Cada set paga +15%.",
  },
  {
    id: "bendicion_dorada",
    title: "La Bendición Dorada",
    omen: "«Los especiales brillan doble, si sabés cerrarlos.»",
    effect: "Puertas piden +1 par. Especiales pagan +50%.",
  },
];

export function drawMahjongPresagio(): MahjongPresagio {
  return MAHJONG_PRESAGIOS[Math.floor(Math.random() * MAHJONG_PRESAGIOS.length)];
}

export function applyPresagioToLevel(lv: LevelDef, p: MahjongPresagio | null): LevelDef {
  if (!p) return lv;
  const next: LevelDef = { ...lv };
  if (p.id === "guardias_dobles") {
    const cur = lv.seals;
    next.seals = {
      count: (cur?.count ?? 0) + 2,
      strength: Math.max(1, (cur?.strength ?? 1) + 1),
    };
  }
  if (p.id === "manos_atadas") {
    next.undoLimit = Math.max(0, (lv.undoLimit ?? 3) - 2);
    if (Number.isFinite(lv.reshuffleLimit as number)) {
      next.reshuffleLimit = Math.max(0, (lv.reshuffleLimit as number) - 1);
    }
  }
  if (p.id === "bendicion_dorada" && lv.gates && lv.gates.count > 0) {
    next.gates = { count: lv.gates.count, unlockAt: lv.gates.unlockAt + 1 };
  }
  return next;
}

export function presagioScoreMult(p: MahjongPresagio | null, specialCount: number): number {
  if (!p) return 1;
  if (p.id === "manos_atadas") return 1.15;
  if (p.id === "bendicion_dorada" && specialCount > 0) return 1.5;
  return 1;
}
