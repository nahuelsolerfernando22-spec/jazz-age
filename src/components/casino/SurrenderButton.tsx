import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { useLives } from "@/store/lives";
import { useMembership } from "@/store/membership";
import { useSurrenderStore } from "@/store/surrender";
import { playLifeLost } from "@/lib/life-lost-sfx";
import { useHaptics } from "@/hooks/use-haptics";
import { useModalBodyFlag } from "@/hooks/use-modal-body-flag";
import { abandonActiveRuns } from "@/lib/games/run-registry";


export function useSurrender(handler: (() => void) | null, label: string = "Rendirse") {
  const setHandler = useSurrenderStore((s) => s.setHandler);
  // Envolvemos el handler para que también cierre cualquier encargo activo.
  const wrapped = useCallback(() => {
    if (!handler) return;
    abandonActiveRuns();
    handler();
  }, [handler]);
  useEffect(() => {
    setHandler(handler ? wrapped : null, label);
    return () => setHandler(null, null);
  }, [handler, wrapped, label, setHandler]);
}

interface Props {
  onSurrender: () => void;
  active: boolean;
  label?: string;
  className?: string;
}

export function SurrenderButton({ onSurrender, active, label = "Rendirse", className }: Props) {
  const [confirm, setConfirm] = useState(false);
  useModalBodyFlag(confirm);
  const spend = useLives((s) => s.spend);
  const tick = useLives((s) => s.tick);
  const current = useLives((s) => s.current);
  const member = useMembership((s) => s.member);
  const haptic = useHaptics();
  const canSurrender = member || current > 0;

  if (!active) return null;

  const doSurrender = () => {
    tick();
    if (!member) {
      const ok = spend();
      if (!ok) {
        setConfirm(false);
        return;
      }
      playLifeLost();
    }
    setConfirm(false);
    onSurrender();
  };

  const openConfirm = () => {
    haptic("warning");
    setConfirm(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        disabled={!canSurrender}
        aria-label="Rendirse (cuesta 1 vida)"
        title={canSurrender ? "Rendirse — cuesta 1 vida" : "Sin vidas suficientes"}
        className={
          className ??
          "inline-flex items-center gap-1.5 min-h-11 min-w-11 rounded-sm border border-[var(--oxblood)]/80 bg-[var(--noir)]/90 px-3 py-2 font-display text-[11px] uppercase tracking-[0.2em] text-[var(--ivory)] shadow-[0_6px_16px_rgba(0,0,0,0.5)] transition-colors hover:bg-[var(--oxblood)]/30 hover:border-[var(--oxblood)] active:bg-[var(--oxblood)]/50 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/70 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0"
        }
      >
        <Flag className="h-4 w-4 shrink-0" aria-hidden />
        <span>{label}</span>
      </button>

      {confirm && (
        <div
          className="fixed inset-0 z-[320] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="surrender-title"
        >
          <div className="w-full max-w-sm rounded-md border border-[var(--brass)]/60 bg-[var(--noir)]/95 p-5 text-center shadow-2xl">
            <h3 id="surrender-title" className="font-display text-xl text-[var(--brass)] mb-2">
              ¿Rendirte?
            </h3>
            <p className="text-sm text-[var(--ivory)]/80 mb-4">
              {member ? (
                <>Sos socio: rendirte no te cuesta vidas.</>
              ) : (
                <>
                  Te cuesta <span className="text-[var(--brass)] font-semibold">1 vida</span> (tenés{" "}
                  {current}).
                </>
              )}
            </p>
            <div className="mb-4 rounded-sm border border-[var(--oxblood)]/45 bg-[var(--oxblood)]/15 px-3 py-2 text-left">
              <div className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--brass)]/85">
                Resultado final
              </div>
              <p className="mt-1 text-[12px] leading-snug text-[var(--ivory)]/75">
                La mesa se cierra como derrota por abandono y volvés a quedar libre para salir.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setConfirm(false)}
                className="min-h-[48px] px-4 py-3 rounded-sm border border-[var(--brass)]/40 text-[var(--ivory)] active:bg-[var(--brass)]/10 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={doSurrender}
                disabled={!member && current <= 0}
                className="min-h-[48px] px-4 py-3 rounded-sm border border-[var(--oxblood)] bg-[var(--oxblood)]/60 text-[var(--ivory)] active:brightness-125 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {member ? "Rendirme" : "Pagar 1 vida"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
