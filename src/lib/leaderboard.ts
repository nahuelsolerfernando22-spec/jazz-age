import { getSupabase } from "@/integrations/supabase/lazy";
import { isOfflineDemo } from "@/lib/offline-demo";

export type LbEntry = {
  id: string;
  game: string;
  mode: string;
  seed: string | null;
  score: number;
  display_name: string;
  created_at: string;
  meta?: Record<string, unknown>;
  source: "local" | "cloud";
};

const LOCAL_KEY = "cuervo:leaderboards:v1";

type LocalStore = Record<string, LbEntry[]>;

function keyOf(game: string, mode: string, seed: string | null) {
  return `${game}|${mode}|${seed ?? ""}`;
}

function readLocal(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as LocalStore) : {};
  } catch {
    return {};
  }
}

function writeLocal(store: LocalStore) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
  } catch {}
}

function getLocalAlias(): string {
  try {
    return localStorage.getItem("cuervo:alias") || "Forastero";
  } catch {
    return "Forastero";
  }
}

export function setLocalAlias(alias: string) {
  try {
    localStorage.setItem("cuervo:alias", alias.slice(0, 16));
  } catch {}
}

export type SubmitInput = {
  game: string;
  mode?: string;
  seed?: string | null;
  score: number;
  meta?: Record<string, unknown>;
};

export async function submitScore(input: SubmitInput): Promise<{ local: boolean; cloud: boolean }> {
  const mode = input.mode ?? "classic";
  const seed = input.seed ?? null;
  const entry: LbEntry = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    game: input.game,
    mode,
    seed,
    score: input.score,
    display_name: getLocalAlias(),
    created_at: new Date().toISOString(),
    meta: input.meta,
    source: "local",
  };

  const store = readLocal();
  const k = keyOf(input.game, mode, seed);
  const list = store[k] ?? [];
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  store[k] = list.slice(0, 50);
  writeLocal(store);

  let cloud = false;
  if (!isOfflineDemo() && (typeof navigator === "undefined" || navigator.onLine !== false)) {
    try {
      const supabase = await getSupabase();
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", u.user.id)
          .maybeSingle();
        const display = prof?.display_name || getLocalAlias();
        const { error } = await supabase.from("leaderboards").insert({
          user_id: u.user.id,
          game: input.game,
          mode,
          seed,
          score: input.score,
          meta: (input.meta ?? {}) as never,
          display_name: display,
        });
        cloud = !error;
      }
    } catch {}
  }

  return { local: true, cloud };
}

export type TopOptions = {
  game: string;
  mode?: string;
  seed?: string | null;
  limit?: number;
};

export async function fetchTop(opts: TopOptions): Promise<LbEntry[]> {
  const mode = opts.mode ?? "classic";
  const limit = opts.limit ?? 10;
  const local = (readLocal()[keyOf(opts.game, mode, opts.seed ?? null)] ?? []).slice(0, limit);

  let cloud: LbEntry[] = [];
  if (!isOfflineDemo() && (typeof navigator === "undefined" || navigator.onLine !== false)) {
    try {
      const supabase = await getSupabase();
      let q = supabase
        .from("leaderboards")
        .select("id, game, mode, seed, score, display_name, created_at, meta")
        .eq("game", opts.game)
        .eq("mode", mode)
        .order("score", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(limit);
      if (opts.seed != null) q = q.eq("seed", opts.seed);
      const { data } = await q;
      if (data) {
        cloud = data.map((r) => ({
          id: r.id,
          game: r.game,
          mode: r.mode,
          seed: r.seed,
          score: r.score,
          display_name: r.display_name,
          created_at: r.created_at,
          meta: (r.meta as Record<string, unknown>) ?? {},
          source: "cloud" as const,
        }));
      }
    } catch {}
  }

  const merged = [...cloud, ...local];
  merged.sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
  return merged.slice(0, limit);
}
