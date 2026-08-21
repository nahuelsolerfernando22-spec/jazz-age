import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  LEAGUE_TIERS,
  type LeagueTierId,
  dayKey as leagueDayKey,
  tierIndex as leagueTierIndex,
} from "@/lib/league";
import { awardLeagueFromChipsDelta } from "@/lib/league-award";
import { useGameMode } from "@/store/game-mode";

export type Mood = "idle" | "win" | "lose";

export type MissionId =
  "spin_x_times" | "win_chips" | "land_jackpot" | "place_bets" | "win_streak" | "drink_buff";

export interface Mission {
  id: MissionId;
  title: string;
  description: string;
  goal: number;
  progress: number;
  rewardChips: number;
  rewardXp: number;
  claimed: boolean;
}

const MISSION_POOL: Omit<Mission, "progress" | "claimed">[] = [
  {
    id: "spin_x_times",
    title: "Tira de la Palanca",
    description: "Gira los rodillos 15 veces",
    goal: 15,
    rewardChips: 150,
    rewardXp: 30,
  },
  {
    id: "win_chips",
    title: "Mano Rápida",
    description: "Gana 500 fichas en total",
    goal: 500,
    rewardChips: 200,
    rewardXp: 40,
  },
  {
    id: "land_jackpot",
    title: "Estrellas Arriba",
    description: "Consigue 1 premio mayor",
    goal: 1,
    rewardChips: 500,
    rewardXp: 100,
  },
  {
    id: "place_bets",
    title: "Gran Apostador",
    description: "Apuesta 1.000 fichas",
    goal: 1000,
    rewardChips: 200,
    rewardXp: 35,
  },
  {
    id: "win_streak",
    title: "En Racha",
    description: "Encadena 4 victorias",
    goal: 4,
    rewardChips: 250,
    rewardXp: 50,
  },
  {
    id: "drink_buff",
    title: "Coraje Líquido",
    description: "Pide 2 copas en la barra",
    goal: 2,
    rewardChips: 120,
    rewardXp: 25,
  },
];

function rollDailyMissions(seed: number): Mission[] {
  const pool = [...MISSION_POOL];
  const picked: Mission[] = [];
  let s = seed;
  for (let i = 0; i < 3 && pool.length; i++) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * pool.length);
    const base = pool.splice(idx, 1)[0];
    picked.push({ ...base, progress: 0, claimed: false });
  }
  return picked;
}

function todaySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export const RANKS = [
  { name: "Mug", xp: 0 },
  { name: "Regular", xp: 100 },
  { name: "Card Sharp", xp: 300 },
  { name: "High Roller", xp: 700 },
  { name: "Made Man", xp: 1500 },
  { name: "Boss", xp: 3000 },
] as const;

type Rank = (typeof RANKS)[number];
export function rankFromXp(xp: number) {
  let current: Rank = RANKS[0];
  let next: Rank | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xp) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    }
  }
  const span = next ? next.xp - current.xp : 1;
  const into = next ? xp - current.xp : 1;
  const pct = next ? Math.min(1, into / span) : 1;
  return { current, next, pct, level: RANKS.indexOf(current) + 1 };
}

interface CasinoState {
  chips: number;
  bet: number;
  streak: number;
  biggestWin: number;

  luckBuff: number;
  buffExpiresAt: number | null;

  currentRumor: { id: string; title: string; text: string } | null;
  reputation: number;

  xp: number;

  missions: Mission[];
  missionsSeed: number;
  lastMissionToast: { rank: string; level: number } | null;

  scarletBond: number;
  scarletTier: number;

  contractsClaimed: string[];
  acceptedMissions: string[];
  lastFavorDay: number | null;

  lastBarRecipeDay: number | null;
  claimBarRecipeOfDay: () => boolean;
  todaySeed: () => number;

  monteCleanStreak: number;
  monteBestCleanStreak: number;
  recordMonteResult: (r: { won: boolean; peeked: boolean }) => void;

  trucoHandsWon: number;
  trucoBestSpread: number;
  recordTrucoResult: (r: { won: boolean; pointSpread: number }) => void;

