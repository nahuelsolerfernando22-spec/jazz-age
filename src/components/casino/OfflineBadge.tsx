import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBadge() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full border px-3 py-1.5 pointer-events-none"
      style={{
        borderColor: "oklch(0.62 0.08 70 / 0.55)",
        background:
          "linear-gradient(180deg, oklch(0.14 0.03 30 / 0.92), oklch(0.08 0.02 22 / 0.95))",
        boxShadow: "0 4px 18px oklch(0 0 0 / 0.6), inset 0 0 12px oklch(0 0 0 / 0.55)",
      }}
    >
      <span
        className="mr-2 inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background: "oklch(0.72 0.18 40)",
          boxShadow: "0 0 8px oklch(0.72 0.18 40 / 0.8)",
        }}
      />
      <span className="font-display text-[11px] uppercase tracking-[0.32em] text-[var(--brass)]">
        Sin telégrafo
      </span>
    </div>
  );
}
