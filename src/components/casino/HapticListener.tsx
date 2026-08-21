import { useEffect } from "react";
import { useHaptics, type HapticKind } from "@/hooks/use-haptics";

const KINDS: ReadonlySet<HapticKind> = new Set([
  "tap",
  "select",
  "success",
  "warning",
  "error",
  "heavy",
]);

function isHapticKind(v: string): v is HapticKind {
  return KINDS.has(v as HapticKind);
}

export function HapticListener() {
  const haptic = useHaptics();
  useEffect(() => {
    const handler = (ev: PointerEvent) => {
      const target = ev.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-haptic]");
      if (!el) return;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
      const raw = el.dataset.haptic ?? "tap";
      haptic(isHapticKind(raw) ? raw : "tap");
    };

    window.addEventListener("pointerdown", handler, { passive: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, [haptic]);
  return null;
}
