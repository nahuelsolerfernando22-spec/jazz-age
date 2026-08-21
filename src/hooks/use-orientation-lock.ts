import { useEffect } from "react";

export type OrientationLockMode = "portrait" | "landscape" | "any";

export function useOrientationLock(mode: OrientationLockMode = "portrait") {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let webLocked = false;

    const screenAny = window.screen as unknown as {
      orientation?: {
        lock?: (m: string) => Promise<void>;
        unlock?: () => void;
      };
    };

    (async () => {
      try {
        const mod = await import("@capacitor/screen-orientation").catch(() => null);
        if (cancelled) return;
        const so = (
          mod as unknown as {
            ScreenOrientation?: {
              lock?: (o: { orientation: string }) => Promise<void>;
              unlock?: () => Promise<void>;
            };
          }
        )?.ScreenOrientation;
        if (so) {
          if (mode === "any") await so.unlock?.();
          else await so.lock?.({ orientation: mode === "landscape" ? "landscape" : "portrait" });
          return;
        }
      } catch {}

      if (mode === "any") {
        try {
          screenAny.orientation?.unlock?.();
        } catch {
          /* noop */
        }
        return;
      }
      const target = mode === "portrait" ? "portrait-primary" : "landscape-primary";
      try {
        await screenAny.orientation?.lock?.(target);
        webLocked = true;
      } catch {}
    })();

    return () => {
      cancelled = true;
      if (webLocked) {
        try {
          screenAny.orientation?.unlock?.();
        } catch {
          /* noop */
        }
      }
      if (mode === "any") {
        (async () => {
          try {
            const mod = await import("@capacitor/screen-orientation").catch(() => null);
            const so = (
              mod as unknown as {
                ScreenOrientation?: { lock?: (o: { orientation: string }) => Promise<void> };
              }
            )?.ScreenOrientation;
            await so?.lock?.({ orientation: "portrait" });
          } catch {
            /* noop */
          }
        })();
      }
    };
  }, [mode]);
}
