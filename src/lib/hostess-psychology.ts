export type FreudDefense =
  | "proyección"
  | "sublimación"
  | "formación_reactiva"
  | "racionalización"
  | "desplazamiento"
  | "negación"
  | "regresión"
  | "aislamiento"
  | "identificación";

export type AdlerDrive =
  | "afán_de_poder"
  | "afán_de_reconocimiento"
  | "afán_de_seguridad"
  | "afán_de_pertenencia"
  | "afán_de_perfección"
  | "afán_de_venganza";

export type JungShadow =
  | "La Bruja"
  | "El Trickster"
  | "La Amante"
  | "El Huérfano"
  | "La Guerrera"
  | "La Sacerdotisa"
  | "El Mago"
  | "La Reina"
  | "La Loca Sabia"
  | "La Madre Oscura";

export interface Psyche {
  persona: string;
  shadow: JungShadow;
  defense: FreudDefense;
  drive: AdlerDrive;
  wound: string;
  totem: string;
  mantra: string;
}

const PSYCHES: Record<string, Psyche> = {
  clara: {
    persona: "Croupier de la ruleta, francés medio, mano firme.",
    shadow: "La Reina",
    defense: "racionalización",
    drive: "afán_de_reconocimiento",
    wound: "El cero le comió la dote una noche de bodas.",
    totem: "una bola de marfil rayada por el uso.",
    mantra: "La bola tiene memoria — mala, pero memoria.",
  },
  salome: {
    persona: "Dueña de la velada de las tragaperras, coqueta profesional.",
    shadow: "La Amante",
    defense: "proyección",
    drive: "afán_de_reconocimiento",
    wound: "Se enamoró del aplauso antes que de nadie.",
    totem: "una moneda con agujero que cuelga del cuello.",
    mantra: "Si dejo de brillar, no queda nada.",
  },
  lin: {
    persona: "Ojo de Dragón, calma de mah-jong.",
    shadow: "El Mago",
    defense: "aislamiento",
    drive: "afán_de_perfección",
    wound: "Le prohibieron jugar en Cantón por ganar demasiado.",
    totem: "una ficha de bambú con un carácter rayado.",
    mantra: "Todo movimiento ya está escrito.",
  },
  shauna: {
    persona: "Póker de sala principal, sonrisa breve.",
    shadow: "La Bruja",
    defense: "aislamiento",
    drive: "afán_de_perfección",
    wound: "Enviudó dos veces del mismo hombre — dos identidades.",
    totem: "un anillo de rubí que aparece y desaparece por rondas.",
    mantra: "Te leo antes de que te leas.",
  },
  luisa: {
    persona: "Baraja del chinchón, paciente y filosa.",
    shadow: "La Sacerdotisa",
    defense: "aislamiento",
    drive: "afán_de_perfección",
    wound: "Enseñó a jugar al hombre que después la denunció.",
    totem: "un mazo con la carta 40 marcada al canto.",
    mantra: "Contá bien y sobrevivís.",
  },
  vita: {
    persona: "Solitario callado, navaja sobre el fieltro.",
    shadow: "La Guerrera",
    defense: "desplazamiento",
    drive: "afán_de_seguridad",
    wound: "Le rebanaron a un hermano en un callejón que ella eligió.",
    totem: "una navaja de mango de nácar, siempre a la izquierda.",
    mantra: "Antes cortar yo que ser cortada.",
  },
  jade: {
    persona: "Ojo de Dragón, calma de mah-jong.",
    shadow: "El Mago",
    defense: "aislamiento",
    drive: "afán_de_perfección",
    wound: "Le prohibieron jugar en Cantón por ganar demasiado.",
    totem: "una ficha de bambú con un carácter rayado.",
    mantra: "Todo movimiento ya está escrito.",
  },
  zelda: {
    persona: "Adivina del cubilete, humo y presagios.",
    shadow: "La Loca Sabia",
    defense: "regresión",
    drive: "afán_de_reconocimiento",
    wound: "Le vaticinó a su madre la fecha exacta de su muerte.",
    totem: "un dado de hueso amarillento, mellado.",
    mantra: "El humo no miente aunque yo sí.",
  },
  eulalia: {
    persona: "Truquera del sótano, seca y porteña.",
    shadow: "La Guerrera",
    defense: "desplazamiento",
    drive: "afán_de_poder",
    wound: "Un envido mal cantado le sacó al único hombre que aguantaba.",
    totem: "un mazo de cartas con la muerte pintada al reverso.",
    mantra: "Mentir bien es rezar en criollo.",
  },
  bettie: {
    persona: "Bettie de la Escoba, reloj en la mano.",
    shadow: "La Guerrera",
    defense: "racionalización",
    drive: "afán_de_seguridad",
    wound: "Le mataron al croupier viejo por no delatar la banca.",
    totem: "un reloj de bolsillo detenido a las 3:14.",
    mantra: "La casa gana porque cuenta mejor.",
  },
  lola: {
    persona: "Suerte del bagatelle, abanico negro.",
    shadow: "La Amante",
    defense: "negación",
    drive: "afán_de_reconocimiento",
    wound: "La suerte se le cambió el día que perdió a su hermana gemela.",
    totem: "un abanico negro con una varilla partida.",
    mantra: "Si sonrío, la bola escucha.",
  },
  opal: {
    persona: "Cuadrículas del ático, contadora metódica del solitario.",
    shadow: "La Sacerdotisa",
    defense: "aislamiento",
    drive: "afán_de_perfección",
    wound:
      "Le auditaron los libros y no encontraron nada — eso la ofendió más que si la hubieran hallado culpable.",
    totem: "un lápiz de mina 2B afilado con navaja, siempre en la oreja.",
    mantra: "El error del otro es mi renglón.",
  },
};

