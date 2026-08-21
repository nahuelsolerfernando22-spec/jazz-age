import bgBlackjack from "@/assets/bg-blackjack.webp";
import bgChinchon from "@/assets/bg-chinchon.webp";
import bgTruco from "@/assets/bg-truco.webp";
import bgMahjong from "@/assets/bg-mahjong.webp";
import bgEscoba from "@/assets/bg-escoba.webp";
import bgDados from "@/assets/bg-dados.webp";
import bgRuleta from "@/assets/bg-ruleta.webp";
import bgBagatelle from "@/assets/bg-bagatelle.webp";
import bgSolitario from "@/assets/bg-solitario.webp";
import bgSindicato from "@/assets/bg-poker.webp"; // Usamos el arte de poker para el Sindicato (Noir)

export const GENERIC_NOIR_BG = bgBlackjack;

export const GAME_BG_MAP: Record<string, string> = {
  blackjack: bgBlackjack,
  chinchon: bgChinchon,
  truco: bgTruco,
  mahjong: bgMahjong,
  escoba: bgEscoba,
  dados: bgDados,
  ruleta: bgRuleta,
  bagatelle: bgBagatelle,
  solitario: bgSolitario,
  sindicato: bgSindicato,
  monte: bgChinchon,
};

const ALL_BGS = Array.from(new Set(Object.values(GAME_BG_MAP)));

const cache = new Map<string, HTMLImageElement>();
let warmed = false;

export function warmSingleBackgrounds(): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  const start = () => {
    for (const src of ALL_BGS) {
      if (cache.has(src)) continue;
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = src;
      cache.set(src, img);
    }
  };
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;
  if (typeof ric === "function") ric(start);
  else window.setTimeout(start, 60);
}

export function getCachedBg(src: string): HTMLImageElement | undefined {
  return cache.get(src);
}
