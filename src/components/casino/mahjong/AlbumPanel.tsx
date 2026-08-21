import { AnimatePresence, motion } from "framer-motion";
import { MahjongTile } from "@/components/casino/mahjong/MahjongTile";
import { BrassButton } from "@/components/casino/BrassButton";
import {
  CHAR_SHEETS,
  SPECIAL_GROUPS,
  computeSets,
  keyChar,
  keySpec,
  totalCollected,
  useMahjongAlbum,
  type SetReward,
} from "@/store/games/mahjong/mahjong-album";
import { useCasino } from "@/store/casino";
import type { SheetIdx, SpecialGroup } from "@/components/casino/mahjong/MahjongTile";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AlbumPanel({ open, onClose }: Props) {
  const album = useMahjongAlbum();
  const casino = useCasino();
  const rewards = computeSets(album);
  const totals = totalCollected(album);

  function claim(setId: string) {
    const gained = album.claimSet(setId);
    if (gained > 0) casino.addChips(gained);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-[oklch(0_0_0/0.88)] p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl overflow-hidden rounded-sm border-2 border-[var(--brass)]/60 bg-[var(--noir)] p-6 shadow-deep"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--brass)]/30 pb-3">
            <div>
              <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/90">
                — Álbum del Cuervo —
              </div>
              <h2 className="font-script text-3xl text-[var(--brass-bright)]">
                Rostros y reliquias
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <BadgeCount label="Personajes" value={totals.chars} goal={totals.charsGoal} />
              <BadgeCount label="Especiales" value={totals.specials} goal={totals.specialsGoal} />
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm border border-[var(--brass)]/50 bg-[var(--noir-soft)] px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/80 hover:bg-[var(--mahogany)]"
              >
                Cerrar
              </button>
            </div>
          </div>

          <div className="grid max-h-[70vh] gap-6 overflow-y-auto pr-2 lg:grid-cols-[1fr_260px]">
            <div className="space-y-6">
              <Section title="Elenco del salón">
                {CHAR_SHEETS.map((names, s) => (
                  <SheetGrid key={s} names={names} sheet={s as SheetIdx} album={album} />
                ))}
              </Section>
              <Section title="Reliquias y pecados">
                {(Object.keys(SPECIAL_GROUPS) as SpecialGroup[]).map((g) => {
                  const { sheet, base, label } = SPECIAL_GROUPS[g];
                  return (
                    <SpecialGroupRow
                      key={g}
                      groupLabel={label}
                      sheet={sheet}
                      base={base}
                      album={album}
                    />
                  );
                })}
              </Section>
            </div>

            <div className="space-y-2">
              <div className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/90">
                Recompensas
              </div>
              {rewards.map((r) => (
                <RewardCard key={r.id} reward={r} onClaim={() => claim(r.id)} />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/90">
        {title}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SheetGrid({
  names,
  sheet,
  album,
}: {
  names: readonly string[];
  sheet: SheetIdx;
  album: ReturnType<typeof useMahjongAlbum.getState>;
}) {
  return (
    <div>
      <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
        Hoja {sheet + 1}
      </div>
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-8">
        {names.map((name, t) => {
          const e = album.chars[keyChar(sheet, t)];
          const state = e?.matched ? "matched" : e?.seen ? "seen" : "unknown";
          return (
            <AlbumSlot key={t} sheet={sheet} type={t} variant="char" name={name} state={state} />
          );
        })}
      </div>
    </div>
  );
}

function SpecialGroupRow({
  groupLabel,
  sheet,
  base,
  album,
}: {
  groupLabel: string;
  sheet: SheetIdx;
  base: number;
  album: ReturnType<typeof useMahjongAlbum.getState>;
}) {
  return (
    <div>
      <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
        {groupLabel}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => {
          const type = base + i;
          const e = album.specials[keySpec(sheet, type)];
          const state = e?.matched ? "matched" : e?.seen ? "seen" : "unknown";
          return (
            <AlbumSlot key={i} sheet={sheet} type={type} variant="special" name="" state={state} />
          );
        })}
      </div>
    </div>
  );
}

function AlbumSlot({
  sheet,
  type,
  variant,
  state,
  name,
}: {
  sheet: SheetIdx;
  type: number;
  variant: "char" | "special";
  state: "unknown" | "seen" | "matched";
  name: string;
}) {
  const filter =
    state === "matched"
      ? "none"
      : state === "seen"
        ? "grayscale(0.9) brightness(0.55)"
        : "brightness(0.15) contrast(1.4)";
  const border =
    state === "matched"
      ? "border-[var(--brass-bright)]"
      : state === "seen"
        ? "border-[var(--brass)]/30"
        : "border-[var(--brass)]/10";
  return (
    <div
      title={name || undefined}
      className={`relative overflow-hidden rounded-sm border ${border} bg-[var(--noir-soft)]`}
      style={{ aspectRatio: "3 / 4" }}
    >
      <div className="absolute inset-0 grid place-items-center p-0.5" style={{ filter }}>
        <MahjongTile index={type} variant={variant} sheet={sheet} size={44} />
      </div>
      {state === "unknown" && (
        <div className="absolute inset-0 grid place-items-center font-display text-lg text-[var(--brass)]/90">
          ?
        </div>
      )}
    </div>
  );
}

function RewardCard({ reward, onClaim }: { reward: SetReward; onClaim: () => void }) {
  const pct = Math.min(1, reward.progress / reward.goal);
  return (
    <div
      className={`rounded-sm border p-2 ${
        reward.claimed
          ? "border-[var(--brass)]/20 bg-[var(--noir-soft)]/50 opacity-60"
          : reward.ready
            ? "border-[var(--brass-bright)] bg-[var(--mahogany)]/40"
            : "border-[var(--brass)]/30 bg-[var(--noir-soft)]"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/80">
          {reward.label}
        </div>
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass-bright)]">
          +{reward.chips}
        </div>
      </div>
      <div className="mt-0.5 font-display text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90">
        {reward.detail} · {reward.progress}/{reward.goal}
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--noir)]">
        <div
          className="h-full"
          style={{
            width: `${pct * 100}%`,
            background: "linear-gradient(90deg, oklch(0.62 0.14 60), oklch(0.92 0.18 75))",
          }}
        />
      </div>
      {reward.ready && !reward.claimed && (
        <div className="mt-2">
          <BrassButton size="sm" variant="primary" onClick={onClaim}>
            Reclamar
          </BrassButton>
        </div>
      )}
      {reward.claimed && (
        <div className="mt-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
          ✓ cobrado
        </div>
      )}
    </div>
  );
}

function BadgeCount({ label, value, goal }: { label: string; value: number; goal: number }) {
  return (
    <div className="rounded-sm border border-[var(--brass)]/40 bg-[var(--noir-soft)] px-2 py-1 text-right">
      <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
        {label}
      </div>
      <div className="font-script text-lg leading-none text-[var(--brass-bright)]">
        {value}
        <span className="text-xs text-[var(--brass)]/90">/{goal}</span>
      </div>
    </div>
  );
}
