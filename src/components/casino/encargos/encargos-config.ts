import {
  BAGATELLE_LEVELS,
  bagatelleLevelLabel,
  bagatelleModifierLabel,
  type BagatelleLevelDef,
} from "@/lib/games/bagatelle/bagatelle-levels";
import {
  BLACKJACK_LEVELS,
  blackjackLevelLabel,
  blackjackModifierLabel,
  type BlackjackLevelDef,
} from "@/lib/games/blackjack/blackjack-levels";
import {
  DADOS_LEVELS,
  dadosLevelLabel,
  dadosModifierLabel,
  type DadosLevelDef,
} from "@/lib/games/dados/dados-levels";
import {
  ESCOBA_LEVELS,
  escobaLevelLabel,
  escobaModifierLabel,
  type EscobaLevelDef,
} from "@/lib/games/escoba/escoba-levels";
import {
  RULETA_LEVELS,
  ruletaLevelLabel,
  ruletaModifierLabel,
  type RuletaLevelDef,
} from "@/lib/games/ruleta/ruleta-levels";
import {
  SOLITARIO_LEVELS,
  solitarioLevelLabel,
  solitarioModifierLabel,
  type SolitarioLevelDef,
} from "@/lib/games/solitario/solitario-levels";
import {
  CHINCHON_LEVELS,
  chinchonLevelLabel,
  chinchonModifierLabel,
  type ChinchonLevelDef,
} from "@/lib/games/chinchon/chinchon-levels";
import {
  TRUCO_LEVELS,
  trucoLevelLabel,
  trucoModifierLabel,
  type TrucoLevelDef,
} from "@/lib/games/truco/truco-levels";

import { useBagatelleRun } from "@/store/games/bagatelle/bagatelle-run";
import { useBlackjackRun } from "@/store/games/blackjack/blackjack-run";
import { useDadosRun } from "@/store/games/dados/dados-run";
import { useEscobaRun } from "@/store/games/escoba/escoba-run";
import { useRuletaRun } from "@/store/games/ruleta/ruleta-run";
import { useSolitarioRun } from "@/store/games/solitario/solitario-run";
import { useChinchonRun } from "@/store/games/chinchon/chinchon-run";
import { useTrucoRun } from "@/store/games/truco/truco-run";

export type EncargoLevel = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  boss?: boolean;
  bossQuote?: string;
  objectiveLabel: string;
  modifierLabels: string[];
  starThresholds: [number, number, number];
  reward: { one: number; two: number; three: number };
};

export type ClearedRecord = { stars: 0 | 1 | 2 | 3 };

export interface EncargoGame {
  key: string;
  route: string;
  title: string;
  hostess: string;
  hostessRoom: string;
  blurb: string;
  /** Nivel de rango mínimo que Corvina exige para entregar el legajo. */
  requiredLevel: number;
  /** Frase de Corvina al entregar el encargo. */
  corvinaLine: string;
  levels: EncargoLevel[];
  useActiveLevel: () => string | null;
  useCleared: () => Record<string, ClearedRecord>;
  useIsUnlocked: (levelId: string) => boolean;
  startRun: (levelId: string) => void;
}

const mapBagatelle = (l: BagatelleLevelDef): EncargoLevel => ({
  id: l.id,
  order: l.order,
  title: l.title,
  subtitle: l.subtitle,
  boss: l.boss,
  bossQuote: l.bossQuote,
  objectiveLabel: bagatelleLevelLabel(l),
  modifierLabels: l.modifiers.map(bagatelleModifierLabel),
  starThresholds: l.starThresholds,
  reward: l.reward,
});

const mapBlackjack = (l: BlackjackLevelDef): EncargoLevel => ({
  id: l.id,
  order: l.order,
  title: l.title,
  subtitle: l.subtitle,
  boss: l.boss,
  bossQuote: l.bossQuote,
  objectiveLabel: blackjackLevelLabel(l),
  modifierLabels: l.modifiers.map(blackjackModifierLabel),
  starThresholds: l.starThresholds,
  reward: l.reward,
});

const mapDados = (l: DadosLevelDef): EncargoLevel => ({
  id: l.id,
  order: l.order,
  title: l.title,
  subtitle: l.subtitle,
  boss: l.boss,
  bossQuote: l.bossQuote,
  objectiveLabel: dadosLevelLabel(l),
  modifierLabels: l.modifiers.map(dadosModifierLabel),
  starThresholds: l.starThresholds,
  reward: l.reward,
});

