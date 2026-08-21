import { useEffect, useState } from "react";
import { interpolate, speak, useNpcSpeak, type Situation } from "@/lib/dialogue";
import { getAbsenceDays, usePlayerMemory } from "@/store/player-memory";
import { getEventContext } from "@/lib/event-manager";
import { consumePending } from "@/lib/cross-reputation";
import { crossRepLine } from "@/lib/hostess-relations";
import { getMood, getMoodState } from "@/lib/hostess-mood";
import { dominantPattern } from "@/lib/hostess-episodic";
import { getRivalry } from "@/lib/hostess-rivalry";

const MOOD_LINES: Record<string, string[]> = {
  furiosa: ["Ya me tenés cansada, {alias}.", "Se acabó la sonrisa.", "Esta va en serio."],
  confiada: ["Te tengo leído, {alias}.", "Seguí probando, si querés.", "Ya sé cómo jugás."],
  nerviosa: ["Hoy me cuesta, no te voy a mentir.", "Dame un respiro, {alias}."],
  aburrida: ["¿Eso es todo? Aburrime más despacio.", "Poné algo de sal, {alias}."],
};

function moodLine(npcId: string): string | null {
  const mood = getMood(npcId);
  if (mood === "neutral") return null;
  const pool = MOOD_LINES[mood];
  if (!pool || pool.length === 0) return null;
  const state = getMoodState(npcId);
  const idx = (Math.abs(state.streak) + state.wins + state.losses) % pool.length;
  return pool[idx] ?? null;
}

const PATTERN_POOLS: Record<string, string[]> = {
  bluff: [
    "Ya te vi ese farol, {alias}. Van tres veces.",
    "El mismo bluff otra vez. Sos previsible.",
    "Cambiá el truco, {alias}, se te lee en la cara.",
  ],
  opening: [
    "Otra vez la misma apertura. Estudiá algo nuevo.",
    "Abrís siempre igual. Aburrido.",
    "Esa apertura ya me la sé de memoria, {alias}.",
  ],
  "raise:big": [
    "Subís cuando perdés. Se te nota.",
    "Apostás grande cuando te falla la mano. Clásico.",
  ],
  capture: ["Me estás comiendo las piezas de siempre.", "Ya sé por dónde vas a atacar, {alias}."],
  bet: ["Siempre la misma apuesta. Arriesgá algo, {alias}.", "Se te lee la mano en el ante."],
};

const MEMORY_POOLS: Record<"defeat" | "signature" | "intel", string[]> = {
  defeat: [
    "La última vez me ganaste con esa jugada. Hoy no, {alias}.",
    "No me olvido de la última mano, {alias}. Vengo por revancha.",
    "Perdí una vez con eso. Solo una vez.",
  ],
  signature: [
    "Anoche te barrí con esta misma seña, {alias}. Repito.",
    "Te tengo el número, {alias}.",
    "Ya sabés cómo termina esto.",
  ],
  intel: [
    "Me contaron cómo jugás, {alias}. Vengo preparada.",
    "Las chicas hablan. Ya sé por dónde te agarrás.",
    "Corre el rumor de tu jugadita, {alias}. Acá no te sirve.",
  ],
};

function pickFromPool(pool: string[], seed: number): string {
  return pool[Math.abs(seed) % pool.length] ?? pool[0];
}

function patternLine(npcId: string): string | null {
  const pat = dominantPattern(npcId);
  const riv = getRivalry(npcId);
  const rot = riv.wins + riv.losses;

  if (pat && riv.lastDefeatTag && pat.tag === riv.lastDefeatTag) {
    return pickFromPool(MEMORY_POOLS.defeat, rot);
  }
  if (pat && riv.signatureMove && pat.tag === riv.signatureMove) {
    return pickFromPool(MEMORY_POOLS.signature, rot + 1);
  }

  if (pat && riv.intel.includes(pat.tag)) {
    return pickFromPool(MEMORY_POOLS.intel, rot + 2);
  }

  if (!pat) return null;
  for (const key of Object.keys(PATTERN_POOLS)) {
    if (pat.tag.startsWith(key)) return pickFromPool(PATTERN_POOLS[key], rot);
  }
  return null;
}

function returnLine(days: number): string | null {
  if (days <= 0) return null;
  if (days < 3) return "Hace un día que no te veía, {alias}. La mesa se enfriaba.";
  if (days < 7) return "Una semana entera sin verte, {alias}. Pensé que te habían encerrado.";
  return "Mucho tiempo sin pisar el Cuervo, {alias}. Acomodate, contame qué pasó.";
}

export function useNpcDialogue(
  npcId: string,
  room: string,
  outcome: Situation | null,
  fallback = "",
): { line: string; greeted: boolean } {
  const [line, setLine] = useState<string>(fallback);
  const [greeted, setGreeted] = useState(false);

  useEffect(() => {
    const pending = consumePending(npcId);
    if (pending) {
      setLine(interpolate(crossRepLine(npcId, pending)));
      usePlayerMemory.getState().noteVisit(npcId);
      setGreeted(true);
      return;
    }

    const days = getAbsenceDays();
    const ret = returnLine(days);
    if (ret && days >= 1) {
      setLine(interpolate(ret));
      usePlayerMemory.getState().noteVisit(npcId);
      setGreeted(true);
      return;
    }

    const evt = getEventContext();
    const greet = speak({
      npcId,
      situation: "greet",
      room,
      hour: evt.hour,
      extra: { timeBand: evt.timeBand, season: evt.season, featured: evt.featuredHostess },
    });
    if (greet) setLine(greet);
    usePlayerMemory.getState().noteVisit(npcId);
    setGreeted(true);
  }, [npcId, room]);

  const dynamic = useNpcSpeak(npcId, outcome, { room });
  useEffect(() => {
    if (dynamic) {
      const mood = moodLine(npcId);
      const pat = patternLine(npcId);
      setLine(interpolate(mood ?? pat ?? dynamic));
    }
  }, [dynamic, npcId]);

  return { line, greeted };
}
