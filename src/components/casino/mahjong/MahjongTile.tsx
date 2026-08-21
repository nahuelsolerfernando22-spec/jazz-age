import { memo } from "react";
import charSheet from "@/assets/mahjong-tiles-sheet.webp";
import charSheet2 from "@/assets/mahjong-tiles-sheet-2.webp";
import charSheet3 from "@/assets/mahjong-tiles-sheet-3.webp";
import charSheet4 from "@/assets/mahjong-tiles-sheet-4.webp";
import charSheet5 from "@/assets/mahjong-tiles-sheet-5.webp";
import specialSheet from "@/assets/mahjong-specials-sheet.webp";
import specialSheet2 from "@/assets/mahjong-specials-sheet-2.webp";
import specialSheet3 from "@/assets/mahjong-specials-sheet-3.webp";
import specialSheet4 from "@/assets/mahjong-specials-sheet-4.webp";
import specialSheet5 from "@/assets/mahjong-specials-sheet-5.webp";

export const MAHJONG_TILE_NAMES = [
  "La Monja",
  "El Borracho",
  "El Tahúr",
  "La Cortesana",
  "El Poli",
  "El Carterista",
  "El Matón",
  "El Banquero",
  "La Pianista",
  "El Magistrado",
  "La Espía",
  "El Cura",
  "La Tatuada",
  "El Boxeador",
  "La Envenenadora",
  "El Detective",
] as const;

export const MAHJONG_TILE_NAMES_2 = [
  "La Burlesca",
  "La Flapper",
  "La Cigarrera",
  "La Marinera",
  "El Tabernero",
  "El Tenor",
  "El Carnicero",
  "El Usurero",
  "El Ratero",
  "El Sepulturero",
  "El Trompetista",
  "El Forense",
  "La Viuda Negra",
  "El Apostador",
  "El Payaso",
  "El Vocero",
] as const;

export const MAHJONG_TILE_NAMES_3 = [
  "La Croupier de Rubí",
  "El Contrabandista",
  "La Chanteuse",
  "El Chofer Enmascarado",
  "La Aristócrata",
  "El Fotógrafo",
  "La Modista",
  "El Violinista Ciego",
  "La Charlestón",
  "El Sicario",
  "La Adivina",
  "El Rabino del Barrio",
  "La Portera",
  "El Chef Napolitano",
  "La Enfermera Nocturna",
  "El Cronista",
] as const;

export const MAHJONG_TILE_NAMES_4 = [
  "La Vidente de Ojo Vidrioso",
  "El Verdugo Encapuchado",
  "La Domadora del Tigre",
  "El Cardenal Rojo",
  "La Bailarina de Plumas",
  "El Marino Tatuado",
  "La Diva del Ópera",
  "El Anarquista",
  "La Nurse Tuerta",
  "El Malabarista Sombrío",
  "La Reina del Silencio",
  "El Ilusionista",
  "La Peluquera Roja",
  "El Cartero Sombra",
  "La Reportera Roja",
  "El Alcalde Corrupto",
] as const;

export const MAHJONG_TILE_NAMES_5 = [
  "La Contorsionista",
  "El Rey del Ring",
  "La Astróloga",
  "El Jockey",
  "La Camarera Descarada",
  "El Sastre Judío",
  "La Modelo del Pintor",
  "El Vagabundo",
  "La Guardarropa",
  "El Ventrílocuo",
  "La Amazona",
  "El Cronómetro",
  "La Cerillera",
  "El Faquir",
  "La Trapecista",
  "El Comisionista",
] as const;

export const MAHJONG_SPECIAL_NAMES = [
  "Whisky",
  "Martini",
  "Champagne",
  "Absenta",
  "Cigarro",
  "Dados",
  "Carmín",
  "Pluma",
] as const;

export const MAHJONG_SPECIAL_NAMES_2 = [
  "Tommy Gun",
  "Fajo",
  "Galera",
  "Gramófono",
  "Llave Maestra",
  "Antifaz",
  "Reloj",
  "Abanico",
] as const;

export const MAHJONG_SPECIAL_NAMES_3 = [
  "Diamante Rojo",
  "Collar de Perlas",
  "Anillo de Rubí",
  "Broche Deco",
  "Saxofón",
  "Herradura",
  "Trébol",
  "Cerilla",
] as const;

export const MAHJONG_SPECIAL_NAMES_4 = [
  "Máscara de Cuervo",
  "Máscara Veneciana",
  "Máscara Roja",
  "Máscara Rota",
  "Vela Negra",
  "Libro Prohibido",
  "Cuchillo Ceremonial",
  "Reloj Roto",
] as const;

