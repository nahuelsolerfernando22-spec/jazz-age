import { motion } from "framer-motion";

interface GateOverlayProps {
  remaining: number;
  size?: number;
}

export function GateOverlay({ remaining, size = 80 }: GateOverlayProps) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[6px]"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.15 0.03 60 / 0.55), oklch(0.10 0.02 30 / 0.75))",
          boxShadow: "inset 0 0 0 2px oklch(0.75 0.16 75), inset 0 0 14px oklch(0 0 0 / 0.6)",
        }}
      />
      <motion.div
        key={remaining}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-[oklch(0.78_0.16_75)] bg-[oklch(0.15_0.03_45)] px-1.5 font-display text-xs font-bold tabular-nums text-[oklch(0.92_0.18_80)]"
          style={{
            boxShadow:
              "0 2px 6px rgba(0,0,0,0.85), inset 0 1px 0 oklch(0.95 0.05 70 / 0.4), 0 0 14px oklch(0.78 0.16 75 / 0.55)",
          }}
          title={`Puerta del Cuervo: cerrá ${remaining} pares más para abrirla`}
        >
          🔒 {remaining}
        </div>
      </motion.div>
    </>
  );
}
