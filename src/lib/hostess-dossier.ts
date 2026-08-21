import { getHostessAiProfile, type HostessAiProfile } from "./hostess-ai";
import {
  getRivalry,
  traitOf,
  weaknessOf,
  type Rivalry,
  type RivalryTrait,
} from "./hostess-rivalry";
import { dominantPattern, getEpisodes, type Episode } from "./hostess-episodic";
import { peekPending, alliesOf, type CrossEvent } from "./cross-reputation";
import { getMood, type Mood } from "./hostess-mood";
import { useHostessState, type HostessDynState } from "@/store/hostess-state";
import { useSingleAffinity, type AffinityRecord } from "@/store/single-affinity";
import { NPCS } from "./npc-bible";
import { portraitFor } from "./npc-portraits";
import { nicknameFor } from "./hostess-nickname";

export interface HostessDossier {
  npcId: string;
  name: string;
  bibleNickname?: string;
  earnedNickname: string | null;
  portrait: string;
  ai: HostessAiProfile;
  rivalry: Rivalry;
  trait: RivalryTrait | null;
  weakness: string | null;
  signatureMove: string | null;
  mood: Mood;
  dyn: HostessDynState | null;
  affinity: AffinityRecord;
  episodes: Episode[];
  dominant: { tag: string; ratio: number } | null;
  incomingGossip: CrossEvent | null;
  allies: string[];
}

const EMPTY_AFF: AffinityRecord = {
  affinity: 0,
  plays: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  lastAt: 0,
};

export function buildHostessDossier(npcId: string): HostessDossier {
  const def = NPCS[npcId];
  const dynStore = useHostessState.getState().byId[npcId] ?? null;
  const affStore = useSingleAffinity.getState().byNpc[npcId] ?? EMPTY_AFF;
  return {
    npcId,
    name: def?.name ?? npcId,
    bibleNickname: def?.nickname,
    earnedNickname: nicknameFor(npcId),
    portrait: portraitFor(npcId),
    ai: getHostessAiProfile(npcId),
    rivalry: getRivalry(npcId),
    trait: traitOf(npcId),
    weakness: weaknessOf(npcId),
    signatureMove: getRivalry(npcId).signatureMove,
    mood: getMood(npcId),
    dyn: dynStore,
    affinity: affStore,
    episodes: getEpisodes(npcId),
    dominant: dominantPattern(npcId),
    incomingGossip: peekPending(npcId),
    allies: alliesOf(npcId),
  };
}

export function labelMood(m: Mood): string {
  return {
    neutral: "serena",
    confiada: "confiada",
    nerviosa: "nerviosa",
    furiosa: "furiosa",
    aburrida: "aburrida",
  }[m];
}

export function labelTag(tag: string | null): string {
  if (!tag) return "—";
  const [fam, detail] = tag.split(":");
  const FAM: Record<string, string> = {
    bluff: "farolear",
    opening: "apertura",
    raise: "subir la apuesta",
    capture: "captura",
    bet: "apuesta",
    fold: "retirarse",
    call: "ver la apuesta",
    envido: "envido",
    truco: "truco",
    corte: "cortar",
    cierre: "cerrar",
  };
  const base = FAM[fam] ?? fam;
  return detail ? `${base} · ${detail}` : base;
}

export interface DiarioEntry {
  npcId: string;
  name: string;
  portrait: string;
  headline: string;
  detail: string;
  weight: number;
}

export function buildDiarioEntries(): DiarioEntry[] {
  const all = useSingleAffinity.getState().byNpc;
  const out: DiarioEntry[] = [];
  for (const npcId of Object.keys(all)) {
    const dossier = buildHostessDossier(npcId);
    const { rivalry, trait, weakness, dominant, incomingGossip } = dossier;
    const total = rivalry.wins + rivalry.losses;
    if (total === 0 && !incomingGossip) continue;

    let headline = "";
    let detail = "";
    let weight = total;

    if (incomingGossip) {
      headline = `${dossier.name} recibió un chisme fresco`;
      detail = `Le llegó novedad del salón de ${
        NPCS[incomingGossip.fromNpc]?.name ?? incomingGossip.fromNpc
      }.`;
      weight += 20;
    } else if (trait) {
      headline = `${dossier.name} · ${trait.label}`;
      detail =
        trait.id === "vengativa"
          ? "Te lleva marcado. Va a jugar con los dientes apretados."
          : trait.id === "estudiosa"
            ? "Está estudiando tus manos. Cambiá el ritmo o te va a agarrar."
            : trait.id === "curtida"
              ? "Te tiene el número. No juega con tanta cortesía como antes."
              : "Impredecible. Ni ella sabe cómo va a abrir.";
      weight += 10;
    } else if (weakness) {
      headline = `${dossier.name} te tiene una lectura`;
      detail = `Detectó tu patrón: ${labelTag(weakness)}.`;
      weight += 5;
    } else if (dominant) {
      headline = `${dossier.name} viene aprendiendo`;
      detail = `Te vio repetir "${labelTag(dominant.tag)}" ${Math.round(
        dominant.ratio * 100,
      )}% de las jugadas.`;
    } else {
      headline = `${dossier.name} · ${rivalry.wins}-${rivalry.losses}`;
      detail = "Sin novedades esta noche.";
    }

    out.push({
      npcId,
      name: dossier.name,
      portrait: dossier.portrait,
      headline,
      detail,
      weight,
    });
  }
  return out.sort((a, b) => b.weight - a.weight);
}
