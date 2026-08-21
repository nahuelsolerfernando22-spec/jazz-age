import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useNemesis, type NemesisRecord } from "@/store/nemesis";
import { useSingleScores } from "@/store/single-scores";
import { useSingleAffinity } from "@/store/single-affinity";
import { useGameStreaks } from "@/store/game-streaks";
import { useLoginStreak } from "@/store/loginStreak";
import { useFavors } from "@/store/favors";
import { useRewardsHistory } from "@/store/rewards-history";
import { SINGLE_GAMES } from "@/lib/single-games";
import { hostessForGame } from "@/lib/single-hostess";

export interface AchievementDef {
  id: string;
  category: string;
  name: string;
  hint: string;
  target: number;
  favors: number;
  progress: () => number;
}

function nemesisFor(gameId: string): NemesisRecord | undefined {
  return useNemesis.getState().byGame[gameId];
}
function affinityFor(gameId: string) {
  const npc = hostessForGame(gameId)?.npcId;
  if (!npc) return null;
  return useSingleAffinity.getState().byNpc[npc] ?? null;
}

function buildDefs(): AchievementDef[] {
  const defs: AchievementDef[] = [];

  defs.push(
    {
      id: "global.login-7",
      category: "global",
      name: "Cliente Fiel",
      hint: "Visitá el Cuervo 7 días seguidos.",
      target: 7,
      favors: 5,
      progress: () => Math.min(7, useLoginStreak.getState().bestStreak),
    },
    {
      id: "global.play-50",
      category: "global",
      name: "Habitué",
      hint: "Jugá 50 manos en cualquier mesa.",
      target: 50,
      favors: 6,
      progress: () => {
        const nem = useNemesis.getState().byGame;
        const scr = useSingleScores.getState().byGame;
        const a = Object.values(nem).reduce((n, r) => n + r.wins + r.losses + r.draws, 0);
        const b = Object.values(scr).reduce((n, r) => n + r.plays, 0);
        return Math.min(50, a + b);
      },
    },
    {
      id: "global.win-25",
      category: "global",
      name: "Habla la Mano",
      hint: "Acumulá 25 victorias entre todos los juegos.",
      target: 25,
      favors: 8,
      progress: () => {
        const nem = useNemesis.getState().byGame;
        return Math.min(
          25,
          Object.values(nem).reduce((n, r) => n + r.wins, 0),
        );
      },
    },
    {
      id: "global.rooms-5",
      category: "global",
      name: "Vuelta al Salón",
      hint: "Jugá al menos una mano en 5 mesas distintas.",
      target: 5,
      favors: 4,
      progress: () => {
        const ids = new Set<string>();
        Object.entries(useNemesis.getState().byGame).forEach(([k, r]) => {
          if (r.wins + r.losses + r.draws > 0) ids.add(k);
        });
        Object.entries(useSingleScores.getState().byGame).forEach(([k, r]) => {
          if (r.plays > 0) ids.add(k);
        });
        return Math.min(5, ids.size);
      },
    },
  );

  for (const g of SINGLE_GAMES) {
    const gid = g.id;
    defs.push({
      id: `${gid}.first-play`,
      category: gid,
      name: "Primera Visita",
      hint: `Jugá tu primera mano en ${g.name}.`,
      target: 1,
      favors: 1,
      progress: () => {
        const n = nemesisFor(gid);
        const s = useSingleScores.getState().byGame[gid];
        const plays = (n ? n.wins + n.losses + n.draws : 0) + (s?.plays ?? 0);
        return plays > 0 ? 1 : 0;
      },
    });
    if (g.hasNemesis) {
      defs.push(
        {
          id: `${gid}.wins-5`,
          category: gid,
          name: "Habitual",
          hint: `Ganá 5 partidas en ${g.name}.`,
          target: 5,
          favors: 3,
          progress: () => Math.min(5, nemesisFor(gid)?.wins ?? 0),
        },
        {
          id: `${gid}.streak-3`,
          category: gid,
          name: "Buena Racha",
          hint: `Encadená 3 victorias en ${g.name}.`,
          target: 3,
          favors: 4,
          progress: () => Math.min(3, nemesisFor(gid)?.bestStreak ?? 0),
        },
        {
          id: `${gid}.nemesis-5`,
          category: gid,
          name: "Rival Curtido",
          hint: `Llevá tu Nemesis de ${g.name} a nivel 5.`,
          target: 5,
          favors: 5,
          progress: () => Math.min(5, nemesisFor(gid)?.level ?? 0),
        },
      );
    } else {
      defs.push({
        id: `${gid}.plays-10`,
        category: gid,
        name: "Manija",
        hint: `Jugá 10 rondas de ${g.name}.`,
        target: 10,
        favors: 3,
        progress: () => Math.min(10, useSingleScores.getState().byGame[gid]?.plays ?? 0),
      });
    }

    defs.push({
      id: `${gid}.streak-days-7`,
      category: gid,
      name: "Todos los Días",
      hint: `Jugá ${g.name} 7 días seguidos.`,
      target: 7,
      favors: 6,
      progress: () => Math.min(7, useGameStreaks.getState().byGame[gid]?.daily.best ?? 0),
    });

    const h = hostessForGame(gid);
    if (h) {
      defs.push({
        id: `${gid}.affinity-50`,
        category: gid,
        name: `Confianza con ${h.name}`,
        hint: `Llevá tu afinidad con ${h.name} a 50.`,
        target: 50,
        favors: 4,
        progress: () => Math.min(50, affinityFor(gid)?.affinity ?? 0),
      });
    }
  }
  return defs;
}

