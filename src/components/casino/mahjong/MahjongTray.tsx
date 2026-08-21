import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { MahjongTile } from "@/components/casino/mahjong/MahjongTile";
import { isLowEnd } from "@/lib/perf-tier";
import type { Tile } from "@/hooks/use-mahjong-game";

const SLOT_W = 56;
const SLOT_H = Math.round((SLOT_W * 4) / 3);

// En APK/gama baja el `layoutId` compartido entre tablero y bandeja obliga a
// framer-motion a medir cada ficha (getBoundingClientRect + measureScroll) en
// cada render: es el mayor coste del juego en Android. Ahí servimos DOM plano.
function SlotLayer({ plain, children }: { plain: boolean; children: React.ReactNode }) {
  if (plain) return <>{children}</>;
  return <AnimatePresence mode="popLayout">{children}</AnimatePresence>;
}

function SlotItem({
  plain,
  children,
  ...rest
}: { plain: boolean; children: React.ReactNode } & Record<string, unknown>) {
  if (plain) {
    const { className } = rest as { className?: string };
    return <div className={className}>{children}</div>;
  }
  const MotionDiv = motion.div as unknown as React.ComponentType<
    Record<string, unknown> & { children?: React.ReactNode }
  >;
  return <MotionDiv {...rest}>{children}</MotionDiv>;
}

interface ShatterEvent {
  uid: number;
  slotIndex: number;
  tile: Tile;
}

export function MahjongTray({
  tray,
  size,
  keyRemaining,
  tileKey,
  matchSize = 2,
}: {
  tray: Tile[];
  size: number;
  keyRemaining?: Map<string, number>;
  tileKey?: (t: Tile) => string;
  matchSize?: number;
}) {
  const [lowFx, setLowFx] = useState(false);
  useEffect(() => {
    setLowFx(isLowEnd());
  }, []);
  const slots = Array.from({ length: size }, (_, i) => tray[i] ?? null);

  const filled = tray.length;
  const warn = filled === size - 1;
  const danger = filled >= size;

  const prevTrayRef = useRef<Tile[]>([]);
  const uidRef = useRef(0);
  const [shatters, setShatters] = useState<ShatterEvent[]>([]);

  useEffect(() => {
    const prev = prevTrayRef.current;
    const currentIds = new Set(tray.map((t) => t.id));
    const removed: ShatterEvent[] = [];
    prev.forEach((t, idx) => {
      if (!currentIds.has(t.id)) {
        removed.push({ uid: ++uidRef.current, slotIndex: idx, tile: t });
      }
    });
    if (removed.length > 0) {
      setShatters((s) => [...s, ...removed]);
      const ids = removed.map((r) => r.uid);
      window.setTimeout(() => {
        setShatters((s) => s.filter((x) => !ids.includes(x.uid)));
      }, 700);
    }
    prevTrayRef.current = tray;
  }, [tray]);

  return (
    <div className="mx-auto w-full max-w-[600px]">
      <motion.div
        className={`relative rounded-sm border-2 px-2 py-2 transition-colors ${
          danger
            ? "border-[var(--blood)] bg-[var(--blood)]/25"
            : warn
              ? "border-[oklch(0.65_0.22_30)] bg-[oklch(0.45_0.20_28)]/15"
              : "border-[var(--brass)]/60 bg-[var(--noir)]/80"
        }`}
        animate={
          warn
            ? {
                x: [0, -2, 2, -2, 2, 0],
                boxShadow: [
                  "0 0 0px oklch(0.55 0.22 25 / 0)",
                  "0 0 28px oklch(0.55 0.22 25 / 0.7)",
                  "0 0 12px oklch(0.55 0.22 25 / 0.35)",
                  "0 0 28px oklch(0.55 0.22 25 / 0.7)",
                  "0 0 12px oklch(0.55 0.22 25 / 0.35)",
                ],
              }
            : { x: 0, boxShadow: "0 0 0px transparent" }
        }
        transition={{
          duration: warn ? 1.1 : 0.3,
          repeat: warn ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <AnimatePresence>
          {warn && (
            <motion.div
              key="warn-flash"
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.15, 0.4, 0.15] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse at center, oklch(0.55 0.22 25 / 0.55) 0%, transparent 75%)",
              }}
            />
          )}
        </AnimatePresence>

        <div className="relative flex items-center justify-center gap-1">
          {slots.map((tile, i) => {
            const isLastFreeSlot = warn && i === size - 1;
            const slotShatters = shatters.filter((s) => s.slotIndex === i);
            return (
              <div
                key={i}
                className={`relative shrink-0 rounded-[6px] border bg-[var(--noir-soft)]/60 ${
                  isLastFreeSlot ? "border-[oklch(0.7_0.22_28)]" : "border-[var(--brass)]/30"
                }`}
                style={{
                  width: SLOT_W,
                  height: SLOT_H,
                  boxShadow: isLastFreeSlot
                    ? "inset 0 0 12px oklch(0.55 0.22 25 / 0.6)"
                    : undefined,
                }}
              >
                <SlotLayer plain={lowFx}>
                  {tile && (
                    <SlotItem
                      plain={lowFx}
                      key={tile.id}
                      layoutId={`tile-${tile.id}`}
                      initial={false}
                      exit={{ opacity: 0, transition: { duration: 0.05 } }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 28,
                      }}
                      className="absolute inset-0"
                    >
                      <MahjongTile
                        index={tile.type}
                        variant={tile.variant}
                        sheet={tile.sheet}
                        size={SLOT_W}
                      />
                      {keyRemaining &&
                        tileKey &&
                        (() => {
                          const k = tileKey(tile);
                          const left = keyRemaining.get(k) ?? 0;
                          if (left <= 0) return null;
                          return (
                            <div
                              aria-hidden
                              className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--brass)] bg-[var(--noir)] px-1 font-display text-[11px] font-bold tabular-nums text-[var(--brass-bright)] shadow-md"
                              title={`Quedan ${left} en tablero`}
                            >
                              {left}
                            </div>
                          );
                        })()}
                    </SlotItem>
                  )}
                </SlotLayer>

                {}
                {!lowFx && slotShatters.map((s) => <Shatter key={s.uid} tile={s.tile} />)}
              </div>
            );
          })}
        </div>
      </motion.div>
      <div
        className={`mt-1 text-center font-display text-[11px] uppercase tracking-[0.4em] transition-colors ${
          warn ? "text-[oklch(0.78_0.22_30)]" : "text-[var(--brass)]/90"
        }`}
      >
        {warn
          ? `¡Cuidado! Bandeja ${filled}/${size} — un hueco`
          : `Bandeja ${filled}/${size} — junta ${matchSize} iguales`}
      </div>
    </div>
  );
}

