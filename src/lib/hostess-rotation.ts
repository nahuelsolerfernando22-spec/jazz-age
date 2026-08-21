export type BandId = "matinee" | "velada" | "trasnoche";

export interface BandDef {
  id: BandId;
  label: string;
  startHour: number;
  endHour: number;
  blurb: string;
}

export const BANDS: BandDef[] = [
  {
    id: "matinee",
    label: "Matinée",
    startHour: 6,
    endHour: 14,
    blurb: "Las mesas tibias, café y resaca.",
  },
  {
    id: "velada",
    label: "Velada",
    startHour: 14,
    endHour: 22,
    blurb: "El salón se llena, las luces bajan.",
  },
  {
    id: "trasnoche",
    label: "Trasnoche",
    startHour: 22,
    endHour: 30,
    blurb: "Solo los que no saben volver a casa.",
  },
];

export interface RoomRoster {
  room: string;
  roomLabel: string;
  titular: string;
  suplente: string;
  rotate?: boolean;
}

export const ROSTER: RoomRoster[] = [
  { room: "ruleta", roomLabel: "La Rueda de la Fortuna", titular: "clara", suplente: "clara" },
  { room: "tables", roomLabel: "Mesa Negra · Blackjack", titular: "vita", suplente: "vita" },
  { room: "mahjong", roomLabel: "Salón de Lin", titular: "lin", suplente: "lin" },
  { room: "dados", roomLabel: "Cinco Huesos del Sótano", titular: "zelda", suplente: "zelda" },
  { room: "chinchon", roomLabel: "Cuarenta del Cuervo", titular: "luisa", suplente: "luisa" },
  { room: "bagatelle", roomLabel: "El Tablero de Bagatelle", titular: "lola", suplente: "lola" },
  { room: "slots", roomLabel: "La Tragaperras Dorada", titular: "salome", suplente: "salome" },
  { room: "truco", roomLabel: "El Envite del Puerto", titular: "eulalia", suplente: "eulalia" },
  { room: "escoba", roomLabel: "Escoba de Quince", titular: "bettie", suplente: "bettie" },
  { room: "solitario", roomLabel: "Solitario del Cuervo", titular: "jade", suplente: "jade" },
];

export function getBand(date: Date = new Date()): BandId {
  const h = date.getHours();
  if (h >= 6 && h < 14) return "matinee";
  if (h >= 14 && h < 22) return "velada";
  return "trasnoche";
}

export function getCurrentHostess(room: string, date: Date = new Date()): string | null {
  const r = ROSTER.find((x) => x.room === room);
  if (!r) return null;

  void date;
  return r.titular;
}

export function isOffShift(npcId: string, date: Date = new Date()): boolean {
  const r = ROSTER.find((x) => x.titular === npcId || x.suplente === npcId);
  if (!r) return false;
  return getCurrentHostess(r.room, date) !== npcId;
}

export function rosterFor(npcId: string): RoomRoster | undefined {
  return ROSTER.find((x) => x.titular === npcId || x.suplente === npcId);
}

export function minutesToNextBand(date: Date = new Date()): number {
  const h = date.getHours();
  const m = date.getMinutes();
  const cur = h * 60 + m;
  const marks = [6 * 60, 14 * 60, 22 * 60, 30 * 60];
  for (const mark of marks) {
    if (cur < mark) return mark - cur;
  }
  return 0;
}

export function sharesWith(npcId: string): Array<{ id: string; roomLabel: string }> {
  const seen = new Set<string>([npcId]);
  const out: Array<{ id: string; roomLabel: string }> = [];
  for (const r of ROSTER) {
    if (r.titular !== npcId && r.suplente !== npcId) continue;
    for (const other of [r.titular, r.suplente]) {
      if (!other || seen.has(other)) continue;
      seen.add(other);
      out.push({ id: other, roomLabel: r.roomLabel });
    }
  }
  return out;
}
