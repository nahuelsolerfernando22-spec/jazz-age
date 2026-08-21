export type Humor =
  | "seco"
  | "coqueto"
  | "irónico"
  | "descarado"
  | "místico"
  | "docente"
  | "melancólico"
  | "sereno"
  | "sarcástico"
  | "cálido"
  | "impaciente"
  | "temerario"
  | "tímido";

export interface HostessPersonality {
  humor: Humor;
  tono: string;
  muletilla: string;
  registro: string;
}

const PERSONALITIES: Record<string, HostessPersonality> = {
  eulalia: {
    humor: "seco",
    tono: "áspera y cortante",
    muletilla: "Pagá y andá.",
    registro: "voseo porteño 1928",
  },
  hernestina: {
    humor: "coqueto",
    tono: "sensual y burlona",
    muletilla: "Ay, mi amor…",
    registro: "bahiano cantado",
  },
  zulme: {
    humor: "irónico",
    tono: "medida, elegante",
    muletilla: "Vamos a ver si me creés.",
    registro: "voseo formal",
  },
  alice: {
    humor: "irónico",
    tono: "medida, elegante",
    muletilla: "Vamos a ver si me creés.",
    registro: "voseo formal",
  },
  luisa: {
    humor: "descarado",
    tono: "burlona y procaz",
    muletilla: "¿En serio te lo creíste?",
    registro: "informal barrial",
  },
  zelda: {
    humor: "místico",
    tono: "profética, brumosa",
    muletilla: "El humo ya te leyó.",
    registro: "arcaísmos gitanos",
  },
  salome: {
    humor: "temerario",
    tono: "encendida y rápida",
    muletilla: "Rueda o rompete.",
    registro: "andaluz encendido",
  },
  pilar: {
    humor: "docente",
    tono: "paciente y filosa",
    muletilla: "Contá bien, criatura.",
    registro: "usted castizo",
  },
  ines: {
    humor: "tímido",
    tono: "susurrada",
    muletilla: "Si no le molesta…",
    registro: "usted tímido",
  },
  anahit: {
    humor: "melancólico",
    tono: "grave, litúrgica",
    muletilla: "El velo lo verá todo.",
    registro: "formal con armenio",
  },
  kelia: {
    humor: "sarcástico",
    tono: "punzante y veloz",
    muletilla: "Doblá el cubo o callate.",
    registro: "ruso-cubano",
  },
  jade: {
    humor: "sereno",
    tono: "elegante, cortés",
    muletilla: "El viento del este decide.",
    registro: "formal, imágenes chinas",
  },
  lin: {
    humor: "sereno",
    tono: "medida y precisa",
    muletilla: "Un movimiento a la vez.",
    registro: "formal",
  },
  yolanda: {
    humor: "cálido",
    tono: "narradora cantarina",
    muletilla: "Poné el broche donde va.",
    registro: "habanero",
  },
  isabel: {
    humor: "impaciente",
    tono: "expeditiva",
    muletilla: "Menos verso, más cuadros.",
    registro: "cortante",
  },
};

const DEFAULT_PERSONALITY: HostessPersonality = {
  humor: "sereno",
  tono: "neutra",
  muletilla: "…",
  registro: "formal",
};

export function getHostessPersonality(id: string | null | undefined): HostessPersonality {
  if (!id) return DEFAULT_PERSONALITY;
  return PERSONALITIES[id] ?? DEFAULT_PERSONALITY;
}

export function describeHostess(archetype: string, id: string): string {
  const p = getHostessPersonality(id);
  return `${archetype} · ${p.tono}`;
}
