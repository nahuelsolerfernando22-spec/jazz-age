import { NPCS } from "./npc-bible";
import { portraitFor } from "./npc-portraits";

export interface SingleHostess {
  npcId: string;
  name: string;
  nickname?: string;
  portrait: string;
  greet: string;
  win: string;
  loss: string;
  chatter: string[];
}

const RAW: Record<
  string,
  { npc: string; greet: string; win: string; loss: string; chatter?: string[] }
> = {
  blackjack: {
    npc: "vita",
    greet: "Sentate. No hablo mucho mientras reparto.",
    win: "Tuviste suerte. Repartí de nuevo.",
    loss: "La casa cobra en silencio.",
    chatter: [
      "Pedí carta o plantate. Sin drama.",
      "El 21 no perdona a los tibios.",
      "Mirá al dealer, no a la mesa de al lado.",
      "Split o doble, si tenés estómago.",
      "La casa cuenta despacio. Vos también.",
    ],
  },
  chinchon: {
    npc: "luisa",
    greet: "Baraja española, señor. Ordené las cartas por ustéd.",
    win: "Bien jugado. Repartí de nuevo.",
    loss: "Menos treinta. Anotado.",
    chatter: [
      "Cortá bajo si vas a cerrar.",
      "El 7 de oros pesa más de lo que parece.",
      "Escalera sí, trío también. Ambas mejor.",
      "Ojo con lo que descartás, señor.",
      "Cien puntos y afuera. No hay revancha.",
    ],
  },
  truco: {
    npc: "eulalia",
    greet: "¿Truco o café? Elegí antes de sentarte.",
    win: "Envido bien cantado. Otra mano.",
    loss: "Me cantaste falta y perdiste. Clásico.",
    chatter: [
      "Envido primero. Truco después.",
      "El as de espadas mira, no habla.",
      "Mentir se paga. A veces conviene.",
      "Quiero. Y subo, si me dejás.",
      "Retrucá con la mano, no con la boca.",
    ],
  },
  mahjong: {
    npc: "lin",
    greet: "Cierre la puerta. Las fichas son sensibles al aire.",
    win: "Buena mano. Silencio otra vez.",
    loss: "Faltó paciencia. La ficha lo sabía.",
    chatter: [
      "La muralla no se apura.",
      "Chi, pon, kan — sepa cuándo.",
      "El descarte de otro es su regalo.",
      "Cuatro juegos y un par. Nada más.",
      "Silencio. Pensá dos fichas adelante.",
    ],
  },
  escoba: {
    npc: "bettie",
    greet: "Bettie, servidora. Escoba de quince: barré la mesa y no dejés migas.",
    win: "Bien contado, señor. Otra mano.",
    loss: "Setenta y velo pa' la casa. Repartí de nuevo.",
    chatter: [
      "Quince exacto o pasás de largo.",
      "El 7 de oros vale una mano entera.",
      "Setenta cuenta si tenés los cuatro palos.",
      "Barrer la mesa suma escoba, no lo olvide.",
      "Contá los oros. Siempre.",
    ],
  },
  dados: {
    npc: "zelda",
    greet: "Los huesos hablan claro. Aprendé a escuchar.",
    win: "Los dados te querían hoy.",
    loss: "Los dados no mienten, cariño.",
    chatter: [
      "Guardá los ases. Tirá el resto.",
      "Servida de cinco huesos, milagro puro.",
      "Escalera antes que full. Siempre.",
      "Tres tiros. Ni uno más, cariño.",
      "El cubilete pesa cuando dudás.",
    ],
  },
  ruleta: {
    npc: "clara",
    greet: "Rojo o negro. Adentro o afuera. Rápido.",
    win: "Cobrá y andate antes de arruinarlo.",
    loss: "La casa siempre gana, amor.",
    chatter: [
      "El cero se lleva todo, amor.",
      "Docenas pagan feo pero pagan seguido.",
      "Rojo caliente, negro paciente.",
      "La bola no tiene memoria. Vos sí.",
      "Cobrá temprano, cobrá siempre.",
    ],
  },
  slots: {
    npc: "salome",
    greet: "Palanca, humo y milagro. En ese orden.",
    win: "¡Tres iguales! Invitá una ronda.",
    loss: "Otra moneda. Va a caer.",
    chatter: [
      "Tirá parejo. Los rodillos escuchan.",
      "El jackpot es un rumor. Hasta que no.",
      "Cerezas pagan poco, pero pagan.",
      "Una moneda más. Sólo una.",
      "El sonido es parte del truco.",
    ],
  },
  bagatelle: {
    npc: "lola",
    greet: "Bola contra clavo. Elegí el ángulo.",
    win: "¡Ay, ese rebote! Suerte tenés.",
    loss: "El clavo del centro es traidor.",
    chatter: [
      "El ángulo hace la diferencia.",
      "No tires fuerte. Tirá justo.",
      "El clavo del medio es un mentiroso.",
      "Rebote doble vale más que un tiro limpio.",
      "La bola busca el pozo. Ayudala.",
    ],
  },
  solitario: {
    npc: "jade",
    greet: "A solas con el mazo. Como debe ser.",
    win: "Salió. Repartí de nuevo.",
    loss: "Otra mano. El mazo no se cansa.",
    chatter: [
      "Sacá los ases apenas aparezcan.",
      "No muevas por mover. Pensá dos.",
      "El rey manda. La reina también.",
      "Cartas negras sobre rojas. Y viceversa.",
      "El mazo se cansa menos que vos.",
    ],
  },
};

export const SINGLE_HOSTESS: Record<string, SingleHostess> = Object.fromEntries(
  Object.entries(RAW).map(([gameId, r]) => {
    const def = NPCS[r.npc];
    return [
      gameId,
      {
        npcId: r.npc,
        name: def?.name ?? r.npc,
        nickname: def?.nickname,
        portrait: portraitFor(r.npc),
        greet: r.greet,
        win: r.win,
        loss: r.loss,
        chatter: r.chatter ?? [r.greet],
      },
    ];
  }),
);

export function hostessForGame(gameId: string): SingleHostess | null {
  return SINGLE_HOSTESS[gameId] ?? null;
}

export function allSingleHostesses(): Array<{ gameId: string; hostess: SingleHostess }> {
  return Object.entries(SINGLE_HOSTESS).map(([gameId, hostess]) => ({ gameId, hostess }));
}
