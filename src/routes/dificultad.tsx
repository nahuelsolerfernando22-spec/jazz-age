import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { usePrestige } from "@/store/prestige";
import {
  useCpuTraining,
  boostFromStats,
  type CpuTrainingBoost,
  type CpuTrainingStats,
} from "@/store/cpu-training";
import { TRUCO_TIERS } from "@/lib/games/truco/truco-tiers";
import { CHINCHON_TIERS } from "@/lib/games/chinchon/chinchon-tiers";
import {
  applyPrestige,
  difficultyLabel,
  type DifficultyTier,
  type TierTuning,
} from "@/lib/difficulty";
import { DifficultyBadge } from "@/components/casino/DifficultyBadge";
import { useTrucoPlayerModel, statsFrom } from "@/store/ai/truco-player-model";

export const Route = createFileRoute("/dificultad")({
  head: () => ({
    meta: [
      { title: "Dificultad avanzada — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Curvas de dificultad del CPU: consistencia, castigo y presión por tier, prestigio infinito y entrenamiento persistido.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DificultadPage,
});

interface GameCard {
  id: string;
  name: string;
  tiers: DifficultyTier[];
}

const GAMES: GameCard[] = [
  { id: "truco", name: "Mentira Criolla", tiers: TRUCO_TIERS },
  { id: "chinchon", name: "El Corte Sucio", tiers: CHINCHON_TIERS },
];

function curves(t: TierTuning, boost: CpuTrainingBoost) {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  return {
    consistency: clamp(t.accuracy + boost.accuracy),

    punishment: clamp(
      t.memory + boost.memory * 0.8 + Math.min(1, (t.depth + boost.depth) / 6) * 0.2,
    ),

    pressure: clamp(t.accuracy * 0.9 + (1 - Math.max(0, t.bluff - boost.bluffCut)) * 0.2),
  };
}

function Bar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[var(--marfil)]/80">
        <span>{label}</span>
        <span className="text-[var(--oro)]/85">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--oro)]/60 to-[var(--oro)]"
          style={{ width: `${Math.max(2, Math.round(value * 100))}%` }}
        />
      </div>
      {hint ? <p className="mt-1 text-[11px] text-[var(--marfil)]/65">{hint}</p> : null}
    </div>
  );
}

