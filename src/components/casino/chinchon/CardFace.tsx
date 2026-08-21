import type { Card as ChCard, Suit } from "@/lib/games/chinchon/chinchon";
import { findCardArt as findArt } from "@/lib/games/chinchon/chinchon-deck";
import cardBack from "@/assets/chinchon-v2/card-back.webp";

// ---------- Constants ----------
export const SUIT_LABEL: Record<Suit, string> = {
  oros: "Oros",
  copas: "Copas",
  espadas: "Espadas",
  bastos: "Bastos",
};

export const SUIT_STYLE: Record<
  Suit,
  { ink: string; halo: string; paper: string; shadow: string; stain: string; plaque: string }
> = {
  oros: {
    ink: "#5f4218",
    halo: "#d2a748",
    paper: "#ead7ab",
    shadow: "#a27a42",
    stain: "#8e5c2a",
    plaque: "#c59b43",
  },
  copas: {
    ink: "#561c1f",
    halo: "#a8393d",
    paper: "#ead1b2",
    shadow: "#8e6452",
    stain: "#8a3436",
    plaque: "#8f2c30",
  },
  espadas: {
    ink: "#1f2329",
    halo: "#747d89",
    paper: "#ddd6ca",
    shadow: "#7c776e",
    stain: "#50545d",
    plaque: "#3a414a",
  },
  bastos: {
    ink: "#3c2a18",
    halo: "#8f6334",
    paper: "#e2cda7",
    shadow: "#8b6a44",
    stain: "#6a4b2f",
    plaque: "#6e4a26",
  },
};

export const RANK_LABEL: Record<number, string> = {
  1: "AS",
  2: "DOS",
  3: "TRES",
  4: "CUATRO",
  5: "CINCO",
  6: "SEIS",
  7: "SIETE",
  8: "OCHO",
  9: "NUEVE",
  10: "SOTA",
  11: "CABALLO",
  12: "REY",
};

export const RANK_NUM_GLYPH: Record<number, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "11",
  12: "12",
};

export const RANK_FILE: Record<number, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "sota",
  11: "caballo",
  12: "rey",
};

export const SUIT_PIP_COLOR: Record<Suit, string> = {
  oros: "#f1c14a",
  copas: "#e0494f",
  espadas: "#e8ecf3",
  bastos: "#c98a45",
};

// ---------- Helpers ----------
export function getCardArtSrc(card: ChCard): string | null {
  if (card.isJoker) return findArt(card.id);
  return findArt(`${card.suit}-${RANK_FILE[card.rank as number]}`);
}

// ---------- Suit glyph ----------
export function SuitEmblem({
  suit,
  size = 28,
  color,
}: {
  suit: Suit;
  size?: number;
  color: string;
}) {
  const s = size;
  switch (suit) {
    case "oros":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-hidden>
          <circle cx="16" cy="16" r="12.5" fill="#d9af50" stroke={color} strokeWidth="1.4" />
          <circle cx="16" cy="16" r="8.1" stroke={color} strokeWidth="0.9" />
          <circle cx="16" cy="16" r="2.1" fill={color} />
        </svg>
      );
    case "copas":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M9 6 H23 V10 C23 16.2 20 19.2 17 19.4 V24 H21 V27 H11 V24 H15 V19.4 C12 19.2 9 16.2 9 10 Z"
            fill="#b53d41"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "espadas":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M16 4 L18.4 21.6 L16 25.8 L13.6 21.6 Z"
            fill="#d5d9df"
            stroke={color}
            strokeWidth="1.2"
          />
          <rect x="10" y="20" width="12" height="2.2" rx="0.6" fill={color} />
          <circle cx="16" cy="26" r="1.9" fill={color} />
        </svg>
      );
    case "bastos":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path d="M7 25.8 L22.2 9.2" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M7.6 25.2 L21.6 9.8" stroke="#99683b" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M20.5 7 L25.8 12.2 M23 5.3 L27.2 9.5"
            stroke={color}
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

