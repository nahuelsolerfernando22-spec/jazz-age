import { useCallback, useEffect, useRef } from "react";
import { useGameMode } from "@/store/game-mode";
import { useNemesis, type NemesisOutcome, type NemesisRecord } from "@/store/nemesis";
import {
  useSingleDifficulty,
  currentDifficulty,
  type SingleDifficulty,
} from "@/store/single-difficulty";
import { useSettings } from "@/store/settings";

const RESOLVED_AT: Record<string, number> = {};
const RESOLVED_WINDOW_MS = 8_000;
function markResolvedNow(gameId: string) {
  RESOLVED_AT[gameId] = Date.now();
}
function wasResolvedRecently(gameId: string) {
  const t = RESOLVED_AT[gameId];
  return !!t && Date.now() - t < RESOLVED_WINDOW_MS;
}

export function reportGameOutcome(gameId: string, outcome: NemesisOutcome | boolean) {
  if (useGameMode.getState().mode !== "single") return;
  const normalized: NemesisOutcome =
    typeof outcome === "boolean" ? (outcome ? "win" : "loss") : outcome;
  useNemesis.getState().recordResult(gameId, normalized);
  markResolvedNow(gameId);
  // Si hay un torneo abierto en esta mesa, esta partida cierra la ronda.
  void import("@/store/cup").then(({ recordCupOutcome }) =>
    recordCupOutcome(gameId, normalized === "win" ? "win" : normalized === "draw" ? "draw" : "loss"),
  );
  if (normalized === "win" || normalized === "loss") {
    void import("@/lib/win-sfx").then(({ playWin, playLose }) => {
      const s = useSettings.getState();
      const opts = { muted: s.muted, master: s.masterVolume, sfx: s.sfxVolume };
      if (normalized === "win") playWin(opts);
      else playLose(opts);
    });
  }
}

export function reportCpuMistake(gameId: string, tag: string, weight = 1) {
  if (useGameMode.getState().mode !== "single") return;
  useNemesis.getState().recordMistake(gameId, tag, weight);
}

export type EndContext =
  | { game: "blackjack"; net: number; playerScore: number; dealerScore: number; outcomes: string[] }
  | { game: "dados"; playerScore: number; cpuScore: number; result: "W" | "L" | "T" }
  | { game: "mahjong"; won: boolean; score: number; trayRemaining: number }
  | { game: "chinchon"; playerWon: boolean; ante: number }
  | { game: "escoba"; playerWon: boolean; draw: boolean; playerPoints: number; cpuPoints: number }
  | { game: "truco"; playerWon: boolean; spread: number; playerScore: number; cpuScore: number };

export function reportOutcomeMistakes(ctx: EndContext): void {
  if (useGameMode.getState().mode !== "single") return;
  const tags = deriveMistakeTags(ctx);
  if (!tags.length) return;
  const store = useNemesis.getState();
  for (const [tag, weight] of tags) store.recordMistake(ctx.game, tag, weight);
}

function deriveMistakeTags(ctx: EndContext): Array<[string, number]> {
  const out: Array<[string, number]> = [];
  switch (ctx.game) {
    case "blackjack": {
      if (ctx.net <= 0) return out;
      if (ctx.dealerScore > 21) out.push(["cpu_dealer_busted", 1]);
      if (ctx.dealerScore >= 17 && ctx.dealerScore <= 18 && ctx.playerScore > ctx.dealerScore)
        out.push(["cpu_stood_too_low", 1]);
      if (ctx.outcomes.includes("blackjack")) out.push(["cpu_missed_bj_check", 1]);
      if (ctx.outcomes.includes("double-win")) out.push(["cpu_lost_to_double", 1]);
      if (ctx.outcomes.filter((o) => o === "win" || o === "double-win").length >= 2)
        out.push(["cpu_lost_split_hands", 2]);
      return out;
    }
    case "dados": {
      if (ctx.result === "W") {
        const margin = ctx.playerScore - ctx.cpuScore;
        out.push(["cpu_lost_generala", 1]);
        if (margin >= 40) out.push(["cpu_low_final_roll", 2]);
        if (ctx.cpuScore < ctx.playerScore * 0.7) out.push(["cpu_wasted_rolls", 1]);
      }
      return out;
    }
    case "mahjong": {
      if (!ctx.won) return out;
      out.push(["board_cleared", 1]);
      if (ctx.trayRemaining >= 5) out.push(["cpu_easy_layout", 1]);
      if (ctx.score >= 200) out.push(["cpu_slow_shuffle", 1]);
      return out;
    }
    case "chinchon": {
      if (!ctx.playerWon) return out;
      out.push(["cpu_late_close", 1]);
      if (ctx.ante >= 100) out.push(["cpu_paid_high_ante", 1]);
      return out;
    }
    case "escoba": {
      if (!ctx.playerWon || ctx.draw) return out;
      const margin = ctx.playerPoints - ctx.cpuPoints;
      out.push(["cpu_lost_escoba", 1]);
      if (margin >= 8) out.push(["cpu_gave_away_sweeps", 2]);
      if (ctx.cpuPoints <= 5) out.push(["cpu_missed_sevens", 1]);
      return out;
    }
    case "truco": {
      if (!ctx.playerWon) return out;
      out.push(ctx.spread >= 15 ? ["cpu_lost_big", 2] : ["cpu_lost_close", 1]);
      if (ctx.cpuScore === 0) out.push(["cpu_no_envido_won", 1]);
      return out;
    }
  }
}

