const NOTES_BY_ROOM: Record<string, string[]> = {
  "/ruleta": [
    "«Anoche cayó el 17 tres veces. Luciera todavía no lo explica.»",
    "«El croupier nuevo se equivoca a propósito con los rusos. Cuidado.»",
    "«Alguien juró que la rueda cojea al este. Nadie lo confirma.»",
  ],
  "/tables": [
    "«Black Bettie reparte con la izquierda hoy. Está enfadada.»",
    "«Prohibido contar cartas en voz alta. Ya nos avisaron.»",
  ],
  "/bar": [
    "«Perla probó un ron nuevo. Dice que raspa como debe raspar.»",
    "«Se acabó el hielo del norte. Pedí lo que quieras tibio.»",
    "«Hoy la propina se comparte con la lavandería. No preguntes.»",
  ],
  "/salon": [
    "«Corvina bajó al salón anoche. No dijo palabra. Solo miró.»",
    "«El pianista del cuarteto tiene la mano vendada. Nadie pregunta.»",
    "«Alguien dejó una pluma negra en el sillón verde.»",
  ],
  "/mentirosos": [
    "«Alice perdió tres cubiletes seguidos ayer. Vendrá afilada.»",
    "«Regla nueva: si dudás y acertás, la fichería te aplaude.»",
  ],
  "/musica": [
    "«Celeste canta esta noche “Corazón de Puerto”. Traigan pañuelo.»",
    "«El cuarteto ensayó un tango nuevo. Sin nombre todavía.»",
  ],
  "/despacho": [
    "«La quiniela cierra a la medianoche. Corvina no espera.»",
    "«Hay un sobre para vos en el cajón izquierdo. Si te animás.»",
  ],
  "/camerinos": [
    "«Daphne perdió una pulsera. Recompensa: un beso en la mejilla.»",
    "«Se planchan corsés hasta las cinco. Después, chismes libres.»",
  ],
  "/copa": [
    "«El Comodoro pidió su copa siempre a la derecha. Respetá.»",
    "«Corvina eligió las copas nuevas. Cinco son iguales. Una arde.»",
  ],
  "/truco": [
    "«Eulalia canta flor sin mirar. Que no te vea temblar.»",
    "«El sótano huele a puerto anoche. Trajeron pescado fresco.»",
  ],

  "/exterior": [
    "«La luna anda alta. Renata reservó tres mesas al balcón.»",
    "«El bote llegó tarde. Se quedaron sin cigarros hasta el jueves.»",
  ],
};

const FALLBACK = [
  "«Todo tranquilo. Demasiado tranquilo.»",
  "«Hay olor a lluvia en el pasillo. Nadie mira arriba.»",
  "«Corvina anda de buen humor. Aprovechá.»",
];

export function getRoomNote(route: string, now: Date = new Date()): string | null {
  const pool = NOTES_BY_ROOM[route] ?? FALLBACK;
  if (pool.length === 0) return null;

  const dayIndex = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  let hash = 0;
  for (let i = 0; i < route.length; i++) hash = (hash * 31 + route.charCodeAt(i)) | 0;
  const idx = Math.abs(dayIndex + hash) % pool.length;
  return pool[idx];
}
