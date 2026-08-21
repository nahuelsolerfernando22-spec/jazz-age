import { useMemo } from "react";
import {
  backgroundForGame,
  backgroundPlaceholderForGame,
  toneForGame,
} from "@/lib/single-backgrounds";
import { useImageReady } from "@/hooks/use-image-ready";

interface Props {
  gameId: string;
  dim?: number;
}

export function SingleBackdrop({ gameId, dim = 0.62 }: Props) {
  const bg = useMemo(() => backgroundForGame(gameId), [gameId]);
  const lqip = useMemo(() => backgroundPlaceholderForGame(gameId), [gameId]);
  const tone = useMemo(() => toneForGame(gameId), [gameId]);

  // La miniatura entra en un par de frames y tapa el hueco; el arte completo
  // se revela recién cuando terminó de decodificar, así nunca se ve a medias.
  const lqipState = useImageReady(lqip, { timeoutMs: 4000 });
  const fullState = useImageReady(bg, { timeoutMs: 8000 });

  if (!bg) return null;
  const a = Math.min(1, Math.max(0, tone.dim ?? dim));
  const [tr, tg, tb] = tone.tint ?? [11, 21, 18];
  const tintA = Math.min(1, Math.max(0, tone.tintAlpha ?? 0));
  const tintLayer =
    tintA > 0
      ? `linear-gradient(180deg, rgba(${tr},${tg},${tb},${tintA}) 0%, rgba(${tr},${tg},${tb},${tintA * 0.85}) 100%), `
      : "";

  const overlay = `linear-gradient(180deg, rgba(11,21,18,${a * 0.75}) 0%, rgba(11,21,18,${a}) 55%, rgba(11,21,18,${Math.min(1, a + 0.15)}) 100%), ${tintLayer}transparent`;

  return (
    <div
      aria-hidden
      data-game={gameId}
      data-bg={fullState}
      className="single-backdrop"
      style={{
        ["--sb-img" as string]: `url(${bg})`,
        ["--sb-lqip" as string]: lqip ? `url(${lqip})` : "none",
        ["--sb-overlay" as string]: overlay,
      }}
    >
      <div className="sb-base" />
      {lqip && <div className="sb-lqip" style={{ opacity: lqipState === "ready" ? 1 : 0 }} />}
      <div className="sb-img" style={{ opacity: fullState === "ready" ? 1 : 0 }} />
      <div className="sb-overlay" />
    </div>
  );
}
