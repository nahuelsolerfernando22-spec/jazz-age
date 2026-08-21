import type { PortraitState } from "./npc-portrait-states";

type EmotionKey = "idle" | "happy" | "win" | "lose" | "angry" | "thinking";

function normalizeState(state: PortraitState): EmotionKey {
  switch (state) {
    case "smile":
      return "happy";
    case "sad":
    case "shocked":
      return "lose";
    case "idle":
    case "happy":
    case "win":
    case "lose":
    case "angry":
    case "thinking":
      return state;
    default:
      return "idle";
  }
}

type Pack = Record<EmotionKey, string[]>;

const LINES: Record<string, Pack> = {
  clara: {
    idle: ["La rueda no descansa, {alias}.", "El rojo y el negro esperan tu voz."],
    happy: ["Me gusta cómo te sienta la suerte, {alias}.", "Seguí así y bailamos."],
    win: ["¡Vas leyendo la rueda, {alias}!", "Otra como esa y me llevás al camarín."],
    lose: ["La banca cobra, {alias}. Así es la casa.", "No mires la ficha caer, dolía más."],
    angry: ["Basta de tironear a la fortuna, {alias}.", "Me estás gastando la sonrisa."],
    thinking: ["Elegí número, no me hagas esperar.", "Pensá rápido, la bola no perdona."],
  },
  salome: {
    idle: ["Las luces te esperan, {alias}.", "Poné una moneda, contame un secreto."],
    happy: ["Sonaste a campanas, {alias}.", "La velada te sonríe."],
    win: ["¡Jackpot, corazón! Bailá conmigo.", "Sabía que hoy venías con estrella."],
    lose: ["Se apagó la línea, {alias}. Otra tirada.", "Nada, ni una cereza. Respirá."],
    angry: ["No golpees la máquina, {alias}. Se ofende.", "Tratala bien o te corto la luz."],
    thinking: ["¿Vas o no vas? La palanca no muerde.", "Decidite, la noche es corta."],
  },
  lin: {
    idle: ["El bambú cae parejo, {alias}.", "Mirá el patrón antes de tocar."],
    happy: ["Buen ojo, {alias}. Muy buen ojo.", "Así se lee el tablero."],
    win: ["Barriste el muro, {alias}. Impecable.", "El dragón te sonríe hoy."],
    lose: ["Se cerró el camino, {alias}. Otra vez será.", "Faltó una ficha, faltó todo."],
    angry: ["Estás rompiendo el ritmo, {alias}.", "No manotees el muro, se siente."],
    thinking: ["Contá antes de tocar, {alias}.", "Cada pieza tiene su hora."],
  },
  shauna: {
    idle: ["Sentate y mostrame los ojos, {alias}.", "La mesa está fría, calentala."],
    happy: ["Me gusta cómo apostás hoy, {alias}.", "Esa mano tiene aire de las mías."],
    win: ["Te llevaste el pozo, {alias}. Bien jugado.", "Se te ve el colmillo, me encanta."],
    lose: ["River sin piedad, {alias}. Levantate.", "Perdiste la mano y la cara."],
    angry: ["No me tilteés en mi mesa, {alias}.", "Otra pavada y te saco del pozo."],
    thinking: ["El tiempo corre, {alias}. Call o fold.", "Pensá bien, no te la regalo."],
  },
  eulalia: {
    idle: ["Sentate al fogón, {alias}. Truco es paciencia.", "Barajo yo, mirá el pique."],
    happy: ["Me gusta cómo cantás, {alias}.", "Sos de los que saben esperar."],
    win: ["¡Vale cuatro y mío, {alias}!", "Bien parado el envido, gaucho."],
    lose: ["Se te fue la mano, {alias}. Aguantá la mueca.", "Cantaste antes de tiempo."],
    angry: ["No me mientas en la cara, {alias}.", "Un truco más así y te bajo del caballo."],
    thinking: ["Pensalo, pero no me duermas la mesa.", "¿Vas o te achicás, {alias}?"],
  },
  luisa: {
    idle: ["Bajá cuando quieras, {alias}.", "La baraja pide manos firmes."],
    happy: ["Buena escala, {alias}. Se ve el oficio.", "Me hacés reír con esas jugadas."],
    win: ["¡Chinchón limpio, {alias}!", "Cerraste redondo. Aplaudo."],
    lose: ["Te quedaste con la mano llena, {alias}.", "Menos siete, mala noche."],
    angry: ["No me revuelvas el mazo, {alias}.", "Ordená la mano y respetá el turno."],
    thinking: ["Tirá una carta, no la beses.", "Contá los puntos, después decidís."],
  },
  jade: {
    idle: ["Ordená el mazo, {alias}. Yo miro.", "Cada carta en su lugar."],
    happy: ["Ese solitario te queda bien, {alias}.", "Vas fluyendo, me gusta."],
    win: ["Torres al rey, {alias}. Precioso.", "Cerraste el juego sin transpirar."],
    lose: [
      "Se te trabó el mazo, {alias}. Barajá de nuevo.",
      "No salieron los ases, no fue tu culpa.",
    ],
    angry: ["No golpees la mesa, {alias}. Molesta.", "Un poco de calma, no es guerra."],
    thinking: ["Mirá dos jugadas adelante, {alias}.", "Tomate tu tiempo, yo tengo el mío."],
  },
  vita: {
    idle: ["Cortá vos, {alias}. Confío… un poco.", "Blackjack es cabeza, no corazón."],
    happy: ["Cartas frescas, {alias}. Bien.", "Me gusta cómo pedís hoy."],
    win: ["¡Veintiuno, {alias}! Cuchillo al aire.", "Te llevaste la mano de la casa."],
    lose: ["Bust, {alias}. Te pasaste de goloso.", "La casa cobra sin pestañear."],
    angry: ["No me discutas la carta, {alias}.", "Otra insolencia y te cierro la mesa."],
    thinking: ["Hit o stand, {alias}. Sin drama.", "Contá bien, no me hagas contar por vos."],
  },
  zelda: {
    idle: ["Sacudí el cubilete, {alias}.", "Los dados dicen la verdad."],
    happy: ["Ese tiro tuvo cadera, {alias}.", "Me gustó cómo cayeron."],
    win: ["¡Generala servida, {alias}!", "Los dados te bendicen hoy."],
    lose: ["Nada. Ni un par, {alias}.", "Se te enfriaron los huesos."],
    angry: [
      "No pateés la mesa, {alias}. Los dados escuchan.",
      "Otra rabieta y me llevo el cubilete.",
    ],
    thinking: ["Elegí bien qué anotás, {alias}.", "Un dado mal usado y se acabó."],
  },
  opal: {
    idle: ["Mirá la grilla, {alias}. Todo está ahí.", "El nueve no se esconde: se olvida."],
    happy: ["Buen razonamiento, {alias}.", "Vas fina hoy, me gusta."],
    win: ["Grilla cerrada, {alias}. Elegante.", "Ni un lápiz de más. Impecable."],
    lose: ["Un número mal puesto arruina todo, {alias}.", "Te ganó la prisa, no el mazo."],
    angry: ["No borres con furia, {alias}. Pensá.", "Otra tachadura así y te saco la goma."],
    thinking: ["Contá candidatos antes de tocar.", "El casillero espera, {alias}."],
  },
  bettie: {
    idle: ["Bienvenido a la barra, {alias}.", "La casa te mira, no te apures."],
    happy: ["Buena entrada, {alias}. Seguí así.", "Me caés bien esta noche."],
    win: ["Te llevaste una, {alias}. Bien.", "La casa aplaude, raro."],
    lose: ["La casa cobra, {alias}. Siempre.", "Perdiste sin escándalo, gracias."],
    angry: ["No me alces la voz, {alias}.", "Un paso más y te acompaño a la puerta."],
    thinking: ["Decidí, {alias}. No pago los silencios.", "La barra no espera a nadie."],
  },
  lola: {
    idle: ["Empujá la bola, {alias}.", "Bagatelle es pulso, no fuerza."],
    happy: ["Buen empuje, {alias}. Bonito.", "Se te da la muñeca hoy."],
    win: ["¡Al hoyo dorado, {alias}!", "La suerte te besó la mano."],
    lose: ["Se fue afuera, {alias}. Otra vez.", "Ni un rebote a favor, mala racha."],
    angry: ["No sacudas la mesa, {alias}. La ofendés.", "Bajá los humos o te cambio de mesa."],
    thinking: ["Apuntá con calma, no con miedo.", "La bola espera tu decisión, {alias}."],
  },
};

const GENERIC: Pack = {
  idle: ["Estoy acá, {alias}. No me hagas esperar."],
  happy: ["Me gusta cómo va la mano, {alias}."],
  win: ["Bien jugado, {alias}."],
  lose: ["Mala, {alias}. Reponete."],
  angry: ["Cuidado con los modos, {alias}."],
  thinking: ["Decidí, {alias}. El tiempo corre."],
};

export function pickEmotionLine(npcId: string, state: PortraitState, seed = 0): string | null {
  const pack = LINES[npcId] ?? GENERIC;
  const key = normalizeState(state);
  const pool = pack[key] ?? GENERIC[key];
  if (!pool || pool.length === 0) return null;
  const idx = Math.abs(seed) % pool.length;
  return pool[idx] ?? pool[0];
}

export function hasEmotionPack(npcId: string): boolean {
  return npcId in LINES;
}

export const EMOTION_LINE_IDS = Object.keys(LINES);
