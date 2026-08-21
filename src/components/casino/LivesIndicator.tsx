import { useEffect, useState } from "react";

import { MAX_LIVES, formatRegen, msUntilNextLife, useLives } from "@/store/lives";
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

  useEffect(() => {
    tick();
    const t = window.setInterval(() => {
      tick();
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(t);
  }, [tick]);

  const remaining = msUntilNextLife(current, lastRegenAt);

  if (compact && !ultra) {
    const critical = current <= 1;
    return (
      <div
        className={`hud-plate ${critical ? "hud-plate-blood" : ""} inline-flex h-9 shrink-0 items-center gap-1 px-2.5 tabular-nums ${
          critical ? "text-red-300" : "text-[var(--oro-claro)]"
        }`}
        title={
          current >= MAX_LIVES ? "Vidas al máximo" : `Próxima vida en ${formatRegen(remaining)}`
        }
      >
        <HeartArt size={16} />
        <span className="font-bold text-[12px] leading-none">
          {current}
          <span className="opacity-50">/{MAX_LIVES}</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className="hud-plate inline-flex items-center gap-1.5 px-2 py-1"
      title={current >= MAX_LIVES ? "Vidas al máximo" : `Próxima vida en ${formatRegen(remaining)}`}
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
    </div>
  );
}