export function nemesisDifficulty(level: number, learning = 0): number {
  const clamped = Math.max(1, Math.min(20, level));
  return 1 + (clamped - 1) * 0.04 + Math.max(0, Math.min(0.5, learning));
}

export function applyPreference(base: number, pref: SingleDifficulty): number {
  if (pref === "rookie") return Math.min(base, 1.1);
  if (pref === "sharp") return Math.min(2.0, base + 0.25);
  return base;
}

export function useNemesisDifficulty(gameId: string): {
  active: boolean;
  nemesis: NemesisRecord | null;
  level: number;
  difficulty: number;
  preference: SingleDifficulty;
  learning: number;
} {
  const mode = useGameMode((s) => s.mode);
  const record = useNemesis((s) => s.byGame[gameId]);
  const pref = useSingleDifficulty((s) => s.byGame[gameId] ?? "normal");
  if (mode !== "single") {
    return {
      active: false,
      nemesis: null,
      level: 1,
      difficulty: 1,
      preference: "normal",
      learning: 0,
    };
  }
  const nem = record ?? useNemesis.getState().get(gameId);
  return {
    active: true,
    nemesis: nem,
    level: nem.level,
    difficulty: applyPreference(nemesisDifficulty(nem.level, nem.learning), pref),
    preference: pref,
    learning: nem.learning,
  };
}

export function useNemesisSession(gameId: string) {
  const active = useGameMode((s) => s.mode) === "single";
  const record = useNemesis((s) => s.byGame[gameId]);
  const pref = useSingleDifficulty((s) => s.byGame[gameId] ?? "normal");
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    useNemesis.getState().get(gameId);
  }, [active, gameId]);

  const onGameEnd = useCallback(
    (outcome: NemesisOutcome | boolean) => {
      if (!active) return;
      reportedRef.current = true;
      const normalized: NemesisOutcome =
        typeof outcome === "boolean" ? (outcome ? "win" : "loss") : outcome;
      useNemesis.getState().recordResult(gameId, normalized);
      markResolvedNow(gameId);
    },
    [active, gameId],
  );

  useEffect(() => {
    reportedRef.current = false;
  }, [gameId]);

  useEffect(() => {
    return () => {
      if (!active) return;
      if (reportedRef.current) return;
      if (wasResolvedRecently(gameId)) return;
      // Diferido: si escribimos en el store durante el desmontaje, React avisa
      // por una actualizacion de estado mientras monta la pantalla siguiente.
      markResolvedNow(gameId);
      setTimeout(() => {
        useNemesis.getState().recordResult(gameId, "abandoned");
      }, 0);
    };
  }, [active, gameId]);

  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    const flush = () => {
      if (reportedRef.current) return;
      if (wasResolvedRecently(gameId)) return;
      reportedRef.current = true;
      useNemesis.getState().recordResult(gameId, "abandoned");
    };
    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted) return;
      flush();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [active, gameId]);

  const nem = record ?? (active ? useNemesis.getState().get(gameId) : null);
  const level = nem?.level ?? 1;
  const learning = nem?.learning ?? 0;

  return {
    active,
    nemesis: nem,
    name: nem?.name ?? "",
    level,
    learning,
    difficulty: applyPreference(nemesisDifficulty(level, learning), pref),
    preference: pref,
    onGameEnd,

    markResolved: () => {
      reportedRef.current = true;
    },
  };
}

export function currentAiPreference(gameId: string): SingleDifficulty {
  return currentDifficulty(gameId);
}
