import { motion, AnimatePresence } from "framer-motion";
import type { TrucoTell } from "@/lib/games/truco/truco-tells";

/** Pista visual del canto de la rival: gesto observable, nunca la mano real. */
export function TrucoTellHint({ tell }: { tell: TrucoTell | null }) {
  return (
    <AnimatePresence>
      {tell && (
        <motion.div
          key={tell.gesto}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none fixed left-1/2 top-[13%] z-[95] w-[min(20rem,88vw)] -translate-x-1/2"
        >
          <div
            className="rounded-sm border px-3 py-2 text-center"
            style={{
              background: "rgba(8,8,10,0.92)",
              borderColor: tell.read === "farol" ? "var(--blood)" : "var(--brass)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{
                color: tell.read === "farol" ? "var(--blood)" : "var(--brass-bright)",
                textShadow: "0 1px 0 #000",
              }}
            >
              {tell.read === "farol" ? "◈ Se le nota algo" : "◆ La ves entera"}
            </p>
            <p
              className="mt-1 text-[12.5px] leading-snug text-[var(--ivory)]"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
            >
              {tell.gesto}
            </p>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[var(--ivory)]/15">
              <div
                className="h-full"
                style={{
                  width: `${Math.round(tell.confianza * 100)}%`,
                  background: tell.read === "farol" ? "var(--blood)" : "var(--brass)",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
