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
