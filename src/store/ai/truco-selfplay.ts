import { simulateMatch } from "@/lib/ai/truco/selfplay";
import { TRUCO_TIERS } from "@/lib/games/truco/truco-tiers";
import { CHINCHON_TIERS } from "@/lib/games/chinchon/chinchon-tiers";
import { usePrestige } from "@/store/prestige";
import { useCpuTraining } from "@/store/cpu-training";
import type { AiProfile } from "@/lib/games/truco/truco";
import type { DifficultyTier } from "@/lib/difficulty";
import { mutateWeights, useTrucoWeights, type LearnedWeights } from "@/store/ai/truco-weights";
import { listRivals } from "@/lib/games/truco/truco-rivals";

function baseProfile(weights: LearnedWeights): AiProfile {
  const diff = usePrestige.getState().resolve("truco", TRUCO_TIERS);
  const boost = useCpuTraining.getState().boost("truco");
  const t = diff.tuning;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return {
    skill: clamp(t.accuracy + boost.accuracy),
    aggression: clamp(t.accuracy * 0.85 + boost.accuracy * 0.6),
    bluff: clamp(t.bluff - boost.bluffCut),
    patience: 0.55,
    memory: clamp(t.memory + boost.memory),
    depth: t.depth + boost.depth,
    weights,
  };
}

interface TrainerAdapter {
  id: string;
  route: string;
  tiers: DifficultyTier[];
  runOnce(): void;
}

const EVAL_MATCHES = 2;
const TRUCO_ADAPTER: TrainerAdapter = {
  id: "truco",
  route: "/truco",
  tiers: TRUCO_TIERS,
  runOnce() {
    const st = useTrucoWeights.getState();
    const champion = st.champion;
    const challenger = mutateWeights(champion);
    const champProfile = baseProfile(champion);
    const chalProfile = baseProfile(challenger);

    const snapshots = st.snapshots;
    const rivals = listRivals();
    const pickSparringProfile = (i: number): AiProfile => {
      const mode = i % 3;
      if (mode === 0) return chalProfile;
      if (mode === 1 && snapshots.length > 0) {
        const snap = snapshots[Math.floor(Math.random() * snapshots.length)]!;
        return baseProfile(snap.weights);
      }

      return rivals[i % rivals.length]!.profile;
    };
    let champWins = 0;
    let chalWins = 0;
    let totalSpread = 0;

    const EVAL = 3;
    for (let i = 0; i < EVAL; i++) {
      const championIsAi = i % 2 === 0;
      const sparring = pickSparringProfile(i);
      const isMutantMatch = i % 3 === 0;
      const res = simulateMatch({
        aiProfile: championIsAi ? champProfile : sparring,
        opponentProfile: championIsAi ? sparring : champProfile,
        florEnabled: true,
        pointGoal: 30,
      });
      const aiWon = res.winner === "ai";
      const championWonThis = championIsAi ? aiWon : !aiWon;
      if (isMutantMatch) {
        if (championWonThis) champWins++;
        else chalWins++;
      }
      totalSpread += res.spread;

      useCpuTraining.getState().report("truco", { playerWon: false, spread: res.spread });
      usePrestige.getState().reportResult("truco", TRUCO_TIERS, false);
    }

    const adopted = chalWins > champWins;
    if (adopted) st.setChampion(challenger, true);
    st.bump(champWins, chalWins);
    return;
  },
};

const CHINCHON_ADAPTER: TrainerAdapter = {
  id: "chinchon",
  route: "/chinchon",
  tiers: CHINCHON_TIERS,
  runOnce() {
    const boost = useCpuTraining.getState().boost("chinchon");
    const cpuWinChance = 0.45 + boost.progress * 0.25;
    const cpuWon = Math.random() < cpuWinChance;
    const spread = Math.floor(Math.random() * 20);
    useCpuTraining.getState().report("chinchon", { playerWon: !cpuWon, spread });
    usePrestige.getState().reportResult("chinchon", CHINCHON_TIERS, false);
  },
};

const ADAPTERS: TrainerAdapter[] = [TRUCO_ADAPTER, CHINCHON_ADAPTER];

const LOCK_KEY = "cuervo:trainer-lock:v1";
const ROTATION_KEY = "cuervo:trainer-rotation:v1";
const LOCK_TTL_MS = 6000;
const HEARTBEAT_MS = 2000;
const TICK_MS = 60_000;
const ROTATE_MS = 30 * 60 * 1000;
const BLOCKED_RUNTIME_ROUTES = [
  "/blackjack",
  "/chinchon",
  "/truco",
  "/mahjong",
  "/escoba",
  "/dados",
  "/ruleta",
  "/bagatelle",
  "/solitario",
  "/tables",
];

function isNativeRuntime(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return !!w.Capacitor?.isNativePlatform?.();
}

function routeAllowsTraining(): boolean {
  if (!_currentRoute || _currentRoute === "/" || _currentRoute === "/single") return true;
  return !BLOCKED_RUNTIME_ROUTES.some((route) => _currentRoute.startsWith(route));
}

