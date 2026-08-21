export interface HostessAiProfile {
  id: string;
  label: string;
  skill: number;
  aggression: number;
  bluff: number;
  patience: number;
  memory: number;
}

const PROFILES: Record<string, HostessAiProfile> = {
  eulalia: {
    id: "eulalia",
    label: "Calculadora fría",
    skill: 0.82,
    aggression: 0.55,
    bluff: 0.2,
    patience: 0.75,
    memory: 0.8,
  },
  hernestina: {
    id: "hernestina",
    label: "Farolera impulsiva",
    skill: 0.62,
    aggression: 0.85,
    bluff: 0.55,
    patience: 0.3,
    memory: 0.5,
  },

  zulme: {
    id: "zulme",
    label: "Mentirosa metódica",
    skill: 0.78,
    aggression: 0.45,
    bluff: 0.35,
    patience: 0.75,
    memory: 0.85,
  },
  alice: {
    id: "alice",
    label: "Mentirosa metódica",
    skill: 0.78,
    aggression: 0.45,
    bluff: 0.35,
    patience: 0.75,
    memory: 0.85,
  },
  luisa: {
    id: "luisa",
    label: "Descarada de sonrisa",
    skill: 0.55,
    aggression: 0.8,
    bluff: 0.65,
    patience: 0.25,
    memory: 0.45,
  },

  zelda: {
    id: "zelda",
    label: "Intuitiva confiada",
    skill: 0.7,
    aggression: 0.65,
    bluff: 0.15,
    patience: 0.55,
    memory: 0.6,
  },
  salome: {
    id: "salome",
    label: "Corazonada temeraria",
    skill: 0.55,
    aggression: 0.85,
    bluff: 0.2,
    patience: 0.3,
    memory: 0.4,
  },

  pilar: {
    id: "pilar",
    label: "Memoria de elefante",
    skill: 0.85,
    aggression: 0.35,
    bluff: 0.1,
    patience: 0.85,
    memory: 0.95,
  },
  ines: {
    id: "ines",
    label: "Paciente cauta",
    skill: 0.65,
    aggression: 0.3,
    bluff: 0.1,
    patience: 0.8,
    memory: 0.55,
  },

  anahit: {
    id: "anahit",
    label: "Estratega paciente",
    skill: 0.88,
    aggression: 0.45,
    bluff: 0.05,
    patience: 0.85,
    memory: 0.75,
  },
  kelia: {
    id: "kelia",
    label: "Ofensiva veloz",
    skill: 0.72,
    aggression: 0.75,
    bluff: 0.1,
    patience: 0.35,
    memory: 0.65,
  },

  yolanda: {
    id: "yolanda",
    label: "Tejedora precisa",
    skill: 0.8,
    aggression: 0.4,
    bluff: 0.1,
    patience: 0.75,
    memory: 0.7,
  },
  isabel: {
    id: "isabel",
    label: "Ambiciosa impaciente",
    skill: 0.6,
    aggression: 0.7,
    bluff: 0.15,
    patience: 0.35,
    memory: 0.55,
  },
};

const DEFAULT_PROFILE: HostessAiProfile = {
  id: "default",
  label: "Equilibrada",
  skill: 0.6,
  aggression: 0.5,
  bluff: 0.3,
  patience: 0.5,
  memory: 0.5,
};

export function getHostessAiProfile(id: string | null | undefined): HostessAiProfile {
  if (!id) return DEFAULT_PROFILE;
  return PROFILES[id] ?? DEFAULT_PROFILE;
}

export function profileToGeneralaSkill(p: HostessAiProfile): "rookie" | "normal" | "sharp" {
  if (p.skill >= 0.75) return "sharp";
  if (p.skill >= 0.55) return "normal";
  return "rookie";
}

export function profileToChinchonDifficulty(p: HostessAiProfile): 0 | 1 | 2 {
  if (p.skill >= 0.78) return 2;
  if (p.skill >= 0.6) return 1;
  return 0;
}
