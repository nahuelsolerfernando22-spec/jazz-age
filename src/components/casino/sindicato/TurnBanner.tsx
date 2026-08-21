import { motion } from "framer-motion";
import { faccionDe } from "@/lib/sindicato-facciones";

export type TurnPhase = "setup" | "deployment" | "attack" | "fortification";

const PHASES: { id: TurnPhase; label: string; hint: string }[] = [
  { id: "deployment", label: "Desplegar", hint: "Repartí tus refuerzos" },
  { id: "attack", label: "Atacar", hint: "Tomá sectores vecinos" },
  { id: "fortification", label: "Reagrupar", hint: "Un movimiento de tropas" },
];

interface Props {
  playerName: string;
  playerColor: string;
  factionId?: string;
  isBot: boolean;
  phase: TurnPhase;
  unassignedTroops: number;
  pendingTroops: number;
  territories: number;
  totalTerritories: number;
  cards: number;
  /** Vuelta actual de la mesa (T.E.G.: las dos primeras son de acomodo). */
  round?: number;
  /** Si es falso, la fase de asalto está cerrada esta vuelta. */
  canAssault?: boolean;
}

export function TurnBanner({
  playerName,
  playerColor,
  factionId,
  isBot,
  phase,
  unassignedTroops,
  pendingTroops,
  territories,
  totalTerritories,
  cards,
  round,
  canAssault = true,
}: Props) {
  const faccion = faccionDe(factionId);
  const activeIndex = PHASES.findIndex((p) => p.id === phase);
  const hint = canAssault
    ? (PHASES[activeIndex]?.hint ?? "")
    : "Vuelta de acomodo: sin asaltos";


  return (
    <div className="pointer-events-none px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto rounded-2xl border-2 border-[var(--oro)]/70 bg-black/85 px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-black text-xl font-black text-black shadow-[0_0_16px_rgba(0,0,0,0.8)]"
            style={{ backgroundColor: playerColor }}
          >
            {faccion.sello}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bebas text-xl leading-tight text-[var(--crema-clara)] flex items-center gap-2">
              <span className="truncate max-w-[90px]">{playerName}</span>
              {isBot ? (
                <span className="shrink-0 text-[11px] font-black tracking-widest text-[var(--oro)] border border-[var(--oro)]/40 px-1 rounded">
                  CPU
                </span>
              ) : null}
            </p>
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--oro)]">
              {faccion.nombre} · {hint}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Chip label="Tropas" value={unassignedTroops + pendingTroops} tone="gold" />
            <Chip label="Zonas" value={`${territories}/${totalTerritories}`} tone="light" />
            <Chip label="Naipes" value={cards} tone={cards >= 3 ? "hot" : "light"} />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          {PHASES.map((p, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            const locked = p.id === "attack" && !canAssault;
            return (
              <div key={p.id} className="flex-1">
                <div className="relative h-[6px] overflow-hidden rounded-full border border-black bg-white/10">
                  {(active || done) && !locked && (
                    <motion.div
                      layout
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      className="absolute inset-y-0 left-0"
                      style={{ backgroundColor: done ? "#6b5a24" : "var(--cd-gold-tab)" }}
                    />
                  )}
                  {locked && (
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.18)_0_4px,transparent_4px_8px)]" />
                  )}
                </div>
                <p
                  className={`mt-1 text-center text-[11px] font-black uppercase tracking-[0.14em] ${
                    locked
                      ? "text-[var(--crema-clara)]/35 line-through"
                      : active
                        ? "text-[var(--oro-palido)]"
                        : done
                          ? "text-[var(--oro)]/80"
                          : "text-[var(--crema-clara)]/65"
                  }`}
                >
                  {p.label}
                </p>
              </div>
            );
          })}
        </div>

        {!canAssault && (
          <p className="mt-1.5 rounded-md border border-[var(--oro)]/40 bg-[var(--oro)]/10 px-2 py-1 text-center text-[10px] font-black uppercase tracking-[0.14em] text-[var(--oro-palido)]">
            {`Vuelta ${round ?? 1} de acomodo · el fuego se abre en la 3ª`}
          </p>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "gold" | "light" | "hot";
}) {
  const styles =
    tone === "gold"
      ? "bg-[var(--oro)] text-black border-black"
      : tone === "hot"
        ? "bg-red-700 text-white border-black"
        : "bg-black/60 text-[var(--crema-clara)] border-[var(--oro)]/50";
  return (
    <div className={`min-w-[42px] rounded-lg border-2 px-1.5 py-1 text-center ${styles}`}>
      <p className="font-bebas text-base leading-none tabular-nums">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-80">{label}</p>
    </div>
  );
}
