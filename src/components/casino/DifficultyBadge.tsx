import type { ResolvedDifficulty } from "@/store/prestige";

interface Props {
  resolved: ResolvedDifficulty;
  tone?: "gold" | "muted";
  className?: string;
  onClick?: () => void;
  title?: string;
}

export function DifficultyBadge({
  resolved,
  tone = "gold",
  className = "",
  onClick,
  title,
}: Props) {
  const gold = tone === "gold";
  const cls = gold
    ? "border-[var(--oro)] bg-[var(--oro)]/15 text-[var(--oro)]"
    : "border-white/15 bg-white/[0.03] text-[var(--marfil)]/80";
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title ?? resolved.tier.hint}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] ${cls} ${className}`}
    >
      <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 border border-current" />
      <span>{resolved.label}</span>
    </Comp>
  );
}
