import crescenciaBack from "@/assets/_placeholder.webp";
import crescenciaFront from "@/assets/_placeholder.webp";
import secueBack from "@/assets/_placeholder.webp";
import secueFront from "@/assets/_placeholder.webp";
import hernestinaBack from "@/assets/_placeholder.webp";
import hernestinaFront from "@/assets/_placeholder.webp";
import lolaPortrait from "@/assets/lola-portrait.webp";
const lolaBack = lolaPortrait;
const lolaFront = lolaPortrait;

const ROTATION_MS = 2 * 60 * 60 * 1000;

const VARIANTS: Record<string, { back: string; front: string }> = {
  crescencia: { back: crescenciaBack, front: crescenciaFront },
  secue: { back: secueBack, front: secueFront },
  hernestina: { back: hernestinaBack, front: hernestinaFront },
  lola: { back: lolaBack, front: lolaFront },
};

export function rotatedPortrait(npcId: string, now: number = Date.now()): string | undefined {
  const v = VARIANTS[npcId];
  if (!v) return undefined;
  const bucket = Math.floor(now / ROTATION_MS);
  return bucket % 2 === 0 ? v.back : v.front;
}

export function hasPoseRotation(npcId: string): boolean {
  return npcId in VARIANTS;
}
