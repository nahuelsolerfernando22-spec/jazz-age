// Rutas reales de la app (única fuente para las suites E2E).
// Si se agrega o quita una pantalla, se actualiza acá y todas las auditorías
// la toman: así no quedan specs apuntando a rutas viejas.

/** Los 12 juegos jugables. */
export const GAME_ROUTES = [
  "/truco",
  "/chinchon",
  "/escoba",
  "/blackjack",
  "/poker",
  "/ruleta",
  "/dados",
  "/slots",
  "/solitario",
  "/sudoku",
  "/mahjong",
  "/bagatelle",
] as const;

/** Pantallas de navegación, progresión y ajustes. */
export const SHELL_ROUTES = [
  "/",
  "/single",
  "/tables",
  "/encargos",
  "/progreso",
  "/logros",
  "/estadisticas",
  "/diario",
  "/dificultad",
  "/reglas",
  "/ajustes",
  "/privacidad",
] as const;

export const ALL_ROUTES = [...SHELL_ROUTES, ...GAME_ROUTES] as const;

/** Nombre legible para reportes. */
export function routeLabel(route: string): string {
  if (route === "/") return "Vestíbulo";
  return route.replace("/", "").replace(/-/g, " ");
}