  guardiaBeaten: boolean;
  setGuardiaBeaten: (v: boolean) => void;

  tutorialSeen: boolean;
  markTutorialSeen: () => void;

  lastCamerinoDay: number | null;
  camerinoOutfits: string[];
  recordCamerinoVisit: (payload: { bond: number; outfit?: string }) => void;

  lastTocadorDay: number | null;
  playTocador: (bond: number) => boolean;

  terrazaBest: number;
  terrazaRunsTotal: number;
  lastTerrazaDay: number | null;
  recordTerraza: (run: { score: number; payout: number }) => {
    dailyBonus: boolean;
    newBest: boolean;
  };

  rouletteTourney: {
    day: number;
    attempts: Array<{ score: number; spinsUsed: number; at: number }>;
  };
  recordRouletteTourney: (score: number, spinsUsed: number) => void;
  setBet: (b: number) => void;
  addChips: (delta: number) => void;
  spend: (amount: number) => boolean;
  claimedGrants: string[];
  hasClaimed: (claimId: string) => boolean;
  grantOnce: (
    claimId: string,
    payload: { chips?: number; xp?: number; reputation?: number },
  ) => boolean;
  registerWin: (won: number) => void;
  registerLoss: () => void;
  grantBuff: (luck: number, durationMs: number) => void;
  consumeBuffIfExpired: () => void;
  bumpReputation: (n: number) => void;
  bumpScarletBond: (n: number) => void;

  trackMission: (id: MissionId, amount?: number) => void;
  claimMission: (id: MissionId) => void;
  ensureFreshMissions: () => void;
  clearLastRankUp: () => void;

  claimContract: (id: string, payout: { chips: number; xp: number; reputation: number }) => boolean;
  acceptMission: (id: string) => void;
  claimDailyFavor: (mult?: number) => { chips: number; reputation: number } | null;

  leaguePoints: number;
  leagueTier: LeagueTierId;
  leagueDay: number;
  lastLeagueResult: {
    day: number;
    rank: number;
    totalPlayers: number;
    fromTier: LeagueTierId;
    toTier: LeagueTierId;
    outcome: "promo" | "stay" | "demote";
    rewardChips: number;
    seenAt: number | null;
  } | null;
  addLeaguePoints: (n: number) => void;
  ensureLeagueDay: () => void;
  ackLeagueResult: () => void;
  lastTourneyNotice: {
    game: string;
    score: number;
    best: number;
    rewardChips: number;
    at: number;
    seenAt: number | null;
  } | null;
  pushTourneyNotice: (payload: {
    game: string;
    score: number;
    best: number;
    rewardChips: number;
  }) => void;
  ackTourneyNotice: () => void;
  reset: () => void;
  setCurrentRumor: (r: { id: string; title: string; text: string } | null) => void;
}

