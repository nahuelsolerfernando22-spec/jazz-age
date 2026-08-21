import callejonBadge from "@/assets/leagues/callejon-badge.webp";
import salonBadge from "@/assets/leagues/salon-badge.webp";
import reservadoBadge from "@/assets/leagues/reservado-badge.webp";
import aticoBadge from "@/assets/leagues/atico-badge.webp";
import mesaBadge from "@/assets/leagues/mesa-badge.webp";

import callejonBg from "@/assets/leagues/callejon-bg.webp";
import salonBg from "@/assets/leagues/salon-bg.webp";
import reservadoBg from "@/assets/leagues/reservado-bg.webp";
import aticoBg from "@/assets/leagues/atico-bg.webp";
import mesaBg from "@/assets/leagues/mesa-bg.webp";

export type LeagueId = "callejon" | "salon" | "reservado" | "atico" | "mesa";

export interface League {
  id: LeagueId;
  tier: number;
  name: string;
  shortName: string;
  blurb: string;
  badge: string;
  bg: string;
  accent: string;
  prize: string;
}

export const LEAGUES: League[] = [
  {
    id: "callejon",
    tier: 1,
    name: "Callejón de las Ratas",
    shortName: "Callejón",
    blurb: "Donde empiezan todos. Ratas, monedas mordidas y aliento a gin barato.",
    badge: callejonBadge,
    bg: callejonBg,
    accent: "oklch(0.55 0.10 50)",
    prize: "Ficha de bronce mordida · +50¢ de propina",
  },
  {
    id: "salon",
    tier: 2,
    name: "Salón de Madame Corvina",
    shortName: "Salón",
    blurb: "El piso de los habitués: humo de puro, terciopelo gastado, pluma y llave cruzadas.",
    badge: salonBadge,
    bg: salonBg,
    accent: "oklch(0.60 0.18 25)",
    prize: "Llavero de la casa · poción menor a elección",
  },
  {
    id: "reservado",
    tier: 3,
    name: "Reservado del Terciopelo",
    shortName: "Reservado",
    blurb: "Cortinas burdeos, antifaces venecianos y dados sobre seda. Aquí ya se respeta.",
    badge: reservadoBadge,
    bg: reservadoBg,
    accent: "oklch(0.68 0.15 35)",
    prize: "Antifaz veneciano · skin de mesa exclusiva",
  },
  {
    id: "atico",
    tier: 4,
    name: "Ático del Cuervo",
    shortName: "Ático",
    blurb: "Vitrales art déco y rayos de oro. El cuervo te mira desde la corona.",
    badge: aticoBadge,
    bg: aticoBg,
    accent: "oklch(0.82 0.16 75)",
    prize: "Pluma del Cuervo · título social «Plumas de Oro»",
  },
  {
    id: "mesa",
    tier: 5,
    name: "Mesa Privada de Corvina",
    shortName: "Mesa Privada",
    blurb: "La cima. Una sola lámpara, una sola mano enguantada, una sola carta: el as de picas.",
    badge: mesaBadge,
    bg: mesaBg,
    accent: "oklch(0.88 0.18 78)",
    prize: "As de picas firmado · poción mayor + skin legendaria",
  },
];

export function leagueById(id: LeagueId): League {
  return LEAGUES.find((l) => l.id === id) ?? LEAGUES[1];
}

export const DEFAULT_LEAGUE: LeagueId = "callejon";
