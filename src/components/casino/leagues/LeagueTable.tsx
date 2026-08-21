import { LEAGUE_TIERS, tierById, type LeagueTierId } from "@/lib/leagues-daily";
import { LeagueBadge } from "./LeagueBadge";

export interface LeagueRow {
  rank: number;
  name: string;
  score: number;
  isPlayer?: boolean;
}

interface Props {
  tier: LeagueTierId;
  rows: LeagueRow[];
  promoCut: number;
  relegCut: number;
}

export function LeagueTable({ tier, rows, promoCut, relegCut }: Props) {
  const skin = SKINS[tier];
  const t = tierById(tier);
  const total = rows.length;
  return (
    <div
      className="relative rounded-md overflow-hidden border-2"
      style={{
        background: skin.bg,
        borderColor: skin.border,
        boxShadow: `0 0 40px -10px ${t.glow}`,
        fontFamily: skin.font,
      }}
    >
      {}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: skin.texture, mixBlendMode: "overlay", opacity: skin.textureOpacity }}
      />

      {}
      <div
        className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 border-b-2"
        style={{ borderColor: skin.border, background: skin.headerBg }}
      >
        <div className="shrink-0">
          <LeagueBadge tier={tier} size="sm" glow={false} />
        </div>
        <div className="min-w-0">
          <div
            className="truncate text-[11px] tracking-[0.3em] uppercase"
            style={{ color: skin.muted }}
          >
            Liga {t.rank}
          </div>
          <div
            className="text-base leading-tight tracking-wide line-clamp-2"
            style={{ color: skin.heading }}
          >
            {skin.title ?? t.fullName}
          </div>
        </div>
        <div
          className="shrink-0 text-right text-[11px] uppercase leading-tight tracking-[0.15em]"
          style={{ color: skin.muted }}
        >
          <div>{promoCut > 0 ? `↑ top ${promoCut}` : "↑ —"}</div>
          <div>{relegCut > 0 ? `↓ últ. ${relegCut}` : "↓ —"}</div>
        </div>
      </div>

      {}
      <div className="relative">
        {rows.length === 0 && (
          <div
            className="px-5 py-8 text-center text-sm"
            style={{ color: skin.muted, fontStyle: "italic" }}
          >
            La libreta está en blanco — la tabla se llena cuando hay conexión con el resto del
            callejón.
          </div>
        )}
        {rows.map((r, i) => {
          const inPromo = r.rank <= promoCut;
          const inReleg = r.rank > total - relegCut;
          const zoneTint = inPromo ? skin.promoTint : inReleg ? skin.relegTint : "transparent";
          const isLast = i === rows.length - 1;
          return (
            <div
              key={r.rank}
              className="relative flex items-center gap-3 px-5 py-2.5 text-sm"
              style={{
                background: r.isPlayer ? skin.playerBg : zoneTint,
                borderBottom: isLast ? "none" : `1px ${skin.rowSep} ${skin.border}`,
                color: skin.body,
              }}
            >
              <div
                className="w-8 text-right tabular-nums"
                style={{
                  color: inPromo ? skin.promo : inReleg ? skin.releg : skin.muted,
                  fontWeight: r.isPlayer ? 700 : 500,
                }}
              >
                {r.rank}
              </div>
              <div
                className="flex-1 truncate"
                style={{
                  fontWeight: r.isPlayer ? 700 : 400,
                  color: r.isPlayer ? skin.heading : skin.body,
                }}
              >
                {r.isPlayer ? `▸ ${r.name}` : r.name}
              </div>
              <div
                className="tabular-nums text-right"
                style={{
                  color: r.isPlayer ? skin.heading : skin.body,
                  fontWeight: r.isPlayer ? 700 : 500,
                }}
              >
                {r.score.toLocaleString("es-AR")}
              </div>
              {inPromo && (
                <span className="text-[11px]" style={{ color: skin.promo }}>
                  ↑
                </span>
              )}
              {inReleg && (
                <span className="text-[11px]" style={{ color: skin.releg }}>
                  ↓
                </span>
              )}
            </div>
          );
        })}
      </div>

      {}
      <div
        className="relative px-5 py-2 text-[11px] tracking-[0.3em] uppercase border-t"
        style={{ borderColor: skin.border, color: skin.muted, background: skin.headerBg }}
      >
        {skin.footer}
      </div>
    </div>
  );
}

interface Skin {
  bg: string;
  headerBg: string;
  border: string;
  heading: string;
  body: string;
  muted: string;
  promo: string;
  releg: string;
  promoTint: string;
  relegTint: string;
  playerBg: string;
  texture: string;
  textureOpacity: number;
  font: string;
  rowSep: "solid" | "dashed" | "dotted" | "double";
  footer: string;
  title?: string;
}

const FONT_SERIF = '"Cormorant Garamond", Georgia, serif';
const FONT_SLAB = '"Stint Ultra Condensed", "Bebas Neue", serif';
const FONT_TYPE = '"Special Elite", "Courier New", monospace';
const FONT_DECO = '"Limelight", "Cormorant Garamond", serif';

