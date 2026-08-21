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
      // 1) Elemento con intención háptica explícita.
      // 2) Fallback global: cualquier control interactivo vibra con "tap",
      //    así ningún botón de mesa queda mudo. Se puede desactivar por
      //    elemento con data-haptic="none".
      const el = target.closest<HTMLElement>(
        '[data-haptic], button, [role="button"], a[href], input[type="checkbox"], input[type="radio"]',
      );
      if (!el) return;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
      const raw = el.dataset.haptic ?? "tap";
      if (raw === "none") return;
      haptic(isHapticKind(raw) ? raw : "tap");
    };

    window.addEventListener("pointerdown", handler, { passive: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, [haptic]);
  return null;
}
