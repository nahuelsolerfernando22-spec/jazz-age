export type LoadingRouteKey =
  | "blackjack"
  | "chinchon"
  | "truco"
  | "mahjong"
  | "escoba"
  | "dados"
  | "ruleta"
  | "bagatelle"
  | "solitario"
  | "single"
  | "anfitrionas"
  | "estadisticas"
  | "tables"
  | "index";

const ROUTE_LINES: Record<LoadingRouteKey, string[]> = {
  blackjack: [
    "Bettie corta el mazo con paciencia.",
    "Veintiuno o nada, encanto — ya te reparto.",
    "La casa mira despacio. Vos también.",
    "Zapato nuevo, cartas frías.",
  ],
  chinchon: [
    "Luisa ordena la baraja española por ustéd.",
    "Cien puntos y afuera. Sin revancha.",
    "El siete de oros ya pesa en la mesa.",
    "Cortando el mazo con calma castellana.",
  ],
  truco: [
    "Eulalia sirve el café antes del truco.",
    "Envido primero. Truco después.",
    "El as de espadas ya está mirando.",
    "Preparando la mesa — cantá cuando toque.",
  ],
  mahjong: [
    "Lin acomoda la muralla en silencio.",
    "Chi, pon, kan — sepa esperar.",
    "144 fichas, un solo camino.",
    "El bambú cruje. La mesa respira.",
  ],
  escoba: [
    "Barriendo migas de la mesa anterior.",
    "Quince exacto, o pasás de largo.",
    "Bettie cuenta los oros — siempre los oros.",
    "La escoba se paga en silencio.",
  ],
  dados: [
    "Zelda sacude el cubilete.",
    "Los huesos hablan claro; hay que escuchar.",
    "Tres tiros. Ni uno más, cariño.",
    "La servida de cinco huesos es rumor. Hasta que no.",
  ],
  ruleta: [
    "Clara pule la rueda antes de girar.",
    "Treinta y siete números. Elegí con calma.",
    "Rojo o negro, adentro o afuera — rápido.",
    "La bola no tiene memoria. Vos sí.",
  ],
  bagatelle: [
    "Lola limpia los clavos del tablero.",
    "El clavo del medio es un mentiroso.",
    "Ángulo, rebote, pozo. En ese orden.",
    "La bola busca el fondo — ayudala.",
  ],
  solitario: [
    "Jade ordena las cartas a solas.",
    "El mazo se cansa menos que vos.",
    "Rey sobre negro, reina sobre rojo.",
    "Los ases se sacan apenas asoman.",
  ],
  single: [
    "Encendiendo las luces del salón privado.",
    "Las anfitrionas ya están tomando posición.",
    "El pasillo huele a whisky joven.",
  ],
  anfitrionas: [
    "Las chicas se acomodan el vestido.",
    "Retocando el rouge antes del retrato.",
    "Once anfitrionas — todas listas.",
  ],
  estadisticas: [
    "Contadora repasando la libreta.",
    "Sumando manos, restando decepciones.",
    "Los números no mienten. Casi nunca.",
  ],
  tables: ["Elegí sala — todas están abiertas esta noche.", "El mapa del Cuervo se despliega."],
  index: [
    "Tres golpes a la puerta de acero.",
    "Madame Corvina te reconoce por el paso.",
    "El cuervo dorado se acomoda en la percha.",
  ],
};

const RETRY_LINES: string[] = [
  "Segundo intento — respirá el humo.",
  "Mirla ya limpió el pasillo. Probemos otra vez.",
  "La bandeja se cayó antes. No pasa dos veces.",
  "Retomando donde nos quedamos, encanto.",
  "El telón se enredó. Ya lo desatamos.",
];

export function routeKeyFor(pathname: string | undefined | null): LoadingRouteKey {
  if (!pathname) return "index";
  const seg = pathname.replace(/^\/+/, "").split(/[/?#]/)[0]?.toLowerCase() ?? "";
  if (seg === "" || seg === "index") return "index";
  if ((ROUTE_LINES as Record<string, unknown>)[seg]) return seg as LoadingRouteKey;
  return "single";
}

export function linesForRoute(pathname: string | undefined, hadError: boolean): string[] {
  const key = routeKeyFor(pathname);
  const base = ROUTE_LINES[key] ?? ROUTE_LINES.single;
  if (!hadError) return base;

  const retry = RETRY_LINES[Math.floor(Math.random() * RETRY_LINES.length)];
  return [retry, ...base];
}

let lastErrorPath: string | null = null;
let lastErrorAt = 0;
const ERROR_TTL_MS = 30_000;

export function markRouteError(pathname: string): void {
  lastErrorPath = pathname;
  lastErrorAt = Date.now();
}

export function consumeRouteErrorFlag(pathname: string | undefined): boolean {
  if (!pathname || !lastErrorPath) return false;
  if (Date.now() - lastErrorAt > ERROR_TTL_MS) {
    lastErrorPath = null;
    return false;
  }
  if (lastErrorPath === pathname) {
    return true;
  }
  return false;
}

export function clearRouteError(): void {
  lastErrorPath = null;
  lastErrorAt = 0;
}