export const SKINS: Record<LeagueTierId, Skin> = {
  vagabundos: {
    bg: "linear-gradient(180deg, oklch(0.18 0.02 30), oklch(0.13 0.02 25))",
    headerBg: "oklch(0.10 0.02 25)",
    border: "oklch(0.35 0.04 35)",
    heading: "oklch(0.92 0.04 80)",
    body: "oklch(0.78 0.03 60)",
    muted: "oklch(0.55 0.05 50)",
    promo: "oklch(0.78 0.15 130)",
    releg: "oklch(0.65 0.18 25)",
    promoTint: "oklch(0.20 0.03 130 / 0.25)",
    relegTint: "oklch(0.20 0.05 25 / 0.25)",
    playerBg: "oklch(0.25 0.04 60 / 0.5)",
    texture:
      "repeating-linear-gradient(45deg, transparent 0 6px, oklch(0.95 0.02 80 / 0.04) 6px 7px)",
    textureOpacity: 0.6,
    font: FONT_TYPE,
    rowSep: "dashed",
    footer: "tiza sobre madera · callejón sur",
    title: "El Tablón del Callejón",
  },

  parroquianos: {
    bg: "linear-gradient(180deg, oklch(0.16 0.02 45), oklch(0.12 0.02 40))",
    headerBg: "oklch(0.22 0.04 45)",
    border: "oklch(0.40 0.06 45)",
    heading: "oklch(0.88 0.10 65)",
    body: "oklch(0.80 0.05 60)",
    muted: "oklch(0.58 0.06 50)",
    promo: "oklch(0.82 0.14 130)",
    releg: "oklch(0.65 0.16 25)",
    promoTint: "oklch(0.22 0.04 130 / 0.22)",
    relegTint: "oklch(0.22 0.05 25 / 0.22)",
    playerBg: "oklch(0.28 0.06 50 / 0.55)",
    texture:
      "radial-gradient(circle at 20% 30%, oklch(0.95 0.05 50 / 0.06) 0 30%, transparent 31%)",
    textureOpacity: 0.7,
    font: FONT_SLAB,
    rowSep: "dotted",
    footer: "pizarra de la barra · noche del jueves",
    title: "La Pizarra de la Cantina",
  },

  conocidas: {
    bg: "linear-gradient(180deg, oklch(0.85 0.04 70), oklch(0.78 0.06 60))",
    headerBg: "oklch(0.92 0.05 75)",
    border: "oklch(0.45 0.08 40)",
    heading: "oklch(0.30 0.08 30)",
    body: "oklch(0.35 0.06 40)",
    muted: "oklch(0.50 0.07 40)",
    promo: "oklch(0.45 0.15 140)",
    releg: "oklch(0.45 0.18 25)",
    promoTint: "oklch(0.75 0.10 130 / 0.35)",
    relegTint: "oklch(0.75 0.12 25 / 0.35)",
    playerBg: "oklch(0.95 0.06 70 / 0.7)",
    texture:
      "repeating-linear-gradient(0deg, transparent 0 22px, oklch(0.40 0.06 40 / 0.15) 22px 23px)",
    textureOpacity: 0.5,
    font: FONT_SERIF,
    rowSep: "solid",
    footer: "libreta del cuervo · pluma negra",
    title: "Registro de Caras Conocidas",
  },

  manofirme: {
    bg: "linear-gradient(180deg, oklch(0.22 0.08 25), oklch(0.16 0.06 25))",
    headerBg: "oklch(0.28 0.10 25)",
    border: "oklch(0.55 0.12 30)",
    heading: "oklch(0.92 0.06 70)",
    body: "oklch(0.82 0.04 60)",
    muted: "oklch(0.60 0.08 40)",
    promo: "oklch(0.82 0.16 130)",
    releg: "oklch(0.68 0.18 20)",
    promoTint: "oklch(0.30 0.08 130 / 0.25)",
    relegTint: "oklch(0.30 0.10 25 / 0.28)",
    playerBg: "oklch(0.35 0.10 25 / 0.55)",
    texture: "radial-gradient(circle at 50% 50%, transparent 60%, oklch(0 0 0 / 0.35) 100%)",
    textureOpacity: 0.8,
    font: FONT_DECO,
    rowSep: "double",
    footer: "cuero cosido a mano · sastrería del puerto",
    title: "El Pacto de Mano Firme",
  },

  bronce: {
    bg: "linear-gradient(180deg, oklch(0.32 0.08 50), oklch(0.22 0.06 45))",
    headerBg: "oklch(0.38 0.10 50)",
    border: "oklch(0.62 0.14 55)",
    heading: "oklch(0.95 0.10 75)",
    body: "oklch(0.86 0.06 65)",
    muted: "oklch(0.68 0.08 55)",
    promo: "oklch(0.85 0.16 130)",
    releg: "oklch(0.68 0.18 25)",
    promoTint: "oklch(0.38 0.08 130 / 0.30)",
    relegTint: "oklch(0.38 0.10 25 / 0.30)",
    playerBg: "oklch(0.45 0.12 55 / 0.55)",
    texture:
      "radial-gradient(circle at 10% 0%, oklch(1 0 0 / 0.18) 0%, transparent 35%), radial-gradient(circle at 90% 100%, oklch(0 0 0 / 0.35) 0%, transparent 40%)",
    textureOpacity: 0.9,
    font: FONT_DECO,
    rowSep: "solid",
    footer: "placa de bronce · fundición del muelle",
    title: "La Placa de Bronce",
  },

  plata: {
    bg: "linear-gradient(180deg, oklch(0.85 0.02 240), oklch(0.72 0.03 240))",
    headerBg: "oklch(0.92 0.02 240)",
    border: "oklch(0.45 0.04 240)",
    heading: "oklch(0.20 0.04 240)",
    body: "oklch(0.30 0.03 240)",
    muted: "oklch(0.45 0.04 240)",
    promo: "oklch(0.45 0.18 140)",
    releg: "oklch(0.50 0.22 25)",
    promoTint: "oklch(0.78 0.08 130 / 0.45)",
    relegTint: "oklch(0.80 0.12 25 / 0.40)",
    playerBg: "oklch(0.95 0.04 240 / 0.85)",
    texture: "repeating-linear-gradient(135deg, transparent 0 3px, oklch(1 0 0 / 0.15) 3px 4px)",
    textureOpacity: 0.8,
    font: FONT_DECO,
    rowSep: "solid",
    footer: "grabado en plata · joyería marchetti",
    title: "El Grabado de Plata",
  },

  oro: {
    bg: "linear-gradient(180deg, oklch(0.78 0.16 85), oklch(0.62 0.18 75))",
    headerBg: "oklch(0.85 0.18 85)",
    border: "oklch(0.45 0.12 65)",
    heading: "oklch(0.22 0.08 50)",
    body: "oklch(0.30 0.08 55)",
    muted: "oklch(0.45 0.10 55)",
    promo: "oklch(0.35 0.22 140)",
    releg: "oklch(0.40 0.22 25)",
    promoTint: "oklch(0.78 0.16 130 / 0.55)",
    relegTint: "oklch(0.78 0.18 25 / 0.45)",
    playerBg: "oklch(0.95 0.18 85 / 0.85)",
    texture:
      "repeating-linear-gradient(45deg, transparent 0 5px, oklch(1 0 0 / 0.18) 5px 6px), radial-gradient(circle at 20% 20%, oklch(1 0 0 / 0.25) 0%, transparent 35%)",
    textureOpacity: 0.9,
    font: FONT_DECO,
    rowSep: "double",
    footer: "lámina de oro · puerto corbeau",
    title: "La Lámina de Oro",
  },

  circulo: {
    bg: "linear-gradient(180deg, oklch(0.10 0.02 25), oklch(0.06 0.02 20))",
    headerBg: "oklch(0.14 0.04 25)",
    border: "oklch(0.55 0.16 25)",
    heading: "oklch(0.92 0.12 30)",
    body: "oklch(0.78 0.04 40)",
    muted: "oklch(0.55 0.08 30)",
    promo: "oklch(0.88 0.18 90)",
    releg: "oklch(0.72 0.22 25)",
    promoTint: "oklch(0.22 0.10 90 / 0.30)",
    relegTint: "oklch(0.22 0.12 25 / 0.35)",
    playerBg: "oklch(0.30 0.14 25 / 0.55)",
    texture: "radial-gradient(circle at 50% 50%, transparent 30%, oklch(0 0 0 / 0.6) 100%)",
    textureOpacity: 0.9,
    font: FONT_SERIF,
    rowSep: "double",
    footer: "cera negra · juramento del círculo",
    title: "El Círculo del Cuervo",
  },

  cuervoDorado: {
    bg: "linear-gradient(180deg, oklch(0.18 0.04 30), oklch(0.10 0.03 25))",
    headerBg:
      "linear-gradient(90deg, oklch(0.20 0.08 40), oklch(0.32 0.18 70), oklch(0.20 0.08 40))",
    border: "oklch(0.85 0.20 85)",
    heading: "oklch(0.98 0.18 85)",
    body: "oklch(0.92 0.10 75)",
    muted: "oklch(0.72 0.14 70)",
    promo: "oklch(0.95 0.20 90)",
    releg: "oklch(0.75 0.22 25)",
    promoTint: "oklch(0.32 0.18 70 / 0.35)",
    relegTint: "oklch(0.30 0.14 25 / 0.40)",
    playerBg:
      "linear-gradient(90deg, oklch(0.35 0.18 70 / 0.7), oklch(0.55 0.22 80 / 0.6), oklch(0.35 0.18 70 / 0.7))",
    texture:
      "radial-gradient(circle at 50% 0%, oklch(1 0.10 85 / 0.30) 0%, transparent 50%), repeating-linear-gradient(90deg, transparent 0 30px, oklch(1 0.15 85 / 0.08) 30px 31px)",
    textureOpacity: 0.9,
    font: FONT_DECO,
    rowSep: "double",
    footer: "leyendas vivas · solo nueve sillas",
    title: "El Trono del Cuervo Dorado",
  },
};
