import { useState } from "react";
import { MobileSheet } from "@/components/ui/MobileSheet";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Objetivo y mazo",
    body: [
      "Se juega uno contra uno con mazo español de 40 cartas (1-7, 10, 11, 12 × oros, copas, espadas, bastos).",
      "Gana quien llega primero a la meta pactada (15 o 30 puntos). En cada mano se reparten 3 cartas a cada uno.",
      "El «mano» es quien juega primero y gana los empates en el envido. En la siguiente partida el mano rota.",
    ],
  },
  {
    title: "Jerarquía de cartas (de la más fuerte a la más débil)",
    body: [
      "1. As de espadas (macho).",
      "2. As de bastos (hembra).",
      "3. 7 de espadas.",
      "4. 7 de oros.",
      "5. Los tres · 6. Los dos · 7. Ases falsos (oros y copas).",
      "8. Reyes (12) · 9. Caballos (11) · 10. Sotas (10).",
      "11. 7 falsos (copas y bastos) · 12. Los seis · 13. Los cinco · 14. Los cuatro.",
      "Cartas del mismo valor entre sí empardan (baza parda).",
    ],
  },
  {
    title: "Cómo se gana la mano",
    body: [
      "Se juegan hasta 3 bazas. Gana la mano quien gane 2 bazas.",
      "Si se emparda la 1ª, decide la 2ª. Si se emparda la 2ª o la 3ª, pesa la 1ª ganada.",
      "Si se empardan las tres, gana el que era mano.",
      "El valor de la mano depende del truco cantado (1, 2, 3 o 4 puntos).",
    ],
  },
  {
    title: "Envido (sólo en la 1ª baza)",
    body: [
      "Se cuenta con dos cartas del mismo palo: 20 + los dos números más altos. Las figuras (10, 11, 12) valen 0.",
      "Con una sola carta o sin par de palo, cuenta la carta más alta que no sea figura.",
      "Envido = 2 · Real envido = +3 · Falta envido = los puntos que le faltan al que va ganando.",
      "Se pueden encadenar: «Envido - envido - real - falta». Máximo 2 «envido» seguidos.",
      "«No quiero» paga el nivel anterior (mínimo 1). En empate de tantos, gana el mano.",
      "Sólo se puede cantar antes de que el mano tire su primera carta (o el pie, si el mano no la tiró).",
    ],
  },
  {
    title: "Truco",
    body: [
      "Truco = 2 puntos · Retruco = 3 · Vale 4 = 4.",
      "Sólo puede subirlo el equipo que aceptó (queriendo) el canto anterior.",
      "«No quiero» paga el nivel anterior. Si nadie cantó truco, la mano vale 1.",
      "Se puede cantar en cualquier momento (excepto con un canto ya pendiente).",
    ],
  },
  {
    title: "«El envido está primero»",
    body: [
      "Si el rival te canta truco en la 1ª baza y el envido aún no se resolvió, podés cortar diciendo envido/real/falta.",
      "Se resuelve el envido primero. Después, el truco pendiente vuelve automáticamente y hay que responderlo.",
    ],
  },
  {
    title: "Flor (si se juega con flor)",
    body: [
      "Tres cartas del mismo palo = flor. Vale 3 puntos. Es obligatorio cantarla si la tenés.",
      "La flor tapa un envido pendiente (el envido no paga puntos).",
      "Contraflor = 6 · Contraflor al resto = 9. Si el rival no tiene flor, se achica y paga.",
    ],
  },
  {
    title: "Ir al mazo",
    body: [
      "Si abandonás la mano, el rival se lleva los puntos en juego del truco (mínimo 1).",
      "Cualquier envido o flor pendiente que estabas por responder cuenta como «no quiero».",
      "Útil cuando te cantan retruco o vale 4 y tenés cartas muy flojas.",
    ],
  },
  {
    title: "Atajos de teclado",
    body: [
      "1 · 2 · 3 — jugar la 1ª, 2ª o 3ª carta de tu mano.",
      "E — cantar envido · T — cantar truco · F — cantar flor.",
      "Q — quiero · N — no quiero.",
    ],
  },
];

export function TrucoRulesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      eyebrow={`${idx + 1} / ${SECTIONS.length}`}
      title={`Tutorial · ${SECTIONS[idx]!.title}`}
      footer={
        <div className="flex w-full items-center justify-between gap-2 handed-row">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="tap-comfort rounded border border-[var(--brass)]/50 px-4 text-sm tracking-widest text-[var(--brass)] active:bg-[var(--brass)]/10 disabled:opacity-30"
          >
            ← Anterior
          </button>
          <div className="flex gap-1.5">
            {SECTIONS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ir al capítulo ${i + 1}`}
                className={`h-3 w-3 rounded-full transition-colors ${i === idx ? "bg-[var(--brass)]" : "bg-[var(--brass)]/25"}`}
              />
            ))}
          </div>
          {idx < SECTIONS.length - 1 ? (
            <button
              onClick={() => setIdx((i) => Math.min(SECTIONS.length - 1, i + 1))}
              className="tap-comfort rounded bg-[var(--brass)] px-4 text-sm font-semibold tracking-widest text-[var(--noir)] active:brightness-110"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="tap-comfort rounded bg-[var(--brass)] px-4 text-sm font-semibold tracking-widest text-[var(--noir)] active:brightness-110"
            >
              Listo
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-2 px-4 py-4 text-[14px] leading-relaxed text-[var(--ivory)]/90">
        {SECTIONS[idx]!.body.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </MobileSheet>
  );
}
