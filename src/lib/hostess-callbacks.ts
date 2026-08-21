import { getMoments, type Moment } from "@/lib/narrative-memory";
import { pushNpcCallback } from "@/lib/npc-callbacks";

const MAX_AGE_MS = 3 * 86_400_000;

const PRIORITY: Record<Moment["type"], number> = {
  betrayal: 100,
  bluff_caught: 90,
  bluff_landed: 85,
  big_win: 80,
  big_loss: 75,
  clutch: 70,
  streak: 55,
  insult: 50,
  gift: 45,
  confession: 40,
  reunion: 25,
  first_meeting: 10,
};

const LINES: Record<Moment["type"], readonly string[]> = {
  betrayal: [
    "No te vuelvas a acercar con esa cara, encanto.",
    "Todavía huelo a promesa rota. ¿Sos vos?",
  ],
  bluff_caught: [
    "Volviste. La última vez te pillé el farol.",
    "¿Otra manito? La última fue muy transparente.",
  ],
  bluff_landed: [
    "El del farol perfecto. Sentate, quiero revancha.",
    "Sigo pensando en cómo me colaste la última.",
  ],
  big_win: ["Volvió el que me barrió. ¿Confiado hoy?", "La casa todavía te debe una del otro día."],
  big_loss: [
    "¿Venís por revancha, o venís por pena?",
    "Última vez saliste con los bolsillos vacíos. Hoy me pintás distinto.",
  ],
  clutch: [
    "El de la remontada. Vamos a ver si repetís.",
    "Con vos nunca se sabe hasta la última mano.",
  ],
  streak: [
    "Tres seguidas. La cuarta no te la regalo.",
    "Venís caliente, encanto. Frenate un poco.",
  ],
  insult: ["Espero que hoy vengas más educado.", "Lo de la última vez no me lo olvidé, dulzura."],
  gift: [
    "Todavía tengo lo que me regalaste. Sentate.",
    "El generoso. La casa tiene memoria buena.",
  ],
  confession: [
    "Lo que me contaste queda entre nosotras. Pero queda.",
    "Volviste. Y yo sigo callándome lo tuyo.",
  ],
  reunion: ["Cuánto tiempo. Pensé que te habías perdido.", "Extrañaba tu manera de tirar cartas."],
  first_meeting: ["Primera vez, ¿no? Me acuerdo de todas las primeras veces."],
};

export function getMomentCallback(hostessId: string): string | null {
  if (!hostessId) return null;
  const moments = getMoments(hostessId);
  if (moments.length === 0) return null;
  const now = Date.now();
  let best: Moment | null = null;
  let bestScore = -1;
  for (const m of moments) {
    if (now - m.at > MAX_AGE_MS) continue;
    const score = PRIORITY[m.type] ?? 0;
    if (score > bestScore) {
      best = m;
      bestScore = score;
    }
  }
  if (!best) return null;
  const pool = LINES[best.type];
  if (!pool || pool.length === 0) return null;

  const day = Math.floor(now / 86_400_000);
  const seed = hashString(`${hostessId}:${best.type}:${day}`);
  return pool[seed % pool.length];
}

export function publishMomentCallback(hostessId: string, ttl = 5000): boolean {
  const line = getMomentCallback(hostessId);
  if (!line) return false;
  return pushNpcCallback({
    npcId: hostessId,
    text: line,
    source: "moment",
    ttl,
  });
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}
