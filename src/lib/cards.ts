import cardBackAsset from "@/assets/cards/back.webp";
const cardBack = cardBackAsset;

const CARD_ASSETS = import.meta.glob("@/assets/cards-ivory/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

export const SUIT_TO_LETTER: Record<string, "S" | "H" | "D" | "C"> = {
  "♠": "S",
  "♥": "H",
  "♦": "D",
  "♣": "C",
};

// Índice "RangoPalo" → URL del asset (ej. "10S", "AH").
const BY_KEY: Record<string, string> = {};
for (const [path, url] of Object.entries(CARD_ASSETS)) {
  const m = path.match(/\/([A2-9JQK]|10)([SHDC])\.webp$/);
  if (m) BY_KEY[`${m[1]}${m[2]}`] = url;
}

export function cardImg(rank: string, suit: string): string {
  const letter = SUIT_TO_LETTER[suit];
  if (!letter) return cardBack;
  // Si falta el asset devolvemos el dorso: nunca una URL vacía dentro del APK.
  return BY_KEY[`${rank}${letter}`] ?? cardBack;
}

export { cardBack };
