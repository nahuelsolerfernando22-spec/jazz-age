export interface WeeklyEvent {
  id: string;
  npc: string;
  room: string;
  route: string;
  title: string;
  modifier: string;
  goal: string;
  rewardLine: string;
}

const POOL: WeeklyEvent[] = [
  {
    id: "vita-solitario",
    npc: "Vita la Cuchillas",
    room: "Solitario del Cuervo",
    route: "/solitario",
    title: "Mano firme",
    modifier: "Vita marca el tiempo con la navaja. Ganás más rápido o no ganás.",
    goal: "Cerrá tres deals diarias antes del domingo.",
    rewardLine: "Vita te regala una baraja marcada (de adorno).",
  },
  {
    id: "clara-ruleta",
    npc: "Clara",
    room: "La Rueda de la Fortuna",
    route: "/ruleta",
    title: "Plenos a ciegas",
    modifier: "Clara no canta el número hasta que la bola para. El silencio paga.",
    goal: "Embocá dos plenos consecutivos.",
    rewardLine: "Clara te guarda la silla de la izquierda toda la noche.",
  },
  {
    id: "jade-mahjong",
    npc: "Jade Ojo de Dragón",
    room: "El Dragón de Marfil",
    route: "/mahjong",
    title: "Ojo limpio",
    modifier: "Jade no acepta ayuda. Sin pistas, sin barajeo extra.",
    goal: "Limpiá un tablero sin usar pista.",
    rewardLine: "Jade te enseña un agarre nuevo de fichas.",
  },
  {
    id: "lola-bagatelle",
    npc: "Lola la Suerte",
    room: "El Tablero de Clavos",
    route: "/bagatelle",
    title: "Bola limpia",
    modifier: "Lola cambió los bumpers. Hoy los carriles laterales pagan más.",
    goal: "Sumá 5.000 puntos en una bola.",
    rewardLine: "Lola te firma la palanca.",
  },
  {
    id: "zelda-dados",
    npc: "Zelda la Adivina",
    room: "El Cubilete de Zelda",
    route: "/dados",
    title: "Servida al primer tiro",
    modifier: "Zelda lee la primera tirada. Las servidas pagan doble esta semana.",
    goal: "Cerrá un contrato servido en Cinco Huesos.",
    rewardLine: "Zelda te tira las cartas gratis el domingo.",
  },
  {
    id: "bettie-escoba",
    npc: "Black Bettie",
    room: "Escoba de 15",
    route: "/escoba",
    title: "Barrida limpia",
    modifier: "Bettie deja la mesa impecable. Escobas encadenadas cuentan doble.",
    goal: "Hacé dos escobas en la misma partida.",
    rewardLine: "Bettie te presta su mazo marcado sin cobrar propina.",
  },
  {
    id: "eulalia-truco",
    npc: "Eulalia",
    room: "El Cuarto del Truco",
    route: "/truco",
    title: "Envido a la vieja",
    modifier: "Eulalia canta primero. Envidos aceptados suman doble prestigio.",
    goal: "Ganá tres envidos en la misma partida.",
    rewardLine: "Eulalia te suelta una anécdota de la vieja escuela.",
  },
  {
    id: "clara-docenas",
    npc: "Clara",
    room: "El Cero de la Ruleta",
    route: "/ruleta",
    title: "Docenas rebeldes",
    modifier: "Clara apuesta por docenas. Aciertos consecutivos pagan más.",
    goal: "Clavá tres docenas seguidas.",
    rewardLine: "Clara te regala una ficha de la casa.",
  },
];

function isoWeek(d: Date): { year: number; week: number } {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const weekDiff = (target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000);
  return { year: target.getUTCFullYear(), week: 1 + Math.round(weekDiff) };
}

export function currentWeeklyEvent(now: Date = new Date()): WeeklyEvent {
  const { year, week } = isoWeek(now);
  const seed = year * 100 + week;
  return POOL[seed % POOL.length];
}

export function weekKey(now: Date = new Date()): string {
  const { year, week } = isoWeek(now);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