// ---------- Corner index ----------
export function CornerIndex({
  rank,
  suit,
  size,
  flipped = false,
}: {
  rank: number;
  suit: Suit;
  size: "sm" | "md";
  flipped?: boolean;
}) {
  const label = String(rank);
  const num = size === "sm" ? 12 : 15;
  const pip = size === "sm" ? 11 : 14;
  const pad = size === "sm" ? 2 : 3;
  const color = SUIT_PIP_COLOR[suit];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[2] flex flex-col items-center leading-none"
      style={{
        ...(flipped
          ? { right: pad, bottom: pad, transform: "rotate(180deg)" }
          : { left: pad, top: pad }),
        gap: 1,
        padding: "2px 3px 3px",
        borderRadius: 4,
        background: "linear-gradient(180deg, rgba(10,5,6,0.78) 0%, rgba(10,5,6,0.55) 100%)",
        boxShadow: "inset 0 0 0 1px rgba(241,193,74,0.35), 0 1px 2px rgba(0,0,0,0.6)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-numerals, 'Cinzel', serif)",
          fontWeight: 900,
          fontSize: num,
          color,
          textShadow: "0 0 2px rgba(0,0,0,0.95), 0 1px 1px rgba(0,0,0,0.9)",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.9)) drop-shadow(0 0 1px rgba(0,0,0,0.95))",
          display: "block",
          lineHeight: 0,
        }}
      >
        <SuitEmblem suit={suit} size={pip} color={color} />
      </span>
    </div>
  );
}

export function FallbackFace({
  card,
  size,
  theme,
}: {
  card: ChCard & { suit: Suit };
  size: "sm" | "md";
  theme: (typeof SUIT_STYLE)[Suit];
}) {
  const suit = card.suit;
  const rank = card.rank as number;
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[3px] rounded-[4px] border"
        style={{ borderColor: `${theme.ink}88` }}
      />
      <span className="absolute left-[5px] top-[4px] flex flex-col items-center leading-none">
        <span
          className="font-display font-black tabular-nums"
          style={{ color: theme.ink, fontSize: size === "sm" ? 12 : 14 }}
        >
          {RANK_NUM_GLYPH[rank]}
        </span>
        <SuitEmblem suit={suit} size={size === "sm" ? 10 : 12} color={theme.ink} />
      </span>
      <span className="absolute bottom-[4px] right-[5px] flex rotate-180 flex-col items-center leading-none">
        <span
          className="font-display font-black tabular-nums"
          style={{ color: theme.ink, fontSize: size === "sm" ? 12 : 14 }}
        >
          {RANK_NUM_GLYPH[rank]}
        </span>
        <SuitEmblem suit={suit} size={size === "sm" ? 10 : 12} color={theme.ink} />
      </span>
      <div className="absolute inset-0 flex items-center justify-center">
        <SuitEmblem suit={suit} size={size === "sm" ? 28 : 36} color={theme.ink} />
      </div>
    </>
  );
}

// ---------- Card face ----------
interface CardFaceProps {
  card: ChCard;
  size?: "sm" | "md" | "hand";
  state?: "default" | "selected" | "meld" | "loose" | "dim";
  onClick?: () => void;
  className?: string;
}

export function CardFace({
  card,
  size = "md",
  state = "default",
  onClick,
  className = "",
}: CardFaceProps) {
  const isHand = size === "hand";
  const dims = isHand
    ? { w: "var(--chinchon-hand-card-w, 44px)", h: "auto" as const }
    : size === "sm"
      ? { w: "92px", h: "137px" }
      : { w: "150px", h: "224px" };

  const theme = card.isJoker ? SUIT_STYLE.copas : SUIT_STYLE[card.suit as Suit];
  const artSrc = getCardArtSrc(card);
  const indexSize: "sm" | "md" = size === "md" ? "md" : "sm";

  const ringClass =
    state === "selected"
      ? "ring-2 ring-[var(--brass)] -translate-y-2 z-10 shadow-[0_10px_22px_rgba(0,0,0,0.6)]"
      : state === "meld"
        ? "ring-1 ring-[oklch(0.6_0.16_140)]/55"
        : state === "loose"
          ? "ring-1 ring-[oklch(0.55_0.18_25)]/45"
          : state === "dim"
            ? "opacity-55"
            : "";

  const altText = card.isJoker
    ? "Comodín"
    : `${RANK_LABEL[card.rank as number]} de ${SUIT_LABEL[card.suit as Suit]}`;

  const sharedProps = {
    style: {
      width: dims.w,
      height: dims.h,
      ...(isHand ? { aspectRatio: "92 / 137" } : {}),
      background: artSrc
        ? "#0d0708"
        : `radial-gradient(circle at 28% 18%, #f3e2ba 0%, ${theme.paper} 42%, #c9ae7f 100%)`,
      boxShadow: `0 6px 14px rgba(0,0,0,0.55), inset 0 0 0 1px ${theme.ink}55`,
    },
    className: `relative shrink-0 overflow-hidden rounded-[5px] transition-transform duration-150 hover:-translate-y-1 ${ringClass} ${className}`,
  };

  const content = (
    <>
      {artSrc ? (
        <img
          src={artSrc}
          alt={altText}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
      ) : card.isJoker ? (
        <div className="absolute inset-0 flex items-center justify-center font-display text-[28px] font-black text-[var(--brass-bright)]">
          J
        </div>
      ) : (
        <FallbackFace card={card as ChCard & { suit: Suit }} size={indexSize} theme={theme} />
      )}

      {artSrc && !card.isJoker && (
        <>
          <CornerIndex rank={card.rank as number} suit={card.suit as Suit} size={indexSize} />
          <CornerIndex
            rank={card.rank as number}
            suit={card.suit as Suit}
            size={indexSize}
            flipped
          />
        </>
      )}
      {card.isJoker && (
        <div className="pointer-events-none absolute left-1 top-1 rounded-[3px] bg-black/75 px-1 py-[1px] font-display text-[11px] uppercase tracking-[0.2em] text-[var(--brass-bright)] shadow">
          J
        </div>
      )}

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[5px]"
        style={{ boxShadow: `inset 0 0 0 1px ${theme.ink}aa, inset 0 0 0 2px ${theme.halo}33` }}
      />
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} data-card-target {...sharedProps}>
        {content}
      </button>
    );
  }

  return <div {...sharedProps}>{content}</div>;
}

