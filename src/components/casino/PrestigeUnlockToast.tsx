import { toast } from "sonner";
import type { ProgressEvent } from "@/store/prestige";

export function announceProgress(gameName: string, evt: ProgressEvent | null) {
  if (!evt) return;
  if (evt.kind === "tier-unlocked") {
    toast.success(`Desbloqueado: ${evt.tier.name}`, {
      description: `${gameName} — ${evt.tier.hint}`,
      duration: 4200,
    });
  } else {
    toast(`Prestigio ${evt.level}`, {
      description: `${gameName} — el rival aprieta un poco más.`,
      duration: 4200,
    });
  }
}
