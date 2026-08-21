import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "@/store/settings";

const SHOWN_KEY = "cuervo:offline-ready-shown:v2";
const REQUIRED_CACHES = ["cuervo-images", "cuervo-build"];

async function isReady(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) return false;
    if (!("caches" in window)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg || !reg.active) return false;
    const names = await caches.keys();
    return REQUIRED_CACHES.every((needle) => names.some((n) => n.startsWith(needle)));
  } catch {
    return false;
  }
}

export function OfflineReadyIndicator() {
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(SHOWN_KEY) === "1") return;
    } catch {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      attempts++;
      if (await isReady()) {
        if (cancelled) return;
        setVisible(true);
        try {
          localStorage.setItem(SHOWN_KEY, "1");
        } catch {}
        setTimeout(() => setVisible(false), 4500);
        return;
      }
      if (attempts < 20) {
        setTimeout(tick, 3000);
      }
    };

    const t = setTimeout(tick, 4000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none fixed bottom-4 left-1/2 z-[80] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--oro)]/50 bg-[var(--verde-noche)]/90 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[var(--oro)] shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"
            />
            Listo para jugar sin internet
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
