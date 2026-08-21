import { useCallback, useMemo, useRef, useState } from "react";
import { BrassButton } from "@/components/casino/BrassButton";
import { ChipFace } from "@/components/casino/roulette/ChipFace";
import {
  NumberCell,
  NumberRow,
  OutsideCell,
  TableAction,
} from "@/components/casino/roulette/BettingPieces";
import { useHaptics } from "@/hooks/use-haptics";
import { useLowFx } from "@/hooks/use-low-fx";
import {
  ANNOUNCED_BETS,
  COMBO_LABEL,
  COMBO_PAYOUT,
  colorOf,
  comboGroups,
  type BetKind,
  type ComboKind,
  type Color,
} from "@/lib/roulette-math";
import { betKey } from "@/lib/games/ruleta/bet-key";
import tableBg from "@/assets/ruleta-table-v3.webp";

const ROWS: ReadonlyArray<readonly number[]> = [
  Object.freeze(Array.from({ length: 12 }, (_, i) => 3 + i * 3)),
  Object.freeze(Array.from({ length: 12 }, (_, i) => 2 + i * 3)),
  Object.freeze(Array.from({ length: 12 }, (_, i) => 1 + i * 3)),
];
const ROW_COLORS: ReadonlyArray<readonly Color[]> = ROWS.map((r) =>
  Object.freeze(r.map((n) => colorOf(n))),
);
const ROW_TO_COLUMN_BET: Record<number, 1 | 2 | 3> = { 0: 3, 1: 2, 2: 1 };

const NumberGrid = ({
  stakeByKey,
  winning,
  spinning,
  disabled,
  placeBet,
  lowFx,
}: {
  stakeByKey: Map<string, number>;
  winning: number | null;
  spinning: boolean;
  disabled: boolean;
  placeBet: (kind: BetKind) => void;
  lowFx: boolean;
}) => {
  const placeBetRef = useRef(placeBet);
  placeBetRef.current = placeBet;
  const onSelectNumber = useCallback((n: number) => placeBetRef.current({ kind: "number", n }), []);

  const rowStakes = useMemo(
    () => ROWS.map((row) => row.map((n) => stakeByKey.get(betKey({ kind: "number", n })) ?? 0)),
    [stakeByKey],
  );
  const effectiveWinning = spinning ? null : winning;

  return (
    <>
      {ROWS.map((row, rIdx) => (
        <NumberRow
          key={rIdx}
          nums={row}
          colors={ROW_COLORS[rIdx]}
          chips={rowStakes[rIdx]}
          winning={effectiveWinning}
          disabled={disabled}
          onSelect={onSelectNumber}
          lowFx={lowFx}
        />
      ))}
    </>
  );
};

const COMBO_KINDS: ComboKind[] = ["split", "street", "corner", "line"];

