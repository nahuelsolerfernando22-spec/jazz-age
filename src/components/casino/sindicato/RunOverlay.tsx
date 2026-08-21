import { useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Skull, Trophy } from "lucide-react";
import { useSyndicateRun } from "@/store/syndicate-run";
import { useSyndicate } from "@/store/syndicate";
import { useHaptics } from "@/hooks/use-haptics";
import { ofrecerRecompensa, OLAS_TOTALES } from "@/lib/sindicato-run";

/**
 * Capa roguelike de la partida: botín entre oleadas, muerte permanente
 * y cierre de la noche. Sin mapa de campaña: todo pasa en la misma mesa.
 */
export function RunOverlay() {
  const haptics = useHaptics();
  const status = useSyndicateRun((s) => s.status);
  const seed = useSyndicateRun((s) => s.seed);
  const ola = useSyndicateRun((s) => s.ola);
  const olasSuperadas = useSyndicateRun((s) => s.olasSuperadas);
  const ultimaRecompensa = useSyndicateRun((s) => s.ultimaRecompensa);
  const takeTalisman = useSyndicateRun((s) => s.takeTalisman);
  const takeNaipe = useSyndicateRun((s) => s.takeNaipe);
  const avanzarOla = useSyndicateRun((s) => s.avanzarOla);
  const startRun = useSyndicateRun((s) => s.startRun);
  const resetGame = useSyndicate((s) => s.resetGame);

  const botin = useMemo(() => ofrecerRecompensa(seed, ola), [seed, ola]);

  if (status !== "reward" && status !== "dead" && status !== "won") return null;

  const nuevaMesa = () => {
    resetGame();
    useSyndicate.setState({ gameStarted: false, winner: null, secretObjective: null });
  };

  const seguir = () => {
    nuevaMesa();
    avanzarOla();
    haptics("heavy");
  };

  const otraNoche = () => {
    nuevaMesa();
    startRun();
    haptics("heavy");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/85 px-4 pb-8 pt-16 backdrop-blur-sm overflow-y-auto">
      <motion.section
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md space-y-4 rounded-2xl border-2 border-[var(--oro-viejo)]/70 bg-[#15110c] p-5 shadow-[0_16px_60px_rgba(0,0,0,0.95)]"
      >
        {status === "reward" ? (
          <>
            <header className="space-y-1">
              <h2 className="font-bebas text-3xl tracking-wider text-[var(--crema-brillo)]">
                BOTÍN DEL ASALTO
              </h2>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--oro)]">
                Oleada {ola} de {OLAS_TOTALES} superada · elegí una carta o un talismán
              </p>
            </header>
            <div className="space-y-2">
              {botin.talismanes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    takeTalisman(t.id);
                    toast.success(`${t.nombre} en el bolsillo.`);
                    seguir();
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border-2 border-[var(--oro)]/50 bg-black/50 p-3 text-left active:scale-[0.98] transition-transform"
                >
                  <span className="text-2xl">{t.icono}</span>
                  <span className="min-w-0">
                    <span className="block font-bebas text-lg text-[var(--oro-palido)]">
                      {t.nombre}
                    </span>
                    <span className="block text-xs font-bold text-[var(--crema-clara)]">
                      {t.efecto}
                    </span>
                  </span>
                </button>
              ))}
              {botin.naipes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    takeNaipe(n.id);
                    toast.success(`${n.nombre} sumado al mazo.`);
                    seguir();
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border-2 border-[#3E7C8C]/60 bg-black/50 p-3 text-left active:scale-[0.98] transition-transform"
                >
                  <span className="text-2xl">{n.icono}</span>
                  <span className="min-w-0">
                    <span className="block font-bebas text-lg text-[#9fd3e0]">{n.nombre}</span>
                    <span className="block text-xs font-bold text-[var(--crema-clara)]">
                      {n.efecto}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={seguir}
              className="h-12 w-full rounded-xl border-2 border-[var(--oro)]/40 font-bebas text-lg tracking-wider text-[var(--oro-palido)]"
            >
              SEGUIR SIN TOCAR NADA
            </button>
          </>
        ) : null}

        {status === "dead" ? (
          <div className="space-y-4 text-center">
            <Skull className="mx-auto text-red-600" size={40} />
            <h2 className="font-bebas text-3xl tracking-wider text-red-200">
              TE LEVANTARON DE LA MESA
            </h2>
            <p className="text-sm font-bold text-[var(--crema-clara)]">
              Aguantaste {olasSuperadas} oleadas. Te llevás {ultimaRecompensa} favores del Cuervo.
            </p>
            <button
              type="button"
              onClick={otraNoche}
              className="h-14 w-full rounded-xl border-2 border-black bg-[var(--oro)] font-bebas text-2xl text-black shadow-[0_5px_0_#000] active:translate-y-1 active:shadow-none transition-all"
            >
              OTRA NOCHE
            </button>
          </div>
        ) : null}

        {status === "won" ? (
          <div className="space-y-4 text-center">
            <Trophy className="mx-auto text-[var(--oro-palido)]" size={40} />
            <h2 className="font-bebas text-3xl tracking-wider text-[var(--oro-palido)]">
              LA CIUDAD ES TUYA
            </h2>
            <p className="text-sm font-bold text-[var(--crema-clara)]">
              +{ultimaRecompensa} favores del Cuervo.
            </p>
            <button
              type="button"
              onClick={otraNoche}
              className="h-14 w-full rounded-xl border-2 border-black bg-[var(--oro)] font-bebas text-2xl text-black shadow-[0_5px_0_#000] active:translate-y-1 active:shadow-none transition-all"
            >
              NUEVA NOCHE
            </button>
          </div>
        ) : null}
      </motion.section>
    </div>
  );
}
