import { useHostessState, type EnergyPhase, type HostessDynState } from "@/store/hostess-state";

const SHIFT_MS = 4 * 60 * 60 * 1000;
const SICK_DURATION_MIN = 2 * 60 * 60 * 1000;
const SICK_DURATION_MAX = 6 * 60 * 60 * 1000;
const SICK_PROB_PER_HOUR = 0.005;
const WALKOUT_MS = 30 * 60 * 1000;

export interface DynamicSnapshot {
  sick: boolean;
  sickSeverity: "leve" | "fuerte" | null;
  phase: EnergyPhase;
  walkedOut: boolean;
  walkoutUntil: number | null;
  contempt: number;
}

function hashSeed(id: string, hour: number): number {
  let h = 2166136261 ^ hour;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

function ensure(id: string, now: number): HostessDynState {
  const cur = useHostessState.getState().byId[id];
  if (cur) return cur;
  const seed: HostessDynState = { sick: null, lastTickAt: now, walkoutUntil: null };
  useHostessState.getState().setTick(id, now);
  return seed;
}

export function tickHostess(id: string, now: number = Date.now()): void {
  const st = ensure(id, now);
  const store = useHostessState.getState();

  if (st.sick && st.sick.until <= now) {
    store.setSick(id, null);
  }

  if (st.walkoutUntil && st.walkoutUntil <= now) {
    store.setWalkout(id, null);
  }

  const currentSick = useHostessState.getState().byId[id]?.sick ?? null;
  if (!currentSick) {
    const hoursSinceTick = Math.max(0, (now - (st.lastTickAt || now)) / (60 * 60 * 1000));

    const rolls = Math.min(6, Math.floor(hoursSinceTick + 0.5));
    for (let i = 0; i < rolls; i++) {
      const seed = hashSeed(id, Math.floor(now / (60 * 60 * 1000)) - i);
      if (seed < SICK_PROB_PER_HOUR) {
        const duration = SICK_DURATION_MIN + seed * (SICK_DURATION_MAX - SICK_DURATION_MIN) * 200;
        const severity = seed < SICK_PROB_PER_HOUR * 0.35 ? "fuerte" : "leve";
        useHostessState.getState().setSick(id, {
          active: true,
          since: now,
          until: now + duration,
          severity,
        });
        break;
      }
    }
    useHostessState.getState().setTick(id, now);
  }
}

export function energyPhase(
  shiftStartedAt: number,
  shiftEndsAt: number,
  now: number = Date.now(),
): EnergyPhase {
  const total = Math.max(1, shiftEndsAt - shiftStartedAt);
  const t = (now - shiftStartedAt) / total;
  if (t < 0.25) return "fresca";
  if (t < 0.75) return "normal";
  if (t < 0.94) return "impaciente";
  return "agotada";
}

export function syntheticShift(
  id: string,
  now: number = Date.now(),
): { start: number; end: number } {
  const seed = hashSeed(id, 0) * SHIFT_MS;
  const base = Math.floor((now - seed) / SHIFT_MS) * SHIFT_MS + seed;
  return { start: base, end: base + SHIFT_MS };
}

export function contemptFromLevel(playerLevel: number): number {
  if (playerLevel >= 20) return 0;
  if (playerLevel <= 1) return 1;
  return Math.max(0, Math.min(1, (20 - playerLevel) / 19));
}

export function getDynamicSnapshot(
  id: string,
  opts: { playerLevel: number; shift?: { start: number; end: number }; now?: number },
): DynamicSnapshot {
  const now = opts.now ?? Date.now();
  tickHostess(id, now);
  const st = useHostessState.getState().byId[id];
  const shift = opts.shift ?? syntheticShift(id, now);
  const phase = energyPhase(shift.start, shift.end, now);
  const walkoutUntil = st?.walkoutUntil ?? null;
  return {
    sick: !!st?.sick?.active,
    sickSeverity: st?.sick?.severity ?? null,
    phase,
    walkedOut: !!(walkoutUntil && walkoutUntil > now),
    walkoutUntil,
    contempt: contemptFromLevel(opts.playerLevel),
  };
}

export function maybeWalkout(id: string, snap: DynamicSnapshot, now: number = Date.now()): boolean {
  if (snap.walkedOut) return true;
  const impatient = snap.phase === "impaciente" || snap.phase === "agotada";
  if (!snap.sick || !impatient) return false;
  const seed = hashSeed(id, Math.floor(now / 60000));
  if (seed < 0.08) {
    useHostessState.getState().setWalkout(id, now + WALKOUT_MS);
    return true;
  }
  return false;
}
