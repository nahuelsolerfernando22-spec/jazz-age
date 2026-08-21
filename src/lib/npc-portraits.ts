import bettie from "@/assets/bettie-portrait.webp";
import pilar from "@/assets/pilar-scene-idle.webp";
import eulalia from "@/assets/eulalia-portrait.webp";
import jade from "@/assets/jade-portrait.webp";
import zelda from "@/assets/zelda-portrait.webp";
import lola from "@/assets/lola-portrait.webp";
import opal from "@/assets/opal-portrait.webp";
import vita from "@/assets/vita-portrait.webp";
import rocio from "@/assets/rocio-scene-idle.webp";
import lin from "@/assets/lin-portrait.webp";
import clara from "@/assets/clara-portrait.webp";
import salome from "@/assets/salome-portrait.webp";
import shauna from "@/assets/shauna-portrait.webp";
import luisa from "@/assets/luisa-portrait.webp";

export const PLACEHOLDER_PORTRAIT = jade;

export const PORTRAITS: Record<string, string> = {
  bettie,
  pilar,
  eulalia,
  jade,
  zelda,
  lola,
  opal,
  vita,
  rocio,
  lin,
  clara,
  salome,
  shauna,
  luisa,
};

export function portraitFor(npcId: string): string {
  return PORTRAITS[npcId] ?? PLACEHOLDER_PORTRAIT;
}
