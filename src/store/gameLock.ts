import { useEffect } from "react";
import { create } from "zustand";
import { toast } from "sonner";
import { useLives } from "@/store/lives";

interface GameLockState {
  locked: boolean;
  started: boolean;
  sessionId: number;
  setLocked: (v: boolean, started?: boolean) => void;
  markStarted: () => void;
}

export const useGameLock = create<GameLockState>((set) => ({
  locked: false,
  started: false,
  sessionId: 0,
  setLocked: (v, started = false) =>
    set((s) => {
      const nextStarted = v ? started : false;
      if (s.locked === v && s.started === nextStarted) return s;
      const nextSession = v && !s.locked ? s.sessionId + 1 : s.sessionId;
      return { locked: v, started: nextStarted, sessionId: nextSession };
    }),
  markStarted: () =>
    set((s) => {
      if (s.started || !s.locked) return s;
      try {
        window.dispatchEvent(new CustomEvent("cuervo:game-started"));
      } catch {
        /* noop */
      }
      return { ...s, started: true };
    }),
}));

export function useLockGame(active: boolean, started = active) {
  const setLocked = useGameLock((s) => s.setLocked);
  useEffect(() => {
    setLocked(active, started);
    if (active) {
      try {
        useLives.getState().tick();
        const remaining = useLives.getState().current;
        // Defer al próximo tick para que <Toaster/> esté montado en la ruta.
        window.setTimeout(() => {
          toast(`Entrás con ${remaining} vida${remaining === 1 ? "" : "s"} · abandonar cuesta 1`, {
            duration: 1200,
            position: "top-center",
            style: {
              marginTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
              fontSize: "12px",
              maxWidth: "92vw",
            },
          });
        }, 0);
      } catch {
        /* noop */
      }
    }
    return () => setLocked(false);
  }, [active, started, setLocked]);
}
