import { useMemo, useState } from "react";
import { FACCIONES } from "@/lib/sindicato-facciones";
import { useHaptics } from "@/hooks/use-haptics";
import { VARIANTES, VARIANTE_CLASICA, type ReglasVariante } from "@/lib/sindicato-variantes";

export interface SorteoResultado {
  color: string;
  turnOrder: number[];
  dados: Record<number, number>;
  reglas: ReglasVariante;
}


/** Paleta de la banda: el jugador elige con qué color juega la noche. */
export const COLORES_BANDA: Array<{ id: string; nombre: string; valor: string }> = [
  { id: "oro", nombre: "Oro viejo", valor: "var(--cd-gold-mid)" },
  { id: "sangre", nombre: "Sangre", valor: "#A83A3A" },
  { id: "esmeralda", nombre: "Esmeralda", valor: "var(--cd-teal)" },
  { id: "oliva", nombre: "Oliva", valor: "#6B7A3A" },
  { id: "violeta", nombre: "Violeta", valor: "#5B4B8A" },
];

const CARA = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function nombreDe(i: number) {
  return i === 0 ? "El Cuervo (vos)" : FACCIONES[i % FACCIONES.length].nombre;
}

/**
 * Mesa previa al estilo T.E.G.: se elige color y se sortea con dados quién
 * abre la ronda. El orden que sale acá manda toda la partida.
 */
export function SindicatoSorteo({
  playerCount,
  onStart,
}: {
  playerCount: number;
  onStart: (r: SorteoResultado) => void;
}) {
  const haptics = useHaptics();
  const [color, setColor] = useState(COLORES_BANDA[0].valor);
  const [dados, setDados] = useState<Record<number, number> | null>(null);
  const [tirando, setTirando] = useState(false);
  const [varianteId, setVarianteId] = useState(VARIANTE_CLASICA.id);
  const reglas = useMemo(
    () => VARIANTES.find((v) => v.id === varianteId) ?? VARIANTE_CLASICA,
    [varianteId],
  );


  const orden = useMemo(() => {
    if (!dados) return [];
    return Object.keys(dados)
      .map(Number)
      .sort((a, b) => dados[b] - dados[a] || a - b);
  }, [dados]);

  const tirar = () => {
    setTirando(true);
    haptics("tap");
    let pasos = 0;
    const t = setInterval(() => {
      const tirada: Record<number, number> = {};
      for (let i = 0; i < playerCount; i++) tirada[i] = 1 + Math.floor(Math.random() * 6);
      setDados(tirada);
      pasos++;
      if (pasos >= 8) {
        clearInterval(t);
        setTirando(false);
        haptics("success");
      }
    }, 110);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--oro)]/40 bg-[#12100c]/95 p-4 shadow-2xl">
        <h2 className="paria-sign text-center text-xl">Mesa del Sindicato</h2>
        <p className="mt-1 text-center text-[11px] text-[var(--oro)]/70">
          Elegí el color de tu banda y tirá el dado para ver quién abre.
        </p>

        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wider text-[var(--oro)]/60">Color de banda</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLORES_BANDA.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setColor(c.valor);
                  haptics("tap");
                }}
                aria-label={c.nombre}
                aria-pressed={color === c.valor}
                className={`h-11 min-w-11 flex-1 rounded-lg border-2 px-2 text-[10px] font-semibold transition-transform active:scale-95 ${
                  color === c.valor
                    ? "border-[var(--oro)] scale-105"
                    : "border-white/15 opacity-70"
                }`}
                style={{ background: c.valor, color: "#0d0b08" }}
              >
                {c.nombre}
              </button>
            ))}
          </div>

        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wider text-[var(--oro)]/60">
            Variante de la casa
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {VARIANTES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVarianteId(v.id);
                  haptics("tap");
                }}
                aria-pressed={varianteId === v.id}
                className={`min-h-11 rounded-lg border px-2 py-2 text-left transition-transform active:scale-95 ${
                  varianteId === v.id
                    ? "border-[var(--oro)] bg-[var(--oro)]/15"
                    : "border-white/12 bg-black/40"
                }`}
              >
                <span className="block text-[11px] font-semibold text-[var(--marfil)]">
                  {v.nombre}
                </span>
                <span className="block text-[9px] leading-tight text-[var(--oro)]/60">
                  {v.resumen}
                </span>
              </button>
            ))}
          </div>
        </div>



        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wider text-[var(--oro)]/60">
            Sorteo de orden
          </p>
          <div className="mt-2 space-y-1">
            {Array.from({ length: playerCount }).map((_, i) => {
              const puesto = orden.indexOf(i);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-black/40 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-xs text-[var(--marfil)]">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ background: i === 0 ? color : undefined }}
                    />
                    {nombreDe(i)}
                  </span>
                  <span className="flex items-center gap-2">
                    {dados && puesto >= 0 && !tirando && (
                      <span className="text-[10px] text-[var(--oro)]/70">{puesto + 1}º</span>
                    )}
                    <span className="text-2xl leading-none text-[var(--oro)]">
                      {dados ? CARA[dados[i]] : "·"}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={tirar}
            disabled={tirando}
            className="h-12 flex-1 rounded-lg border border-[var(--oro)]/50 bg-black/50 text-sm font-semibold text-[var(--oro)] active:scale-95 disabled:opacity-50"
          >
            {dados ? "Tirar de nuevo" : "Tirar dados"}
          </button>
          <button
            type="button"
            onClick={() => dados && onStart({ color, turnOrder: orden, dados })}
            disabled={!dados || tirando}
            className="h-12 flex-1 rounded-lg bg-[var(--oro)] text-sm font-bold text-[#12100c] active:scale-95 disabled:opacity-40"
          >
            Empezar
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[var(--oro)]/55">
          Ronda 1: 5 fichas por capo. Ronda 2: 3 fichas. Recién en la 3ª se asalta.
        </p>
      </div>
    </div>
  );
}
