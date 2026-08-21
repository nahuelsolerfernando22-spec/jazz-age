import { motion, AnimatePresence } from "framer-motion";
import { contractById, tableTotals, type TableContract } from "@/lib/cinco-huesos";
import { BrassButton } from "@/components/casino/BrassButton";
import { useGameOutcome } from "@/hooks/use-game-outcome";

interface Props {
  open: boolean;
  table: TableContract[];
  rivalName: string;
  /** Fichas netas de la noche (positivo = ganancia). */
  net: number;
  onRematch: () => void;
  onClose: () => void;
  canRematch: boolean;
}

/** Cierre de noche: quién se llevó cada contrato y revancha directa. */
export function HuesosEndScreen({
  open,
  table,
  rivalName,
  net,
  onRematch,
  onClose,
  canRematch,
}: Props) {
  const { player, rival } = tableTotals(table);
  const outcome = player > rival ? "win" : player < rival ? "loss" : "draw";
  useGameOutcome(open ? outcome : null);

  const title =
    outcome === "win"
      ? "Te llevaste la mesa"
      : outcome === "loss"
        ? `${rivalName} se lleva el bote`
        : "Empate";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[70] px-3"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 26 }}
          style={{ paddingBottom: "calc(var(--sa-bottom) + 10px)" }}
          role="dialog"
          aria-label="Resultado de la noche"
        >
          <div
            className="mx-auto max-w-2xl rounded-t-md border border-[var(--brass)]/45 p-4"
            style={{
              background: "linear-gradient(180deg, oklch(0.14 0.02 35), oklch(0.07 0.01 30))",
              boxShadow: "0 -14px 40px oklch(0.02 0 0 / 0.75)",
            }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="gen-display text-xl text-[var(--brass-bright)]">{title}</h2>
              <span className="gen-num text-lg text-[var(--ivory)]">
                {player} — {rival}
              </span>
            </div>
            <div className="gen-label mt-1 text-[var(--brass)]/90">
              {net > 0 ? `+${net} fichas` : net < 0 ? `${net} fichas` : "sin cambios en la caja"}
            </div>

            <ul className="mt-3 max-h-[34vh] space-y-1 overflow-y-auto pr-1">
              {table.map((t) => {
                const c = contractById(t.id);
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 border-b border-[var(--brass)]/12 pb-1"
                  >
                    <span className="gen-body min-w-0 truncate text-[12px] text-[var(--ivory)]">
                      {c.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {t.servida && t.owner !== null && t.owner !== "burned" && (
                        <span
                          className="gen-label rounded-[3px] border px-1 py-px text-[11px]"
                          style={{
                            borderColor: "oklch(0.85 0.18 75 / 0.6)",
                            color: "oklch(0.88 0.16 78)",
                          }}
                        >
                          servida
                        </span>
                      )}
                      <span
                        className="gen-label shrink-0 text-[11px]"
                        style={{
                          color:
                            t.owner === "player"
                              ? "oklch(0.85 0.18 75)"
                              : t.owner === "rival"
                                ? "oklch(0.68 0.16 28)"
                                : "var(--smoke)",
                        }}
                      >
                        {t.owner === "player"
                          ? `vos · ${t.value}`
                          : t.owner === "rival"
                            ? `${rivalName} · ${t.value}`
                            : "quemado"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <BrassButton
                type="button"
                variant="primary"
                size="md"
                onClick={onRematch}
                disabled={!canRematch}
              >
                Otra noche
              </BrassButton>
              <button
                type="button"
                onClick={onClose}
                className="gen-label min-h-[48px] rounded-md border-2 border-[var(--brass)]/40 bg-[var(--noir)]/80 px-2 text-[var(--brass)]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
