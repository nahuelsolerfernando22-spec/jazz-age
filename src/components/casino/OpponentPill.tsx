import type { CSSProperties, ReactNode } from "react";
import { avatarFocusStyle } from "@/lib/npc-avatar-focus";

export function OpponentPill({
  name,
  avatar,
  cards = 3,
  active = false,
  bubble,
  align = "left",
  size = "md",
  showCards = true,
  showName = true,
  npcId,
}: {
  name: string;
  avatar?: string;
  cards?: number;
  active?: boolean;
  bubble?: ReactNode;
  align?: "left" | "right";
  size?: "md" | "lg" | "xl";
  showCards?: boolean;
  showName?: boolean;
  npcId?: string;
}) {
  const isRight = align === "right";
  const avatarBox = size === "xl" ? "h-24 w-24" : size === "lg" ? "h-16 w-16" : "h-10 w-10";
  const nameCls =
    size === "xl"
      ? "text-[14px] tracking-[0.22em] px-2.5 py-1"
      : size === "lg"
        ? "text-[13px] tracking-[0.2em] px-2 py-0.5"
        : "text-[11px] tracking-[0.18em] px-1.5 py-0.5";
  const cardBox = size === "lg" ? "h-5 w-3.5" : "h-4 w-3";
  return (
    <div
      className={[
        "inline-flex items-center gap-2 max-w-[220px]",
        isRight ? "flex-row-reverse text-right" : "",
      ].join(" ")}
    >
      <div
        className={[
          "relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2",
          avatarBox,
          active
            ? "border-[var(--brass-bright)] shadow-[0_0_0_2px_var(--brass)_inset]"
            : "border-[var(--brass)]/50",
        ].join(" ")}
        style={{ background: "var(--mahogany)" }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-full w-full object-cover"
            style={avatarFocusStyle(npcId) as CSSProperties}
          />
        ) : (
          <span className="font-display text-base text-[var(--brass)]">{name.slice(0, 1)}</span>
        )}
      </div>
      <div className={`flex min-w-0 flex-col ${isRight ? "items-end" : "items-start"}`}>
        {showName && (
          <span
            className={`rounded-[3px] border border-[var(--brass)]/40 bg-[var(--noir)]/80 font-hud uppercase text-[var(--ivory)] truncate max-w-[160px] ${nameCls}`}
          >
            {name}
          </span>
        )}
        {showCards && (
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: cards }).map((_, i) => (
              <span
                key={i}
                className={`block rounded-[1px] border border-[var(--brass)]/60 ${cardBox}`}
                style={{
                  background:
                    "repeating-linear-gradient(45deg, var(--oxblood-deep) 0 2px, var(--mahogany) 2px 4px)",
                }}
              />
            ))}
          </div>
        )}
        {bubble && (
          <div
            className={[
              "mt-1 max-w-[180px] rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/90 px-2 py-1 text-[11px] text-[var(--ivory)] shadow-md",
              isRight ? "text-right" : "text-left",
            ].join(" ")}
          >
            {bubble}
          </div>
        )}
      </div>
    </div>
  );
}
