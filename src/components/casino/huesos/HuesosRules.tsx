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
      <button
        type="button"
        aria-label="Cerrar reglas"
        onClick={onClose}
        className="absolute inset-0 bg-[oklch(0.05_0.01_25)]/95"
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-md border border-[var(--brass)]/45 bg-[var(--noir)] p-5 shadow-deep sm:rounded-md"
      >
        <div className="gen-label text-[var(--brass)]/90">cómo se juega</div>
        <h2 className="gen-display mt-1 text-2xl text-[var(--brass-bright)]">Cinco Huesos</h2>

        <ol className="mt-4 space-y-3">
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

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-sm border border-[oklch(0.78_0.16_70)] bg-gradient-to-br from-[oklch(0.45_0.12_60)] to-[oklch(0.30_0.10_50)] py-2.5 font-display text-[11px] uppercase tracking-[0.3em] text-[oklch(0.98_0.06_85)]"
        >
          Entendido
        </button>
      </motion.div>
    </div>,
    document.body,
  );
}
