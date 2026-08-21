import { useEffect, useState, type ReactNode } from "react";

import { MAX_LIVES, formatRegen, msUntilNextLife, useLives } from "@/store/lives";
import { LivesSheet } from "./LivesSheet";
import { IconCorazon } from "./DecoIcons";

function HeartArt({ size = 16, dim = false }: { size?: number; dim?: boolean }) {
  return (
    <IconCorazon
      size={size}
      className="shrink-0"
      style={{
        color: dim ? "rgba(236,235,230,0.28)" : "var(--blood, #c8442f)",
        opacity: dim ? 0.6 : 1,
      }}
    />
  );
}

export function LivesIndicator({
  compact = false,
  ultra = false,
}: {
  compact?: boolean;
  ultra?: boolean;
}) {
  const current = useLives((s) => s.current);
  const lastRegenAt = useLives((s) => s.lastRegenAt);
  const tick = useLives((s) => s.tick);
  const [, setNow] = useState(Date.now());
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    tick();
    const t = window.setInterval(() => {
      tick();
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(t);
  }, [tick]);

  const remaining = msUntilNextLife(current, lastRegenAt);
  const title =
    current >= MAX_LIVES
      ? "Vidas al máximo — tocá para ver la sala de descanso"
      : `Próxima vida en ${formatRegen(remaining)} — tocá para recuperarlas`;

  // El corazón del HUD es la puerta a la sala de descanso: esperar el reloj
  // o mirar una función. Antes sólo aparecía al quedarse sin vidas.
  const wrap = (node: ReactNode) => (
    <>
      <button
        type="button"
        onClick={() => setSheet(true)}
        aria-label={title}
        title={title}
        className="cd-hit-44 inline-flex shrink-0 rounded-sm transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)]/80"
      >
        {node}
      </button>
      <LivesSheet open={sheet} onClose={() => setSheet(false)} />
    </>
  );

  if (compact && !ultra) {
    const critical = current <= 1;
    return wrap(
      <div
        className={`hud-plate ${critical ? "hud-plate-blood" : ""} inline-flex h-9 shrink-0 items-center gap-1 px-2.5 tabular-nums ${
          critical ? "text-red-300" : "text-[var(--oro-claro)]"
        }`}
      >
        <HeartArt size={16} />
        <span className="font-bold text-[12px] leading-none">
          {current}
          <span className="opacity-50">/{MAX_LIVES}</span>
        </span>
      </div>,
    );
  }

  return wrap(
    <div
      className="hud-plate inline-flex items-center gap-1.5 px-2 py-1"
    >
      {ultra ? (
        <span className="flex items-center gap-1 font-numerals text-[13px] leading-none tabular-nums text-[var(--blood)]">
          <HeartArt size={14} />
          <span>{current}</span>
          <span className="text-[var(--smoke)]/60">/{MAX_LIVES}</span>
        </span>
      ) : (
        <>
          <div className="flex items-center gap-0.5 leading-none">
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <HeartArt key={i} size={compact ? 14 : 16} dim={i >= current} />
            ))}
          </div>
          {!compact && (
            <span className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/85 tabular-nums">
              {current >= MAX_LIVES ? "lleno" : formatRegen(remaining)}
            </span>
          )}
        </>
      )}
    </div>,
  );
}
