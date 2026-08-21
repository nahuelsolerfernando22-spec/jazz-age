import texCuervo from "@/assets/sindicato/tex/faccion-cuervo.jpg";
import texEscarlata from "@/assets/sindicato/tex/faccion-escarlata.jpg";
import texMuelle from "@/assets/sindicato/tex/faccion-muelle.jpg";
import texOlivo from "@/assets/sindicato/tex/faccion-olivo.jpg";
import texCofradia from "@/assets/sindicato/tex/faccion-cofradia.jpg";
import texNeutral from "@/assets/sindicato/tex/neutral.jpg";
import texLaton from "@/assets/sindicato/tex/laton.jpg";

/** Arte raster por facción: cada barrio hereda la estética de su dueño. */
export const TEXTURA_FACCION: Record<string, string> = {
  cuervo: texCuervo,
  escarlata: texEscarlata,
  muelle: texMuelle,
  olivo: texOlivo,
  cofradia: texCofradia,
};

export const TEXTURA_NEUTRAL = texNeutral;
export const TEXTURA_LATON = texLaton;

/** Lista de patrones a declarar en los <defs> del tablero. */
export const PATRONES_TABLERO: { id: string; href: string }[] = [
  ...Object.entries(TEXTURA_FACCION).map(([id, href]) => ({ id: `tex-${id}`, href })),
  { id: "tex-neutral", href: texNeutral },
  { id: "tex-laton", href: texLaton },
];

export function patronDeFaccion(faccionId?: string): string {
  return faccionId && TEXTURA_FACCION[faccionId] ? `url(#tex-${faccionId})` : "url(#tex-neutral)";
}

/** Textura base (href) que le corresponde a una facción. */
export function texturaDeFaccion(faccionId?: string): string {
  return (faccionId && TEXTURA_FACCION[faccionId]) || TEXTURA_NEUTRAL;
}

/**
 * Variante de arte por propietario: cada banda recibe su propio patrón
 * (textura de su facción + tinte y encuadre propios) para que todos sus
 * barrios se lean con una estética consistente entre sí.
 */
export interface VarianteDueno {
  id: string;
  href: string;
  color: string;
  /** rotación del encuadre del arte, en grados */
  rotacion: number;
  /** escala del tile, para que dos bandas nunca se vean igual */
  escala: number;
  /** intensidad del tinte de banda sobre el arte */
  tinte: number;
}

export function varianteDeDueno(
  index: number,
  faccionId: string | undefined,
  color: string,
): VarianteDueno {
  return {
    id: `tex-owner-${index}`,
    href: texturaDeFaccion(faccionId),
    color,
    rotacion: (index * 37) % 360,
    escala: 1 + ((index * 13) % 5) / 10,
    tinte: 0.26 + ((index * 7) % 3) * 0.05,
  };
}

export function patronDeDueno(ownerIndex?: number | null): string | null {
  return ownerIndex === null || ownerIndex === undefined ? null : `url(#tex-owner-${ownerIndex})`;
}
