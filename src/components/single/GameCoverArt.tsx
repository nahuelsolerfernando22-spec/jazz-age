import { memo } from "react";
import { coverSourcesForGame } from "@/lib/single-backgrounds";

interface Props {
  gameId: string;
  /** Ancho aproximado que ocupa el arte en pantalla (para elegir la variante). */
  sizes?: string;
  /** Prioridad de carga: el hero se descarga enseguida, los tiles no. */
  eager?: boolean;
  /** `contain` muestra el arte completo; `cover` lo recorta para llenar el marco. */
  fit?: "contain" | "cover";
  className?: string;
}

/**
 * Portada de juego responsive.
 * El arte es apaisado (3:2) y los contenedores van de cuadrados a altos, así que
 * se muestra completo (`object-contain`) sobre una copia desenfocada del mismo
 * arte: nunca se recorta, nunca se deforma y nunca quedan bordes vacíos.
 * Formatos: AVIF → WebP → JPG, con anchos 320/640/900.
 */
export const GameCoverArt = memo(function GameCoverArt({
  gameId,
  sizes = "100vw",
  eager = false,
  fit = "contain",
  className = "",
}: Props) {
  const s = coverSourcesForGame(gameId);
  if (!s) return null;
  const loading = eager ? "eager" : "lazy";
  const fetchPriority = eager ? "high" : "auto";

  const picture = (imgClass: string, style?: React.CSSProperties) => (
    <picture>
      {s.avif ? <source type="image/avif" srcSet={s.avif} sizes={sizes} /> : null}
      {s.webp ? <source type="image/webp" srcSet={s.webp} sizes={sizes} /> : null}
      <img
        src={s.src}
        srcSet={s.jpg}
        sizes={sizes}
        alt=""
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={false}
        className={imgClass}
        style={style}
      />
    </picture>
  );

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {picture("absolute inset-[-8%] h-[116%] w-[116%] object-cover", {
        filter: "blur(28px) saturate(0.9) brightness(0.62)",
      })}
      {picture(
        `absolute inset-0 h-full w-full object-center ${fit === "cover" ? "object-cover" : "object-contain"}`,
      )}
    </div>
  );
});