// ---------- Card back ----------
export function CardBack({ size = "md" }: { size?: "sm" | "md" | "xs" }) {
  const dims =
    size === "xs" ? { w: 42, h: 63 } : size === "sm" ? { w: 82, h: 122 } : { w: 132, h: 197 };

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        boxShadow: "0 4px 10px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.55)",
      }}
      className="relative shrink-0 overflow-hidden rounded-[5px] bg-[#0d0708]"
    >
      <img
        src={cardBack}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

// ---------- Luisa mood copy ----------
export type Mood = "idle" | "smug" | "warn" | "win" | "lose" | "shocked" | "danger" | "struggling";

export const LINES: Record<Mood, string[]> = {
  idle: [
    "Tirá, pibe. La noche es corta y la baraja no.",
    "Cinco o menos, o callate la boca.",
    "Cada carta tiene su historia. La mía las cuenta todas.",
    "Despacio, encanto. La mesa no se va a ningún lado.",
    "Mirá bien antes de tirar, que el pozo tiene memoria.",
  ],
  smug: [
    "Mirá, mirá. La señora juega bonito hoy.",
    "Eso es… interesante. Sigamos.",
    "Cuidá lo que descartás, encanto.",
    "Me gusta cuando dudás. Significa que entendiste.",
  ],
  warn: [
    "Olé, olé. Me huele a cierre.",
    "Una más y me planto.",
    "Ojo que canto.",
    "Tengo la mano caliente, papito.",
  ],
  win: [
    "Chinchón, mi vida. Andá pagando y sonreí.",
    "La casa primero, querido. Siempre.",
    "Las cartas hablan español conmigo.",
    "Otra ronda perdida tuya, otra propina para mí.",
  ],
  lose: [
    "Mhh. Bueno jugado, lo admito.",
    "Hoy te llevás una, mañana vuelvo.",
    "Que no se te suba a la cabeza.",
    "Me bajaste la guardia, eso no pasa seguido.",
  ],
  shocked: [
    "¡Escalera limpia! … Eso no se ve dos veces en una noche.",
    "Chinchón… me dejaste muda, encanto. Y eso es difícil.",
    "Siete del mismo palo. Brindemos por la suerte ajena.",
    "Cobrá y andate antes de que cambie de opinión.",
  ],
  danger: [
    "Cuidado, mi vida. Estás a un descuido del cien.",
    "Una mano más como esa y te despido de la mesa.",
    "Te tiembla la baraja, encanto. Se nota.",
  ],
  struggling: [
    "Mhh. Hoy las cartas no me quieren.",
    "Voy detrás, pero la noche es larga.",
    "Que no te ilusione, ya vuelvo.",
  ],
};

export function pick<T>(arr: T[], rnd = Math.random): T {
  return arr[Math.floor(rnd() * arr.length)];
}
