let installed = false;
let manualOverride: boolean | null = null;
const listeners = new Set<(on: boolean) => void>();
let current = false;

interface BatteryLike {
  level: number;
  charging: boolean;
  addEventListener: (t: string, cb: () => void) => void;
}

function apply(on: boolean) {
  if (current === on) return;
  current = on;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.lowPower = on ? "1" : "0";
  }
  listeners.forEach((l) => l(on));
}

function computeAuto(b: BatteryLike): boolean {
  return !b.charging && b.level <= 0.15;
}

export function installLowPower() {
  if (installed || typeof navigator === "undefined") return;
  installed = true;
  const anyNav = navigator as unknown as { getBattery?: () => Promise<BatteryLike> };
  if (!anyNav.getBattery) return;
  anyNav
    .getBattery()
    .then((b) => {
      const sync = () => {
        if (manualOverride !== null) return;
        apply(computeAuto(b));
      };
      b.addEventListener("levelchange", sync);
      b.addEventListener("chargingchange", sync);
      sync();
    })
    .catch(() => {
      /* noop */
    });
}

export function setLowPowerOverride(v: boolean | null) {
  manualOverride = v;
  if (v !== null) apply(v);
}

export function isLowPower() {
  return current;
}

export function onLowPowerChange(cb: (on: boolean) => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
