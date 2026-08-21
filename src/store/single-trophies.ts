import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useNemesis, type NemesisRecord } from "@/store/nemesis";
import { useGameMode } from "@/store/game-mode";

export interface SingleTrophy {
  id: string;
  name: string;
  hint: string;
  check: (records: Record<string, NemesisRecord>) => boolean;
}

const anyRecord = (
  records: Record<string, NemesisRecord>,
  pred: (r: NemesisRecord) => boolean,
): boolean => Object.values(records).some(pred);

const totalWins = (records: Record<string, NemesisRecord>) =>
  Object.values(records).reduce((n, r) => n + r.wins, 0);

const distinctGamesBeaten = (records: Record<string, NemesisRecord>) =>
  Object.values(records).filter((r) => r.wins > 0).length;

export const SINGLE_TROPHIES: SingleTrophy[] = [
  {
    id: "first-blood",
    name: "Primera Sangre",
    hint: "Vencé a un Nemesis por primera vez.",
    check: (r) => anyRecord(r, (x) => x.wins >= 1),
  },
  {
    id: "streak-3",
    name: "Racha de Tres",
    hint: "Ganá 3 partidas seguidas en una misma mesa.",
    check: (r) => anyRecord(r, (x) => x.bestStreak >= 3),
  },
  {
    id: "streak-5",
    name: "Racha del Cuervo",
    hint: "Ganá 5 partidas seguidas en la misma mesa.",
    check: (r) => anyRecord(r, (x) => x.bestStreak >= 5),
  },
  {
    id: "streak-10",
    name: "Racha del Callejón",
    hint: "Ganá 10 partidas seguidas en la misma mesa.",
    check: (r) => anyRecord(r, (x) => x.bestStreak >= 10),
  },
  {
    id: "climb-5",
    name: "Escalador",
    hint: "Llevá un Nemesis a nivel 5.",
    check: (r) => anyRecord(r, (x) => x.level >= 5),
  },
  {
    id: "climb-10",
    name: "Cazador de Sombras",
    hint: "Llevá un Nemesis a nivel 10.",
    check: (r) => anyRecord(r, (x) => x.level >= 10),
  },
  {
    id: "climb-20",
    name: "El Duelista Eterno",
    hint: "Llevá un Nemesis al nivel máximo (20).",
    check: (r) => anyRecord(r, (x) => x.level >= 20),
  },
  {
    id: "beat-lv5",
    name: "Cabeza en la Mesa",
    hint: "Ganá una partida con el Nemesis en nivel ≥ 5.",
    check: (r) => anyRecord(r, (x) => x.wins >= 1 && x.level >= 5),
  },
  {
    id: "beat-lv10",
    name: "Domador de Nemesis",
    hint: "Ganá una partida con el Nemesis en nivel ≥ 10.",
    check: (r) => anyRecord(r, (x) => x.wins >= 1 && x.level >= 10),
  },
  {
    id: "wins-25",
    name: "Cliente Habitual",
    hint: "Acumulá 25 victorias en el modo Single.",
    check: (r) => totalWins(r) >= 25,
  },
  {
    id: "wins-100",
    name: "Fantasma del Garito",
    hint: "Acumulá 100 victorias en el modo Single.",
    check: (r) => totalWins(r) >= 100,
  },
  {
    id: "variety-5",
    name: "Mano de Todos los Juegos",
    hint: "Ganá al menos una partida en 5 mesas distintas.",
    check: (r) => distinctGamesBeaten(r) >= 5,
  },
  {
    id: "variety-10",
    name: "La Casa entera es tuya",
    hint: "Ganá al menos una partida en 10 mesas distintas.",
    check: (r) => distinctGamesBeaten(r) >= 10,
  },
];

interface SingleTrophyState {
  unlocked: string[];
  announced: string[];
  pending: string[];
  claimAnnounced: (ids: string[]) => void;
  reset: () => void;
}

export const useSingleTrophies = create<SingleTrophyState>()(
  persist(
    (set) => ({
      unlocked: [],
      announced: [],
      pending: [],
      claimAnnounced: (ids) =>
        set((s) => ({
          announced: Array.from(new Set([...s.announced, ...ids])),
          pending: s.pending.filter((id) => !ids.includes(id)),
        })),
      reset: () => set({ unlocked: [], announced: [], pending: [] }),
    }),
    { name: "cuervo:single-trophies", version: 1 },
  ),
);

export function evaluateSingleTrophies(): string[] {
  const records = useNemesis.getState().byGame;
  const cur = useSingleTrophies.getState();
  const newlyUnlocked: string[] = [];
  for (const t of SINGLE_TROPHIES) {
    if (cur.unlocked.includes(t.id)) continue;
    if (t.check(records)) newlyUnlocked.push(t.id);
  }
  if (newlyUnlocked.length === 0) return [];
  useSingleTrophies.setState((s) => ({
    unlocked: Array.from(new Set([...s.unlocked, ...newlyUnlocked])),
    pending: Array.from(new Set([...s.pending, ...newlyUnlocked])),
  }));
  return newlyUnlocked;
}

let subscribed = false;
export function installSingleTrophyWatcher() {
  if (subscribed || typeof window === "undefined") return;
  subscribed = true;
  useNemesis.subscribe((state, prev) => {
    if (state.byGame === prev.byGame) return;
    if (useGameMode.getState().mode !== "single") return;
    evaluateSingleTrophies();
  });
}
