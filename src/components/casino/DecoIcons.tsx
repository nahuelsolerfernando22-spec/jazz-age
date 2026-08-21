import type { CSSProperties } from "react";

/**
 * Íconos dibujados a mano (SVG) con estética art déco 1928 — tinta de latón,
 * trazo grueso y formas geométricas legibles a 24-32px en Android.
 * Reemplazan los medallones rasterizados que se veían borrosos en tamaños chicos.
 */

type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

const INK = "currentColor";

function Svg({
  size = 28,
  className,
  style,
  title,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      style={{
        width: size,
        height: size,
        display: "block",
        overflow: "visible",
        filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.75))",
        ...style,
      }}
      fill="none"
      stroke={INK}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Pila de fichas — pestaña "Jugar". */
export function IconFichas(p: IconProps) {
  return (
    <Svg {...p}>
      <ellipse cx="24" cy="33" rx="14" ry="5.5" />
      <path d="M10 33v-5M38 33v-5" />
      <ellipse cx="24" cy="28" rx="14" ry="5.5" />
      <path d="M10 28v-5M38 28v-5" />
      <ellipse cx="24" cy="23" rx="14" ry="5.5" />
      <path d="M24 17.6v10.8M18.6 23h10.8" strokeWidth="1.4" opacity="0.85" />
      <path d="M24 9.5l3 3.2-3 3.2-3-3.2z" strokeWidth="1.6" />
    </Svg>
  );
}

/** Abanico de naipes — pestaña "Juegos". */
export function IconNaipes(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="7" y="15" width="15" height="22" rx="2.5" transform="rotate(-16 14.5 26)" />
      <rect x="16.5" y="12" width="15" height="22" rx="2.5" />
      <rect x="26" y="15" width="15" height="22" rx="2.5" transform="rotate(16 33.5 26)" />
      <path d="M24 18.5l3.2 3.4a4.4 4.4 0 1 1-6.4 0z" strokeWidth="1.5" />
      <path d="M24 26.5v3.5" strokeWidth="1.5" />
    </Svg>
  );
}

/** Sobre lacrado — pestaña "Encargos". */
export function IconSobre(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="6" y="12" width="36" height="24" rx="2.5" />
      <path d="M6.8 13.4L24 26 41.2 13.4" />
      <path d="M6.8 34.8L18 24M41.2 34.8L30 24" strokeWidth="1.4" opacity="0.8" />
      <circle cx="24" cy="29.5" r="4.6" strokeWidth="1.8" />
      <path d="M22 29.5h4M24 27.5v4" strokeWidth="1.2" opacity="0.9" />
    </Svg>
  );
}

/** Libro de la casa — pestaña "Reglas". */
export function IconLibro(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 11h11a5 5 0 0 1 5 5v21a5 5 0 0 0-5-4H8z" />
      <path d="M40 11H29a5 5 0 0 0-5 5v21a5 5 0 0 1 5-4h11z" />
      <path d="M24 16v21" strokeWidth="1.4" opacity="0.75" />
      <path d="M12 18h6M12 23h6M30 18h6M30 23h6" strokeWidth="1.2" opacity="0.7" />
      <path d="M24 5.8l2.6 2.7-2.6 2.7-2.6-2.7z" strokeWidth="1.5" />
    </Svg>
  );
}

/** Lámpara de escritorio — pestaña "Ajustes". */
export function IconLampara(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M13 22l7-11h9l6 11z" />
      <path d="M13 22h22" strokeWidth="1.6" />
      <path d="M24.5 22v6.5c0 4-4.5 4.5-4.5 8.5" />
      <path d="M12 39h16" strokeWidth="2.4" />
      <path d="M18 22.5l1.5 4M24 22.5l0 4M30 22.5l-1.5 4" strokeWidth="1.2" opacity="0.7" />
      <path d="M38 12l2.2 2.3L38 16.6l-2.2-2.3z" strokeWidth="1.5" />
    </Svg>
  );
}

/** Corazón déco — vidas. */
export function IconCorazon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M24 40L9 25.5A9.4 9.4 0 0 1 24 14a9.4 9.4 0 0 1 15 11.5z" strokeWidth="2.6" />
      <path
        d="M24 33.5l-7.5-7.4A4.6 4.6 0 0 1 24 20.6a4.6 4.6 0 0 1 7.5 5.5z"
        strokeWidth="1.4"
        opacity="0.8"
      />
    </Svg>
  );
}

/** Paquete con moño — regalo diario. */
export function IconRegalo(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="8" y="19" width="32" height="20" rx="2" />
      <rect x="6" y="13" width="36" height="7" rx="1.6" />
      <path d="M24 13v26" strokeWidth="2.2" />
      <path d="M24 13c-1-4-4-6-7-5s-2 5 1 5zM24 13c1-4 4-6 7-5s2 5-1 5z" strokeWidth="1.7" />
    </Svg>
  );
}

/** Gramófono — control de música. */
export function IconGramola(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M18 12.5l14-4.5v9l-14 4.5z" />
      <path d="M18 12.5l-4 4.5 4 4.5" strokeWidth="1.6" />
      <path d="M22 22.5v9" strokeWidth="1.8" />
      <path d="M14 38h16l-2-6H16z" />
      <path d="M36 14.5a6 6 0 0 1 0 8M39.5 11.5a10 10 0 0 1 0 14" strokeWidth="1.6" opacity="0.9" />
    </Svg>
  );
}

