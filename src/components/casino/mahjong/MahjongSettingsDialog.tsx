import { useMahjongSettings } from "@/lib/games/mahjong/mahjong-settings";
import { BrassButton } from "@/components/casino/BrassButton";
import { MobileSheet } from "@/components/ui/MobileSheet";
import { useSettings } from "@/store/settings";

export function MahjongSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useMahjongSettings();
  const matchHint = useSettings((st) => st.mahjongMatchHint);
  const setMatchHint = useSettings((st) => st.setMahjongMatchHint);
  const selectFx = useSettings((st) => st.mahjongSelectFx);
  const setSelectFx = useSettings((st) => st.setMahjongSelectFx);
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      eyebrow="— El Dragón de Marfil —"
      title="Ajustes"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            onClick={s.reset}
            className="tap-target font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90 active:text-[var(--brass-bright)]"
          >
            Restablecer
          </button>
          <BrassButton variant="primary" size="sm" onClick={onClose}>
            Cerrar
          </BrassButton>
        </div>
      }
    >
      <div className="space-y-4 px-4 py-4 text-[13px] text-[var(--ivory)]/90">
        <label className="tap-comfort flex items-center justify-between gap-3 border-b border-[var(--brass)]/20 pb-3">
          <div className="min-w-0">
            <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
              Consejo del Dragón
            </div>
            <div className="text-[11px] text-[var(--ivory)]/70">
              Muestra la mejor jugada + porqué (EV, riesgo, huérfanas).
            </div>
          </div>
          <input
            type="checkbox"
            checked={s.showAiExplain}
            onChange={(e) => s.set({ showAiExplain: e.target.checked })}
            className="h-6 w-6 accent-[var(--brass-bright)]"
          />
        </label>

        <label className="tap-comfort flex items-center justify-between gap-3 border-b border-[var(--brass)]/20 pb-3">
          <div className="min-w-0">
            <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
              Resaltar mejor jugada
            </div>
            <div className="text-[11px] text-[var(--ivory)]/70">
              Brillo permanente sobre la ficha sugerida por la mesa.
            </div>
          </div>
          <input
            type="checkbox"
            checked={s.showBestMoveGlow}
            onChange={(e) => s.set({ showBestMoveGlow: e.target.checked })}
            className="h-6 w-6 accent-[var(--brass-bright)]"
          />
        </label>

        <div className="border-b border-[var(--brass)]/20 pb-3">
          <div className="flex items-center justify-between">
            <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
              Pista automática
            </div>
            <div className="font-script text-lg text-[var(--ivory)]">{s.autoHintSeconds}s</div>
          </div>
          <input
            type="range"
            min={4}
            max={15}
            step={1}
            value={s.autoHintSeconds}
            onChange={(e) => s.set({ autoHintSeconds: Number(e.target.value) })}
            className="mt-2 h-6 w-full accent-[var(--brass-bright)]"
          />
          <div className="text-[11px] text-[var(--ivory)]/70">
            Segundos sin tocar antes de resaltar una jugada gratis.
          </div>
        </div>

        <div className="pb-1">
          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
            Marcar pareja disponible
          </div>
          <div className="mt-1 text-[11px] text-[var(--ivory)]/70">
            El contorno verde sobre la ficha gemela de la bandeja.
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                { v: "off", label: "Nunca" },
                { v: "delay", label: "A los 6s" },
                { v: "always", label: "Siempre" },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setMatchHint(o.v)}
                className={`tap-target rounded-sm border px-2 py-2 font-display text-[11px] uppercase tracking-[0.16em] transition ${
                  matchHint === o.v
                    ? "border-[var(--brass-bright)] bg-[var(--brass)]/20 text-[var(--brass-bright)]"
                    : "border-[var(--brass)]/30 text-[var(--ivory)]/70"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-1">
          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
            Titileo al seleccionar
          </div>
          <div className="mt-1 text-[11px] text-[var(--ivory)]/70">
            Pulsos y destellos de las fichas al tocarlas. "Reducido" deja los avisos fijos, sin
            parpadeo.
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                { v: "off", label: "Sin efectos" },
                { v: "reducido", label: "Reducido" },
                { v: "full", label: "Completo" },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setSelectFx(o.v)}
                className={`tap-target rounded-sm border px-2 py-2 font-display text-[11px] uppercase tracking-[0.16em] transition ${
                  selectFx === o.v
                    ? "border-[var(--brass-bright)] bg-[var(--brass)]/20 text-[var(--brass-bright)]"
                    : "border-[var(--brass)]/30 text-[var(--ivory)]/70"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileSheet>
  );
}
