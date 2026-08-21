/**
 * CINCO HUESOS — dados + cartas.
 *
 * El motor de Generala (5 dados, 3 tiros, apartar) se mantiene, pero la
 * planilla fija de 10 casilleros desaparece: cada noche se reparten seis
 * CONTRATOS boca arriba sobre el paño y los dos jugadores compiten por
 * cerrarlos. El que llega primero se lo lleva; el resto se queda sin nada.
 * Encima corren las CARTAS DE FAVOR: tres en mano, un solo uso cada una,
 * que rompen las reglas del turno.
 */

export type ContractTier = "menor" | "mayor" | "leyenda";

export interface Contract {
  id: string;
  title: string;
  hint: string;
  tier: ContractTier;
  /** Pago base al cerrarlo. */
  pay: number;
  /** Pago si se cierra en el primer tiro (servida). */
  payServida: number;
  /** true si los cinco dados cumplen el contrato. */
  test: (dice: number[]) => boolean;
}

function counts(dice: number[]): number[] {
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (const v of dice) c[v]++;
  return c;
}
const sum = (d: number[]) => d.reduce((a, b) => a + b, 0);
const maxRun = (d: number[]) => Math.max(...counts(d).slice(1));

export const CONTRACT_DECK: Contract[] = [
  {
    id: "cuenta_chica",
    title: "Cuenta Chica",
    hint: "Los cinco dados suman 16 o menos",
    tier: "menor",
    pay: 18,
    payServida: 24,
    test: (d) => sum(d) <= 16,
  },
  {
    id: "cuenta_grande",
    title: "Cuenta Grande",
    hint: "Los cinco dados suman 23 o más",
    tier: "menor",
    pay: 18,
    payServida: 24,
    test: (d) => sum(d) >= 23,
  },
  {
    id: "escalera_menor",
    title: "Escalera Menor",
    hint: "Cuatro números seguidos (1-2-3-4, 2-3-4-5, 3-4-5-6)",
    tier: "menor",
    pay: 20,
    payServida: 28,
    test: (d) => {
      const s = new Set(d);
      return (
        [1, 2, 3, 4].every((f) => s.has(f)) ||
        [2, 3, 4, 5].every((f) => s.has(f)) ||
        [3, 4, 5, 6].every((f) => s.has(f))
      );
    },
  },

  {
    id: "mano_sucia",
    title: "Mano Sucia",
    hint: "Un par y al menos un seis",
    tier: "menor",
    pay: 14,
    payServida: 18,
    test: (d) => counts(d).some((n) => n >= 2) && d.includes(6),
  },
  {
    id: "trago_corto",
    title: "Trago Corto",
    hint: "Tres dados de 3 o menos",
    tier: "menor",
    pay: 14,
    payServida: 18,
    test: (d) => d.filter((v) => v <= 3).length >= 3,
  },
  {
    id: "todo_impar",
    title: "Noche Impar",
    hint: "Los cinco dados salen impares",
    tier: "menor",
    pay: 20,
    payServida: 28,
    test: (d) => d.every((v) => v % 2 === 1),
  },
  {
    id: "todo_par",
    title: "Cuentas Pares",
    hint: "Los cinco dados salen pares",
    tier: "menor",
    pay: 20,
    payServida: 28,
    test: (d) => d.every((v) => v % 2 === 0),
  },
  {
    id: "dos_pares",
    title: "Dos Pares Negros",
    hint: "Dos pares distintos sobre el paño",
    tier: "menor",
    pay: 16,
    payServida: 22,
    test: (d) => counts(d).filter((n) => n >= 2).length >= 2,
  },
  {
    id: "trio",
    title: "Trío del Sótano",
    hint: "Tres dados iguales",
    tier: "menor",
    pay: 20,
    payServida: 26,
    test: (d) => maxRun(d) >= 3,
  },
  {
    id: "seis_sucios",
    title: "Seises Sucios",
    hint: "Al menos tres seises",
    tier: "mayor",
    pay: 26,
    payServida: 34,
    test: (d) => counts(d)[6] >= 3,
  },
  {
    id: "mano_cuervo",
    title: "La Mano del Cuervo",
    hint: "Los dados suman exactamente 21",
    tier: "mayor",
    pay: 30,
    payServida: 40,
    test: (d) => sum(d) === 21,
  },
  {
    id: "escalera",
    title: "Escalera del Fondo",
    hint: "1-2-3-4-5 o 2-3-4-5-6",
    tier: "mayor",
    pay: 28,
    payServida: 38,
    test: (d) => {
      const s = new Set(d);
      return [1, 2, 3, 4, 5].every((f) => s.has(f)) || [2, 3, 4, 5, 6].every((f) => s.has(f));
    },
  },
  {
    id: "full",
    title: "Full de Corvina",
    hint: "Trío + par",
    tier: "mayor",
    pay: 32,
    payServida: 42,
    test: (d) => {
      const c = counts(d);
      return (c.some((n) => n === 3) && c.some((n) => n === 2)) || c.some((n) => n === 5);
    },
  },
  {
    id: "poker",
    title: "Póker de Huesos",
    hint: "Cuatro dados iguales",
    tier: "mayor",
    pay: 42,
    payServida: 56,
    test: (d) => maxRun(d) >= 4,
  },
  {
    id: "reloj_parado",
    title: "El Reloj Parado",
    hint: "Los cinco dados suman exactamente 12",
    tier: "menor",
    pay: 22,
    payServida: 30,
    test: (d) => sum(d) === 12,
  },
  {
    id: "cinco_huesos",
    title: "Cinco Huesos",
    hint: "Los cinco dados iguales",
    tier: "leyenda",
    pay: 70,
    payServida: 120,
    test: (d) => maxRun(d) === 5,
  },
  {
    id: "doble_luto",
    title: "Doble Luto",
    hint: "Tres ases y dos seises sobre el paño",
    tier: "leyenda",
    pay: 64,
    payServida: 100,
    test: (d) => {
      const c = counts(d);
      return c[1] >= 3 && c[6] >= 2;
    },
  },



  {
    id: "cuervo_negro",
    title: "El Cuervo Negro",
    hint: "Cuatro iguales y el quinto un 1",
    tier: "leyenda",
    pay: 60,
    payServida: 95,
    test: (d) => {
      const c = counts(d);
      return c.some((n, f) => f !== 1 && n === 4) && c[1] === 1;
    },
  },
];

