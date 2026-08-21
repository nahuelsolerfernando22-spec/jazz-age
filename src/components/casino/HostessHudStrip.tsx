import featherIcon from "@/assets/_placeholder.webp";
import chipsIcon from "@/assets/_placeholder.webp";
import favorIcon from "@/assets/_placeholder.webp";
import { MAX_AFFECTION_LEVEL, getLevelInfo } from "@/lib/affinity";
import { useFavors } from "@/store/favors";
import { useCasino } from "@/store/casino";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.floor(n / 1000)}k`;
  if (n >= 1000) return n.toLocaleString("es-AR");
  return String(n);
}

export function HostessHudStrip({
  npcId,
  showChips = true,
  showFavors = true,
  showAffinity = true,
  variant = "overlay",
}: {
  npcId: string;
  showChips?: boolean;
  showFavors?: boolean;
  showAffinity?: boolean;
  variant?: "overlay" | "inline";
}) {
  const info = getLevelInfo(npcId);
  const chips = useCasino((s) => s.chips);
  const favors = useFavors((s) => s.favors);

  const overlayClass = variant === "overlay" ? "absolute inset-x-0 bottom-0 z-20" : "relative";

  return (
    <div
      className={`${overlayClass} pointer-events-none flex items-center justify-between gap-2 px-3 py-1.5`}
      style={{
        background:
          "linear-gradient(to top, rgba(15, 6, 6, 0.92) 0%, rgba(15, 6, 6, 0.78) 60%, rgba(15, 6, 6, 0) 100%)",
        borderTop: "1px solid var(--brass)",
        boxShadow: "inset 0 1px 0 rgba(201, 168, 76, 0.25)",
      }}
      aria-label={`HUD de ${npcId}`}
    >
      {showAffinity && (
        <div
          className="flex items-center gap-[3px]"
          title={`${info.name} · ${info.points.toLocaleString("es-AR")} pts${
            info.capped
              ? " · tope actual (próximamente)"
              : info.nextAt
                ? ` · faltan ${(info.nextAt - info.points).toLocaleString("es-AR")} para subir`
                : " · máximo"
          }`}
        >
          {Array.from({ length: MAX_AFFECTION_LEVEL }, (_, i) => {
            const filled = i < info.level;
            const prestige = i >= 5;
            return (
              <img
                key={i}
                src={featherIcon}
                alt=""
                aria-hidden
                width={12}
                height={12}
                loading="lazy"
                decoding="async"
                style={{
                  width: 12,
                  height: 12,
                  objectFit: "contain",
                  opacity: filled ? 1 : 0.2,
                  filter: filled
                    ? prestige
                      ? "drop-shadow(0 0 4px rgba(255, 206, 77, 0.7)) saturate(1.2)"
                      : "drop-shadow(0 0 2px rgba(201, 168, 76, 0.45))"
                    : "grayscale(1)",
                }}
              />
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        {showChips && (
          <span
            className="flex items-center gap-1 font-display text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--brass-bright)" }}
          >
            <img
              src={chipsIcon}
              alt=""
              aria-hidden
              width={16}
              height={16}
              loading="lazy"
              decoding="async"
              style={{ width: 16, height: 16, objectFit: "contain" }}
            />
            {fmt(chips)}¢
          </span>
        )}
        {showFavors && (
          <span
            className="flex items-center gap-1 font-display text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--brass-bright)" }}
          >
            <img
              src={favorIcon}
              alt=""
              aria-hidden
              width={16}
              height={16}
              loading="lazy"
              decoding="async"
              style={{ width: 16, height: 16, objectFit: "contain" }}
            />
            {fmt(favors)}
          </span>
        )}
      </div>
    </div>
  );
}
