/**
 * Encuadre unificado de los retratos de las anfitrionas.
 *
 * Todos los retratos son ilustraciones 416x620 de cuerpo medio, pero la cara
 * no cae en el mismo punto en cada una: si recortamos siempre "object-top"
 * algunas quedan centradas y otras muestran el techo del salón o cortan la
 * frente. Este mapa fija el punto focal (la cara) y el zoom por NPC para que
 * todos los avatares circulares de la app se vean igual de encuadrados.
 */
export interface AvatarFocus {
  /** Posición horizontal/vertical de la cara en % de la imagen. */
  x: number;
  y: number;
  /** Zoom aplicado sobre el recorte cuadrado. */
  zoom: number;
}

const FOCUS: Record<string, AvatarFocus> = {
  bettie: { x: 40, y: 13, zoom: 1.55 },
  clara: { x: 35, y: 10, zoom: 1.5 },
  eulalia: { x: 45, y: 13, zoom: 1.55 },
  jade: { x: 62, y: 13, zoom: 1.55 },
  lin: { x: 45, y: 14, zoom: 1.5 },
  lola: { x: 52, y: 14, zoom: 1.5 },
  luisa: { x: 52, y: 12, zoom: 1.5 },
  opal: { x: 68, y: 15, zoom: 1.55 },
  salome: { x: 36, y: 15, zoom: 1.5 },
  shauna: { x: 50, y: 15, zoom: 1.5 },
  vita: { x: 43, y: 14, zoom: 1.55 },
  zelda: { x: 62, y: 16, zoom: 1.5 },
};

const DEFAULT_FOCUS: AvatarFocus = { x: 50, y: 14, zoom: 1.5 };

export function avatarFocus(npcId?: string | null): AvatarFocus {
  if (!npcId) return DEFAULT_FOCUS;
  return FOCUS[npcId] ?? DEFAULT_FOCUS;
}

/** Estilo listo para un <img className="object-cover"> dentro de un círculo. */
export function avatarFocusStyle(npcId?: string | null): React.CSSProperties {
  const f = avatarFocus(npcId);
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    transform: `scale(${f.zoom})`,
    transformOrigin: `${f.x}% ${f.y}%`,
  };
}
