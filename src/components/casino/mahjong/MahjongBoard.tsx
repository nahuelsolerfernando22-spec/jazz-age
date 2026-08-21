import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MahjongTile } from "@/components/casino/mahjong/MahjongTile";
import { GateOverlay } from "@/components/casino/mahjong/GateOverlay";
import { isLowEnd } from "@/lib/perf-tier";
import { useSettings } from "@/store/settings";

import type { Tile } from "@/hooks/use-mahjong-game";
import type { SpecialGroup } from "@/components/casino/mahjong/MahjongTile";
import { useMahjongRun } from "@/store/games/mahjong/mahjong-run";

interface MahjongBoardProps {
  tiles: Tile[];
  freeIds: Set<string>;
  matchableIds?: Set<string>;
  hintId: string | null;
  trayIds: Set<string>;
  shuffledIds: Set<string>;
  lockedShuffleIds?: Set<string>;
  rotLeft?: Record<string, number>;
  onTap: (id: string) => void;
  shuffleNonce: number;

  pairsClosed?: number;

  synergyPulse?: { group: SpecialGroup; tick: number } | null;

  matchBurst?: { x: number; y: number; z: number; tick: number; big: boolean } | null;
}

const TILE_W = 96;
const TILE_H = Math.round((TILE_W * 4) / 3);

const Z_OFFSET_X = 8;
const Z_OFFSET_Y = -13;


// En gama baja evitamos montar un componente de framer-motion por ficha
// (100+ suscripciones al motor de animación ahogan la WebView de Android):
// servimos un <button> plano con las mismas clases y estilos.
function TileButton({
  plain,
  children,
  ...rest
}: { plain: boolean; children: React.ReactNode } & Record<string, unknown>) {
  if (plain) {
    const { className, style, onClick, disabled, type } = rest as {
      className?: string;
      style?: React.CSSProperties;
      onClick?: () => void;
      disabled?: boolean;
      type?: "button";
    };
    // Reenviamos los data-* (los usan los tests E2E y la depuración en APK).
    const dataProps: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (k.startsWith("data-") || k === "aria-label") dataProps[k] = v;
    }
    return (
      <button
        type={type ?? "button"}
        className={className}
        style={style}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled}
        {...dataProps}
      >
        {children}
      </button>
    );
  }
  const MotionButton = motion.button as unknown as React.ComponentType<
    Record<string, unknown> & { children?: React.ReactNode }
  >;
  return <MotionButton {...rest}>{children}</MotionButton>;
}

// En gama baja tampoco montamos <AnimatePresence> alrededor de las 100+ fichas:
// su reconciliación de salidas recorre todos los hijos en cada render.
function TileLayer({ plain, children }: { plain: boolean; children: React.ReactNode }) {
  if (plain) return <>{children}</>;
  return <AnimatePresence>{children}</AnimatePresence>;
}

const HINT_DELAY_MS = 6000;
let hintClock: { key: string; at: number } = { key: "", at: 0 };

interface BoardTileProps {
  t: Tile;
  lowFx: boolean;
  fxOff: boolean;
  fxReduced: boolean;
  isFreeTap: boolean;
  isHint: boolean;
  isSpecial: boolean;
  isMatchable: boolean;
  showMatchable: boolean;
  wasShuffled: boolean;
  isLockedShuffle: boolean;
  isSealed: boolean;
  isGated: boolean;
  gateRemaining: number;
  isRotting: boolean;
  isRotArmed: boolean;
  rotSecsValue: number;
  occluders?: Array<{ rl: number; rt: number; dz: number }>;
  left: number;
  top: number;
  zIndex: number;
  synergyPulse?: { group: SpecialGroup; tick: number } | null;
  runActive?: boolean;
  runFloor?: number;
  onTap: (id: string) => void;
}

