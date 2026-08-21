import type { CrossEvent } from "@/lib/cross-reputation";

const NPC_LABEL: Record<string, string> = {
  clara: "Clara",
  salome: "Salomé",
  lin: "Lin",
  shauna: "Shauna",
  eulalia: "Eulalia",
  luisa: "Luisa",
  jade: "Jade",
  vita: "Vita",
  zelda: "Zelda",
  opal: "Opal",
  bettie: "Bettie",
  lola: "Lola",
};

function label(id: string): string {
  return NPC_LABEL[id] ?? id;
}

export function crossRepLine(target: string, evt: CrossEvent): string {
  const who = label(evt.fromNpc);
  if (evt.kind === "win") {
    return `${who} ya me contó. Cuidá la fortuna, {alias}.`;
  }
  if (evt.kind === "loss") {
    return `${who} mandó decir que la noche te golpeó. Sentate, {alias}.`;
  }
  return `${who} habla mucho de vos últimamente.`;
}
