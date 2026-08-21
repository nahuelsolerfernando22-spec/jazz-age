// Reliquias del Cuervo: objetos permanentes de una vigilia (run) de Mahjong.
// A diferencia de los presagios (que endurecen la mesa), las reliquias son
// ventajas acumulables que se eligen al superar cada piso.
import type { LevelDef } from "@/lib/games/mahjong/mahjong-levels";
import type { MahjongRelic } from "@/store/games/mahjong/mahjong-run";

export type ReliquiaId =
  | "colmillo-marfil"
  | "brujula-humo"
  | "reloj-parado"
  | "bandeja-nacar"
  | "moneda-marcada"
  | "cigarrera-nacar"
  | "guante-blanco"
  | "medalla-laton";

export interface ReliquiaDef extends MahjongRelic {
  id: ReliquiaId;
}

export const RELIQUIAS: ReliquiaDef[] = [
  {
    id: "colmillo-marfil",
    name: "Colmillo de Marfil",
    description: "+2 retrocesos en cada mesa de la vigilia.",
    icon: "◈",
  },
  {
    id: "brujula-humo",
    name: "Brújula de Humo",
    description: "+1 mezcla disponible por mesa.",
    icon: "◆",
  },
  {
    id: "reloj-parado",
    name: "Reloj Parado",
    description: "+25 segundos en las mesas con tiempo.",
    icon: "◈",
  },
  {
    id: "bandeja-nacar",
    name: "Bandeja de Nácar",
    description: "+1 hueco permanente en la bandeja.",
    icon: "◆",
  },
  {
    id: "moneda-marcada",
    name: "Moneda Marcada",
    description: "Todo lo que cerrás paga +18%.",
    icon: "◈",
  },
  {
    id: "cigarrera-nacar",
    name: "Cigarrera de Nácar",
    description: "Los especiales pagan +40%.",
    icon: "◆",
  },
  {
    id: "guante-blanco",
    name: "Guante Blanco",
    description: "Un sello menos al iniciar cada mesa.",
    icon: "◈",
  },
  {
    id: "medalla-laton",
    name: "Medalla de Latón",
    description: "La primera derrota de la vigilia no cuesta vida.",
    icon: "◆",
  },
];

export function reliquiaPorId(id: string): ReliquiaDef | null {
  return RELIQUIAS.find((r) => r.id === id) ?? null;
}

function tiene(relics: MahjongRelic[], id: ReliquiaId): number {
  return relics.filter((r) => r.id === id).length;
}

/** Aplica las ventajas de las reliquias sobre la mesa ya afectada por presagios. */
export function aplicarReliquiasANivel(lv: LevelDef, relics: MahjongRelic[]): LevelDef {
  if (!relics.length) return lv;
  const next: LevelDef = { ...lv };

  const colmillo = tiene(relics, "colmillo-marfil");
  if (colmillo) next.undoLimit = (lv.undoLimit ?? 3) + 2 * colmillo;

  const brujula = tiene(relics, "brujula-humo");
  if (brujula && Number.isFinite(lv.reshuffleLimit as number)) {
    next.reshuffleLimit = (lv.reshuffleLimit as number) + brujula;
  }

  const reloj = tiene(relics, "reloj-parado");
  if (reloj && lv.timeLimit) next.timeLimit = lv.timeLimit + 25 * reloj;

  const bandeja = tiene(relics, "bandeja-nacar");
  if (bandeja) next.traySize = (lv.traySize ?? 7) + bandeja;

  const guante = tiene(relics, "guante-blanco");
  if (guante && lv.seals && lv.seals.count > 0) {
    next.seals = { ...lv.seals, count: Math.max(0, lv.seals.count - guante) };
  }

  return next;
}

/** Multiplicador de puntaje aportado por las reliquias. */
export function reliquiasScoreMult(relics: MahjongRelic[], specialCount: number): number {
  if (!relics.length) return 1;
  let m = 1 + 0.18 * tiene(relics, "moneda-marcada");
  if (specialCount > 0) m *= 1 + 0.4 * tiene(relics, "cigarrera-nacar");
  return m;
}

/** Tres reliquias distintas para ofrecer, evitando repetir las ya obtenidas. */
export function ofrecerReliquias(relics: MahjongRelic[], seed: number): ReliquiaDef[] {
  const propias = new Set(relics.map((r) => r.id));
  const pool = RELIQUIAS.filter((r) => !propias.has(r.id));
  const fuente = pool.length >= 3 ? pool : RELIQUIAS.slice();
  const orden = fuente
    .map((r, i) => ({ r, k: Math.abs(Math.sin((seed + 1) * (i + 7)) * 10000) % 1 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.r);
  return orden.slice(0, 3);
}