let _defs: AchievementDef[] | null = null;
export function getAchievementDefs(): AchievementDef[] {
  if (!_defs) _defs = buildDefs();
  return _defs;
}

export interface AchievementState {
  def: AchievementDef;
  progress: number;
  unlocked: boolean;
  claimed: boolean;
}

interface ClaimedStore {
  claimed: Record<string, number>;
  unlockedAt: Record<string, number>;
  markUnlocked: (id: string) => void;
  claim: (id: string) => number;
  reset: () => void;
}

export const useAchievements = create<ClaimedStore>()(
  persist(
    (set, get) => ({
      claimed: {},
      unlockedAt: {},
      markUnlocked: (id) => {
        if (get().unlockedAt[id]) return;
        set((s) => ({ unlockedAt: { ...s.unlockedAt, [id]: Date.now() } }));
      },
      claim: (id) => {
        const def = getAchievementDefs().find((d) => d.id === id);
        if (!def) return 0;
        if (get().claimed[id]) return 0;
        if (def.progress() < def.target) return 0;
        useFavors.getState().add(def.favors);
        useRewardsHistory.getState().add({
          source: "achievement",
          gameId: def.category === "global" ? undefined : def.category,
          favors: def.favors,
          chips: 0,
          label: `Logro: ${def.name}`,
        });
        set((s) => ({
          claimed: { ...s.claimed, [id]: Date.now() },
          unlockedAt: s.unlockedAt[id] ? s.unlockedAt : { ...s.unlockedAt, [id]: Date.now() },
        }));
        return def.favors;
      },
      reset: () => set({ claimed: {}, unlockedAt: {} }),
    }),
    { name: "cuervo:achievements:v1" },
  ),
);

export function snapshotAchievements(): AchievementState[] {
  const st = useAchievements.getState();
  return getAchievementDefs().map((def) => {
    const p = def.progress();
    const unlocked = p >= def.target;
    if (unlocked && !st.unlockedAt[def.id]) st.markUnlocked(def.id);
    return { def, progress: p, unlocked, claimed: !!st.claimed[def.id] };
  });
}

export function achievementsByCategory(): Record<string, AchievementState[]> {
  const out: Record<string, AchievementState[]> = {};
  for (const a of snapshotAchievements()) {
    (out[a.def.category] ??= []).push(a);
  }
  return out;
}

export function hostessLevelsSummary(): Array<{
  gameId: string;
  gameName: string;
  hostessName: string;
  affinity: number;
  level: number;
}> {
  const rows: Array<{
    gameId: string;
    gameName: string;
    hostessName: string;
    affinity: number;
    level: number;
  }> = [];
  for (const g of SINGLE_GAMES) {
    const h = hostessForGame(g.id);
    if (!h) continue;
    const rec = useSingleAffinity.getState().byNpc[h.npcId];
    const affinity = rec?.affinity ?? 0;

    const level = Math.min(5, Math.floor(affinity / 20));
    rows.push({ gameId: g.id, gameName: g.name, hostessName: h.name, affinity, level });
  }
  return rows;
}
