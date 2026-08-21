import { useDebts } from "@/store/debts";

export function DebtBadge() {
  const total = useDebts((s) => s.totalDebt());
  if (total <= 0) return null;
  return (
    <div
      title="Deuda con la casa"
      className="hud-plate hud-plate-blood group relative flex items-center gap-1.5 px-2 py-1 font-display text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)] shadow-deep transition hover:bg-[var(--blood)]/40"
    >
      <span aria-hidden className="text-[var(--blood)]">
        ▼
      </span>
      <span className="tabular-nums text-[var(--ivory)]">{total.toLocaleString("es-AR")}¢</span>
      <span className="hidden sm:inline text-[var(--smoke)]">a la casa</span>
    </div>
  );
}
