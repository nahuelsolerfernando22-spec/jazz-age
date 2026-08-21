import { motion } from "framer-motion";
import { favorById, type FavorId } from "@/lib/cinco-huesos";
import artVuelta from "@/assets/huesos/favor-vuelta-de-mano.webp";
import artDedo from "@/assets/huesos/favor-dedo-balanza.webp";
import artCortar from "@/assets/huesos/favor-cortar-mazo.webp";
import artDoblar from "@/assets/huesos/favor-doblar-apuesta.webp";
import artDeuda from "@/assets/huesos/favor-cobrar-deuda.webp";
import cardBack from "@/assets/huesos/card-back.webp";

const FAVOR_ART: Record<FavorId, string> = {
  vuelta_de_mano: artVuelta,
  dedo_balanza: artDedo,
  cortar_mazo: artCortar,
  doblar_apuesta: artDoblar,
  cobrar_deuda: artDeuda,
  ojo_cuervo: artDeuda, // placeholder
  cubilete_plomo: artDeuda, // placeholder
};

interface Props {
  hand: FavorId[];
  used: FavorId[];
  /** Favor esperando un objetivo (dado o contrato). */
  pending: FavorId | null;
  disabled: boolean;
  /** Favores que existen en la mano pero no se pueden jugar en este momento. */
  unavailable?: FavorId[];
  onPlay: (id: FavorId) => void;
  onCancel: () => void;
  /**
   * "dock" reduce la carta para que entre dentro del zócalo fijo del juego,
   * de modo que los favores estén siempre a mano y no queden tapados.
   */
  variant?: "full" | "dock";
}

/** Las tres cartas de favor: un solo uso cada una por noche. */
export function FavorHand({
  hand,
  used,
  pending,
  disabled,
  unavailable = [],
  onPlay,
  onCancel,
  variant = "full",
}: Props) {
  const dock = variant === "dock";
  return (
    <section className={dock ? "" : "mt-4"}>
      <div
        className={`gen-label flex items-center justify-between text-[var(--brass)]/90 ${dock ? "mb-1" : "mb-2"}`}
      >
        <span>favores en la manga</span>
        {pending && (
          <button
            type="button"
            onClick={onCancel}
            className="gen-label rounded-[3px] border border-[var(--brass)]/45 px-2 py-[3px] text-[var(--brass)]"
          >
            cancelar
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {hand.map((id) => {
          const f = favorById(id);
          const spent = used.includes(id);
          const isPending = pending === id;
          const blocked = !spent && (disabled || unavailable.includes(id));
          return (
            <motion.button
              key={id}
              type="button"
              data-card-target
              disabled={spent || blocked}
              onClick={() => onPlay(id)}
              whileTap={spent || blocked ? undefined : { scale: 0.96 }}
              className={`relative flex flex-col justify-end overflow-hidden rounded-[4px] border text-left disabled:cursor-default ${
                dock ? "min-h-[68px] p-1.5" : "min-h-[124px] p-2"
              }`}
              style={{
                borderColor: isPending ? "var(--brass-bright)" : "oklch(0.55 0.06 70 / 0.5)",
                background: spent
                  ? "oklch(0.09 0.01 30 / 0.9)"
                  : "linear-gradient(160deg, oklch(0.20 0.04 45), oklch(0.11 0.02 32))",
                opacity: spent ? 0.4 : blocked ? 0.5 : 1,
                boxShadow: isPending ? "0 0 14px oklch(0.85 0.18 75 / 0.45)" : undefined,
              }}
            >
              <img
                src={spent ? cardBack : FAVOR_ART[id]}
                alt=""
                aria-hidden
                loading="lazy"
                width={420}
                height={630}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                style={{
                  filter: spent ? "grayscale(0.6) brightness(0.6)" : "saturate(1.05)",
                  opacity: spent ? 0.55 : 0.62,
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, oklch(0.07 0.01 30 / 0.98) 46%, oklch(0.07 0.01 30 / 0.72) 74%, oklch(0.07 0.01 30 / 0.25))",
                }}
              />
              <span
                className={`relative gen-display leading-tight text-[var(--ivory)] ${dock ? "text-[11px]" : "text-[11px]"}`}
                style={{ textShadow: "0 1px 3px oklch(0.05 0 0 / 0.9)" }}
              >
                {f.title}
              </span>
              {!dock && (
                <span
                  className="relative gen-body text-[11px] leading-snug text-[var(--smoke)]"
                  style={{ textShadow: "0 1px 3px oklch(0.05 0 0 / 0.9)" }}
                >
                  {f.text}
                </span>
              )}
              <span className="relative gen-label text-[11px] text-[var(--brass)]/90">
                {spent
                  ? "usada"
                  : isPending
                    ? "elegí objetivo"
                    : blocked
                      ? "sin uso ahora"
                      : "jugar"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
