import { AnimatePresence, motion } from "framer-motion";
import {
  type ClaraClaim,
  type LadoClara,
  type LegajoClara,
  multiplicadorClara,
  punteriaClara,
} from "@/lib/games/ruleta/clara-bet";

interface Props {
  claim: ClaraClaim | null;
  lado: LadoClara | null;
  legajo: LegajoClara;
  ficha: number;
  disabled: boolean;
  onElegir: (lado: LadoClara | null) => void;
}

/** "La Apuesta de Clara": corazonada de la crupier + apuesta paralela del jugador. */
export function ClaraSideBet({ claim, lado, legajo, ficha, disabled, onElegir }: Props) {
  if (!claim) return null;
  const punteria = punteriaClara(legajo);
  const multAcomp = multiplicadorClara(claim, "acompañar");
  const multDesaf = multiplicadorClara(claim, "desafiar");

  return (
    <div
      className="rounded-sm border px-3 py-3"
      style={{
        borderColor: "var(--brass)",
        background: "oklch(0.12 0.01 60 / 0.92)",
        boxShadow: "0 6px 18px oklch(0 0 0 / 0.55)",
      }}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p
          className="font-display text-[11px] uppercase tracking-[0.18em]"
          style={{ color: "var(--brass-bright)", textShadow: "0 1px 0 #000" }}
        >
          ◆ La apuesta de Clara
        </p>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[var(--cd-text-dim)]">
          {punteria == null ? "sin legajo" : `puntería ${punteria}%`}
        </span>
      </div>

      <p
        className="mt-1.5 font-serif text-[13px] leading-snug text-[var(--cd-text-main)]"
        style={{ textShadow: "0 1px 2px oklch(0 0 0 / 0.9)" }}
      >
        “{claim.frase}”
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className="rounded-sm border px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.16em]"
          style={{ borderColor: "var(--brass)", color: "var(--brass-bright)" }}
        >
          {claim.etiqueta}
        </span>
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--cd-text-main)]/15">
          <div
            className="h-full"
            style={{ width: `${Math.round(claim.seguridad * 100)}%`, background: "var(--brass)" }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["acompañar", "desafiar"] as const).map((op) => {
          const activo = lado === op;
          const mult = op === "acompañar" ? multAcomp : multDesaf;
          return (
            <button
              key={op}
              type="button"
              disabled={disabled}
              onClick={() => onElegir(activo ? null : op)}
              className="min-h-[44px] rounded-sm border px-2 py-2 text-center transition-colors disabled:opacity-45"
              style={{
                borderColor: activo
                  ? op === "acompañar"
                    ? "var(--brass-bright)"
                    : "var(--blood)"
                  : "var(--brass)",
                background: activo
                  ? op === "acompañar"
                    ? "oklch(0.28 0.06 80 / 0.5)"
                    : "oklch(0.22 0.08 25 / 0.5)"
                  : "transparent",
              }}
            >
              <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-[var(--cd-text-main)]">
                {op === "acompañar" ? "Acompañarla" : "Desafiarla"}
              </span>
              <span className="mt-0.5 block font-mono text-[11px] text-[var(--brass-bright)]">
                ×{mult.toFixed(2)} · {ficha} fichas
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 font-serif text-[11px] leading-snug text-[var(--cd-text-dim)]">
        Se cobra aparte de tus apuestas de mesa. Si no elegís lado, la corazonada queda en charla.
      </p>
    </div>
  );
}

/** Resultado del último cruce con Clara. */
export function ClaraSideBetResult({
  texto,
  neto,
}: {
  texto: string | null;
  neto: number;
}) {
  return (
    <AnimatePresence>
      {texto && (
        <motion.div
          key={texto}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="mt-2 rounded-sm border px-3 py-2 text-center"
          style={{
            borderColor: neto >= 0 ? "var(--brass-bright)" : "var(--blood)",
            background: "oklch(0.12 0.01 60 / 0.9)",
          }}
        >
          <p className="font-serif text-[12px] leading-snug text-[var(--cd-text-main)]">{texto}</p>
          <p
            className="mt-0.5 font-mono text-[12px]"
            style={{ color: neto >= 0 ? "var(--brass-bright)" : "var(--blood)" }}
          >
            {neto >= 0 ? `+${neto}` : neto} fichas
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
