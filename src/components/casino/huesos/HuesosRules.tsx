import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { FAVOR_DECK } from "@/lib/cinco-huesos";
import sealMenor from "@/assets/huesos/seal-menor.webp";
import sealMayor from "@/assets/huesos/seal-mayor.webp";
import sealLeyenda from "@/assets/huesos/seal-leyenda.webp";

const TIERS = [
  { seal: sealMenor, name: "Menor", text: "Los más fáciles. Pagan poco, pero se cierran rápido." },
  { seal: sealMayor, name: "Mayor", text: "Piden manos armadas. Pagan el doble que un menor." },
  {
    seal: sealLeyenda,
    name: "Leyenda",
    text: "Casi imposibles. Uno solo puede dar vuelta la noche.",
  },
];

/** Hoja de reglas de Cinco Huesos: se abre antes de sentarse a la mesa. */
export function HuesosRules({ onClose }: { onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[280] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Cómo se juega a Cinco Huesos"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[oklch(0.05_0.01_25)]/95"
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative flex max-h-[86svh] w-full max-w-md flex-col overflow-hidden rounded-t-md border border-[var(--brass)]/45 shadow-deep sm:rounded-md"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, oklch(0.26 0.06 40 / 0.85) 0%, transparent 60%), linear-gradient(180deg, oklch(0.13 0.02 35) 0%, var(--noir) 45%, oklch(0.09 0.015 30) 100%)",
        }}
      >
        {/* Cenefa déco superior */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--brass) 18%, var(--brass-bright) 50%, var(--brass) 82%, transparent)",
            opacity: 0.85,
          }}
        />
        {/* Rayos déco de fondo */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            background:
              "repeating-conic-gradient(from 0deg at 50% 0%, var(--brass-bright) 0deg 3deg, transparent 3deg 12deg)",
            maskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 62%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 62%)",
          }}
        />

        {/* Encabezado fijo con cierre siempre a mano */}
        <div className="relative z-[1] flex items-start gap-3 border-b border-[var(--brass)]/20 px-5 pb-3 pt-4 backdrop-blur-[2px]">
          <div className="min-w-0 flex-1">
            <div className="gen-label text-[var(--brass)]/90">cómo se juega</div>
            <h2 className="gen-display mt-1 text-2xl leading-none text-[var(--brass-bright)]">
              Cinco Huesos
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar reglas"
            onClick={onClose}
            className="cd-hit-44 -mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--brass)]/45 text-[var(--brass)] active:bg-[var(--mahogany)]/40"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor">
              <path d="M5 5 L15 15 M15 5 L5 15" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-3">
        <ol className="space-y-3">
          {[
            "Se reparten seis contratos boca arriba. Los dos compiten por cerrarlos: el que llega primero se lo lleva.",
            "En tu turno tirás los cinco dados. Tenés tres tiros: podés apartar los que te sirven y volver a tirar el resto.",
            "Cuando una mano cumple un contrato libre, lo tocás y lo cerrás. Si lo lográs en el primer tiro es servida y paga más.",
            "Si no llegás a ninguno, tenés que quemar el contrato más barato de la mesa: nadie lo cobra.",
            "La noche termina cuando no queda contrato libre. Gana quien sumó más fichas.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="gen-display shrink-0 text-lg leading-none text-[var(--brass)]/90">
                {i + 1}
              </span>
              <span className="gen-body text-sm leading-snug text-[var(--smoke)]">{t}</span>
            </li>
          ))}
        </ol>

        <div className="gen-label mt-5 text-[var(--brass)]/90">los tres sellos</div>
        <div className="mt-2 space-y-2">
          {TIERS.map((t) => (
            <div key={t.name} className="flex items-center gap-3">
              <img
                src={t.seal}
                alt=""
                aria-hidden
                width={40}
                height={40}
                className="h-9 w-9 shrink-0"
              />
              <div className="min-w-0">
                <div className="gen-display text-sm text-[var(--ivory)]">{t.name}</div>
                <div className="gen-body text-[11px] leading-snug text-[var(--smoke)]">
                  {t.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="gen-label mt-5 text-[var(--brass)]/90">favores en la manga</div>
        <p className="gen-body mt-1 text-[11px] italic leading-snug text-[var(--smoke)]">
          Arrancás con tres cartas, un solo uso cada una por noche. La anfitriona también tiene las
          suyas según su nivel.
        </p>
        <ul className="mt-2 space-y-1.5">
          {FAVOR_DECK.map((f) => (
            <li key={f.id} className="gen-body text-[11px] leading-snug text-[var(--smoke)]">
              <span className="gen-display text-[var(--brass-bright)]">{f.title}</span> · {f.text}
            </li>
          ))}
        </ul>
        </div>

        <div
          className="relative z-[1] border-t border-[var(--brass)]/20 bg-[oklch(0.09_0.015_30)]/80 px-5 pt-3 backdrop-blur"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full rounded-sm border border-[oklch(0.78_0.16_70)] bg-gradient-to-br from-[oklch(0.45_0.12_60)] to-[oklch(0.30_0.10_50)] py-2.5 font-display text-[11px] uppercase tracking-[0.3em] text-[oklch(0.98_0.06_85)] shadow-gold active:translate-y-px"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
