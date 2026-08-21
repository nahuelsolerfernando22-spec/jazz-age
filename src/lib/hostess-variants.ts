import { portraitFor } from "@/lib/npc-portraits";
import corvinaBase from "@/assets/_placeholder.webp";
import corvinaSick from "@/assets/_placeholder.webp";
import corvinaTired from "@/assets/_placeholder.webp";
import type { DynamicSnapshot } from "@/lib/hostess-dynamic";
import { getEquippedGiftsForNpc } from "@/lib/hostess-gifts";
import { wornPortraitFor } from "@/lib/hostess-worn-portraits";

interface VariantSet {
  base: string;
  sick?: string;
  tired?: string;
}

const VARIANTS: Record<string, VariantSet> = {
  corvina: { base: corvinaBase, sick: corvinaSick, tired: corvinaTired },
};

const WORN_SLOT_PRIORITY = ["outfit", "adornment", "accessory", "gesture"] as const;

export function variantSrcFor(npcId: string, snap: DynamicSnapshot): string {
  const set = VARIANTS[npcId];
  const fallback = set?.base ?? portraitFor(npcId);

  if (set?.sick && snap.sick) return set.sick;
  if (set?.tired && (snap.phase === "impaciente" || snap.phase === "agotada")) return set.tired;

  const equipped = getEquippedGiftsForNpc(npcId);
  for (const slot of WORN_SLOT_PRIORITY) {
    const worn = wornPortraitFor(equipped[slot]);
    if (worn) return worn;
  }

  return fallback;
}

export function hasVariants(npcId: string): boolean {
  return npcId in VARIANTS;
}

export function wornSrcForEquipped(npcId: string): string | undefined {
  const equipped = getEquippedGiftsForNpc(npcId);
  for (const slot of WORN_SLOT_PRIORITY) {
    const worn = wornPortraitFor(equipped[slot]);
    if (worn) return worn;
  }
  return undefined;
}