/** Llama de tinta — racha diaria (reemplaza el rombo). */
export function IconLlamaRacha(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M24 6c1.5 6-3.5 8.5-6.5 12.5C14 23.4 13 27 13 30a11 11 0 0 0 22 0c0-4.5-2.4-7.6-5-10.4-1.4 2.2-2.9 3-4.2 2.3C24 21 25.6 14.4 24 6z"
        strokeWidth="2.4"
      />
      <path
        d="M24 42a6 6 0 0 1-6-6c0-3 2.6-5 4-8 1.7 2.4 3.2 3 4.6 2 .9 2.3 3.4 3.7 3.4 6a6 6 0 0 1-6 6z"
        strokeWidth="1.5"
        opacity="0.85"
      />
    </Svg>
  );
}

/** Sello de lacre con plumilla — viñeta de misión pendiente. */
export function IconLacre(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M24 8c5 2 9 1 11 4s-1 6 0 9-3 6-4 9-5 3-7 5-5-2-8-3-6 0-8-3 1-6 0-9 2-6 4-9 7-1 12-3z"
        strokeWidth="2.2"
      />
      <path d="M18 24h12M20.5 29h7" strokeWidth="1.5" opacity="0.85" />
    </Svg>
  );
}

/** Tilde a plumilla — misión cumplida. */
export function IconPlumaTilde(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 26.5c4.5 1 8 4 11 9C24.5 22 31 13.5 40 8" strokeWidth="3.2" />
    </Svg>
  );
}

/**
 * Filigrana de tinta para separadores: dos plumazos que nacen de un nudo
 * central irregular, dibujado a mano (nada de rombos geométricos).
 */
export function OrnamentoTinta({
  size = 22,
  className,
  style,
  flip,
}: IconProps & { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 24"
      width={size * 1.6}
      height={size}
      aria-hidden
      className={className}
      style={{
        display: "block",
        transform: flip ? "scaleX(-1)" : undefined,
        filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.7))",
        ...style,
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    >
      <path d="M2 12c6-6 10 6 15 0" opacity="0.9" />
      <path d="M17 12c3.5-5 8-2 6.5 2.5S16 18 20 12s10-6 12.5-1.5S36 16 38 12" />
      <path d="M20 5.5v2M20 16.5v2" opacity="0.6" />
    </svg>
  );
}
/**
 * Mano señalando a plumilla — reemplaza el rombo del rótulo "Continuar".
 * Dibujo de cartel clandestino: puño con índice extendido y puño de camisa.
 */
export function IconManoContinuar(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M6 24.5h9.5M15.5 20.5c0-2 1.5-3 3-3h9.5c1.6 0 2.6-1.2 2.6-2.4s-1-2.3-2.6-2.3h-6"
        strokeWidth="2"
      />
      <path
        d="M15.5 20.5v8c0 3.4 2.8 6 6.4 6h9.6c4.4 0 8-3.3 8-7.6v-4.2c0-1.5-1.2-2.6-2.7-2.6-1.4 0-2.6 1.1-2.6 2.5"
        strokeWidth="2"
      />
      <path d="M34.2 22.6c0-1.5-1.2-2.6-2.7-2.6s-2.7 1.1-2.7 2.6" strokeWidth="1.7" opacity="0.9" />
      <path d="M28.8 22.6c0-1.5-1.2-2.6-2.7-2.6s-2.6 1.1-2.6 2.6" strokeWidth="1.7" opacity="0.9" />
      <path d="M6 20.5v8" strokeWidth="1.6" opacity="0.7" />
    </Svg>
  );
}

/**
 * Chinche clavada en el papel — viñeta de rótulo. Sustituye a los rombos
 * geométricos: cabeza irregular, brillo mordido y sombra de clavo.
 */
export function IconChinche(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M24 9c5.2 0 9 3 8.6 6.4-.3 2.4-2.6 3.2-2.3 6.1.2 2.3 1.9 3.3 4.4 4.4 2 .9 1.3 3.1-1.2 3.1H14.5c-2.5 0-3.2-2.2-1.2-3.1 2.5-1.1 4.2-2.1 4.4-4.4.3-2.9-2-3.7-2.3-6.1C15 12 18.8 9 24 9Z"
        strokeWidth="2.1"
      />
      <path d="M24 29v10" strokeWidth="2.4" />
      <path d="M20.5 14.5c.8-1.6 2.3-2.4 4-2.4" strokeWidth="1.5" opacity="0.75" />
    </Svg>
  );
}

/**
 * Puño del Sindicato — pestaña "Sindicato".
 * Representa el control y la conquista de territorios.
 */
export function IconSindicato(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14 26v10c0 2 1.5 3.5 3.5 3.5h13c2 0 3.5-1.5 3.5-3.5V26" strokeWidth="2.2" />
      <path d="M12 26h24v-6c0-2-1.5-3.5-3.5-3.5h-17c-2 0-3.5 1.5-3.5 3.5v6z" strokeWidth="2.2" />
      <path d="M18 16.5v-4M24 16.5v-6M30 16.5v-4" strokeWidth="1.8" />
      <path d="M12 22h24" strokeWidth="1.5" opacity="0.8" />
      <path d="M24 30.5l2.5 2.5-2.5 2.5-2.5-2.5z" strokeWidth="1.5" />
    </Svg>
  );
}
