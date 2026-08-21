import { motion, AnimatePresence } from "framer-motion";
import { contractById, type TableContract } from "@/lib/cinco-huesos";
import sealMenor from "@/assets/huesos/seal-menor.webp";
import sealMayor from "@/assets/huesos/seal-mayor.webp";
import sealLeyenda from "@/assets/huesos/seal-leyenda.webp";

interface Props {
  table: TableContract[];
  rivalName: string;
  /** Valor que pagaría cada contrato con los dados que hay ahora en la mesa. */
  preview: Record<string, number>;
  canClaim: boolean;
  /** Modo "cortar el mazo": tocar un contrato libre lo reemplaza. */
  cutMode?: boolean;
  /** Contrato al que le está apuntando la rival en su turno. */
  rivalTarget?: string | null;
  /** Favores que todavía le quedan a la rival. */
  rivalFavors?: number;
  onClaim: (id: string) => void;
  onCut?: (id: string) => void;
}

const TIER_TONE: Record<string, { border: string; label: string }> = {
  menor: { border: "oklch(0.55 0.06 70 / 0.5)", label: "contrato menor" },
  mayor: { border: "oklch(0.72 0.12 70 / 0.6)", label: "contrato mayor" },
  leyenda: { border: "oklch(0.62 0.20 25 / 0.75)", label: "leyenda" },
};

const TIER_SEAL: Record<string, string> = {
  menor: sealMenor,
  mayor: sealMayor,
  leyenda: sealLeyenda,
};

/**
 * Los seis contratos boca arriba. Reemplaza al viejo cartón de Generala: acá
 * no hay casilleros propios, se compite por la misma mesa.
 */
export function ContractBoard({
  table,
  rivalName,
  preview,
  canClaim,
  cutMode = false,
  rivalTarget = null,
  rivalFavors = 0,
  onClaim,
  onCut,
}: Props) {
  return (
    <section className="mt-4">
      <div className="gen-label mb-2 flex items-center justify-between text-[var(--brass)]/90">
        <span>contratos sobre el paño</span>
        <span className="flex items-center gap-2">
          {rivalFavors > 0 && (
            <span className="text-[var(--brass)]/90">
              {rivalName}: {rivalFavors} favor{rivalFavors === 1 ? "" : "es"}
            </span>
          )}
          <span className="text-[var(--brass-bright)]">
            {table.filter((t) => t.owner === null).length} libres
          </span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {table.map((t) => {
          const c = contractById(t.id);
          const tone = TIER_TONE[c.tier];
          const value = preview[t.id] ?? 0;
          const open = t.owner === null;
          const claimable = open && canClaim && value > 0 && !cutMode;
          const cuttable = open && cutMode;
          const interactive = claimable || cuttable;
          const targeted = open && rivalTarget === t.id;
          return (
            <motion.button
              key={t.id}
              type="button"
              data-card-target
              layout
              disabled={!interactive}
              onClick={() => (cuttable ? onCut?.(t.id) : onClaim(t.id))}
              whileTap={interactive ? { scale: 0.97 } : undefined}
              className="relative flex min-h-[92px] flex-col justify-between overflow-hidden rounded-[4px] border p-2 text-left transition-colors disabled:cursor-default"
              style={{
                borderColor: claimable
                  ? "var(--brass-bright)"
                  : cuttable
                    ? "oklch(0.62 0.20 25 / 0.8)"
                    : targeted
                      ? "oklch(0.62 0.20 25 / 0.9)"
                      : tone.border,
                background: open
                  ? claimable
                    ? "linear-gradient(160deg, oklch(0.30 0.07 60), oklch(0.16 0.03 40))"
                    : "oklch(0.12 0.02 35 / 0.85)"
                  : "oklch(0.09 0.01 30 / 0.9)",
                opacity: open ? 1 : 0.55,
                boxShadow: claimable ? "0 0 16px oklch(0.85 0.18 75 / 0.35)" : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-1">
                <img
                  src={TIER_SEAL[c.tier]}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  width={128}
                  height={128}
                  className="pointer-events-none absolute right-1 bottom-1 h-12 w-12 opacity-[0.16]"
                />
                <span className="gen-display text-[13px] leading-tight text-[var(--ivory)]">
                  {c.title}
                </span>
                <span className="gen-num shrink-0 text-sm text-[var(--brass-bright)]">
                  {value > 0 && open ? value : c.pay}
                </span>
              </div>
              <span className="gen-body mt-1 text-[11px] leading-snug text-balance break-words text-[var(--smoke)]">
                {c.hint}
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span
                  className="gen-label text-[11px]"
                  style={{
                    color: c.tier === "leyenda" ? "oklch(0.68 0.18 28)" : "var(--brass)",
                  }}
                >
                  {tone.label}
                </span>
                <span className="gen-label text-[11px] text-[var(--brass)]/90">
                  {t.owner === "player"
                    ? `vos · ${t.value}`
                    : t.owner === "rival"
                      ? `${rivalName} · ${t.value}`
                      : t.owner === "burned"
                        ? "quemado"
                        : claimable
                          ? "cerrar"
                          : ""}
                </span>
              </div>
              {t.servida && t.owner !== null && t.owner !== "burned" && (
                <span
                  aria-label="cerrado de primer tiro"
                  className="gen-label pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-[3px] border px-1.5 py-0.5 text-[11px]"
                  style={{
                    borderColor: "oklch(0.85 0.18 75 / 0.7)",
                    color: "oklch(0.88 0.16 78)",
                    background: "oklch(0.20 0.05 60 / 0.55)",
                  }}
                >
                  servida
                </span>
              )}
              {targeted && (
                <motion.span
                  aria-label={`${rivalName} va por este contrato`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="gen-label pointer-events-none absolute top-1 left-1 rounded-[3px] border px-1 py-[1px] text-[11px]"
                  style={{
                    borderColor: "oklch(0.62 0.20 25 / 0.9)",
                    color: "oklch(0.75 0.18 28)",
                    background: "oklch(0.14 0.04 30 / 0.9)",
                  }}
                >
                  va por este
                </motion.span>
              )}
              <AnimatePresence>
                {claimable && (
                  <motion.span
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.15, 0.4, 0.15] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 120%, oklch(0.85 0.18 75 / 0.35), transparent 70%)",
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