const DEFAULT: Psyche = {
  persona: "Anfitriona del Cuervo Dorado.",
  shadow: "La Sacerdotisa",
  defense: "aislamiento",
  drive: "afán_de_pertenencia",
  wound: "Perdió algo en el puerto de Port Corbeau.",
  totem: "una prenda que no explica.",
  mantra: "La noche cobra a todos.",
};

export function getPsyche(id: string | null | undefined): Psyche {
  if (!id) return DEFAULT;
  return PSYCHES[id] ?? DEFAULT;
}

const SHADOW_SITUATIONS: Record<JungShadow, string[]> = {
  "La Bruja": ["flirty", "tense", "confidence"],
  "El Trickster": ["tense", "flirty", "rumor"],
  "La Amante": ["flirty", "flirty_closed", "farewell"],
  "El Huérfano": ["greet", "return", "lose"],
  "La Guerrera": ["angry", "tense", "tilt"],
  "La Sacerdotisa": ["idle", "confidence", "pact"],
  "El Mago": ["win", "confidence"],
  "La Reina": ["greet", "welcome", "farewell", "regular"],
  "La Loca Sabia": ["rumor", "confidence", "secret"],
  "La Madre Oscura": ["lose", "defeat", "secret"],
};

export function psychologyBias(npcId: string, situation: string, lineId: string): number {
  const p = getPsyche(npcId);
  const hits = SHADOW_SITUATIONS[p.shadow] ?? [];
  const inSituation = hits.includes(situation);
  const isShadowTagged = /\.shadow\./.test(lineId);
  const isDefenseTagged = /\.def\./.test(lineId);
  let mult = 1;
  if (isShadowTagged && inSituation) mult *= 2.2;
  if (isDefenseTagged) mult *= 1.4;
  return mult;
}

export function describePsyche(id: string): string {
  const p = getPsyche(id);
  return `${p.persona} · Sombra: ${p.shadow} · Defensa: ${p.defense} · Motor: ${p.drive}`;
}
