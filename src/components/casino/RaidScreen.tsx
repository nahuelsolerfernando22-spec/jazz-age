import { Link } from "@tanstack/react-router";

/**
 * Pantalla que aparece cuando una sala no pudo cargar: en la ficción del
 * salón, "la redada" cortó la partida. Ofrece reintentar o volver al hall.
 */
export function RaidScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-5 bg-[#0b0906] px-6 text-center text-[var(--crema)]">
      <p
        className="text-3xl uppercase tracking-[0.18em] text-[var(--oro-claro)]"
        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
      >
        Redada en el salón
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-[var(--marfil)]/80">
        Apagaron las luces un momento. Esperá que el portero abra otra vez la puerta de esta sala.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            data-haptic="tap"
            onClick={onRetry}
            className="min-h-11 rounded-full border border-[var(--oro)]/50 bg-[var(--oro)]/15 px-5 text-[11px] uppercase tracking-[0.22em] text-[var(--oro-claro)]"
          >
            Reintentar
          </button>
        ) : null}
        <Link
          to="/single"
          data-haptic="tap"
          className="min-h-11 rounded-full border border-[var(--oro)]/25 px-5 text-[11px] uppercase leading-[2.75rem] tracking-[0.22em] text-[var(--marfil)]/80"
        >
          Volver al hall
        </Link>
      </div>
    </div>
  );
}
