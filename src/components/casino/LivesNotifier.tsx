import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { MAX_LIVES, formatRegen, msUntilNextLife, useLives } from "@/store/lives";

const WARN_THRESHOLD_MS = 60_000;

export function LivesNotifier() {
  const current = useLives((s) => s.current);
  const lastRegenAt = useLives((s) => s.lastRegenAt);
  const tick = useLives((s) => s.tick);

  const prevCurrentRef = useRef<number | null>(null);
  const warnedForAnchorRef = useRef<number | null>(null);

  useEffect(() => {
    tick();
    const t = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(t);
  }, [tick]);

  useEffect(() => {
    const prev = prevCurrentRef.current;
    prevCurrentRef.current = current;
    if (prev === null) return;
    if (current > prev) {
      const gained = current - prev;
      if (current >= MAX_LIVES) {
        toast.success("Vidas al máximo", {
          description: "El Cuervo te devolvió el aliento. Cinco corazones listos.",
          id: "lives-full",
        });
      } else {
        toast.success(gained === 1 ? "+1 vida recargada" : `+${gained} vidas recargadas`, {
          description: `Ahora tienes ${current}/${MAX_LIVES} corazones.`,
          id: "lives-regen",
        });
      }
    }
  }, [current]);

  useEffect(() => {
    if (current >= MAX_LIVES) {
      warnedForAnchorRef.current = null;
      return;
    }
    const remaining = msUntilNextLife(current, lastRegenAt);
    if (
      remaining > 0 &&
      remaining <= WARN_THRESHOLD_MS &&
      warnedForAnchorRef.current !== lastRegenAt
    ) {
      warnedForAnchorRef.current = lastRegenAt;
      toast("Otra vida está por llegar", {
        description: `En ${formatRegen(remaining)} recuperás un corazón.`,
        id: "lives-warn",
      });
    }
  }, [current, lastRegenAt]);

  return null;
}