export const useCasino = create<CasinoState>()(
  persist(
    (set, get) => ({
      chips: 500,
      bet: 10,
      streak: 0,
      biggestWin: 0,
      luckBuff: 0,
      buffExpiresAt: null,
      currentRumor: null,
      reputation: 0,
      xp: 0,
      missions: rollDailyMissions(todaySeed()),
      missionsSeed: todaySeed(),
      lastMissionToast: null,
      scarletBond: 0,
      scarletTier: 0,
      contractsClaimed: [],
      acceptedMissions: [],
      lastFavorDay: null,
      lastBarRecipeDay: null,
      todaySeed: () => todaySeed(),
      claimBarRecipeOfDay: () => {
        const day = todaySeed();
        if (get().lastBarRecipeDay === day) return false;
        set({ lastBarRecipeDay: day });
        return true;
      },
      monteCleanStreak: 0,
      monteBestCleanStreak: 0,
      recordMonteResult: ({ won, peeked }) =>
        set((s) => {
          const next = won && !peeked ? s.monteCleanStreak + 1 : 0;
          return {
            monteCleanStreak: next,
            monteBestCleanStreak: Math.max(s.monteBestCleanStreak, next),
          };
        }),
      trucoHandsWon: 0,
      trucoBestSpread: 0,
      recordTrucoResult: ({ won, pointSpread }) =>
        set((s) => ({
          trucoHandsWon: s.trucoHandsWon + (won ? 1 : 0),
          trucoBestSpread: Math.max(s.trucoBestSpread, won ? pointSpread : 0),
        })),
      guardiaBeaten: true,
      setGuardiaBeaten: (v) => set({ guardiaBeaten: v }),
      tutorialSeen: false,
      markTutorialSeen: () => set({ tutorialSeen: true }),
      lastCamerinoDay: null,
      camerinoOutfits: [],
      lastTocadorDay: null,
      terrazaBest: 0,
      terrazaRunsTotal: 0,
      lastTerrazaDay: null,
      recordTerraza: ({ score, payout }) => {
        const day = todaySeed();
        const dailyBonus = get().lastTerrazaDay !== day;
        const newBest = score > get().terrazaBest;
        set((s) => ({
          chips: s.chips + payout,
          reputation: s.reputation + (dailyBonus ? 1 : 0),
          terrazaBest: Math.max(s.terrazaBest, score),
          terrazaRunsTotal: s.terrazaRunsTotal + 1,
          lastTerrazaDay: day,
        }));
        return { dailyBonus, newBest };
      },
      rouletteTourney: { day: todaySeed(), attempts: [] },
      recordRouletteTourney: (score, spinsUsed) =>
        set((s) => {
          const day = todaySeed();
          const fresh = s.rouletteTourney.day === day ? s.rouletteTourney : { day, attempts: [] };
          return {
            rouletteTourney: {
              day,
              attempts: [...fresh.attempts, { score, spinsUsed, at: Date.now() }],
            },
          };
        }),
      playTocador: (bond) => {
        const day = todaySeed();
        if (get().lastTocadorDay === day) return false;
        set({ lastTocadorDay: day });
        get().bumpScarletBond(bond);
        return true;
      },
      recordCamerinoVisit: ({ bond, outfit }) => {
        const day = todaySeed();
        set((s) => ({
          lastCamerinoDay: day,
          scarletBond: Math.max(0, s.scarletBond + bond),
          camerinoOutfits:
            outfit && !s.camerinoOutfits.includes(outfit)
              ? [...s.camerinoOutfits, outfit]
              : s.camerinoOutfits,
        }));

        const bondNow = get().scarletBond;
        const thresholds = [0, 50, 150, 350, 750, 1500];
        let tier = 0;
        for (let i = 0; i < thresholds.length; i++) {
          if (bondNow >= thresholds[i]) tier = i;
        }
        set({ scarletTier: tier });
      },
      claimContract: (id, payout) => {
        const { contractsClaimed } = get();
        if (contractsClaimed.includes(id)) return false;
        set((s) => ({
          chips: s.chips + payout.chips,
          xp: s.xp + payout.xp,
          reputation: s.reputation + payout.reputation,
          contractsClaimed: [...s.contractsClaimed, id],
        }));
        return true;
      },
      acceptMission: (id) => {
        set((s) =>
          s.acceptedMissions.includes(id) || s.contractsClaimed.includes(id)
            ? s
            : { acceptedMissions: [...s.acceptedMissions, id] },
        );
      },
      claimDailyFavor: (mult = 1) => {
        const day = todaySeed();
        if (get().lastFavorDay === day) return null;

        const rep = get().reputation;
        const base = Math.round(80 * (1 + rep * 0.02));
        const chips = Math.max(20, Math.round(base * mult));
        const reputation = 1;
        set((s) => ({
          chips: s.chips + chips,
          reputation: s.reputation + reputation,
          lastFavorDay: day,
        }));
        return { chips, reputation };
      },

      leaguePoints: 0,
      leagueTier: "cobre",
      leagueDay: leagueDayKey(),
      lastLeagueResult: null,
      lastTourneyNotice: null,
      addLeaguePoints: (n) => {
        if (!Number.isFinite(n) || n <= 0) return;
        get().ensureLeagueDay();
        set((s) => ({ leaguePoints: s.leaguePoints + Math.round(n) }));
      },
      ensureLeagueDay: () => {
        const today = leagueDayKey();
        const s = get();
        if (s.leagueDay === today) return;

        const tierIdx = leagueTierIndex(s.leagueTier);

        const targetBase: Record<LeagueTierId, number> = {
          cobre: 800,
          laton: 1500,
          plata: 2800,
          oro: 4800,
          esmeralda: 8000,
          cuervo: 14000,
        };
        const ratio = s.leaguePoints / targetBase[s.leagueTier];
        let outcome: "promo" | "stay" | "demote";
        let estRank: number;
        if (ratio >= 1.05) {
          outcome = "promo";
          estRank = 2;
        } else if (ratio >= 0.55) {
          outcome = "stay";
          estRank = 5;
        } else {
          outcome = "demote";
          estRank = 9;
        }
        let nextTierIdx = tierIdx;
        if (outcome === "promo") nextTierIdx = Math.min(LEAGUE_TIERS.length - 1, tierIdx + 1);
        if (outcome === "demote") nextTierIdx = Math.max(0, tierIdx - 1);
        const nextTier = LEAGUE_TIERS[nextTierIdx].id;
        const rewardBase = outcome === "promo" ? 400 : outcome === "stay" ? 180 : 60;
        const rewardChips = Math.round(rewardBase * LEAGUE_TIERS[tierIdx].rewardMult);
        set((cur) => ({
          chips: cur.chips + rewardChips,
          leaguePoints: 0,
          leagueTier: nextTier,
          leagueDay: today,
          lastLeagueResult: {
            day: s.leagueDay,
            rank: estRank,
            totalPlayers: 10,
            fromTier: s.leagueTier,
            toTier: nextTier,
            outcome,
            rewardChips,
            seenAt: null,
          },
        }));
      },
      ackLeagueResult: () =>
        set((s) => ({
          lastLeagueResult: s.lastLeagueResult
            ? { ...s.lastLeagueResult, seenAt: Date.now() }
            : null,
        })),
      pushTourneyNotice: (payload) =>
        set({
          lastTourneyNotice: {
            ...payload,
            at: Date.now(),
            seenAt: null,
          },
        }),
      ackTourneyNotice: () =>
        set((s) => ({
          lastTourneyNotice: s.lastTourneyNotice
            ? { ...s.lastTourneyNotice, seenAt: Date.now() }
            : null,
        })),

      setBet: (b) => set({ bet: b }),
      addChips: (delta) => {
        if (!Number.isFinite(delta) || delta === 0) return;
        const safeDelta = Math.trunc(delta);

        if (useGameMode.getState().mode === "single") {
          if (safeDelta > 0) useGameMode.getState().addSingleTrophies(safeDelta);
          return;
        }
        set((s) => ({ chips: Math.max(0, Math.min(9_999_999, s.chips + safeDelta)) }));
        if (safeDelta > 0) {
          const appliedDebt = awardLeagueFromChipsDelta(safeDelta);
          if (appliedDebt > 0) {
            set((s) => ({ chips: Math.max(0, s.chips - appliedDebt) }));
          }
        }
      },
      spend: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0) return false;
        const safeAmount = Math.trunc(amount);
        const { chips } = get();
        if (chips < safeAmount) return false;
        set({ chips: chips - safeAmount });

        get().trackMission("place_bets", safeAmount);
        return true;
      },
      claimedGrants: [],
      hasClaimed: (claimId) => get().claimedGrants.includes(claimId),
      grantOnce: (claimId, payload) => {
        if (typeof claimId !== "string" || claimId.length === 0) return false;
        if (get().claimedGrants.includes(claimId)) return false;

        const chips = Number.isFinite(payload.chips) ? Math.trunc(payload.chips as number) : 0;
        const xp = Number.isFinite(payload.xp) ? Math.trunc(payload.xp as number) : 0;
        const rep = Number.isFinite(payload.reputation)
          ? Math.trunc(payload.reputation as number)
          : 0;

        set((s) => {
          const nextClaims = [...s.claimedGrants, claimId];

          const trimmed = nextClaims.length > 500 ? nextClaims.slice(-500) : nextClaims;
          return {
            claimedGrants: trimmed,
            xp: s.xp + Math.max(0, xp),
            reputation: s.reputation + rep,
          };
        });
        if (chips !== 0) get().addChips(chips);
        return true;
      },
      registerWin: (won) =>
        set((s) => {
          const newStreak = s.streak + 1;

          queueMicrotask(() => {
            get().trackMission("win_chips", won);
            get().trackMission("win_streak", newStreak);
          });
          return {
            streak: newStreak,
            biggestWin: Math.max(s.biggestWin, won),
          };
        }),
      registerLoss: () => set({ streak: 0 }),
      grantBuff: (luck, durationMs) =>
        set({ luckBuff: luck, buffExpiresAt: Date.now() + durationMs }),
      consumeBuffIfExpired: () => {
        const { buffExpiresAt } = get();
        if (buffExpiresAt && Date.now() > buffExpiresAt) {
          set({ luckBuff: 0, buffExpiresAt: null });
        }
      },
      bumpReputation: (n) => set((s) => ({ reputation: s.reputation + n })),
      bumpScarletBond: (n) =>
        set((s) => {
          const bond = Math.max(0, s.scarletBond + n);

          const thresholds = [0, 50, 150, 350, 750, 1500];
          let tier = 0;
          for (let i = 0; i < thresholds.length; i++) {
            if (bond >= thresholds[i]) tier = i;
          }
          return { scarletBond: bond, scarletTier: tier };
        }),
      trackMission: (id, amount = 1) =>
        set((s) => {
          let changed = false;
          const missions = s.missions.map((m) => {
            if (m.id !== id || m.claimed) return m;
            const next = Math.min(m.goal, m.progress + amount);
            if (next === m.progress) return m;
            changed = true;
            return { ...m, progress: next };
          });
          return changed ? { missions } : {};
        }),
      claimMission: (id) =>
        set((s) => {
          const m = s.missions.find((x) => x.id === id);
          if (!m || m.claimed || m.progress < m.goal) return {};
          const beforeRank = rankFromXp(s.xp);
          const newXp = s.xp + m.rewardXp;
          const afterRank = rankFromXp(newXp);
          const leveledUp = afterRank.level > beforeRank.level;
          return {
            chips: s.chips + m.rewardChips,
            xp: newXp,
            missions: s.missions.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
            lastMissionToast: leveledUp
              ? { rank: afterRank.current.name, level: afterRank.level }
              : s.lastMissionToast,
          };
        }),
      ensureFreshMissions: () => {
        const seed = todaySeed();
        if (get().missionsSeed !== seed) {
          set({ missions: rollDailyMissions(seed), missionsSeed: seed });
        }
      },
      clearLastRankUp: () => set({ lastMissionToast: null }),
      reset: () =>
        set({
          chips: 500,
          bet: 10,
          streak: 0,
          biggestWin: 0,
          luckBuff: 0,
          buffExpiresAt: null,
          reputation: 0,
          xp: 0,
          missions: rollDailyMissions(todaySeed()),
          missionsSeed: todaySeed(),
          lastMissionToast: null,
          scarletBond: 0,
          scarletTier: 0,
          contractsClaimed: [],
          claimedGrants: [],
          lastFavorDay: null,
          monteCleanStreak: 0,
          monteBestCleanStreak: 0,
          trucoHandsWon: 0,
          trucoBestSpread: 0,
          guardiaBeaten: true,
          lastCamerinoDay: null,
          camerinoOutfits: [],
          lastTocadorDay: null,
          terrazaBest: 0,
          terrazaRunsTotal: 0,
          lastTerrazaDay: null,
          leaguePoints: 0,
          leagueTier: "cobre",
          leagueDay: leagueDayKey(),
          lastLeagueResult: null,
          lastTourneyNotice: null,
        }),
      setCurrentRumor: (r) => set({ currentRumor: r }),
    }),
    {
      name: "speakeasy-1928",
      version: 1,
      migrate: (persistedState: unknown, _version: number) => {
        return persistedState as CasinoState;
      },
      skipHydration: false,
    },
  ),
);
