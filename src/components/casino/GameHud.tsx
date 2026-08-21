import { type ReactNode } from "react";
import brandMedallion from "@/assets/brand-medallion.webp";
import { LivesIndicator } from "@/components/casino/LivesIndicator";
import { DailyRewardsPanel } from "@/components/casino/DailyRewardsPanel";
import { MusicToggle } from "@/components/single/MusicToggle";
import { AmbientToggle } from "@/components/single/AmbientToggle";

/**
 * HUD diegético del salón: placa de latón con remaches, medallón grabado,
 * vidas y fichas como objetos físicos. Reemplaza la barra tipo navegador web.
 */
export function GameHud({ trailing }: { trailing?: ReactNode }) {
  return (
    <div
      className="relative shrink-0"
      style={{
        paddingTop: "max(0.4rem, env(safe-area-inset-top))",
        paddingLeft: "max(0.6rem, env(safe-area-inset-left))",
        paddingRight: "max(0.6rem, env(safe-area-inset-right))",
      }}
    >
      <div
        className="mx-auto flex max-w-2xl items-center gap-2 px-2 py-1.5"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.22 0.03 62 / 0.95) 0%, oklch(0.11 0.015 45 / 0.96) 55%, oklch(0.07 0.01 40 / 0.98) 100%)",
          border: "1px solid oklch(0.7 0.11 76 / 0.5)",
          borderRadius: 4,
          boxShadow:
            "inset 0 1px 0 oklch(1 0 0 / 0.16), inset 0 -2px 6px oklch(0 0 0 / 0.7), 0 10px 26px -14px oklch(0 0 0 / 0.95)",
        }}
      >
        {/* Remaches */}
        {[
          "left-1.5 top-1.5",
          "right-1.5 top-1.5",
          "left-1.5 bottom-1.5",
          "right-1.5 bottom-1.5",
        ].map((pos) => (
          <span
            key={pos}
            aria-hidden
            className={`pointer-events-none absolute ${pos} h-[5px] w-[5px] rounded-full`}
            style={{
              background:
                "radial-gradient(circle at 30% 30%, oklch(0.95 0.06 88), oklch(0.5 0.08 62))",
              boxShadow: "0 1px 1px oklch(0 0 0 / 0.8)",
            }}
          />
        ))}

        <span
          aria-hidden
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, oklch(0.4 0.05 60), oklch(0.12 0.02 40))",
            border: "1px solid oklch(0.75 0.12 78 / 0.65)",
            boxShadow: "inset 0 1px 2px oklch(1 0 0 / 0.18), 0 2px 6px oklch(0 0 0 / 0.8)",
          }}
        >
          <img
            src={brandMedallion}
            alt=""
            width={24}
            height={24}
            loading="eager"
            decoding="async"
            className="h-6 w-6 object-contain"
          />
        </span>

        <div className="cd-scroll-x-fade flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <LivesIndicator compact />
          <DailyRewardsPanel compact />
          {trailing}
        </div>

        <span
          aria-hidden
          className="h-7 w-px shrink-0"
          style={{
            background:
              "linear-gradient(180deg, transparent, oklch(0.7 0.11 76 / 0.45), transparent)",
          }}
        />
        <div className="flex shrink-0 items-center gap-1">
          <MusicToggle size="sm" />
          <AmbientToggle size="sm" />
        </div>
      </div>
    </div>
  );
}