const mapEscoba = (l: EscobaLevelDef): EncargoLevel => ({
  id: l.id,
  order: l.order,
  title: l.title,
  subtitle: l.subtitle,
  boss: l.boss,
  bossQuote: l.bossQuote,
  objectiveLabel: escobaLevelLabel(l),
  modifierLabels: l.modifiers.map(escobaModifierLabel),
  starThresholds: l.starThresholds,
  reward: l.reward,
});

const mapRuleta = (l: RuletaLevelDef): EncargoLevel => ({
  id: l.id,
  order: l.order,
  title: l.title,
  subtitle: l.subtitle,
  boss: l.boss,
  bossQuote: l.bossQuote,
  objectiveLabel: ruletaLevelLabel(l),
  modifierLabels: l.modifiers.map(ruletaModifierLabel),
  starThresholds: l.starThresholds,
  reward: l.reward,
});

const SLOTS_MOD_LABEL: Record<string, string> = {
  rot: "podrido",
  "snitch-base": "soplones",
  seal: "sellos",
  clock: "reloj",
  "rtp-drain": "comisión",
  sabotage: "sabotaje",
};

const mapSolitario = (l: SolitarioLevelDef): EncargoLevel => ({
  id: l.id,
  order: l.order,
  title: l.title,
  subtitle: l.subtitle,
  boss: l.boss,
  bossQuote: l.bossQuote,
  objectiveLabel: solitarioLevelLabel(l),
  modifierLabels: l.modifiers.map(solitarioModifierLabel),
  starThresholds: l.starThresholds,
  reward: l.reward,
});

const mapChinchon = (l: ChinchonLevelDef): EncargoLevel => ({
  id: l.id,
  order: l.order,
  title: l.title,
  subtitle: l.subtitle,
  boss: l.boss,
  bossQuote: l.bossQuote,
  objectiveLabel: chinchonLevelLabel(l),
  modifierLabels: l.modifiers.map(chinchonModifierLabel),
  starThresholds: l.starThresholds,
  reward: l.reward,
});

const mapTruco = (l: TrucoLevelDef): EncargoLevel => ({
  id: l.id,
  order: l.order,
  title: l.title,
  subtitle: l.subtitle,
  boss: l.boss,
  bossQuote: l.bossQuote,
  objectiveLabel: trucoLevelLabel(l),
  modifierLabels: l.modifiers.map(trucoModifierLabel),
  starThresholds: l.starThresholds,
  reward: l.reward,
});