function TierRow({
  tier,
  prestige,
  boost,
  active,
}: {
  tier: DifficultyTier;
  prestige: number;
  boost: CpuTrainingBoost;
  active: boolean;
}) {
  const tuning = applyPrestige(tier.tuning, prestige);
  const c = curves(tuning, boost);
  return (
    <div
      className={`rounded-xl border p-3 ${
        active ? "border-[var(--oro)]/70 bg-[var(--oro)]/[0.06]" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--marfil)]">
            {difficultyLabel(tier, prestige)}
          </p>
          <p className="text-[11px] text-[var(--marfil)]/65">{tier.hint}</p>
        </div>
        {active ? (
          <span className="rounded-full border border-[var(--oro)]/60 bg-[var(--oro)]/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--oro)]">
            Activo
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Bar label="Consistencia" value={c.consistency} />
        <Bar label="Castigo" value={c.punishment} />
        <Bar label="Presión" value={c.pressure} />
      </div>
      <p className="mt-2 text-[11px] text-[var(--marfil)]/65">
        Sim. profundidad {tuning.depth + boost.depth} · memoria {(tuning.memory * 100).toFixed(0)}%
        · farol {(Math.max(0, tuning.bluff - boost.bluffCut) * 100).toFixed(0)}%
      </p>
    </div>
  );
}

function GamePanel({ game }: { game: GameCard }) {
  const prestige = usePrestige((s) => s.byGame[game.id]);
  const training = useCpuTraining((s) => s.byGame[game.id]);
  const resolved = useMemo(
    () => usePrestige.getState().resolve(game.id, game.tiers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prestige?.tierId, prestige?.prestige, game.id],
  );
  const boost = useMemo(() => boostFromStats(training ?? emptyStats), [training]);
  const streak = prestige?.streak ?? 0;
  const activeTier = resolved.tier;
  const winRate = training && training.games > 0 ? training.cpuWins / training.games : 0;
  const resetTraining = () => useCpuTraining.getState().reset(game.id);

  return (
    <section className="rounded-2xl border border-[var(--oro)]/25 bg-[var(--verde-noche)]/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--marfil)]/65">
            {game.name}
          </p>
          <h2
            className="text-2xl text-[var(--oro)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}
          >
            NIVEL {activeTier.name.toUpperCase()}
            {resolved.prestige > 0 ? ` · P.${resolved.prestige}` : ""}
          </h2>
        </div>
        <DifficultyBadge resolved={resolved} />
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Metric label="Racha" value={`${streak} / ${activeTier.unlockAt}`} />
        <Metric label="Entrenamiento" value={boost.stage} />
        <Metric label="Partidas CPU" value={String(training?.games ?? 0)} />
        <Metric
          label="Winrate CPU"
          value={training && training.games ? `${Math.round(winRate * 100)}%` : "—"}
        />
      </div>

      <div className="mb-4">
        <Bar
          label={`Progreso de entrenamiento (${boost.stage})`}
          value={boost.progress}
          hint="El rival aprende con cada partida — la curva es infinita y se guarda entre sesiones."
        />
      </div>

      <div className="space-y-2">
        {game.tiers.map((t) => {
          const isActive = t.id === activeTier.id;
          const pres = isActive ? resolved.prestige : 0;
          return <TierRow key={t.id} tier={t} prestige={pres} boost={boost} active={isActive} />;
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-[var(--marfil)]/65">
          Último reporte: {formatUpdatedAt(training?.updatedAt)}
        </p>
        <button
          type="button"
          onClick={resetTraining}
          className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/50 hover:text-[var(--oro)]"
        >
          Reiniciar entrenamiento
        </button>
      </div>
    </section>
  );
}

const emptyStats: CpuTrainingStats = {
  games: 0,
  cpuWins: 0,
  xp: 0,
  lastPlayerStreak: 0,
  updatedAt: 0,
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--marfil)]/65">{label}</p>
      <p className="text-sm font-semibold text-[var(--marfil)]">{value}</p>
    </div>
  );
}

function formatUpdatedAt(ts?: number): string {
  if (!ts) return "sin partidas todavía";
  const d = new Date(ts);
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function DificultadPage() {
  return (
    <div className="min-h-dvh bg-[var(--verde-noche)] text-[var(--marfil)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--marfil)]/65">
              Ajustes avanzados
            </p>
            <h1
              className="text-4xl text-[var(--oro)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
            >
              DIFICULTAD
            </h1>
            <p className="mt-1 text-xs text-[var(--marfil)]/65 max-w-md">
              Cómo se comporta el rival en cada mesa. Tres curvas —
              <span className="text-[var(--oro)]/80"> consistencia</span>,
              <span className="text-[var(--oro)]/80"> castigo</span> y
              <span className="text-[var(--oro)]/80"> presión</span> — se calculan a partir del
              tier, el prestigio infinito y el entrenamiento persistido del CPU.
            </p>
          </div>
          <Link
            to="/ajustes"
            className="rounded-full border border-[var(--oro)]/50 px-4 py-3 min-h-[44px] inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--oro)] hover:bg-[var(--oro)]/10"
          >
            Ajustes
          </Link>
        </header>

        <div className="space-y-5">
          {GAMES.map((g) => (
            <GamePanel key={g.id} game={g} />
          ))}
          <TrucoPlayerModelPanel />
        </div>
      </div>
    </div>
  );
}

function TrucoPlayerModelPanel() {
  const model = useTrucoPlayerModel((s) => s.model);
  const reset = useTrucoPlayerModel((s) => s.reset);
  const stats = useMemo(() => statsFrom(model), [model]);
  const hasData = stats.hands > 0;
  return (
    <section className="rounded-2xl border border-[var(--oro)]/25 bg-[var(--verde-noche)]/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--marfil)]/65">
            Truco · Perfil del jugador
          </p>
          <h2
            className="text-2xl text-[var(--oro)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}
          >
            LO QUE LA MESA APRENDIÓ DE VOS
          </h2>
          <p className="mt-1 text-[11px] text-[var(--marfil)]/65">
            Lecturas de tu estilo: tasas suavizadas (Laplace) que el rival usa para valorar cantos y
            farolear. Cuantas más manos, más peso tienen.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/50 hover:text-[var(--oro)]"
        >
          Reiniciar lectura
        </button>
      </header>
      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Metric label="Manos observadas" value={String(stats.hands)} />
        <Metric label="Canta envido" value={pct(stats.envidoCallRate)} />
        <Metric label="Acepta envido" value={pct(stats.envidoAcceptRate)} />
        <Metric label="Envido prom." value={hasData ? stats.envidoAvgCalled.toFixed(1) : "—"} />
        <Metric label="Acepta truco" value={pct(stats.trucoAcceptRate)} />
        <Metric label="Acepta retruco" value={pct(stats.retrucoAcceptRate)} />
        <Metric label="Acepta vale 4" value={pct(stats.vale4AcceptRate)} />
        <Metric label="Faroles" value={pct(stats.bluffRate)} />
      </div>
    </section>
  );
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
