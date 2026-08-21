import { activeTourneyGame, TOURNEY_META, tourneyPeriodKey } from "@/lib/daily-tournament";
import { tourneyRoundState, type TourneyGame } from "@/lib/tourney-format";

interface Props {
  game: TourneyGame;
  className?: string;
}

/**
 * Chapa discreta que le recuerda al jugador que está corriendo una ronda del
 * torneo semanal. Solo se muestra si ESTE juego es el torneo activo de la
 * semana; si ya se gastaron todas las rondas, avisa "Rondas usadas".
 *
 * Vive en el flujo normal del encabezado (nunca position absolute) para no
 * taparle controles a nadie.
 */
export function TourneyRoundBadge({ game, className = "" }: Props) {
  if (activeTourneyGame() !== game) return null;

  const meta = TOURNEY_META[game];
  const state = tourneyRoundState(game, tourneyPeriodKey());
  const totalRounds = state.scores.length;
  // "Ronda" choca con la ronda interna de varios juegos (generala, mahjong):
  // el jugador leía "Ronda 1 de 2" al lado de "Ronda 7/10". Usamos "Intento".
  const roundLabel = state.finished
    ? "Intentos usados"
    : `Intento ${state.roundsDone + 1} de ${totalRounds}`;

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-sm border border-[var(--brass)]/45 bg-[var(--noir)]/70 px-2 py-0.5 font-display text-[11px] uppercase tracking-[0.24em] text-[var(--brass)]/85 ${className}`}
      title={`${meta.label} · ${roundLabel}`}
    >
      <span aria-hidden className="shrink-0 text-[var(--brass)]">
        ♦
      </span>
      <span className="truncate">{meta.label}</span>
      <span aria-hidden className="shrink-0 text-[var(--brass)]/90">
        ·
      </span>
      <span className="shrink-0">{roundLabel}</span>
    </span>
  );
}
