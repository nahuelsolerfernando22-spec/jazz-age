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

export function SingleBackdrop({ gameId, dim = 0.44 }: Props) {
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

  // El velo ya no es parejo: arriba casi no pesa (ahí vive el arte de la
  // anfitriona) y se densifica sólo en el tercio inferior, que es donde se
  // apoyan los paneles y hace falta contraste para leer.
  const overlay =
    `linear-gradient(180deg,` +
    ` rgba(24,16,12,${(a * 0.3).toFixed(3)}) 0%,` +
    ` rgba(20,14,11,${(a * 0.55).toFixed(3)}) 42%,` +
    ` rgba(14,11,10,${(a * 0.92).toFixed(3)}) 74%,` +
    ` rgba(11,9,9,${Math.min(1, a + 0.14).toFixed(3)}) 100%),` +
    ` ${tintLayer}transparent`;

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