export function contractById(id: string): Contract {
  const c = CONTRACT_DECK.find((x) => x.id === id);
  if (!c) throw new Error(`Contrato desconocido: ${id}`);
  return c;
}

/** Puntaje de un contrato con los dados en mesa (0 si no cumple). */
export function contractValue(c: Contract, dice: number[], servida: boolean): number {
  if (!c.test(dice)) return 0;
  return servida ? c.payServida : c.pay;
}

// ---------------------------------------------------------------- favores

export type FavorId =
  | "vuelta_de_mano"
  | "dedo_balanza"
  | "cortar_mazo"
  | "doblar_apuesta"
  | "cobrar_deuda"
  | "ojo_cuervo"
  | "cubilete_plomo";

export interface Favor {
  id: FavorId;
  title: string;
  text: string;
}

export const FAVOR_DECK: Favor[] = [
  {
    id: "vuelta_de_mano",
    title: "Vuelta de Mano",
    text: "Sumá un tiro extra a este turno.",
  },
  {
    id: "dedo_balanza",
    title: "Dedo en la Balanza",
    text: "Girá un dado a la cara que quieras.",
  },
  {
    id: "cortar_mazo",
    title: "Cortar el Mazo",
    text: "Cambiá un contrato libre por otro del mazo.",
  },
  {
    id: "doblar_apuesta",
    title: "Doblar la Apuesta",
    text: "El próximo contrato que cierres paga doble (hasta 30 fichas de más).",
  },
  {
    id: "cobrar_deuda",
    title: "Cobrar Deuda",
    text: "Robá el último contrato que cerró la rival, pero paga la mitad.",
  },
  {
    id: "ojo_cuervo",
    title: "Ojo del Cuervo",
    text: "Ves el contrato que la rival intentará cerrar este turno.",
  },
  {
    id: "cubilete_plomo",
    title: "Cubilete de Plomo",
    text: "En el próximo tiro de la rival, sus dados no pueden pasar de 4.",
  },
];

export function favorById(id: FavorId): Favor {
  const f = FAVOR_DECK.find((x) => x.id === id);
  if (!f) throw new Error(`Favor desconocido: ${id}`);
  return f;
}

