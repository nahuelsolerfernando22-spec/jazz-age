export type SingleCategory = "naipes" | "dados" | "azar" | "puntaje" | "meta";

export interface SingleGame {
  id: string;
  name: string;
  to: string;
  hint: string;
  category: SingleCategory;
  hasNemesis: boolean;
}

export const SINGLE_GAMES: SingleGame[] = [
  {
    id: "blackjack",
    name: "Filo de Veintiuno",
    to: "/tables",
    hint: "Blackjack: 21 sin pestañear.",
    category: "naipes",
    hasNemesis: true,
  },
  {
    id: "chinchon",
    name: "El Corte Sucio",
    to: "/chinchon",
    hint: "Chinchón: cortar antes que te corten.",
    category: "naipes",
    hasNemesis: true,
  },
  {
    id: "truco",
    name: "Mentira Criolla",
    to: "/truco",
    hint: "Truco: envido, real, falta.",
    category: "naipes",
    hasNemesis: true,
  },
  {
    id: "mahjong",
    name: "Marfil Paciente",
    to: "/mahjong",
    hint: "Mahjong: parejas de marfil.",
    category: "naipes",
    hasNemesis: true,
  },
  {
    id: "escoba",
    name: "Barrido de Quince",
    to: "/escoba",
    hint: "Escoba: sumar quince, barrer la mesa.",
    category: "naipes",
    hasNemesis: true,
  },

  {
    id: "dados",
    name: "Cinco Huesos",
    to: "/dados",
    hint: "Dados y contratos sobre el paño.",
    category: "dados",
    hasNemesis: true,
  },

  {
    id: "ruleta",
    name: "La Rueda del Cuervo",
    to: "/ruleta",
    hint: "Ruleta: rojo, negro, o nada.",
    category: "azar",
    hasNemesis: false,
  },
  {
    id: "bagatelle",
    name: "Clavo y Suerte",
    to: "/bagatelle",
    hint: "Bagatelle: bola contra clavo.",
    category: "azar",
    hasNemesis: false,
  },

  {
    id: "solitario",
    name: "La Mano Muerta",
    to: "/solitario",
    hint: "Solitario: a solas con el mazo.",
    category: "puntaje",
    hasNemesis: false,
  },
  {
    id: "sindicato",
    name: "El Sindicato",
    to: "/sindicato",
    hint: "El TEG del Cuervo: conquistá los barrios del puerto.",
    category: "meta",
    hasNemesis: false,
  },
  {
    id: "poker",
    name: "Cara de Piedra",
    to: "/poker",
    hint: "Póker: Texas Hold'em de límite fijo a tres manos.",
    category: "naipes",
    hasNemesis: true,
  },
];

export const CATEGORY_LABELS: Record<SingleCategory | "all", string> = {
  all: "Todos",
  naipes: "Naipes",
  dados: "Dados",
  azar: "Azar",
  puntaje: "Puntaje",
  meta: "Meta",
};