function Shatter({ tile }: { tile: Tile }) {
  const isSpecial = tile.variant === "special";

  const shards = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = 36 + Math.random() * 28;
    const rot = (Math.random() - 0.5) * 180;

    const a0 = (i / 8) * 360 - 6;
    const a1 = ((i + 1) / 8) * 360 + 6;
    const p = (deg: number) => {
      const r = 80;
      const rad = (deg - 90) * (Math.PI / 180);
      return `${50 + Math.cos(rad) * r}% ${50 + Math.sin(rad) * r}%`;
    };
    const clip = `polygon(50% 50%, ${p(a0)}, ${p((a0 + a1) / 2)}, ${p(a1)})`;
    return {
      i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      rot,
      clip,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {}
      <motion.div
        className="absolute inset-0 rounded-[6px]"
        initial={{ opacity: 0.9, scale: 0.9 }}
        animate={{ opacity: 0, scale: 1.4 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          background: isSpecial
            ? "radial-gradient(circle, oklch(0.98 0.20 85 / 1) 0%, oklch(0.85 0.18 75 / 0.6) 50%, transparent 80%)"
            : "radial-gradient(circle, oklch(0.98 0 0 / 0.95) 0%, oklch(0.85 0.10 70 / 0.5) 50%, transparent 80%)",
          filter: "blur(2px)",
        }}
      />
      {}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0.3, opacity: 0.7 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        style={{
          border: `2px solid ${isSpecial ? "oklch(0.92 0.18 80)" : "oklch(0.8 0.12 70)"}`,
          boxShadow: isSpecial
            ? "0 0 18px oklch(0.85 0.18 75 / 0.7)"
            : "0 0 10px oklch(0.7 0.10 65 / 0.5)",
        }}
      />
      {}
      {shards.map((s) => (
        <motion.div
          key={s.i}
          className="absolute inset-0"
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: s.x,
            y: s.y + 18,
            rotate: s.rot,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: [0.3, 0.7, 0.4, 1] }}
          style={{
            clipPath: s.clip,
            WebkitClipPath: s.clip,
            filter: isSpecial
              ? "drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(0 0 6px oklch(0.85 0.18 75 / 0.5))"
              : "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
          }}
        >
          <MahjongTile index={tile.type} variant={tile.variant} sheet={tile.sheet} size={SLOT_W} />
        </motion.div>
      ))}
      {}
      {Array.from({ length: isSpecial ? 10 : 6 }).map((_, i) => {
        const a = (i / (isSpecial ? 10 : 6)) * Math.PI * 2;
        const d = 30 + Math.random() * 30;
        return (
          <motion.span
            key={`sp-${i}`}
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(a) * d,
              y: Math.sin(a) * d,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{
              background: isSpecial ? "oklch(0.95 0.18 85)" : "oklch(0.85 0.12 70)",
              boxShadow: isSpecial ? "0 0 6px oklch(0.95 0.18 85)" : "0 0 4px oklch(0.85 0.12 70)",
            }}
          />
        );
      })}
    </div>
  );
}
