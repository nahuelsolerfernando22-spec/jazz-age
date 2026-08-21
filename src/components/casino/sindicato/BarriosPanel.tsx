import { BARRIOS, type Territorio } from "@/lib/sindicato-data";

interface Props {
  territories: Territorio[];
  conquests: Record<string, { ownerId: number }>;
  myPlayerId: number;
  myColor: string;
}

/** Fichas de barrio: muestra cuánto falta para cobrar la bonificación de cada zona. */
export function BarriosPanel({ territories, conquests, myPlayerId, myColor }: Props) {
  const filas = BARRIOS.map((barrio) => {
    const propios = territories.filter((t) => t.barrio === barrio.id);
    if (propios.length === 0) return null;
    const mios = propios.filter((t) => conquests[t.id]?.ownerId === myPlayerId).length;
    return { barrio, total: propios.length, mios, completo: mios === propios.length };
  }).filter((f): f is NonNullable<typeof f> => f !== null);

  if (filas.length === 0) return null;

  return (
    <div className="pointer-events-none mt-1.5 px-2">
      <div className="pointer-events-auto flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {filas.map(({ barrio, total, mios, completo }) => (
          <div
            key={barrio.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border-2 px-2 py-1 backdrop-blur-md ${
              completo
                ? "border-[var(--oro-palido)] bg-[var(--oro)]/25 shadow-[0_0_10px_rgba(201,168,76,0.4)]"
                : "border-black/70 bg-black/85"
            }`}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-sm border border-black"
              style={{ backgroundColor: completo ? myColor : barrio.color }}
            />
            <span className="font-bebas text-sm leading-none tracking-wide text-[var(--crema-brillo)]">
              {barrio.nombre}
            </span>
            <span
              className={`font-bebas text-sm leading-none ${
                completo ? "text-[var(--oro-palido)]" : "text-[var(--crema-brillo)]/70"
              }`}
            >
              {mios}/{total}
            </span>
            <span className="rounded border border-[var(--oro)]/50 px-1 font-bebas text-[11px] leading-tight text-[var(--oro-palido)]">
              +{barrio.bonus}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
