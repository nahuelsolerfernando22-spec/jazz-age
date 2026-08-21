import { useEffect } from "react";
import { toast } from "sonner";
import { onRunRegistered, type RunResult } from "@/lib/games/run-registry";

function starLine(n: number | undefined): string {
  const s = Math.max(0, Math.min(3, n ?? 0));
  return "★".repeat(s) + "☆".repeat(3 - s);
}

/**
 * Avisa el cierre de un encargo en cualquier mesa cargada.
 * Se apoya en el registro de legajos, así que no arrastra las nueve mesas al
 * paquete de arranque.
 */
export function EncargoResultToaster() {
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    const stop = onRunRegistered((entry) => {
      let seen: RunResult | null = entry.store.getState().lastResult ?? null;
      unsubs.push(
        entry.store.subscribe((state) => {
          const next = state.lastResult ?? null;
          if (!next) {
            seen = null;
            return;
          }
          if (next === seen) return;
          seen = next;
          const title = entry.findLevel(next.levelId)?.title ?? next.levelId;
          const gameTag = `${entry.label} · ${title}`;
          if (next.won) {
            toast.success(`Encargo cumplido — ${gameTag}`, {
              description: `${starLine(next.stars)}${next.reward ? `  ·  +${next.reward}¢` : ""}`,
              duration: 5000,
              action: {
                label: "Ver hub",
                onClick: () => {
                  const a = document.createElement("a");
                  a.href = "/encargos";
                  a.click();
                },
              },
            });
          } else {
            toast(`Encargo fallido — ${gameTag}`, {
              description: "Intentalo de nuevo desde el hub.",
              duration: 4000,
            });
          }
        }),
      );
    });

    return () => {
      stop();
      for (const u of unsubs) u();
    };
  }, []);

  return null;
}
