import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  desafioDeBarrio,
  repartirSuma15,
  resolverHueso,
  resolverMonte,
  resolverNaipe,
  resolverRuleta,
  resolverSuma15,
  resolverVeintiuno,
  type DesafioResultado,
} from "@/lib/sindicato-desafio";

interface Props {
  barrio: string | undefined;
  territorio: string;
  /** Ganar suma un dado de ataque; perder le da uno a la defensa. */
  onResuelto: (gano: boolean) => void;
  onCerrar: () => void;
}

const BTN =
  "min-h-[44px] px-4 rounded-xl border-[3px] border-black font-bebas text-xl uppercase " +
  "shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all touch-manipulation";

export function DesafioDeMesa({ barrio, territorio, onResuelto, onCerrar }: Props) {
  const def = useMemo(() => desafioDeBarrio(barrio), [barrio]);
  const escoba = useMemo(() => repartirSuma15(), []);
  const reinaMonte = useMemo(() => Math.floor(Math.random() * 3), []);
  const [res, setRes] = useState<DesafioResultado | null>(null);

  const cerrar = (r: DesafioResultado) => {
    setRes(r);
    window.setTimeout(() => onResuelto(r.gano), 1100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.92, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        className="w-[92vw] max-w-sm rounded-2xl border-[4px] border-black bg-[#0d0a06] p-6 shadow-[0_0_70px_rgba(0,0,0,0.9)] ring-1 ring-[var(--oro-viejo)]/25"
      >
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--oro-viejo)]">
          {def.juego} · {territorio}
        </p>
        <h2 className="mt-1 font-serif text-3xl font-bold uppercase italic leading-none text-[var(--crema-brillo)] drop-shadow-[0_3px_0_#000]">
          {def.titulo}
        </h2>
        <p className="mt-3 text-[13px] leading-snug text-[var(--crema-clara)]/85">{def.consigna}</p>

        {res ? (
          <div className="mt-6 text-center">
            <p
              className={`font-bebas text-3xl uppercase drop-shadow-[0_2px_0_#000] ${
                res.gano ? "text-[var(--oro)]" : "text-red-400"
              }`}
            >
              {res.gano ? "Mano ganada · +1 dado de asalto" : "Mano perdida · +1 dado al defensor"}
            </p>
            <p className="mt-1 text-[12px] text-[var(--crema-clara)]/80">{res.detalle}</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {def.tipo === "naipe" && (
              <button
                className={`${BTN} bg-[var(--oro-viejo)] text-black`}
                onClick={() => cerrar(resolverNaipe())}
              >
                Cortar el mazo
              </button>
            )}

            {def.tipo === "hueso" && (
              <button
                className={`${BTN} bg-[var(--oro-viejo)] text-black`}
                onClick={() => cerrar(resolverHueso())}
              >
                Tirar los huesos
              </button>
            )}

            {def.tipo === "ruleta" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`${BTN} bg-red-800 text-white`}
                  onClick={() => cerrar(resolverRuleta("rojo"))}
                >
                  Rojo
                </button>
                <button
                  className={`${BTN} bg-[#15100a] text-[var(--crema-brillo)]`}
                  onClick={() => cerrar(resolverRuleta("negro"))}
                >
                  Negro
                </button>
              </div>
            )}

            {def.tipo === "suma15" && (
              <>
                <p className="text-center font-bebas text-2xl text-[var(--oro)]">
                  Mesa: {escoba.mesa}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {escoba.opciones.map((c, i) => (
                    <button
                      key={`${c}-${i}`}
                      className={`${BTN} bg-[var(--oro-viejo)] text-black`}
                      onClick={() => cerrar(resolverSuma15(escoba.mesa, c))}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}

            {def.tipo === "carta-alta" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`${BTN} bg-[var(--oro-viejo)] text-black`}
                  onClick={() => cerrar(resolverVeintiuno(false))}
                >
                  Plantarse
                </button>
                <button
                  className={`${BTN} bg-red-800 text-white`}
                  onClick={() => cerrar(resolverVeintiuno(true))}
                >
                  Pedir carta
                </button>
              </div>
            )}

            {def.tipo === "monte" && (
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={`${BTN} bg-[var(--oro-viejo)] text-black`}
                    onClick={() => cerrar(resolverMonte(i, reinaMonte))}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            <button
              className="min-h-[44px] text-[12px] font-black uppercase tracking-[0.2em] text-[var(--crema-clara)]/60"
              onClick={onCerrar}
            >
              Ir directo a los dados
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
