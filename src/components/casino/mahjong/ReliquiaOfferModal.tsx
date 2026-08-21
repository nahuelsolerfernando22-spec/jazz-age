import { motion } from "framer-motion";
import type { ReliquiaDef } from "@/lib/games/mahjong/mahjong-reliquias";

/** Elección de reliquia al superar un piso de la vigilia. */
export function ReliquiaOfferModal({
  piso,
  opciones,
  onElegir,
  onSaltar,
}: {
  piso: number;
  opciones: ReliquiaDef[];
  onElegir: (r: ReliquiaDef) => void;
  onSaltar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 px-4">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-md rounded-sm border border-[var(--brass)] bg-[var(--noir)] p-4"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.7)" }}
        role="dialog"
        aria-label="Elegí una reliquia"
      >
        <p
          className="text-center text-[11px] uppercase tracking-[0.22em] text-[var(--brass-bright)]"
          style={{ textShadow: "0 1px 0 #000" }}
        >
          Piso {piso} superado
        </p>
        <h2
          className="mt-1 text-center font-display text-xl text-[var(--ivory)]"
          style={{ textShadow: "0 2px 3px rgba(0,0,0,0.9)" }}
        >
          Elegí una reliquia
        </h2>
        <p className="mt-1 text-center text-[12px] text-[var(--ivory)]/70">
          Te acompaña el resto de la vigilia.
        </p>

        <div className="mt-4 space-y-2">
          {opciones.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onElegir(r)}
              className="flex w-full min-h-[56px] items-center gap-3 rounded-sm border border-[var(--brass)]/50 bg-black/50 px-3 py-2 text-left transition-colors active:bg-[var(--brass)]/15"
            >
              <span className="text-lg text-[var(--brass-bright)]">{r.icon}</span>
              <span className="min-w-0">
                <span
                  className="block text-[13.5px] font-semibold text-[var(--ivory)]"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
                >
                  {r.name}
                </span>
                <span className="block text-[12px] leading-snug text-[var(--ivory)]/75">
                  {r.description}
                </span>
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSaltar}
          className="mt-3 min-h-[44px] w-full text-[12px] uppercase tracking-[0.18em] text-[var(--ivory)]/60"
        >
          Seguir sin reliquia
        </button>
      </motion.div>
    </div>
  );
}