export const ENCARGO_GAMES: EncargoGame[] = [
  {
    key: "ruleta",
    route: "/ruleta",
    title: "La Rueda del Cuervo",
    hostess: "Clara",
    hostessRoom: "ruleta",
    blurb: "Cerocero, comisiones y croupiers ciegos.",
    requiredLevel: 2,
    corvinaLine: "Clara cobra comisión hasta por respirar. Andá con paciencia.",
    levels: RULETA_LEVELS.map(mapRuleta),
    useActiveLevel: () => useRuletaRun((s) => s.activeLevel),
    useCleared: () => useRuletaRun((s) => s.cleared),
    useIsUnlocked: (id) => useRuletaRun((s) => s.isUnlocked(id)),
    startRun: (id) => useRuletaRun.getState().startRun(id),
  },
  {
    key: "blackjack",
    route: "/tables",
    title: "Filo de Veintiuno",
    hostess: "Bettie",
    hostessRoom: "tables",
    blurb: "Sin split, sin double, sin seguro. La casa manda.",
    requiredLevel: 2,
    corvinaLine: "La mesa de Bettie no perdona. Contá antes de pedir.",
    levels: BLACKJACK_LEVELS.map(mapBlackjack),
    useActiveLevel: () => useBlackjackRun((s) => s.activeLevel),
    useCleared: () => useBlackjackRun((s) => s.cleared),
    useIsUnlocked: (id) => useBlackjackRun((s) => s.isUnlocked(id)),
    startRun: (id) => useBlackjackRun.getState().startRun(id),
  },
  {
    key: "dados",
    route: "/dados",
    title: "Cinco Huesos",
    hostess: "Zelda",
    hostessRoom: "dados",
    blurb: "Cinco dados, mano dura y jugadas trucadas.",
    requiredLevel: 1,
    corvinaLine: "Zelda tira los huesos abajo. Bajá con la cara lavada.",
    levels: DADOS_LEVELS.map(mapDados),
    useActiveLevel: () => useDadosRun((s) => s.activeLevel),
    useCleared: () => useDadosRun((s) => s.cleared),
    useIsUnlocked: (id) => useDadosRun((s) => s.isUnlocked(id)),
    startRun: (id) => useDadosRun.getState().startRun(id),
  },
  {
    key: "escoba",
    route: "/escoba",
    title: "Barrido de Quince",
    hostess: "La Beata",
    hostessRoom: "escoba",
    blurb: "Cartas contadas, oros, sietes y escobas.",
    requiredLevel: 1,
    corvinaLine: "La Beata reza y cuenta cartas. Las dos cosas en serio.",
    levels: ESCOBA_LEVELS.map(mapEscoba),
    useActiveLevel: () => useEscobaRun((s) => s.activeLevel),
    useCleared: () => useEscobaRun((s) => s.cleared),
    useIsUnlocked: (id) => useEscobaRun((s) => s.isUnlocked(id)),
    startRun: (id) => useEscobaRun.getState().startRun(id),
  },
  {
    key: "bagatelle",
    route: "/bagatelle",
    title: "Clavo y Suerte",
    hostess: "Lola",
    hostessRoom: "bagatelle",
    blurb: "Menos bolas, gravedad rara y bumpers hostiles.",
    requiredLevel: 3,
    corvinaLine: "El tablero de Lola está torcido a propósito. Aprovechalo.",
    levels: BAGATELLE_LEVELS.map(mapBagatelle),
    useActiveLevel: () => useBagatelleRun((s) => s.activeLevel),
    useCleared: () => useBagatelleRun((s) => s.cleared),
    useIsUnlocked: (id) => useBagatelleRun((s) => s.isUnlocked(id)),
    startRun: (id) => useBagatelleRun.getState().startRun(id),
  },
  {
    key: "solitario",
    route: "/solitario",
    title: "La Mano Muerta",
    hostess: "Vita",
    hostessRoom: "solitario",
    blurb: "Klondike con reloj, sin deshacer y de a tres.",
    requiredLevel: 3,
    corvinaLine: "Trabajo de trastienda: vos, el mazo y el reloj.",
    levels: SOLITARIO_LEVELS.map(mapSolitario),
    useActiveLevel: () => useSolitarioRun((s) => s.activeLevel),
    useCleared: () => useSolitarioRun((s) => s.cleared),
    useIsUnlocked: (id) => useSolitarioRun((s) => s.isUnlocked(id)),
    startRun: (id) => useSolitarioRun.getState().startRun(id),
  },
  {
    key: "chinchon",
    route: "/chinchon",
    title: "El Corte Sucio",
    hostess: "Pilar",
    hostessRoom: "chinchon",
    blurb: "Cartas españolas, cierre a 100 y CPU con ventaja.",
    requiredLevel: 4,
    corvinaLine: "Pilar corta sucio. Si te apura, dejala cerrar mal.",
    levels: CHINCHON_LEVELS.map(mapChinchon),
    useActiveLevel: () => useChinchonRun((s) => s.activeLevel),
    useCleared: () => useChinchonRun((s) => s.cleared),
    useIsUnlocked: (id) => useChinchonRun((s) => s.isUnlocked(id)),
    startRun: (id) => useChinchonRun.getState().startRun(id),
  },
  {
    key: "truco",
    route: "/truco",
    title: "Mentira Criolla",
    hostess: "La Parda",
    hostessRoom: "truco",
    blurb: "Envido, flor y truco. La casa siempre canta primero.",
    requiredLevel: 4,
    corvinaLine: "La Parda miente mejor que vos. Todavía.",
    levels: TRUCO_LEVELS.map(mapTruco),
    useActiveLevel: () => useTrucoRun((s) => s.activeLevel),
    useCleared: () => useTrucoRun((s) => s.cleared),
    useIsUnlocked: (id) => useTrucoRun((s) => s.isUnlocked(id)),
    startRun: (id) => useTrucoRun.getState().startRun(id),
  },
];

export function findEncargoGame(key: string): EncargoGame | undefined {
  return ENCARGO_GAMES.find((g) => g.key === key);
}
