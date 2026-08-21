import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MAHJONG_TILE_NAMES,
  MAHJONG_TILE_NAMES_2,
  MAHJONG_TILE_NAMES_3,
  MAHJONG_TILE_NAMES_4,
  MAHJONG_TILE_NAMES_5,
  MAHJONG_SPECIAL_NAMES,
  MAHJONG_SPECIAL_NAMES_2,
  MAHJONG_SPECIAL_NAMES_3,
  MAHJONG_SPECIAL_NAMES_4,
  MAHJONG_SPECIAL_NAMES_5,
  type SheetIdx,
  type SpecialGroup,
} from "@/components/casino/mahjong/MahjongTile";

export const CHAR_SHEETS: readonly (readonly string[])[] = [
  MAHJONG_TILE_NAMES,
  MAHJONG_TILE_NAMES_2,
  MAHJONG_TILE_NAMES_3,
  MAHJONG_TILE_NAMES_4,
  MAHJONG_TILE_NAMES_5,
];

export const SPECIAL_SHEETS: readonly (readonly string[])[] = [
  MAHJONG_SPECIAL_NAMES,
  MAHJONG_SPECIAL_NAMES_2,
  MAHJONG_SPECIAL_NAMES_3,
  MAHJONG_SPECIAL_NAMES_4,
  MAHJONG_SPECIAL_NAMES_5,
];

export interface SpecialCell {
  sheet: SheetIdx;
  index: number;
  group: SpecialGroup;
  name: string;
}

export const SPECIAL_GROUPS: Record<
  SpecialGroup,
  { sheet: SheetIdx; base: number; label: string }
> = {
  bebidas: { sheet: 0, base: 0, label: "Bebidas" },
  vicios: { sheet: 0, base: 4, label: "Vicios" },
  armas: { sheet: 1, base: 0, label: "Armas" },
  tesoros: { sheet: 1, base: 4, label: "Tesoros" },
  joyas: { sheet: 2, base: 0, label: "Joyas" },
  suerte: { sheet: 2, base: 4, label: "Suerte" },
  mascaras: { sheet: 3, base: 0, label: "Máscaras" },
  sombras: { sheet: 3, base: 4, label: "Sombras" },
  reliquias: { sheet: 4, base: 0, label: "Reliquias" },
  pecados: { sheet: 4, base: 4, label: "Pecados" },
};

export function keyChar(sheet: number, type: number): string {
  return `c:${sheet}:${type}`;
}
export function keySpec(sheet: number, type: number): string {
  return `s:${sheet}:${type}`;
}

export interface AlbumEntry {
  seen: number;
  matched: number;
  firstAt?: number;
  matchedAt?: number;
}

export interface SetReward {
  id: string;
  label: string;
  detail: string;
  chips: number;
  progress: number;
  goal: number;
  claimed: boolean;
  ready: boolean;
}

interface AlbumState {
  chars: Record<string, AlbumEntry>;
  specials: Record<string, AlbumEntry>;
  claimedSets: string[];
  markSeen: (kind: "char" | "special", sheet: number, type: number) => void;
  markMatched: (kind: "char" | "special", sheet: number, type: number) => void;
  reset: () => void;
  claimSet: (setId: string) => number;
}

const emptyEntry: AlbumEntry = { seen: 0, matched: 0 };

