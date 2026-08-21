/**
 * Etiquetas canónicas de los cantos, en criollo.
 * Se usan tanto en la mesa 1v1 como en la de a tres para que el cartel,
 * el encabezado de respuesta y el log digan siempre lo mismo.
 */
export type AnyCantoKind = "envido" | "truco" | "flor";

const LABELS: Record<string, string> = {
  envido: "Envido",
  real: "Real envido",
  falta: "Falta envido",
  truco: "Truco",
  retruco: "Retruco",
  vale4: "Vale cuatro",
  flor: "Flor",
  contraflor: "Contraflor",
  contrarresto: "Contraflor al resto",
};

/** "retruco" → "Retruco"; cae al kind cuando el nivel no está mapeado. */
export function cantoLabel(kind: AnyCantoKind, level?: string | null): string {
  const key = String(level ?? kind);
  return LABELS[key] ?? LABELS[kind] ?? key.toUpperCase();
}

/** Igual que cantoLabel pero en mayúsculas, para carteles y titulares. */
export function cantoLabelUpper(kind: AnyCantoKind, level?: string | null): string {
  return cantoLabel(kind, level).toUpperCase();
}