// ------------------------------------------------------------------ mesa

export interface TableContract {
  id: string;
  /** null = libre; player/rival = cerrado; burned = quemado. */
  owner: "player" | "rival" | "burned" | null;
  value: number;
  /** true si se cerró en el primer tiro. */
  servida?: boolean;
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface HuesosDeal {
  table: TableContract[];
  /** Contratos que quedan en el mazo para "Cortar el Mazo". */
  reserve: string[];
  hand: FavorId[];
  /** Favores en poder de la anfitriona (la IA también juega sucio). */
  rivalHand: FavorId[];
}

/** Favores que la IA sabe usar (no puede "cortar el mazo": es cosa del jugador). */
export const RIVAL_FAVORS: FavorId[] = [
  "vuelta_de_mano",
  "dedo_balanza",
  "doblar_apuesta",
  "cobrar_deuda",
];

/** Reparte la noche: contratos boca arriba + 3 favores en mano. */
export function dealNight(tableSize = 6, rnd: () => number = Math.random): HuesosDeal {
  // Mezcla dirigida: siempre una leyenda y al menos dos menores
  const legends = shuffle(
    CONTRACT_DECK.filter((c) => c.tier === "leyenda"),
    rnd,
  ).slice(0, 1);
  const minors = shuffle(
    CONTRACT_DECK.filter((c) => c.tier === "menor"),
    rnd,
  );
  const majors = shuffle(
    CONTRACT_DECK.filter((c) => c.tier === "mayor"),
    rnd,
  );

  const picked = [
    ...legends,
    ...minors.slice(0, 3),
    ...majors.slice(0, Math.max(0, tableSize - 4)),
  ];

  const table = shuffle(picked, rnd)
    .slice(0, tableSize)
    .map((c) => ({ id: c.id, owner: null, value: 0 }) as TableContract);
  const used = new Set(table.map((t) => t.id));
  const reserve = shuffle(
    CONTRACT_DECK.filter((c) => !used.has(c.id)).map((c) => c.id),
    rnd,
  );
  const hand = shuffle(
    FAVOR_DECK.map((f) => f.id),
    rnd,
  ).slice(0, 3);
  const rivalHand = shuffle(RIVAL_FAVORS, rnd).slice(0, 2);
  return { table, reserve, hand, rivalHand };
}

export function tableTotals(table: TableContract[]): { player: number; rival: number } {
  let player = 0;
  let rival = 0;
  for (const t of table) {
    if (t.owner === "player") player += t.value;
    else if (t.owner === "rival") rival += t.value;
  }
  return { player, rival };
}

export function openContracts(table: TableContract[]): TableContract[] {
  return table.filter((t) => t.owner === null);
}

export function nightOver(table: TableContract[]): boolean {
  return openContracts(table).length === 0;
}

// -------------------------------------------------------------------- IA

export type HuesosSkill = "rookie" | "normal" | "sharp";

export interface RivalTurn {
  dice: number[];
  /** Contrato cerrado, o null si tuvo que quemar. */
  claimed: string | null;
  burned: string | null;
  value: number;
  servida: boolean;
  /** Contrato al que le apuntó durante los tiros (para el HUD). */
  target: string | null;
  /** Favor que gastó este turno, si gastó alguno. */
  favorUsed: FavorId | null;
  /** Contrato robado al jugador con "Cobrar Deuda". */
  stolen: string | null;
  /** Intención del rival (revelada por Ojo del Cuervo). */
  intent?: string | null;
}

function roll5(rnd: () => number, forceHigh = false): number[] {
  return Array.from({ length: 5 }, () => {
    const val = 1 + Math.floor(rnd() * 6);
    if (forceHigh && val < 4) return 4 + Math.floor(rnd() * 3);
    return val;
  });
}

function bestOpen(
  table: TableContract[],
  dice: number[],
  servida: boolean,
): { contract: Contract; value: number } | null {
  let best: { contract: Contract; value: number } | null = null;
  for (const t of openContracts(table)) {
    const c = contractById(t.id);
    const v = contractValue(c, dice, servida);
    if (v > 0 && (!best || v > best.value)) best = { contract: c, value: v };
  }
  return best;
}

/**
 * Evalúa por Monte Carlo qué dados conviene guardar apuntando a los contratos
 * libres. Reemplaza las heurísticas fijas: la rival ahora elige un contrato
 * objetivo real y guarda en función de él.
 */
export function planHold(
  table: TableContract[],
  dice: number[],
  rerollsLeft: number,
  skill: HuesosSkill,
  rnd: () => number = Math.random,
): { mask: boolean[]; target: string | null; ev: number } {
  const open = openContracts(table).map((t) => contractById(t.id));
  if (open.length === 0) return { mask: dice.map(() => true), target: null, ev: 0 };

  const sims = skill === "rookie" ? 24 : skill === "normal" ? 60 : 120;
  let best: { mask: boolean[]; target: string | null; ev: number } | null = null;

  for (let sub = 0; sub < 32; sub++) {
    const mask = [0, 1, 2, 3, 4].map((i) => (sub & (1 << i)) !== 0);
    let total = 0;
    const targetScore = new Map<string, number>();
    for (let s = 0; s < sims; s++) {
      let final = dice;
      let bestV = 0;
      let bestId: string | null = null;
      // Cada tiro es una oportunidad de cerrar: guardamos el mejor valor visto,
      // porque en la mesa uno puede plantarse en cuanto la mano sirve.
      for (let r = 0; r < Math.max(1, rerollsLeft); r++) {
        final = final.map((d, i) => (mask[i] ? d : 1 + Math.floor(rnd() * 6)));
        for (const c of open) {
          const v = contractValue(c, final, false);
          if (v > bestV) {
            bestV = v;
            bestId = c.id;
          }
        }
      }
      total += bestV;
      if (bestId) targetScore.set(bestId, (targetScore.get(bestId) ?? 0) + bestV);
    }
    const ev = total / sims;
    if (!best || ev > best.ev) {
      let target: string | null = null;
      let topScore = 0;
      for (const [id, sc] of targetScore) {
        if (sc > topScore) {
          topScore = sc;
          target = id;
        }
      }
      best = { mask, target, ev };
    }
  }
  return best ?? { mask: dice.map(() => false), target: null, ev: 0 };
}

/** Qué caras conviene guardar apuntando a los contratos libres. */
export function decideHolds(table: TableContract[], dice: number[], skill: HuesosSkill): boolean[] {
  return planHold(table, dice, 1, skill).mask;
}

export interface RivalTurnOptions {
  /** Favores disponibles de la anfitriona. */
  hand?: FavorId[];
  /** Último contrato que cerró el jugador (objetivo de "Cobrar Deuda"). */
  lastPlayerClaim?: string | null;
  /** Presagio activo. */
  presagio?: { caliente?: boolean } | null;
  /** Dados actuales del jugador (para Ojo del Cuervo o Cubilete de Plomo). */
  playerDice?: number[];
  /** Favores jugados por el jugador este turno. */
  favorsUsed?: FavorId[];
  rnd?: () => number;
}

/** Turno completo de la anfitriona sobre la mesa de contratos. */
export function rivalTurn(
  table: TableContract[],
  skill: HuesosSkill = "normal",
  rndOrOpts: (() => number) | RivalTurnOptions = Math.random,
): RivalTurn {
  const opts: RivalTurnOptions =
    typeof rndOrOpts === "function" ? { rnd: rndOrOpts } : (rndOrOpts ?? {});
  const rnd = opts.rnd ?? Math.random;
  // Cuántos favores sabe aprovechar según nivel: la novata ni los mira.
  const favorBudget = skill === "rookie" ? 0 : skill === "normal" ? 1 : 2;
  const hand = new Set((opts.hand ?? []).slice(0, favorBudget));

  // Rumor "Mesa Caliente": aumenta probabilidad de seises/cincos
  const forceHigh = !!opts.presagio?.caliente;
  let dice = roll5(rnd, forceHigh);

  // Cubilete de Plomo: los dados del rival no pasan de 4
  // El plomo sólo recorta las caras altas: un dado bajo se queda como salió.
  const plomo = !!opts.favorsUsed?.includes("cubilete_plomo");
  if (plomo) {
    dice = dice.map((d) => (d > 4 ? 1 + Math.floor(rnd() * 4) : d));
  }

  const first = [...dice];
  let rolls = 1;
  let maxRerolls = skill === "rookie" ? 1 : 2;
  let target: string | null = null;
  let favorUsed: FavorId | null = null;

  /** Cara máxima que puede sacar la rival este turno (el plomo le tapa los seises). */
  const cara = () => (plomo ? 1 + Math.floor(rnd() * 4) : 1 + Math.floor(rnd() * 6));

  const ceiling = Math.max(1, ...openContracts(table).map((t) => contractById(t.id).pay));


  for (let r = 0; r < maxRerolls; r++) {
    const now = bestOpen(table, dice, false);
    if (now && skill === "sharp" && now.value >= ceiling * 0.75) break;
    const plan = planHold(table, dice, maxRerolls - r, skill, rnd);
    target = plan.target ?? target;
    if (plan.mask.every(Boolean)) break;
    // Vuelta de Mano: si el plan pinta bien pero le falta un tiro, lo compra.
    if (
      !favorUsed &&
      hand.has("vuelta_de_mano") &&
      r === maxRerolls - 1 &&
      !bestOpen(table, dice, false) &&
      plan.ev > ceiling * 0.4
    ) {
      favorUsed = "vuelta_de_mano";
      maxRerolls++;
    }
    dice = dice.map((d, i) => (plan.mask[i] ? d : cara()));
    rolls++;
  }

  // Dedo en la Balanza: gira un dado si eso cierra (o mejora) un contrato.
  if (!favorUsed && hand.has("dedo_balanza")) {
    const current = bestOpen(table, dice, false)?.value ?? 0;
    let bestTweak: { dice: number[]; value: number } | null = null;
    for (let i = 0; i < dice.length; i++) {
      for (let face = 1; face <= 6; face++) {
        if (dice[i] === face) continue;
        const trial = dice.map((d, k) => (k === i ? face : d));
        const v = bestOpen(table, trial, false)?.value ?? 0;
        if (v > current && (!bestTweak || v > bestTweak.value))
          bestTweak = { dice: trial, value: v };
      }
    }
    if (bestTweak) {
      dice = bestTweak.dice;
      favorUsed = "dedo_balanza";
    }
  }

  const servida = rolls === 1 && favorUsed === null && !!bestOpen(table, first, true);

  // Ojo del Cuervo: el rival muestra qué contrato intentará cerrar
  const best = bestOpen(table, dice, servida);
  const effectiveTarget = opts.favorsUsed?.includes("ojo_cuervo")
    ? (target ?? best?.contract.id ?? null)
    : null;

  if (best) {
    let value = best.value;
    if (!favorUsed && hand.has("doblar_apuesta") && value >= ceiling * 0.75) {
      value = valorDoblado(value);
      favorUsed = "doblar_apuesta";
    }
    return {
      dice,
      claimed: best.contract.id,
      burned: null,
      value,
      servida,
      target: target ?? best.contract.id,
      favorUsed,
      stolen: null,
      intent: effectiveTarget,
    };
  }

  // Sin contrato: antes de quemar, intenta cobrarle una deuda al jugador.
  if (!favorUsed && hand.has("cobrar_deuda") && opts.lastPlayerClaim) {
    const owned = table.find((t) => t.id === opts.lastPlayerClaim && t.owner === "player");
    if (owned) {
      return {
        dice,
        claimed: null,
        burned: null,
        value: valorRobado(owned.value),
        servida: false,
        target,
        favorUsed: "cobrar_deuda",
        stolen: owned.id,
        intent: effectiveTarget,
      };
    }
  }

  const cheapest = openContracts(table)
    .map((t) => contractById(t.id))
    .sort((a, b) => a.pay - b.pay)[0];
  return {
    dice,
    claimed: null,
    burned: cheapest ? cheapest.id : null,
    value: 0,
    servida: false,
    target,
    favorUsed,
    stolen: null,
    intent: effectiveTarget,
  };
}

export function rollDice(n = 5): number[] {
  return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
}

/** Tope del bono de "Doblar la Apuesta": duplica, pero nunca más de +30. */
export const BONO_DOBLE_MAX = 30;
export function valorDoblado(value: number): number {
  return value + Math.min(value, BONO_DOBLE_MAX);
}
/** "Cobrar Deuda": el contrato robado paga la mitad (redondeo hacia arriba). */
export function valorRobado(value: number): number {
  return Math.ceil(value / 2);
}
