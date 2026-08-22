import { AnimatePresence, motion } from "framer-motion";

export interface ConquistaAviso {
  /** Clave única para reanimar aunque se repita el sector. */
  key: number;
  sector: string;
  /** Conquistas seguidas en este turno. */
  racha: number;
  /** Fichas ganadas por el golpe, si hubo. */
  fichas?: number;
  naipe?: boolean;
}

/**
 * Aviso sobrio de sector tomado: un cartel de latón que entra desde abajo,
 * muestra la racha y se va solo. Sin confeti ni pantallazos.
 */
export function ConquistaFlash({ aviso }: { aviso: ConquistaAviso | null }) {
  return (
    <AnimatePresence>
      {aviso && (
        <motion.div
          key={aviso.key}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed inset-x-0 top-[38%] z-[92] flex justify-center px-6"
        >
          <div className="relative overflow-hidden rounded-xl border-2 border-[var(--oro)]/80 bg-black/90 px-4 py-2.5 text-center shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-md">
            <p className="font-bebas text-2xl leading-none text-[var(--oro-palido)]">
              Sector tomado
            </p>
            <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-[0.2em] text-[var(--crema-clara)]/85">
              {aviso.sector}
            </p>
            <div className="mt-1.5 flex items-center justify-center gap-1.5">
              {aviso.racha > 1 ? (
                <span className="rounded-full border border-[var(--oro)]/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[var(--oro)]">
                  {`Racha x${aviso.racha}`}
                </span>
              ) : null}
              {aviso.naipe ? (
                <span className="rounded-full border border-[var(--oro)]/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[var(--oro)]">
                  Naipe
                </span>
              ) : null}
              {aviso.fichas ? (
                <span className="rounded-full border border-[var(--oro)]/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[var(--oro)]">
                  {`+${aviso.fichas} fichas`}
                </span>
              ) : null}
            </div>

            <motion.span
              aria-hidden
              initial={{ x: "-130%" }}
              animate={{ x: "130%" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[var(--oro)]/22 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
