import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const submitRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        mode: z.enum(["casual", "daily", "tournament"]),
        seed: z.string().min(1).max(64),
        score: z.number().int().min(0).max(99_999_999),
        best_ball: z.number().int().min(0).max(99_999_999),
        balls_played: z.number().int().min(1).max(50),
        combo_max: z.number().int().min(0).max(99),
        jackpots: z.number().int().min(0).max(99),
        duration_ms: z
          .number()
          .int()
          .min(0)
          .max(60 * 60 * 1000),
        client_version: z.string().min(1).max(16).default("pinball-1"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const maxScorePerBall = 50_000;
    const { userId, supabase } = context;

    const avgPerBall = data.score / Math.max(1, data.balls_played);
    if (avgPerBall > maxScorePerBall) {
      return { ok: false as const, reason: "Puntuación irreal por bola." };
    }
    if (data.best_ball > maxScorePerBall) {
      return { ok: false as const, reason: "Bola única demasiado alta." };
    }
    if (data.duration_ms < data.balls_played * 1500) {
      return { ok: false as const, reason: "Run demasiado corta." };
    }

    const { error } = await supabase.from("pinball_runs").insert({
      user_id: userId,
      mode: data.mode,
      seed: data.seed,
      score: data.score,
      best_ball: data.best_ball,
      balls_played: data.balls_played,
      combo_max: data.combo_max,
      jackpots: data.jackpots,
      duration_ms: data.duration_ms,
      client_version: data.client_version,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, reason: "Ya enviaste tu run de hoy." };
      }
      console.error("[submitRun] insert error", error);
      return { ok: false as const, reason: "No se pudo guardar." };
    }
    return { ok: true as const };
  });

export const getPinballLeaderboard = createServerFn({ method: "GET" })
  .validator((input) =>
    z
      .object({
        mode: z.enum(["casual", "daily", "tournament"]).default("casual"),
        metric: z.enum(["best_ball", "score"]).default("best_ball"),
        limit: z.number().int().min(1).max(50).default(10),
        seed: z.string().max(64).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    let q = supabasePublic
      .from("pinball_runs")
      .select(
        "id, score, best_ball, combo_max, jackpots, created_at, user_id, profiles:profiles!inner(display_name, avatar_seed)",
      )
      .eq("mode", data.mode)
      .order(data.metric, { ascending: false })
      .limit(data.limit);
    if (data.seed) q = q.eq("seed", data.seed);
    const { data: rows, error } = await q;
    if (error) {
      console.error("[getPinballLeaderboard]", error);
      return { rows: [] as Array<LeaderboardRow> };
    }
    type PinballRow = {
      id: string;
      score: number;
      best_ball: number;
      combo_max: number;
      jackpots: number;
      created_at: string;
      profiles?: { display_name?: string | null; avatar_seed?: number | null } | null;
    };
    const mapped: LeaderboardRow[] = ((rows ?? []) as PinballRow[]).map((r) => ({
      id: r.id,
      score: r.score,
      best_ball: r.best_ball,
      combo_max: r.combo_max,
      jackpots: r.jackpots,
      created_at: r.created_at,
      display_name: r.profiles?.display_name ?? "anónimo",
      avatar_seed: r.profiles?.avatar_seed ?? 0,
    }));
    return { rows: mapped };
  });

export type LeaderboardRow = {
  id: string;
  score: number;
  best_ball: number;
  combo_max: number;
  jackpots: number;
  created_at: string;
  display_name: string;
  avatar_seed: number;
};
