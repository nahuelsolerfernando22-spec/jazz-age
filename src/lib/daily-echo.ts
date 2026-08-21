import { hashSeed, mulberry32, rngShuffle, todayKey } from "./rng";
import { SINGLE_GAMES } from "./single-games";

/**
 * Retos del día ("Ecos del cuervo").
 *
 * Regla de oro: TODO reto tiene que ser medible con señales que la app ya
 * emite (partidas jugadas, partidas ganadas, legajos de encargos cerrados).
 * Nada de objetivos decorativos que nunca se pueden completar.
 */
export type EchoKind = "plays" | "wins" | "encargo";

export interface EchoChallenge {
  id: string;
  /** id de SINGLE_GAMES (coincide con la clave de encargos salvo mahjong). */
  gameId: string;
  gameName: string;
  kind: EchoKind;
  target: number;
  title: string;
  description: string;
  hint?: string;
  /** Fichas que paga Corvina al cerrarlo. */
  reward: number;
  /** Favores que suma al fichero. */
  favors: number;
  route: string;
}

/** Mesas con legajos en la oficina de Corvina (ver encargos-config). */
export const ENCARGO_KEYS = [
  "ruleta",
  "blackjack",
  "dados",
  "escoba",
  "bagatelle",
  "solitario",
  "chinchon",
  "truco",
] as const;

const REWARD: Record<EchoKind, { chips: number; favors: number }> = {
  plays: { chips: 120, favors: 1 },
  wins: { chips: 200, favors: 2 },
  encargo: { chips: 260, favors: 3 },
};

function build(
  kind: EchoKind,
  game: { id: string; name: string; to: string },
  target: number,
  date: string,
  idx: number,
): EchoChallenge {
  const base = { id: `${date}:${idx}`, gameId: game.id, gameName: game.name, route: game.to };
  const pay = REWARD[kind];
  if (kind === "plays") {
    return {
      ...base,
      kind,
      target,
      title: `${game.name} — ${target} manos`,
      description: `Sentate a la mesa y jugá ${target} ${target === 1 ? "mano" : "manos"}.`,
      hint: "Corvina cuenta las manos terminadas, ganes o pierdas.",
      ...pay,
      reward: pay.chips,
    };
  }
  if (kind === "wins") {
    return {
      ...base,
      kind,
      target,
      title: `${game.name} — ${target} ${target === 1 ? "victoria" : "victorias"}`,
      description: `Ganale a la casa ${target} ${target === 1 ? "vez" : "veces"}.`,
      ...pay,
      reward: pay.chips,
    };
  }
  return {
    ...base,
    kind,
    target,
    route: "/encargos",
    title: `${game.name} — cerrar legajo`,
    description: `Firmá y cerrá un encargo de ${game.name} en la oficina.`,
    hint: "Vale cualquier legajo de esa mesa con al menos una estrella.",
    ...pay,
    reward: pay.chips,
  };
}

export function generateDailyEcho(date: string = todayKey()): EchoChallenge[] {
  const rng = mulberry32(hashSeed(`daily-echo:${date}`));
  const games = rngShuffle(rng, SINGLE_GAMES);

  const out: EchoChallenge[] = [];
  const used = new Set<string>();

  // 1) Un reto de "jugar" en cualquier mesa.
  const g1 = games.find((g) => !used.has(g.id));
  if (g1) {
    used.add(g1.id);
    out.push(build("plays", g1, 2 + Math.floor(rng() * 2), date, out.length));
  }

  // 2) Un reto de "ganar" en una mesa con rival (némesis).
  const g2 = games.find((g) => !used.has(g.id) && g.hasNemesis);
  if (g2) {
    used.add(g2.id);
    out.push(build("wins", g2, 1, date, out.length));
  }

  // 3) Un legajo de encargos, para que el día empuje a la oficina.
  const g3 = games.find(
    (g) => !used.has(g.id) && (ENCARGO_KEYS as readonly string[]).includes(g.id),
  );
  if (g3) {
    used.add(g3.id);
    out.push(build("encargo", g3, 1, date, out.length));
  }

  return out;
}

export const DAILY_ECHO_BONUS = 500;