/** Panel plegable con las apuestas internas combinadas del paño francés. */
function ComboBets({
  bet,
  chips,
  spinning,
  stakeByKey,
  placeBet,
}: {
  bet: number;
  chips: number;
  spinning: boolean;
  stakeByKey: Map<string, number>;
  placeBet: (kind: BetKind) => void;
}) {
  const [kind, setKind] = useState<ComboKind>("split");
  const groups = useMemo(() => comboGroups(kind), [kind]);

  return (
    <details className="mb-3 group">
      <summary
        data-inline-chip
        className="cd-press-soft flex min-h-9 cursor-pointer list-none items-center justify-between rounded-sm border border-[var(--brass)]/35 bg-[var(--noir)]/55 px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.22em] text-[var(--brass)]/85 [&::-webkit-details-marker]:hidden"
      >
        <span>Apuestas combinadas</span>
        <span aria-hidden className="transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {COMBO_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            data-inline-chip
            className="cd-press min-h-9 rounded-sm border px-2.5 py-1 font-display text-[11px] uppercase tracking-[0.18em]"
            style={{
              borderColor: kind === k ? "var(--brass-bright)" : "oklch(0.72 0.14 78 / 0.35)",
              color: kind === k ? "var(--brass-bright)" : "var(--smoke)",
              background: kind === k ? "oklch(0.24 0.06 60 / 0.7)" : "transparent",
            }}
          >
            {COMBO_LABEL[k]} · {COMBO_PAYOUT[k]}:1
          </button>
        ))}
      </div>

      <div className="mt-1.5 max-h-40 overflow-y-auto rounded-sm border border-[var(--brass)]/20 p-1.5">
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
          {groups.map((nums) => {
            const k = betKey({ kind: "combo", combo: kind, nums });
            const staked = stakeByKey.get(k) ?? 0;
            return (
              <button
                key={k}
                type="button"
                onClick={() => placeBet({ kind: "combo", combo: kind, nums })}
                disabled={spinning || chips < bet}
                aria-label={`${COMBO_LABEL[kind]} ${nums.join(", ")}`}
                data-inline-chip
                className="cd-press relative min-h-9 rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/70 px-1 py-1 font-display text-[11px] tabular-nums tracking-[0.06em] text-[var(--ivory)] disabled:opacity-35"
              >
                {nums.join("·")}
                {staked > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-[var(--brass-bright)] px-1 text-[11px] font-bold text-[#1a1206]">
                    {staked}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

export function BettingTable({
  chips,
  bet,
  setBet,
  chipOpts,
  spinning,
  totalStake,
  sideStake = 0,

  stakeByKey,
  placeBet,
  placeBets,
  clearBets,
  rebet,
  canRebet,
  onSpin,
  result,
  hotNumber,
  streak,
}: {
  chips: number;
  bet: number;
  setBet: (v: number) => void;
  chipOpts: number[];
  spinning: boolean;
  totalStake: number;
  /** Fichas comprometidas fuera de la mesa (apuesta de Clara). */
  sideStake?: number;

  stakeByKey: Map<string, number>;
  placeBet: (kind: BetKind) => void;
  placeBets: (nums: readonly number[]) => void;
  clearBets: () => void;
  rebet: () => void;
  canRebet: boolean;
  onSpin: () => void;
  result: number | null;
  hotNumber: number;
  streak: { color: Color; len: number } | null;
}) {
  const haptic = useHaptics();
  const lowFx = useLowFx();
  const winning = result;
  const announced: Array<{
    key: keyof typeof ANNOUNCED_BETS;
    label: string;
    nums: readonly number[];
  }> = [
    { key: "voisins", label: "Voisins du Zéro", nums: ANNOUNCED_BETS.voisins },
    { key: "tiers", label: "Tiers du Cylindre", nums: ANNOUNCED_BETS.tiers },
    { key: "orphelins", label: "Orphelins", nums: ANNOUNCED_BETS.orphelins },
    { key: "jeuZero", label: "Jeu Zéro", nums: ANNOUNCED_BETS.jeuZero },
  ];

  return (
    <div
      className="relative mt-2 overflow-hidden rounded-[14px] border-2 p-2 sm:mt-4 sm:p-4 [touch-action:manipulation]"
      style={{
        borderColor: "oklch(0.72 0.14 78 / 0.65)",
        backgroundColor: "oklch(0.20 0.06 150)",
        backgroundImage: [
          "radial-gradient(120% 80% at 50% 0%, oklch(0.34 0.09 152 / 0.95) 0%, oklch(0.22 0.06 150 / 0.96) 45%, oklch(0.11 0.03 150 / 0.98) 100%)",
          `url(${tableBg})`,
        ].join(", "),
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        backgroundBlendMode: "normal, luminosity",
        boxShadow:
          "inset 0 0 0 1px oklch(0.85 0.16 78 / 0.22), inset 0 0 90px oklch(0 0 0 / 0.55), 0 0 26px oklch(0.72 0.14 78 / 0.12), 0 14px 34px -12px rgba(0,0,0,0.9)",
      }}
    >
      {/* Viñeta de paño y filete dorado interior */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[6px] rounded-[10px]"
        style={{
          border: "1px solid oklch(0.85 0.16 78 / 0.18)",
          boxShadow: "inset 0 0 70px oklch(0 0 0 / 0.45)",
        }}
      />

      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="font-script text-base leading-[1.15] text-[var(--brass-bright)]">
            la mesa
          </div>
          <div className="mt-0.5 truncate font-display text-[11px] uppercase tracking-[0.24em] text-[var(--brass)]/90 sm:tracking-[0.5em]">
            ─ haga su juego ─
          </div>
        </div>
        <div className="shrink-0 whitespace-nowrap text-right font-display text-[11px] uppercase tracking-[0.12em] text-[var(--smoke)] sm:text-[11px] sm:tracking-[0.32em]">
          en mesa · <span className="text-[var(--brass-bright)]">{totalStake}¢</span>
          <span className="mx-1.5 opacity-40 sm:mx-2">|</span>
          ficha · <span className="text-[var(--brass-bright)]">{bet}¢</span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-2 rounded-sm border px-2.5 py-1 font-display text-[11px] uppercase tracking-[0.3em]"
          style={{
            borderColor: "oklch(0.85 0.18 75 / 0.55)",
            background:
              "linear-gradient(180deg, oklch(0.20 0.08 60 / 0.7), oklch(0.10 0.04 30 / 0.85))",
            color: "var(--ivory)",
            boxShadow: "0 0 10px oklch(0.85 0.18 75 / 0.25)",
          }}
          title="Si tu pleno cae aquí, paga ×50 en vez de ×36"
        >
          <span className="text-[var(--brass)]/80">número de la noche</span>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
            style={{
              background:
                colorOf(hotNumber) === "green"
                  ? "oklch(0.32 0.14 145)"
                  : colorOf(hotNumber) === "red"
                    ? "oklch(0.45 0.20 25)"
                    : "oklch(0.12 0.01 30)",
              color: "var(--ivory)",
              border: "1px solid oklch(0.85 0.18 75 / 0.7)",
            }}
          >
            {hotNumber}
          </span>
          <span className="text-[var(--brass-bright)]">paga ×50</span>
        </div>
        {streak && streak.len >= 3 && (
          <div
            className="rounded-sm border px-2.5 py-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--ivory)]"
            style={{
              borderColor: streak.color === "red" ? "oklch(0.55 0.20 25)" : "oklch(0.45 0.04 60)",
              background:
                streak.color === "red"
                  ? "linear-gradient(180deg, oklch(0.30 0.16 25 / 0.7), oklch(0.10 0.04 30 / 0.85))"
                  : "linear-gradient(180deg, oklch(0.18 0.02 30 / 0.85), oklch(0.06 0.01 28 / 0.95))",
            }}
          >
            racha {streak.color === "red" ? "roja" : "negra"} ×{streak.len}
          </div>
        )}
      </div>

      {/* Las apuestas anunciadas son de jugador avanzado: plegadas por defecto
          para que el paño y el tablero de números respiren en teléfono. */}
      <details className="mb-3 group">
        <summary
          data-inline-chip
          className="cd-press-soft flex min-h-9 cursor-pointer list-none items-center justify-between rounded-sm border border-[var(--brass)]/35 bg-[var(--noir)]/55 px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.24em] text-[var(--brass)]/85 [&::-webkit-details-marker]:hidden"
        >
          <span>Apuestas anunciadas</span>
          <span aria-hidden className="transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {announced.map((a) => {
            const cost = a.nums.length * bet;
            const canAfford = chips >= cost;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => {
                  placeBets(a.nums);
                  haptic("tap");
                }}
                disabled={spinning || !canAfford}
                title={`${a.nums.length} plenos · ${cost}¢`}
                data-inline-chip
                className="cd-press cd-press-soft group/bet relative flex min-h-9 flex-col items-center justify-center rounded-sm border border-[var(--brass)]/45 bg-gradient-to-b from-[var(--oxblood)]/35 to-[var(--noir)]/85 px-2 py-1.5 font-display uppercase tracking-[0.22em] text-[var(--ivory)] transition hover:from-[var(--oxblood)]/55 hover:to-[var(--noir)]/95 disabled:cursor-not-allowed disabled:opacity-35 sm:min-h-11"
              >
                <span className="text-[11px] leading-tight text-[var(--brass-bright)]">
                  {a.label}
                </span>
                <span className="mt-0.5 text-[11px] text-[var(--smoke)]">
                  {a.nums.length} plenos · {cost}¢
                </span>
              </button>
            );
          })}
        </div>
      </details>

      {/* Apuestas combinadas del paño: split, calle, cuadro y línea */}
      <ComboBets
        bet={bet}
        chips={chips}
        spinning={spinning}
        stakeByKey={stakeByKey}
        placeBet={placeBet}
      />

      <div className="mb-2 flex flex-wrap items-center gap-2">
        {chipOpts.map((v) => {
          const active = bet === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => {
                setBet(v);
                haptic("select");
              }}
              disabled={spinning || v > chips}
              aria-pressed={active}
              aria-label={`Ficha ${v}`}
              className="cd-press relative rounded-full disabled:opacity-30"
            >
              <ChipFace amount={v} size={36} active={active} />
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const i = chipOpts.indexOf(bet);
              const next = chipOpts[Math.max(0, i - 1)] ?? bet;
              if (next <= chips) setBet(next);
            }}
            disabled={spinning || bet === chipOpts[0]}
            aria-label="Bajar valor de ficha a la mitad"
            data-inline-chip
            className="cd-press cd-press-soft relative min-h-9 min-w-9 rounded-sm border border-[var(--brass)]/45 bg-[var(--noir)]/70 px-2 py-1 font-display text-[11px] font-bold text-[var(--brass)] hover:text-[var(--brass-bright)] disabled:opacity-30"
          >
            ½
          </button>
          <button
            type="button"
            onClick={() => {
              const i = chipOpts.indexOf(bet);
              const next = chipOpts[Math.min(chipOpts.length - 1, i + 1)] ?? bet;
              if (next <= chips) setBet(next);
            }}
            disabled={spinning || bet === chipOpts[chipOpts.length - 1] || bet * 2 > chips}
            aria-label="Subir valor de ficha al doble"
            data-inline-chip
            className="cd-press cd-press-soft relative min-h-9 min-w-9 rounded-sm border border-[var(--brass)]/45 bg-[var(--noir)]/70 px-2 py-1 font-display text-[11px] font-bold text-[var(--brass)] hover:text-[var(--brass-bright)] disabled:opacity-30"
          >
            ×2
          </button>
          <TableAction
            onClick={clearBets}
            disabled={spinning || totalStake === 0}
            label="Limpiar"
          />
          <TableAction onClick={rebet} disabled={spinning || !canRebet} label="Repetir" />
        </div>
      </div>

      <div
        role="group"
        aria-label="Tablero de apuestas de ruleta francesa"
        className="relative overflow-hidden rounded-sm border border-[var(--brass)]/30 p-2 sm:p-3"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, oklch(0.32 0.10 145) 0%, oklch(0.20 0.08 145) 55%, oklch(0.12 0.05 145) 100%)",
          boxShadow:
            "inset 0 0 40px oklch(0.05 0.02 145 / 0.7), inset 0 1px 0 oklch(0.95 0.05 80 / 0.06)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
          style={{
            background:
              "repeating-linear-gradient(45deg, oklch(0 0 0 / 0.3) 0 2px, transparent 2px 5px), repeating-linear-gradient(-45deg, oklch(1 0 0 / 0.04) 0 2px, transparent 2px 5px)",
          }}
        />

        {/* Vista horizontal (tablet / escritorio) */}
        <div className="relative grid grid-cols-[24px_minmax(0,1fr)_38px] gap-[3px] sm:grid-cols-[36px_minmax(0,1fr)_56px] sm:gap-1.5">
          <NumberCell
            n={0}
            color="green"
            chips={stakeByKey.get(betKey({ kind: "number", n: 0 })) ?? 0}
            isWinner={winning === 0 && !spinning}
            onSelect={() => placeBet({ kind: "number", n: 0 })}
            disabled={spinning || chips < bet}
            tall
            lowFx={lowFx}
          />

          <div className="grid grid-rows-3 gap-[3px] sm:gap-1.5">
            <NumberGrid
              stakeByKey={stakeByKey}
              winning={winning}
              spinning={spinning}
              disabled={spinning || chips < bet}
              placeBet={placeBet}
              lowFx={lowFx}
            />
          </div>

          <div className="grid grid-rows-3 gap-[3px] sm:gap-1.5">
            {[0, 1, 2].map((rIdx) => {
              const col = ROW_TO_COLUMN_BET[rIdx];
              const k = betKey({ kind: "column", idx: col });
              return (
                <OutsideCell
                  key={rIdx}
                  label="2 a 1"
                  chips={stakeByKey.get(k) ?? 0}
                  onSelect={() => placeBet({ kind: "column", idx: col })}
                  disabled={spinning || chips < bet}
                  small
                  lowFx={lowFx}
                />
              );
            })}
          </div>
        </div>

        <div className="relative mt-1.5 grid grid-cols-[24px_minmax(0,1fr)_38px] gap-[3px] sm:grid-cols-[36px_minmax(0,1fr)_56px] sm:gap-1.5">
          <div />
          <div className="grid grid-cols-3 gap-[3px] sm:gap-1.5">
            {[1, 2, 3].map((d) => (
              <OutsideCell
                key={d}
                label={`${d}ª docena · 2:1`}
                chips={stakeByKey.get(betKey({ kind: "dozen", idx: d as 1 | 2 | 3 })) ?? 0}
                onSelect={() => placeBet({ kind: "dozen", idx: d as 1 | 2 | 3 })}
                disabled={spinning || chips < bet}
                lowFx={lowFx}
              />
            ))}
          </div>
          <div />
        </div>

        <div className="relative mt-1.5 grid grid-cols-[24px_minmax(0,1fr)_38px] gap-[3px] sm:grid-cols-[36px_minmax(0,1fr)_56px] sm:gap-1.5">
          <div />
          <div className="grid grid-cols-3 grid-rows-2 gap-[3px] sm:grid-cols-6 sm:grid-rows-1 sm:gap-1.5">
            <OutsideCell
              label="1 a 18"
              chips={stakeByKey.get(betKey({ kind: "highLow", high: false })) ?? 0}
              onSelect={() => placeBet({ kind: "highLow", high: false })}
              disabled={spinning || chips < bet}
              lowFx={lowFx}
            />
            <OutsideCell
              label="Par"
              chips={stakeByKey.get(betKey({ kind: "parity", even: true })) ?? 0}
              onSelect={() => placeBet({ kind: "parity", even: true })}
              disabled={spinning || chips < bet}
              lowFx={lowFx}
            />
            <OutsideCell
              label="◆"
              subLabel="Rojo"
              accent="oklch(0.55 0.22 25)"
              chips={stakeByKey.get(betKey({ kind: "color", color: "red" })) ?? 0}
              onSelect={() => placeBet({ kind: "color", color: "red" })}
              disabled={spinning || chips < bet}
              lowFx={lowFx}
            />
            <OutsideCell
              label="◆"
              subLabel="Negro"
              accent="oklch(0.30 0.02 30)"
              chips={stakeByKey.get(betKey({ kind: "color", color: "black" })) ?? 0}
              onSelect={() => placeBet({ kind: "color", color: "black" })}
              disabled={spinning || chips < bet}
              lowFx={lowFx}
            />
            <OutsideCell
              label="Impar"
              chips={stakeByKey.get(betKey({ kind: "parity", even: false })) ?? 0}
              onSelect={() => placeBet({ kind: "parity", even: false })}
              disabled={spinning || chips < bet}
              lowFx={lowFx}
            />
            <OutsideCell
              label="19 a 36"
              chips={stakeByKey.get(betKey({ kind: "highLow", high: true })) ?? 0}
              onSelect={() => placeBet({ kind: "highLow", high: true })}
              disabled={spinning || chips < bet}
              lowFx={lowFx}
            />
          </div>
          <div />
        </div>
      </div>

      <BrassButton
        type="button"
        variant="primary"
        size="lg"
        shape="ingot"
        block
        onClick={onSpin}
        disabled={spinning || totalStake + sideStake === 0}
        aria-label={
          spinning
            ? "Girando la ruleta"
            : totalStake + sideStake === 0
              ? "Hagan su juego — colocá fichas para girar"
              : `Girar la ruleta con ${totalStake + sideStake} centavos apostados`
        }
        aria-busy={spinning}
        accessKey="g"
        className="cd-press cd-press-soft relative mt-2 sm:mt-4"
      >
        {spinning
          ? "◉ girando… ◉"
          : totalStake + sideStake === 0
            ? "◉ haga su juego ◉"
            : `◉ Girar · ${totalStake + sideStake}¢ ◉`}
      </BrassButton>

    </div>
  );
}
