import { useCallback, useEffect, useRef } from "react";
import { noteEvent, resetMood, type Mood } from "@/lib/hostess-mood";
import { pushEpisode, dominantPattern } from "@/lib/hostess-episodic";
import { recordMatch, type MatchRecord } from "@/lib/hostess-learning";
import { awardLifeOnWin, registerHostessMatchResult } from "@/lib/economy";
import { bumpRivalry } from "@/lib/hostess-rivalry";
import { getEffectiveProfile } from "@/lib/hostess-tuning";
import {
  decisionCurvesFor,
  type DecisionContext,
  type DecisionCurves,
} from "@/lib/hostess-decision";

const LONG_TURN_MS = 25_000;

export interface UseHostessMatch {
  begin: () => void;
  event: (kind: "won" | "lost" | "tied" | "long-turn" | "insult", tag?: string) => Mood;
  tag: (t: string, outcome?: "win" | "loss" | "neutral") => void;

  capture: (piece: string) => void;
  lostPiece: (piece: string) => void;
  bluff: (kind: string) => void;
  opening: (name: string) => void;
  insult: (kind?: string) => void;
  finish: (r: MatchRecord & { bigWin?: boolean; skipEconomy?: boolean; margin?: number }) => void;
  elapsedMs: () => number;

  curves: (ctx?: DecisionContext) => DecisionCurves;
}

export function useHostessMatch(hostessId: string): UseHostessMatch {
  const startedAtRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const armWatchdog = useCallback(() => {
    clearWatchdog();
    watchdogRef.current = setTimeout(() => {
      if (finishedRef.current) return;
      noteEvent(hostessId, "long-turn");
      pushEpisode(hostessId, { tag: "long-turn:auto", outcome: "neutral" });
      armWatchdog();
    }, LONG_TURN_MS);
  }, [hostessId, clearWatchdog]);

  useEffect(() => {
    return () => {
      clearWatchdog();
      resetMood(hostessId);
    };
  }, [hostessId, clearWatchdog]);

  const begin = useCallback(() => {
    startedAtRef.current = Date.now();
    finishedRef.current = false;
    resetMood(hostessId);
    armWatchdog();
  }, [hostessId, armWatchdog]);

  const event = useCallback(
    (kind: "won" | "lost" | "tied" | "long-turn" | "insult", tag?: string) => {
      const mood = noteEvent(hostessId, kind);
      if (tag) {
        pushEpisode(hostessId, {
          tag,
          outcome: kind === "won" ? "loss" : kind === "lost" ? "win" : "neutral",
        });
      }
      if (kind !== "long-turn") armWatchdog();
      return mood;
    },
    [hostessId, armWatchdog],
  );

  const tag = useCallback(
    (t: string, outcome: "win" | "loss" | "neutral" = "neutral") => {
      pushEpisode(hostessId, { tag: t, outcome });
    },
    [hostessId],
  );

  const capture = useCallback(
    (piece: string) => {
      event("won", `capture:${piece}`);
    },
    [event],
  );
  const lostPiece = useCallback(
    (piece: string) => {
      event("lost", `capture-lost:${piece}`);
    },
    [event],
  );
  const bluff = useCallback(
    (kind: string) => {
      tag(`bluff:${kind}`, "neutral");
    },
    [tag],
  );
  const opening = useCallback(
    (name: string) => {
      tag(`opening:${name}`, "neutral");
    },
    [tag],
  );
  const insult = useCallback(
    (kind?: string) => {
      event("insult", kind ? `insult:${kind}` : "insult");
    },
    [event],
  );

  const finish = useCallback(
    (r: MatchRecord & { bigWin?: boolean; skipEconomy?: boolean }) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      clearWatchdog();
      const durationMs =
        r.durationMs ?? (startedAtRef.current > 0 ? Date.now() - startedAtRef.current : undefined);
      try {
        recordMatch(hostessId, { ...r, durationMs });

        const dom = dominantPattern(hostessId);
        const margin = (r as MatchRecord & { margin?: number }).margin;
        bumpRivalry(hostessId, {
          hostessWon: r.hostessWon,
          margin,
          dominantTag: dom?.tag ?? null,
        });

        if (!r.skipEconomy) {
          const playerWon = !r.hostessWon;
          if (playerWon) awardLifeOnWin();
          const big = r.bigWin || (typeof margin === "number" && margin >= 15);
          registerHostessMatchResult(hostessId, {
            won: playerWon,
            magnitude: big ? "big" : "normal",
            skipNemesis: true,
          });
        }
      } catch {}
    },
    [hostessId, clearWatchdog],
  );

  const elapsedMs = useCallback(
    () => (startedAtRef.current > 0 ? Date.now() - startedAtRef.current : 0),
    [],
  );

  const curves = useCallback(
    (ctx: DecisionContext = {}) =>
      decisionCurvesFor(getEffectiveProfile(hostessId), hostessId, ctx),
    [hostessId],
  );

  return {
    begin,
    event,
    tag,
    capture,
    lostPiece,
    bluff,
    opening,
    insult,
    finish,
    elapsedMs,
    curves,
  };
}
