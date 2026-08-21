import blackjack from "@/assets/bg-blackjack.webp";
import chinchon from "@/assets/bg-chinchon.webp";
import truco from "@/assets/bg-truco.webp";
import mahjong from "@/assets/bg-mahjong.webp";
import escoba from "@/assets/bg-escoba.webp";
import dados from "@/assets/bg-dados.webp";
import ruleta from "@/assets/bg-ruleta.webp";
import bagatelle from "@/assets/bg-bagatelle.webp";
import solitario from "@/assets/bg-solitario.webp";
import sindicato from "@/assets/bg-poker.webp";

const BY_GAME: Record<string, string> = {
  blackjack,
  chinchon,
  truco,
  mahjong,
  escoba,
  dados,
  ruleta,
  bagatelle,
  solitario,
  sindicato,
};

export function backgroundForGame(gameId: string): string | null {
  return BY_GAME[gameId] ?? null;
}

const VARIANT_MODULES = import.meta.glob("@/assets/bg-thumbs/*.{avif,webp,jpg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

interface Variants {
  avif?: Record<number, string>;
  webp?: Record<number, string>;
  jpg?: Record<number, string>;
}

const VARIANTS: Record<string, Variants> = {};

for (const path in VARIANT_MODULES) {
  const parts = path.split("/").pop()?.split("-") || [];
  if (parts.length < 2) continue;
  const game = parts[0];
  const sizePart = parts[1].split(".")[0];
  const size = parseInt(sizePart, 10);
  const ext = path.split(".").pop() as "avif" | "webp" | "jpg";
  if (!game || isNaN(size) || !ext) continue;
  VARIANTS[game] ??= {};
  VARIANTS[game][ext] ??= {};
  VARIANTS[game][ext]![size] = VARIANT_MODULES[path];
}

function srcSetFor(gameId: string, ext: "avif" | "webp" | "jpg"): string | undefined {
  const v = VARIANTS[gameId]?.[ext];
  if (!v) return undefined;
  return Object.entries(v)
    .map(([size, url]) => `${url} ${size}w`)
    .join(", ");
}

export interface CoverSources {
  src: string;
  avif?: string;
  webp?: string;
  jpg?: string;
}

export function coverSourcesForGame(gameId: string): CoverSources | null {
  const full = BY_GAME[gameId];
  const v = VARIANTS[gameId];
  if (!full && !v) return null;
  return {
    src: v?.jpg?.[640] ?? v?.webp?.[640] ?? full,
    avif: srcSetFor(gameId, "avif"),
    webp: srcSetFor(gameId, "webp"),
    jpg: srcSetFor(gameId, "jpg"),
  };
}

export function coverSrcSetForGame(gameId: string): string | undefined {
  return srcSetFor(gameId, "webp");
}

export function coverSrcForGame(gameId: string): string | null {
  return coverSourcesForGame(gameId)?.src ?? null;
}

export function backgroundPlaceholderForGame(gameId: string): string | null {
  const v = VARIANTS[gameId];
  return v?.webp?.[320] ?? v?.jpg?.[320] ?? v?.avif?.[320] ?? null;
}

export interface BackgroundTone {
  dim?: number;
  tint?: [number, number, number];
  tintAlpha?: number;
}

const TONE_BY_GAME: Record<string, BackgroundTone> = {
  escoba: { dim: 0.4, tint: [46, 18, 14], tintAlpha: 0.16 },
  blackjack: { dim: 0.54, tint: [14, 22, 18], tintAlpha: 0.12 },
};

export function toneForGame(gameId: string): BackgroundTone {
  return TONE_BY_GAME[gameId] ?? {};
}
