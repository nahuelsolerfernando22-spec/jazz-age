import { useDailyEcho } from "@/store/daily-echo";
import { onRunRegistered } from "@/lib/games/run-registry";

let installed = false;

/** Avisa a los retos del día cuando se cierra un legajo de encargos. */
export function installEncargoTracker() {
  if (installed) return;
  installed = true;

  onRunRegistered((entry) => {
    let prev = new Set(Object.keys(entry.store.getState().cleared ?? {}));
    entry.store.subscribe((s) => {
      const keys = Object.keys(s.cleared ?? {});
      const isNew = keys.some((k) => !prev.has(k));
      prev = new Set(keys);
      if (isNew) useDailyEcho.getState().tickEncargo(entry.id);
    });
  });
}
