import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AbandonEncargoButton } from "@/components/casino/AbandonEncargoButton";
import { onRunRegistered, type RunEntry, type RunLevelLike } from "@/lib/games/run-registry";

function targetOf(l: RunLevelLike): number | null {
  const o = l.objective as { count?: number; target?: number; length?: number } | undefined;
  if (!o) return null;
  return o.count ?? o.target ?? o.length ?? null;
}

/**
 * Banda de encargo activo: se muestra sobre la mesa del juego correspondiente.
 * Escucha el registro de legajos, así que sólo conoce la mesa ya cargada.
 */
export function EncargoRunBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<RunEntry[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => onRunRegistered((entry) => setEntries((prev) => [...prev, entry])), []);

  // Un solo re-render por cambio en cualquiera de las mesas cargadas.
  useEffect(() => {
    const unsubs = entries.map((e) => e.store.subscribe(() => setTick((t) => t + 1)));
    return () => {
      for (const u of unsubs) u();
    };
  }, [entries]);

  const entry = entries.find((e) => e.route && pathname.startsWith(e.route));
  const state = entry ? entry.store.getState() : null;
  const levelId = state?.activeLevel ?? null;
  const progress = state?.progress ?? null;
  void tick;

  useEffect(() => {
    setOpen(false);
  }, [levelId]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!levelId) {
      root.style.removeProperty("--encargo-banner-h");
      return;
    }
    root.style.setProperty("--encargo-banner-h", open ? "9.5rem" : "3.5rem");
    return () => {
      root.style.removeProperty("--encargo-banner-h");
    };
  }, [levelId, open]);

  if (!entry || !levelId) return null;
  const level = entry.findLevel(levelId);
  if (!level) return null;

  const objective = entry.levelLabel ? entry.levelLabel(level) : "";
  const target = targetOf(level);
  const pct =
    progress != null && target ? Math.max(0, Math.min(100, (progress / target) * 100)) : null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
    >
      <div
        className="hud-plate pointer-events-auto w-full max-w-md rounded-sm px-3 py-2"
        style={{
          border: "1px solid oklch(0.55 0.10 65 / 0.6)",
          background:
            "linear-gradient(180deg, oklch(0.20 0.06 40 / 0.96) 0%, oklch(0.09 0.03 25 / 0.97) 100%)",
          boxShadow: "0 14px 34px -16px oklch(0 0 0 / 0.95)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="hud-label shrink-0 text-[11px] tracking-[0.3em] text-[var(--brass)]/85">
            {level.boss ? "Jefe" : "Encargo"}
          </span>
          <span className="min-w-0 flex-1 truncate font-display text-[11px] uppercase tracking-[0.14em] text-[var(--oro-claro)]">
            {level.title}
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Ocultar encargo" : "Mostrar encargo"}
            className="shrink-0 px-2 font-display text-[11px] text-[var(--brass)]/80"
            style={{ minHeight: 32 }}
          >
            {open ? "▾" : "▴"}
          </button>
        </div>

        {open ? (
          <>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="min-w-0 flex-1 font-script text-[11px] leading-snug text-[var(--marfil)]/85">
                {objective}
              </p>
              {progress != null && target ? (
                <span className="shrink-0 font-numerals text-sm text-[var(--oro-claro)]">
                  {progress}
                  <span className="text-[var(--marfil)]/65">/{target}</span>
                </span>
              ) : null}
            </div>
            {pct != null ? (
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #8a6a1e, #f7d271)",
                  }}
                />
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="hud-label text-[11px] tracking-[0.25em] text-[var(--brass)]/90">
                {entry.hostess}
              </span>
              <AbandonEncargoButton onAbandon={() => entry.store.getState().abandon?.()} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
