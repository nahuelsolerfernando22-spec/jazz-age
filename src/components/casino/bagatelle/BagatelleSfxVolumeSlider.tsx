import { useSettings } from "@/store/settings";

export function BagatelleSfxVolumeSlider() {
  const value = useSettings((s) => s.bagatelleSfxVolume);
  const setValue = useSettings((s) => s.setBagatelleSfxVolume);
  const muted = useSettings((s) => s.muted);
  const pct = Math.round((value ?? 1) * 100);
  return (
    <label className={`mt-3 block ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <span>Volumen del tablero</span>
        <span className="text-[var(--brass-bright)]">{muted ? "muteado" : `${pct}%`}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        disabled={muted}
        onChange={(e) => setValue(Number(e.target.value) / 100)}
        className="mt-1 w-full accent-[var(--brass-bright)]"
        aria-label="Volumen específico del SFX del bagatelle"
      />
      <div className="mt-0.5 flex justify-between text-[11px] uppercase tracking-[0.24em] text-[var(--ivory)]/45">
        <span>silencio</span>
        <span>fuerte</span>
      </div>
      <div className="mt-1 text-[11px] text-[var(--ivory)]/45">
        Se multiplica con el volumen general y el de efectos.
      </div>
    </label>
  );
}
