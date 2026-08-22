import React from "react";
import { motion } from "framer-motion";
import { SyndicateCard, esTrioValido, mejorTrio, debeCanjearObligado } from "@/store/syndicate";
import { REGLAS_NAIPES, faccionDe } from "@/lib/sindicato-facciones";

interface Props {
  cards: SyndicateCard[];
  factionId?: string;
  onTrade: (cardIds: string[]) => void;
  onPlaySpecial?: (cardId: string) => void;
  onClose: () => void;
}

export const TacticalCardsModal = ({
  cards,
  factionId,
  onTrade,
  onPlaySpecial,
  onClose,
}: Props) => {
  const [showRules, setShowRules] = React.useState(false);
  const faccion = faccionDe(factionId);
  const [selectedCards, setSelectedCards] = React.useState<string[]>([]);

  const toggleCard = (id: string) => {
    setSelectedCards((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const canTrade = React.useMemo(
    () => esTrioValido(cards.filter((c) => selectedCards.includes(c.id))),
    [selectedCards, cards],
  );

  /** Mano llena con trío disponible: la mesa obliga a canjear. */
  const canjeObligado = React.useMemo(() => debeCanjearObligado(cards), [cards]);

  /** Marca automáticamente el mejor trío legal, cuidando los comodines. */
  const marcarMejorTrio = React.useCallback(() => {
    const trio = mejorTrio(cards);
    if (trio) setSelectedCards(trio.map((c) => c.id));
  }, [cards]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
    >
      <div className="paria-card max-w-lg w-full p-6 border-4 border-[var(--oro)] bg-[var(--cd-noir-2)] relative shadow-[0_0_100px_rgba(0,0,0,1)]">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--oro)] text-black px-8 py-2 font-bebas text-2xl rotate-[-2deg] border-[3px] border-black shadow-[4px_4px_0_#000] whitespace-nowrap">
          NAIPES DEL SINDICATO
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--oro)] text-3xl hover:scale-110 transition-transform"
        >
          ×
        </button>

        <div className="mt-8 rounded-xl border-2 border-[var(--oro)]/50 bg-black/60 p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--oro)]">
            Facción · {faccion.nombre} {faccion.sello}
          </p>
          <p className="mt-1 text-[11px] font-bold leading-snug text-[var(--crema-clara)]/90">
            {faccion.efecto}
          </p>
        </div>

        {canjeObligado && (
          <div className="mt-3 rounded-lg border-2 border-red-500/70 bg-red-950/40 p-2 text-center">
            <p className="text-[11px] font-black uppercase tracking-widest text-red-300">
              Mano llena · canje obligatorio
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={marcarMejorTrio}
          className="mt-3 min-h-11 w-full rounded-lg border-2 border-[var(--oro)]/60 bg-black/50 px-3 text-[11px] font-black uppercase tracking-widest text-[var(--oro)] active:scale-95"
        >
          Marcar mejor trío
        </button>

        <div className="mt-3 grid grid-cols-3 gap-3 mb-4 overflow-y-auto max-h-[42vh] p-2">
          {cards.map((card, idx) => {
            const isSelected = selectedCards.includes(card.id);
            return (
              <motion.div
                key={card.id}
                initial={{ rotateY: 90 }}
                animate={{ rotateY: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => toggleCard(card.id)}
                className={`aspect-[2/3] bg-[var(--crema-clara)] border-[3px] rounded-lg shadow-[4px_4px_0_rgba(0,0,0,1)] relative overflow-hidden group cursor-pointer transition-all ${
                  isSelected
                    ? "border-[var(--oro)] -translate-y-2 scale-105 ring-4 ring-[var(--oro)]/30"
                    : "border-black"
                }`}
              >
                <div className="absolute inset-0 bg-black/5" />
                {isSelected && <div className="absolute inset-0 bg-[var(--oro)]/10" />}

                <div className="p-2 h-full flex flex-col items-center justify-between text-black relative z-10">
                  <span className="text-[11px] font-black uppercase tracking-tighter self-start">
                    {card.type ? "ESPECIAL" : card.symbol}
                  </span>

                  <div className="w-12 h-12 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                    {card.type === "bribe" && <span className="text-4xl">💰</span>}
                    {card.type === "informant" && <span className="text-4xl">👁️</span>}
                    {card.type === "surprise" && <span className="text-4xl">⚡</span>}
                    {!card.type && (
                      <>
                        {card.symbol === "infantry" && <span className="text-4xl">🔫</span>}
                        {card.symbol === "cavalry" && <span className="text-4xl">🛡️</span>}
                        {card.symbol === "artillery" && <span className="text-4xl">🎰</span>}
                        {card.symbol === "wildcard" && <span className="text-4xl">🃏</span>}
                      </>
                    )}
                  </div>

                  <div className="text-[11px] font-bold text-center leading-none uppercase tracking-widest bg-black/10 p-1 w-full rounded">
                    {card.type === "bribe"
                      ? "SOBORNO (+1 DADO)"
                      : card.type === "informant"
                        ? "CHIVATO (VER TROPAS)"
                        : card.type === "surprise"
                          ? "GOLPE (+3 TROPAS)"
                          : card.territoryId.replace("terr-", "ZONA ")}
                  </div>

                  {card.type && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaySpecial?.(card.id);
                      }}
                      className="mt-1 w-full py-1 bg-black text-[var(--oro)] text-[11px] font-black rounded uppercase hover:bg-[var(--oro)] hover:text-black transition-colors"
                    >
                      JUGAR
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {cards.length === 0 ? (
          <p className="mb-4 text-center text-[11px] italic text-[var(--crema-clara)]/80">
            Todavía no tenés naipes. Conquistá un sector para ganar uno.
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setShowRules((v) => !v)}
          className="mb-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--oro)]/50 bg-black/60 font-bebas text-lg text-[var(--oro)]"
        >
          {showRules ? "OCULTAR REGLAS" : "REGLAS DEL MAZO"}
        </button>

        {showRules ? (
          <div className="mb-4 max-h-[30vh] space-y-2 overflow-y-auto rounded-xl border-2 border-[var(--oro)]/40 bg-black/70 p-3">
            {REGLAS_NAIPES.map((r) => (
              <div key={r.titulo} className="flex gap-2">
                <span className="text-base leading-none">{r.icono}</span>
                <div>
                  <p className="font-bebas text-base leading-none text-[var(--oro-palido)]">
                    {r.titulo}
                  </p>
                  <p className="text-[11px] leading-snug text-[var(--crema-clara)]/80">{r.regla}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex gap-4">
          <button
            disabled={!canTrade}
            className="flex-1 py-4 bg-[var(--oro)] text-black font-bebas text-2xl rounded-xl shadow-[6px_6px_0_#000] active:translate-y-1 active:shadow-none border-2 border-black disabled:opacity-30 transition-all"
            onClick={() => onTrade(selectedCards)}
          >
            {canTrade ? "EJECUTAR CANJE" : "ELEGÍ 3 NAIPES"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
