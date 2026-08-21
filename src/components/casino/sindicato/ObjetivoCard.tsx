/**
 * Naipe de objetivo secreto del jugador. Tapado por defecto: se destapa al tocar,
 * como cuando espiás tu carta debajo de la mesa.
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Target } from "lucide-react";
import { useSyndicate } from "@/store/syndicate";
import { evaluarObjetivo } from "@/lib/sindicato-objetivos";

export function ObjetivoCard() {
  const [abierto, setAbierto] = useState(false);
  const objetivo = useSyndicate((s) => s.objectives[0] ?? null);
  const conquests = useSyndicate((s) => s.conquests);
  const territories = useSyndicate((s) => s.activeTerritories);
  const players = useSyndicate((s) => s.players);
  const roundNumber = useSyndicate((s) => s.roundNumber);
  const comun = useSyndicate((s) => s.comunObjetivo);

  const progreso = useMemo(
    () =>
      evaluarObjetivo(
        objetivo,
        {
          conquests,
          territories,
          eliminados: Object.fromEntries(players.map((p) => [p.id, p.eliminated])),
          comun,
        },
        0,
      ),
    [objetivo, conquests, territories, players, comun],
  );

  if (!objetivo) return null;

  return (
    <div className="fixed left-3 top-[172px] z-[80] max-w-[52vw]">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Tapar objetivo secreto" : "Espiar objetivo secreto"}
        className="cd-hit-44 flex w-full items-center gap-2 rounded-2xl border-2 border-[var(--oro)]/60 bg-black/85 px-3 py-2 text-left backdrop-blur-md active:translate-y-[1px] touch-manipulation"
      >
        <Target size={16} className="shrink-0 text-[var(--oro)]" />
        <span className="min-w-0 flex-1">
          <span className="block font-bebas text-sm leading-none text-[var(--oro-palido)]">
            Objetivo secreto
          </span>
          <span className="block truncate text-[11px] font-black uppercase tracking-widest text-[var(--oro)]/80">
            {abierto ? objetivo.titulo : "Tocá para espiar"}
          </span>
        </span>
        {abierto ? (
          <EyeOff size={14} className="shrink-0 text-[var(--oro)]/70" />
        ) : (
          <Eye size={14} className="shrink-0 text-[var(--oro)]/70" />
        )}
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="mt-2 overflow-hidden rounded-2xl border-2 border-[var(--oro)]/40 bg-black/90 p-3 backdrop-blur-md"
          >
            <p className="text-[12px] leading-snug text-[var(--crema-clara)]/90">{objetivo.desc}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--oro)]"
                style={{ width: `${Math.round(progreso.progreso * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--oro)]/70">
              {progreso.detalle}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--crema-clara)]/50">
              {`Ronda ${roundNumber} · objetivo común ${comun} sectores`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