// Cada ficha se memoiza: un toque sólo re-renderiza las fichas cuyas props
// cambiaron (la pareja y sus vecinas), no las 100+ del tablero. Es la
// diferencia entre reconciliar ~1.500 nodos por toque y reconciliar ~20.
const BoardTile = memo(function BoardTile({
  t,
  lowFx,
  fxOff,
  fxReduced,
  isFreeTap,
  isHint,
  isSpecial,
  isMatchable,
  showMatchable,
  wasShuffled,
  isLockedShuffle,
  isSealed,
  isGated,
  gateRemaining,
  isRotting,
  isRotArmed,
  rotSecsValue,
  occluders,
  left,
  top,
  zIndex,
  synergyPulse,
  runActive,
  runFloor,
  onTap,
}: BoardTileProps) {
  const elevShadowY = 4 + t.pos.z * 4;
  const elevShadowBlur = 8 + t.pos.z * 6;
  const elevShadowAlpha = Math.min(0.8, 0.45 + t.pos.z * 0.08);
  return (
    <TileButton
      key={t.id}
      plain={lowFx}
      type="button"
      {...(lowFx ? {} : { layoutId: `tile-${t.id}` })}
      initial={lowFx ? false : { opacity: 0, y: -160, rotate: -10 }}
      animate={
        lowFx
          ? undefined
          : {
              opacity: 1,
              y: wasShuffled && !fxOff ? [0, -22, 0] : 0,
              rotate: wasShuffled && !fxOff ? [0, -6, 6, 0] : 0,
              scale: isHint ? 1.06 : isLockedShuffle && !fxOff ? [1, 1.08, 1] : 1,
            }
      }
      exit={lowFx ? undefined : { opacity: 0, scale: 0.5, y: -40 }}
      transition={
        lowFx
          ? undefined
          : {
              type: wasShuffled ? "tween" : "spring",
              duration: wasShuffled ? 0.5 : isLockedShuffle ? 0.9 : undefined,
              stiffness: 340,
              damping: 26,
              delay: wasShuffled
                ? (t.pos.x + t.pos.y) * 0.02
                : Math.min(0.22, t.pos.z * 0.03 + (t.pos.x + t.pos.y) * 0.004),
            }
      }

      onClick={() => onTap(t.id)}
      disabled={!isFreeTap}
      aria-disabled={!isFreeTap}
      data-tile-id={t.id}
      data-tile-free={isFreeTap ? "1" : "0"}
      className="absolute p-0 bg-transparent focus:outline-none"
      style={{
        left,
        top,
        zIndex,
        cursor: isFreeTap ? "pointer" : "not-allowed",
        pointerEvents: isFreeTap ? "auto" : "none",
        ...(lowFx && isHint ? { transform: "scale(1.06)" } : null),
      }}
    >
      {}
      <div
        aria-hidden
        className="absolute rounded-[6px]"
        style={{
          left: 0,
          top: elevShadowY + 3,
          width: TILE_W,
          height: TILE_H,
          background: `oklch(0 0 0 / ${Math.min(0.5, elevShadowAlpha * 0.62)})`,
          pointerEvents: "none",
        }}
      />
      {}
      <div
        aria-hidden
        className="absolute rounded-[6px]"
        style={{
          left: 3 + t.pos.z,
          top: 5 + t.pos.z * 2,
          width: TILE_W,
          height: TILE_H,
          background:
            "linear-gradient(135deg, oklch(0.72 0.05 80) 0%, oklch(0.55 0.06 60) 50%, oklch(0.38 0.05 50) 100%)",
          boxShadow: `0 ${elevShadowY}px ${elevShadowBlur}px oklch(0 0 0 / ${elevShadowAlpha})`,
        }}
      />
      {}
      <div
        className="relative"
        style={{
          opacity: isFreeTap ? 1 : 0.58,
          transition: "opacity 160ms ease-out",
        }}
      >
        <div
          className="relative"
          style={{
            width: TILE_W,
            height: TILE_H,
          }}
        >
          <div className="absolute inset-0">
            {}
            {!t.faceDown && (
              <MahjongTile index={t.type} variant={t.variant} sheet={t.sheet} size={TILE_W} />
            )}
            {}
            {t.faceDown && (
              <div
                className="absolute inset-0 overflow-hidden rounded-[6px]"
                style={{
                  background:
                    "linear-gradient(145deg, oklch(0.32 0.10 25) 0%, oklch(0.22 0.08 22) 50%, oklch(0.14 0.05 20) 100%)",
                  boxShadow:
                    "inset 0 0 0 2px oklch(0.55 0.14 65), inset 0 0 12px oklch(0 0 0 / 0.7), 0 4px 8px rgba(0,0,0,0.6)",
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-1 rounded-[3px]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, oklch(0.55 0.14 65 / 0.18) 0 2px, transparent 2px 6px), repeating-linear-gradient(-45deg, oklch(0.55 0.14 65 / 0.18) 0 2px, transparent 2px 6px)",
                    border: "1px solid oklch(0.55 0.14 65 / 0.45)",
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center font-display text-2xl"
                  style={{
                    color: "oklch(0.78 0.16 70)",
                    textShadow: "0 0 8px oklch(0.55 0.18 65 / 0.7), 0 1px 2px rgba(0,0,0,0.9)",
                  }}
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <rect x="5" y="10.5" width="14" height="10" rx="2" />
                    <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          {}
          {occluders && occluders.length > 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6px]"
              style={lowFx ? undefined : { mixBlendMode: "multiply" }}
            >
              {(lowFx ? occluders.slice(0, 1) : occluders).map((o, i) => {
                const alpha = Math.min(0.85, 0.5 + o.dz * 0.18);
                return (
                  <div
                    key={i}
                    className="absolute rounded-[6px]"
                    style={{
                      left: o.rl - 4,
                      top: o.rt + 3,
                      width: TILE_W + 8,
                      height: TILE_H + 6,
                      background: `oklch(0.05 0.01 30 / ${Math.min(0.62, alpha)})`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
        {isHint && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[6px]"
            initial={fxReduced ? { opacity: 0.9 } : { opacity: 0.2 }}
            animate={fxReduced ? { opacity: 0.9 } : { opacity: [0.2, 0.95, 0.2] }}
            transition={fxReduced ? { duration: 0 } : { duration: 0.8, repeat: 1 }}
            style={{
              boxShadow: "inset 0 0 0 2px oklch(0.7 0.22 25), 0 0 22px oklch(0.7 0.22 25 / 0.7)",
            }}
          />
        )}
        {isMatchable && showMatchable && !isHint && (
          <div
            aria-hidden
            className={fxReduced ? "mj-pulse-matchable mj-static" : "mj-pulse-matchable"}
          />
        )}
        {!fxOff && synergyPulse && isSpecial && isFreeTap && t.group === synergyPulse.group && (
          <motion.div
            key={`syn-${synergyPulse.tick}-${t.id}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[6px]"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: [0, 1, 0], scale: [0.92, 1.06, 1] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              boxShadow: "inset 0 0 0 2px oklch(0.92 0.2 85), 0 0 28px oklch(0.85 0.2 80 / 0.9)",
            }}
          />
        )}

        {runActive && runFloor && runFloor > 1 && !fxOff && isFreeTap && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[6px] border border-[var(--cd-gold-mid)]/30"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {isSealed && (
          <>
            {}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[6px]"
              style={{
                background:
                  "repeating-linear-gradient(45deg, oklch(0.18 0.02 30 / 0.55) 0 6px, oklch(0.45 0.04 60 / 0.55) 6px 10px), repeating-linear-gradient(-45deg, oklch(0.18 0.02 30 / 0.55) 0 6px, oklch(0.45 0.04 60 / 0.55) 6px 10px)",
                mixBlendMode: "multiply",
                boxShadow: "inset 0 0 0 2px oklch(0.55 0.05 65), inset 0 0 14px oklch(0 0 0 / 0.7)",
              }}
            />
            {}
            <motion.div
              key={t.seal}
              initial={fxReduced ? false : { scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                fxReduced ? { duration: 0.12 } : { type: "spring", stiffness: 260, damping: 18 }
              }
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div
                className="flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-[oklch(0.78_0.06_70)] bg-[oklch(0.18_0.02_30)] px-1.5 font-display text-xs font-bold tabular-nums text-[oklch(0.92_0.16_75)]"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.8), inset 0 1px 0 oklch(0.95 0.05 70 / 0.4)",
                }}
                title={`Sello del Cuervo: cierra ${t.seal} pares más para abrirlo`}
              >
                <span className="flex items-center gap-0.5 font-display text-[11px] leading-none">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    width="11"
                    height="11"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                  >
                    <rect x="5" y="10.5" width="14" height="10" rx="2" />
                    <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
                  </svg>
                  {t.seal}
                </span>
              </div>
            </motion.div>
          </>
        )}
        {isSpecial && isFreeTap && <div aria-hidden className="mj-special-dot" />}
        {isGated && <GateOverlay remaining={gateRemaining} size={TILE_W} />}
        {(isRotting || isRotArmed) && (
          <>
            {}
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 rounded-[6px]${fxReduced ? "" : " animate-pulse"}`}
              style={{
                boxShadow: `inset 0 0 0 2px oklch(0.55 0.20 140), 0 0 14px oklch(0.55 0.20 140 / 0.75)`,
                background:
                  isRotting && rotSecsValue <= 5
                    ? "radial-gradient(circle, oklch(0.35 0.18 30 / 0.35) 0%, transparent 70%)"
                    : undefined,
              }}
            />
            {}
            {isRotting && (
              <div
                className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[oklch(0.55_0.20_140)] bg-[var(--noir)] px-1 font-display text-[11px] font-bold tabular-nums text-[oklch(0.75_0.20_140)]"
                style={{ boxShadow: "0 0 6px oklch(0.55 0.20 140 / 0.8)" }}
                title={`Podrida: ${rotSecsValue}s antes de caer sola a la bandeja`}
              >
                {rotSecsValue}
              </div>
            )}
          </>
        )}
        {wasShuffled && !fxOff && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.9 }}
            style={{
              boxShadow: isSpecial
                ? "inset 0 0 0 2px oklch(0.85 0.18 75), 0 0 22px oklch(0.85 0.18 75 / 0.85)"
                : "inset 0 0 0 2px oklch(0.78 0.12 70), 0 0 18px oklch(0.78 0.12 70 / 0.7)",
            }}
          />
        )}
        {isLockedShuffle && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0.6, 0.85, 0] }}
            transition={{ duration: 1.2 }}
            style={{
              boxShadow:
                "inset 0 0 0 2px oklch(0.82 0.18 150), 0 0 22px oklch(0.82 0.18 150 / 0.85)",
            }}
          />
        )}
      </div>
    </TileButton>
  );
});

export function MahjongBoard({
  tiles,
  freeIds,
  matchableIds,
  hintId,
  trayIds,
  shuffledIds,
  lockedShuffleIds,
  rotLeft,
  onTap,
  shuffleNonce,
  pairsClosed = 0,
  synergyPulse,
  matchBurst,
}: MahjongBoardProps) {
  const runActive = useMahjongRun((s) => s.active);
  const runFloor = useMahjongRun((s) => s.floor);

  // En APK/gama baja el compositor de WebView se ahoga con layout animations
  // y mix-blend-mode por ficha (100+ capas). Ahí servimos una versión plana.
  const [lowFx, setLowFx] = useState(false);
  useEffect(() => {
    setLowFx(isLowEnd());
  }, []);

  // Pista de pareja: por defecto no se muestra al instante (spoilea la jugada
  // y el pulso hace titilar las fichas). Aparece recién tras unos segundos.
  const matchHintMode = useSettings((s) => s.mahjongMatchHint);
  const hasMatchable = (matchableIds?.size ?? 0) > 0;
  // La cuenta atrás depende del estado del tablero (fichas restantes / mezclas),
  // no del set de parejas: ese set se recalcula constantemente y reiniciaba el
  // temporizador para siempre, con lo que el modo "a los 6s" nunca disparaba.
  const boardKey = useMemo(() => {
    const remaining = tiles.reduce((n, t) => (t.removed ? n : n + 1), 0);
    const tray = Array.from(trayIds).sort().join(",");
    return `${remaining}:${shuffleNonce}:${tray}`;
  }, [tiles, shuffleNonce, trayIds]);

  const [hintReady, setHintReady] = useState(false);
  useEffect(() => {
    if (matchHintMode === "always") {
      setHintReady(true);
      return;
    }
    if (matchHintMode === "off") {
      setHintReady(false);
      return;
    }
    // El reloj vive fuera del componente: si el tablero se re-monta (remontes de
    // React, pausas de la WebView) la cuenta no vuelve a empezar de cero y el
    // modo "a los 6s" dispara igual.
    const now = Date.now();
    if (hintClock.key !== boardKey) {
      hintClock = { key: boardKey, at: now };
    }
    const left = HINT_DELAY_MS - (now - hintClock.at);
    if (left <= 0) {
      setHintReady(true);
      return;
    }
    setHintReady(false);
    const id = window.setTimeout(() => setHintReady(true), left);
    return () => window.clearTimeout(id);
  }, [matchHintMode, boardKey]);
  const showMatchable = matchHintMode !== "off" && hintReady && hasMatchable;

  // Titileo al seleccionar/interactuar: "completo" | "reducido" | "off".
  const selectFx = useSettings((s) => s.mahjongSelectFx);
  const fxReduced = selectFx !== "full";
  const fxOff = selectFx === "off";

  const onBoard = useMemo(
    () => tiles.filter((t) => !t.removed && !trayIds.has(t.id)),
    [tiles, trayIds],
  );
  // Clave estable del tablero: el cálculo de oclusores es O(n·18) y con Sets
  // nuevos en cada render se recalculaba en cada tap. Sólo cambia cuando entra
  // o sale una ficha del tablero.
  const onBoardKey = useMemo(() => onBoard.map((t) => t.id).join("|"), [onBoard]);

  const maxX = Math.max(0, ...onBoard.map((t) => t.pos.x)) + 1;
  const maxY = Math.max(0, ...onBoard.map((t) => t.pos.y)) + 1;
  const maxZ = Math.max(0, ...onBoard.map((t) => t.pos.z));
  const padTop = Math.abs(maxZ * Z_OFFSET_Y) + 24;
  const padBottom = 24;
  const padX = 32;
  const boardW = maxX * TILE_W + (maxZ + 1) * Z_OFFSET_X + padX * 2;
  const boardH = maxY * TILE_H + padTop + padBottom;

  const occludersByTile = useMemo(() => {
    const map = new Map<string, Array<{ rl: number; rt: number; dz: number }>>();
    const MAX_DZ = 2;
    const MIN_OVERLAP = TILE_W * TILE_H * 0.18;

    const layers = new Map<number, Map<string, Tile[]>>();
    for (const o of onBoard) {
      let layer = layers.get(o.pos.z);
      if (!layer) {
        layer = new Map();
        layers.set(o.pos.z, layer);
      }
      const key = `${o.pos.x},${o.pos.y}`;
      const arr = layer.get(key);
      if (arr) arr.push(o);
      else layer.set(key, [o]);
    }

    for (const t of onBoard) {
      const occ: Array<{ rl: number; rt: number; dz: number }> = [];
      for (let dz = 1; dz <= MAX_DZ; dz++) {
        const layer = layers.get(t.pos.z + dz);
        if (!layer) continue;

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const cell = layer.get(`${t.pos.x + dx},${t.pos.y + dy}`);
            if (!cell) continue;
            const rl = dx * TILE_W + dz * Z_OFFSET_X;
            const rt = dy * TILE_H + dz * Z_OFFSET_Y;
            const ow = Math.min(TILE_W, rl + TILE_W) - Math.max(0, rl);
            const oh = Math.min(TILE_H, rt + TILE_H) - Math.max(0, rt);
            if (ow <= 0 || oh <= 0) continue;
            if (ow * oh < MIN_OVERLAP) continue;
            for (const o of cell) {
              if (o.id !== t.id) occ.push({ rl, rt, dz });
            }
          }
        }
      }
      if (occ.length) map.set(t.id, occ);
    }

    // overlays per tile still read as "covered" without stacking 8+ layers.
    for (const [id, arr] of map) {
      if (arr.length > 2) {
        arr.sort((a, b) => b.dz - a.dz);
        map.set(id, arr.slice(0, 2));
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBoardKey]);

  // onTap estable: si cambiara de identidad en cada render tumbaría el memo
  // de todas las fichas.
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const stableTap = useCallback((id: string) => onTapRef.current(id), []);

  // Geometría del tablero: sólo cambia cuando entra o sale una ficha.
  const sorted = useMemo(
    () => [...tiles].sort((a, b) => a.pos.z - b.pos.z || a.pos.y - b.pos.y || a.pos.x - b.pos.x),
    [tiles],
  );

  return (
    <div className="relative mx-auto" style={{ width: boardW, height: boardH }}>
      {}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-md"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, oklch(0.30 0.05 150 / 0.85) 0%, oklch(0.18 0.04 150 / 0.95) 55%, oklch(0.10 0.03 30 / 0.95) 100%)",
          boxShadow:
            "inset 0 0 60px oklch(0 0 0 / 0.85), inset 0 0 0 1px oklch(0.55 0.18 65 / 0.35)",
        }}
      />
      {!lowFx && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-radial-gradient(circle at 30% 20%, oklch(0.5 0.04 150 / 0.18) 0 1px, transparent 1px 4px), repeating-radial-gradient(circle at 70% 80%, oklch(0.6 0.03 100 / 0.12) 0 1px, transparent 1px 5px)",
          }}
        />
      )}

      <TileLayer plain={lowFx}>
        {sorted.map((t) => {
          if (t.removed) return null;
          if (trayIds.has(t.id)) return null;
          const positionFree = freeIds.has(t.id);
          const isSealed = t.seal > 0;
          const gateRemaining = t.gate ? Math.max(0, t.gate - pairsClosed) : 0;
          const isGated = gateRemaining > 0;
          const isFreeTap = positionFree && !isSealed && !isGated;
          const rotSecs = rotLeft?.[t.id];
          const rotSecsValue = rotSecs ?? 0;
          return (
            <BoardTile
              key={t.id}
              t={t}
              runActive={runActive}
              runFloor={runFloor}
              lowFx={lowFx}
              fxOff={fxOff}
              fxReduced={fxReduced}
              isFreeTap={isFreeTap}
              isHint={hintId === t.id}
              isSpecial={t.variant === "special"}
              isMatchable={isFreeTap && (matchableIds?.has(t.id) ?? false)}
              showMatchable={showMatchable}
              wasShuffled={shuffledIds.has(t.id)}
              isLockedShuffle={lockedShuffleIds?.has(t.id) ?? false}
              isSealed={isSealed}
              isGated={isGated}
              gateRemaining={gateRemaining}
              isRotting={t.rotMax != null && rotSecsValue > 0}
              isRotArmed={t.rotMax != null && rotSecs == null && isFreeTap}
              rotSecsValue={rotSecsValue}
              occluders={occludersByTile.get(t.id)}
              left={t.pos.x * TILE_W + t.pos.z * Z_OFFSET_X + 32}
              top={t.pos.y * TILE_H + t.pos.z * Z_OFFSET_Y + padTop}
              zIndex={(t.pos.z + 1) * 10000 + (maxY - t.pos.y) * 100 + t.pos.x}
              synergyPulse={synergyPulse}
              onTap={stableTap}
            />
          );
        })}
      </TileLayer>

      {}
      <AnimatePresence>
        {matchBurst && (
          <motion.div
            key={`burst-${matchBurst.tick}`}
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            initial={{ opacity: 0.9, scale: 0.2 }}
            animate={{ opacity: 0, scale: matchBurst.big ? 3.6 : 2.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: matchBurst.big ? 0.9 : 0.65, ease: [0.2, 0.8, 0.3, 1] }}
            style={{
              left: matchBurst.x * TILE_W + matchBurst.z * Z_OFFSET_X + 32 + TILE_W / 2 - 70,
              top: matchBurst.y * TILE_H + matchBurst.z * Z_OFFSET_Y + padTop + TILE_H / 2 - 70,
              width: 140,
              height: 140,
              zIndex: (matchBurst.z + 3) * 10000,
              background: matchBurst.big
                ? "radial-gradient(circle, oklch(0.96 0.22 82 / 0.85) 0%, oklch(0.72 0.22 75 / 0.45) 45%, transparent 72%)"
                : "radial-gradient(circle, oklch(0.88 0.18 145 / 0.8) 0%, oklch(0.55 0.18 145 / 0.35) 50%, transparent 72%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