export const useMahjongAlbum = create<AlbumState>()(
  persist(
    (set, get) => ({
      chars: {},
      specials: {},
      claimedSets: [],
      markSeen: (kind, sheet, type) =>
        set((s) => {
          const bag = kind === "char" ? s.chars : s.specials;
          const k = kind === "char" ? keyChar(sheet, type) : keySpec(sheet, type);
          const prev = bag[k] ?? emptyEntry;
          const next: AlbumEntry = {
            seen: prev.seen + 1,
            matched: prev.matched,
            firstAt: prev.firstAt ?? Date.now(),
            matchedAt: prev.matchedAt,
          };
          return kind === "char"
            ? { chars: { ...s.chars, [k]: next } }
            : { specials: { ...s.specials, [k]: next } };
        }),
      markMatched: (kind, sheet, type) =>
        set((s) => {
          const bag = kind === "char" ? s.chars : s.specials;
          const k = kind === "char" ? keyChar(sheet, type) : keySpec(sheet, type);
          const prev = bag[k] ?? emptyEntry;
          const next: AlbumEntry = {
            seen: Math.max(prev.seen, 1),
            matched: prev.matched + 1,
            firstAt: prev.firstAt ?? Date.now(),
            matchedAt: Date.now(),
          };
          return kind === "char"
            ? { chars: { ...s.chars, [k]: next } }
            : { specials: { ...s.specials, [k]: next } };
        }),
      claimSet: (setId) => {
        const st = get();
        if (st.claimedSets.includes(setId)) return 0;
        const rewards = computeSets(st);
        const target = rewards.find((r) => r.id === setId);
        if (!target || !target.ready) return 0;
        set({ claimedSets: [...st.claimedSets, setId] });
        return target.chips;
      },
      reset: () => set({ chars: {}, specials: {}, claimedSets: [] }),
    }),
    { name: "cuervo:mahjong-album", version: 1 },
  ),
);

export function computeSets(
  state: Pick<AlbumState, "chars" | "specials" | "claimedSets">,
): SetReward[] {
  const out: SetReward[] = [];

  for (let s = 0; s < CHAR_SHEETS.length; s++) {
    const goal = CHAR_SHEETS[s].length;
    let progress = 0;
    for (let t = 0; t < goal; t++) {
      const e = state.chars[keyChar(s, t)];
      if (e && e.matched > 0) progress++;
    }
    const id = `char-sheet-${s}`;
    out.push({
      id,
      label: `Elenco · Hoja ${s + 1}`,
      detail: `${goal} personajes cerrados`,
      chips: 250,
      progress,
      goal,
      claimed: state.claimedSets.includes(id),
      ready: progress >= goal,
    });
  }

  for (const g of Object.keys(SPECIAL_GROUPS) as SpecialGroup[]) {
    const { sheet, base, label } = SPECIAL_GROUPS[g];
    const goal = 4;
    let progress = 0;
    for (let i = 0; i < 4; i++) {
      const e = state.specials[keySpec(sheet, base + i)];
      if (e && e.matched > 0) progress++;
    }
    const id = `special-${g}`;
    out.push({
      id,
      label: `Sinergia · ${label}`,
      detail: `${goal} especiales cerrados`,
      chips: 300,
      progress,
      goal,
      claimed: state.claimedSets.includes(id),
      ready: progress >= goal,
    });
  }

  const totalChars = CHAR_SHEETS.reduce((n, arr) => n + arr.length, 0);
  let progressAll = 0;
  for (let s = 0; s < CHAR_SHEETS.length; s++) {
    for (let t = 0; t < CHAR_SHEETS[s].length; t++) {
      const e = state.chars[keyChar(s, t)];
      if (e && e.matched > 0) progressAll++;
    }
  }
  const idAll = "chars-all";
  out.push({
    id: idAll,
    label: "Nemesis del Cuervo",
    detail: "los 80 personajes del salón",
    chips: 2000,
    progress: progressAll,
    goal: totalChars,
    claimed: state.claimedSets.includes(idAll),
    ready: progressAll >= totalChars,
  });

  return out;
}

export function totalCollected(state: Pick<AlbumState, "chars" | "specials">): {
  chars: number;
  charsGoal: number;
  specials: number;
  specialsGoal: number;
} {
  const charsGoal = CHAR_SHEETS.reduce((n, arr) => n + arr.length, 0);
  const specialsGoal = SPECIAL_SHEETS.reduce((n, arr) => n + arr.length, 0);
  let chars = 0;
  for (const k in state.chars) if (state.chars[k].matched > 0) chars++;
  let specials = 0;
  for (const k in state.specials) if (state.specials[k].matched > 0) specials++;
  return { chars, charsGoal, specials, specialsGoal };
}
