export type FloorId = "attic" | "upstairs" | "ground" | "cantina" | "basement";
export type NpcRole = "hostess" | "host" | "patron" | "boss";
export type DiscTrait = "D" | "I" | "S" | "C";

export interface NpcDef {
  id: string;
  name: string;
  nickname?: string;
  floor: FloorId | "any";
  role: NpcRole;
  room?: string;
  disc: DiscTrait[];
  tags?: string[];
}

export const NPCS: Record<string, NpcDef> = {
  bettie: {
    id: "bettie",
    name: "Black Bettie",
    floor: "ground",
    role: "hostess",
    room: "tables",
    disc: ["D"],
    tags: ["blackjack"],
  },
  madge: {
    id: "madge",
    name: "Madge",
    floor: "ground",
    role: "hostess",
    room: "tables",
    disc: ["D", "C"],
    tags: ["tables"],
  },
  pilar: {
    id: "pilar",
    name: "Pilar «La Baraja» Solís",
    floor: "upstairs",
    role: "hostess",
    room: "chinchon",
    disc: ["C", "S"],
    tags: ["cartas"],
  },
  eulalia: {
    id: "eulalia",
    name: "Eulalia",
    floor: "basement",
    role: "hostess",
    room: "truco",
    disc: ["I", "D"],
    tags: ["truco"],
  },
  jade: {
    id: "jade",
    name: "Jade «Ojo de Dragón»",
    floor: "upstairs",
    role: "hostess",
    room: "solitario",
    disc: ["C"],
    tags: ["solitario"],
  },
  zelda: {
    id: "zelda",
    name: "Zelda «La Adivina» Marek",
    floor: "cantina",
    role: "hostess",
    room: "dados",
    disc: ["I", "C"],
    tags: ["dados"],
  },
  luciera: {
    id: "luciera",
    name: "Luciera",
    floor: "ground",
    role: "hostess",
    room: "ruleta",
    disc: ["I"],
    tags: ["ruleta"],
  },
  daphne: {
    id: "daphne",
    name: "Daphne",
    floor: "cantina",
    role: "hostess",
    room: "slots",
    disc: ["I", "S"],
    tags: ["slots"],
  },
  lola: {
    id: "lola",
    name: "Lola «La Suerte» Vargas",
    floor: "cantina",
    role: "hostess",
    room: "bagatelle",
    disc: ["I"],
    tags: ["bagatelle"],
  },
  opal: {
    id: "opal",
    name: "Opal «Cuadrículas» Hartley",
    floor: "attic",
    role: "hostess",
    room: "solitario",
    disc: ["C"],
    tags: ["solitario"],
  },
  vita: {
    id: "vita",
    name: "Vita la Cuchillas",
    floor: "ground",
    role: "hostess",
    room: "tables",
    disc: ["D"],
    tags: ["blackjack"],
  },
  rocio: {
    id: "rocio",
    name: "Rocío «Siete de Oros» Cañete",
    floor: "upstairs",
    role: "hostess",
    room: "escoba",
    disc: ["C", "D"],
    tags: ["escoba", "cartas"],
  },
  lin: {
    id: "lin",
    name: "Lin «Pluma de Tinta»",
    floor: "upstairs",
    role: "hostess",
    room: "mahjong",
    disc: ["C", "S"],
    tags: ["mahjong"],
  },
  clara: {
    id: "clara",
    name: "Clara «La Rueda» Vidal",
    floor: "ground",
    role: "hostess",
    room: "ruleta",
    disc: ["I"],
    tags: ["ruleta"],
  },
  salome: {
    id: "salome",
    name: "Salomé «Palanca» Duarte",
    floor: "cantina",
    role: "hostess",
    room: "slots",
    disc: ["I", "S"],
    tags: ["slots"],
  },
  shauna: {
    id: "shauna",
    name: "Shauna «Cinco Cartas» Byrne",
    floor: "ground",
    role: "hostess",
    room: "tables",
    disc: ["D", "C"],
    tags: ["tables"],
  },
  luisa: {
    id: "luisa",
    name: "Luisa «La Chinchona» Ferrari",
    floor: "upstairs",
    role: "hostess",
    room: "chinchon",
    disc: ["C", "S"],
    tags: ["cartas"],
  },
};

export function getNpc(id: string): NpcDef | undefined {
  return NPCS[id];
}