const TAB_ID = (() => {
  try {
    const c = typeof crypto !== "undefined" ? crypto : null;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
})();

let _timer: ReturnType<typeof setTimeout> | null = null;
let _heartbeat: ReturnType<typeof setInterval> | null = null;
let _currentRoute = "";
let _visible = typeof document === "undefined" ? true : !document.hidden;
let _bc: BroadcastChannel | null = null;

interface Lock {
  tab: string;
  ts: number;
}
function readLock(): Lock | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return null;
    const l = JSON.parse(raw) as Lock;
    if (!l || typeof l.tab !== "string" || typeof l.ts !== "number") return null;
    return l;
  } catch {
    return null;
  }
}
function writeLock(l: Lock) {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(l));
  } catch {}
}
function releaseLock() {
  try {
    const cur = readLock();
    if (cur && cur.tab === TAB_ID) localStorage.removeItem(LOCK_KEY);
  } catch {}
}
function isLeader(): boolean {
  const l = readLock();
  if (!l) return false;
  if (l.tab !== TAB_ID) return false;
  if (Date.now() - l.ts > LOCK_TTL_MS) return false;
  return true;
}
function tryAcquireLock(): boolean {
  const l = readLock();
  const now = Date.now();
  if (l && l.tab !== TAB_ID && now - l.ts < LOCK_TTL_MS) return false;
  writeLock({ tab: TAB_ID, ts: now });

  const after = readLock();
  return !!after && after.tab === TAB_ID;
}

interface RotationState {
  idx: number;
  startedAt: number;
}
function readRotation(): RotationState {
  try {
    const raw = localStorage.getItem(ROTATION_KEY);
    if (raw) {
      const r = JSON.parse(raw) as RotationState;
      if (typeof r.idx === "number" && typeof r.startedAt === "number") return r;
    }
  } catch {}
  return { idx: 0, startedAt: Date.now() };
}
function writeRotation(r: RotationState) {
  try {
    localStorage.setItem(ROTATION_KEY, JSON.stringify(r));
  } catch {}
}
function currentAdapter(): TrainerAdapter {
  const r = readRotation();
  const now = Date.now();
  if (now - r.startedAt >= ROTATE_MS) {
    const next: RotationState = { idx: (r.idx + 1) % ADAPTERS.length, startedAt: now };
    writeRotation(next);
    return ADAPTERS[next.idx]!;
  }
  return ADAPTERS[r.idx % ADAPTERS.length]!;
}

function clearTick() {
  if (_timer) {
    clearTimeout(_timer);
    _timer = null;
  }
}

function schedule() {
  clearTick();
  if (!_visible) return;
  if (!routeAllowsTraining()) {
    clearTick();
    releaseLock();
    return;
  }
  const adapter = currentAdapter();

  if (_currentRoute.startsWith(adapter.route)) return;

  if (!isLeader()) {
    if (!tryAcquireLock()) {
      _timer = setTimeout(schedule, LOCK_TTL_MS);
      return;
    }

    try {
      _bc?.postMessage({ type: "leader-changed", tab: TAB_ID });
    } catch {}
  }
  _timer = setTimeout(() => {
    _timer = null;
    try {
      adapter.runOnce();
    } catch {}
    schedule();
  }, TICK_MS);
}

function heartbeat() {
  if (!_visible) return;

  if (isLeader()) writeLock({ tab: TAB_ID, ts: Date.now() });
}

let _installed = false;
export function installBackgroundTrainer(): void {
  if (_installed || typeof document === "undefined") return;
  if (isNativeRuntime()) return;
  _installed = true;
  _visible = !document.hidden;
  document.addEventListener("visibilitychange", () => {
    _visible = !document.hidden;
    if (!_visible) {
      clearTick();
      releaseLock();
    } else schedule();
  });
  window.addEventListener("beforeunload", () => {
    clearTick();
    releaseLock();
    try {
      _bc?.postMessage({ type: "released", tab: TAB_ID });
    } catch {}
    try {
      _bc?.close();
    } catch {}
  });
  if (typeof BroadcastChannel !== "undefined") {
    try {
      _bc = new BroadcastChannel("cuervo:trainer");
      _bc.onmessage = (ev) => {
        const msg = ev.data as { type: string; tab: string } | null;
        if (!msg) return;
        if (msg.type === "leader-changed" && msg.tab !== TAB_ID) {
          clearTick();
        } else if (msg.type === "released") {
          schedule();
        }
      };
    } catch {}
  }
  window.addEventListener("storage", (ev) => {
    if (ev.key === LOCK_KEY) schedule();
  });
  _heartbeat = setInterval(heartbeat, HEARTBEAT_MS);

  schedule();
}

export function setBackgroundTrainerRoute(pathname: string): void {
  _currentRoute = pathname || "";
  schedule();
}

export function stopBackgroundTrainer(): void {
  clearTick();
  if (_heartbeat) {
    clearInterval(_heartbeat);
    _heartbeat = null;
  }
  releaseLock();
}