export const MAHJONG_SPECIAL_NAMES_5 = [
  "Reloj de Bolsillo",
  "El Loco (Tarot)",
  "Champán en Hielo",
  "Frasco de Perfume",
  "Pluma y Tinta",
  "Liguero Carmesí",
  "As de Corazones",
  "Rosa en Llamas",
] as const;

export type SpecialGroup =
  | "bebidas"
  | "vicios"
  | "armas"
  | "tesoros"
  | "joyas"
  | "suerte"
  | "mascaras"
  | "sombras"
  | "reliquias"
  | "pecados";

export type SheetIdx = 0 | 1 | 2 | 3 | 4;

export function specialGroup(specialIndex: number, sheet: SheetIdx = 0): SpecialGroup {
  if (sheet === 0) return specialIndex < 4 ? "bebidas" : "vicios";
  if (sheet === 1) return specialIndex < 4 ? "armas" : "tesoros";
  if (sheet === 2) return specialIndex < 4 ? "joyas" : "suerte";
  if (sheet === 3) return specialIndex < 4 ? "mascaras" : "sombras";
  return specialIndex < 4 ? "reliquias" : "pecados";
}

const CHAR_COLS = 4;
const CHAR_ROWS = 4;
const CHAR_TOTAL = CHAR_COLS * CHAR_ROWS;
const SPEC_COLS = 4;
const SPEC_ROWS = 2;
const SPEC_TOTAL = SPEC_COLS * SPEC_ROWS;

const CHAR_SHEETS = [charSheet, charSheet2, charSheet3, charSheet4, charSheet5] as const;
const SPEC_SHEETS = [
  specialSheet,
  specialSheet2,
  specialSheet3,
  specialSheet4,
  specialSheet5,
] as const;
const CHAR_NAMES_BY_SHEET = [
  MAHJONG_TILE_NAMES,
  MAHJONG_TILE_NAMES_2,
  MAHJONG_TILE_NAMES_3,
  MAHJONG_TILE_NAMES_4,
  MAHJONG_TILE_NAMES_5,
] as const;
const SPEC_NAMES_BY_SHEET = [
  MAHJONG_SPECIAL_NAMES,
  MAHJONG_SPECIAL_NAMES_2,
  MAHJONG_SPECIAL_NAMES_3,
  MAHJONG_SPECIAL_NAMES_4,
  MAHJONG_SPECIAL_NAMES_5,
] as const;
const TILE_BASE_BACKGROUND =
  "linear-gradient(145deg, rgb(241 227 188) 0%, rgb(207 183 127) 55%, rgb(144 112 66) 100%)";
const TILE_BASE_SHADOW =
  "0 6px 10px rgba(0,0,0,0.42), 0 2px 2px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(145,101,37,0.62), inset 0 -3px 4px rgba(0,0,0,0.25)";

function MahjongTileImpl({
  index,
  variant = "char",
  sheet = 0,
  size = 96,
  className = "",
  title,
}: {
  index: number;
  variant?: "char" | "special";
  sheet?: SheetIdx;
  size?: number;
  className?: string;
  title?: string;
}) {
  const isSpec = variant === "special";
  const cols = isSpec ? SPEC_COLS : CHAR_COLS;
  const rows = isSpec ? SPEC_ROWS : CHAR_ROWS;
  const total = isSpec ? SPEC_TOTAL : CHAR_TOTAL;
  const sheetSrc = isSpec ? SPEC_SHEETS[sheet] : CHAR_SHEETS[sheet];
  const names = isSpec ? SPEC_NAMES_BY_SHEET[sheet] : CHAR_NAMES_BY_SHEET[sheet];

  const i = ((index % total) + total) % total;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const w = size;
  const h = Math.round((size * 4) / 3);
  const label = title ?? names[i];
  const fallbackText = isSpec ? label.slice(0, 3).toUpperCase() : String(i + 1);
  const posX = cols <= 1 ? 0 : (col / (cols - 1)) * 100;
  const posY = rows <= 1 ? 0 : (row / (rows - 1)) * 100;
  const spriteStyle = {
    position: "absolute" as const,
    inset: 0,
    backgroundImage: `url(${sheetSrc})`,
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    imageRendering: "-webkit-optimize-contrast" as const,
    userSelect: "none" as const,
    pointerEvents: "none" as const,
  };
  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className={`relative shrink-0 overflow-hidden rounded-[6px] ${className}`}
      style={{
        width: w,
        height: h,
        filter: undefined,
        background: TILE_BASE_BACKGROUND,
        boxShadow: TILE_BASE_SHADOW,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center px-1 text-center font-display text-[12px] font-bold uppercase leading-none text-[var(--mahogany)]"
      >
        {fallbackText}
      </span>
      <div data-mahjong-sheet="true" aria-hidden="true" style={spriteStyle} />
    </div>
  );
}

export const MahjongTile = memo(MahjongTileImpl);
