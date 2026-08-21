/**
 * Constantes de tensión casino para Marfil Paciente (mahjong).
 * Mantenidas separadas de use-mahjong-game para no tocar el motor
 * compartido: sólo gobiernan los límites de pistas y reordenes que se
 * aplican desde la pantalla del juego.
 */

/** Pistas manuales disponibles por partida (además de la pista automática por inactividad). */
export const HINT_LIMIT = 3;

/** Usos del botón "Reordenar" (mezcla de fichas) disponibles por partida. */
export const REORDER_LIMIT = 3;

/** Costo en fichas de la casa por cada reorden. */
export const REORDER_CHIP_COST = 40;
