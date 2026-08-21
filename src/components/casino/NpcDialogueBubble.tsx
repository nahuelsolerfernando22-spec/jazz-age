import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNpcDialogue } from "@/hooks/use-npc-dialogue";
import { trackNpcVisit } from "@/lib/last-room";
import type { Situation } from "@/lib/dialogue";

interface Props {
  npcId: string;
  room: string;
  outcome?: Situation | null;
}

const DISPLAY_NAME: Record<string, string> = {
  corvina: "Madame Corvina",
  perla: "Perla · La Marea",
  celeste: "Celeste Dauphin",
  vita: "Vita · Las Cuchillas",
  zulme: "Alice",
  eloise: "Condesa Eloise",
  jade: "Jade · Ojo de Dragón",
  yolanda: "Yolanda · La Habanera",
  lola: "Lola · La Suerte",
  zelda: "Zelda · La Adivina",
  remedios: "Remedios · La Pulga",
  anahit: "Anahit Sarkisian",
  mirla: "Mirla",
  bettie: "Black Bettie",
  eulalia: "Eulalia",
  clara: "Clara · La Rueda",
  salome: "Salomé · La Velada",
  shauna: "Shauna",
  lin: "Lin · Ojo de Dragón",
  luisa: "Luisa · La Baraja",
  opal: "Opal · La Cuadrícula",
};

function prettyName(id: string): string {
  if (DISPLAY_NAME[id]) return DISPLAY_NAME[id];
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function NpcDialogueBubble({ npcId, room, outcome = null }: Props) {
  const { line } = useNpcDialogue(npcId, room, outcome ?? null);
  useEffect(() => {
    trackNpcVisit(npcId);
  }, [npcId]);
  const shown = line;
  if (!shown) return null;
  const tag: string | null = null;
  const name = prettyName(npcId);

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-40 hidden max-w-[19rem] sm:block sm:max-w-sm"
      style={{ filter: "drop-shadow(0 8px 22px oklch(0 0 0 / 0.55))" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={shown}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative rounded-[3px] border-2 px-4 pb-3 pt-5 backdrop-blur-md"
          style={{
            borderColor: "hsl(var(--brass) / 0.6)",
            background:
              "linear-gradient(180deg, hsl(var(--noir) / 0.94) 0%, hsl(var(--mahogany) / 0.9) 100%)",
            boxShadow: "inset 0 0 0 1px hsl(var(--brass) / 0.28), 0 0 0 1px hsl(var(--noir) / 0.6)",
          }}
        >
          {}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div
              className="rounded-[2px] border px-2.5 py-0.5 font-display text-[11px] uppercase tracking-[0.42em]"
              style={{
                color: "hsl(var(--brass-bright))",
                borderColor: "hsl(var(--brass) / 0.7)",
                background:
                  "linear-gradient(180deg, hsl(var(--mahogany)) 0%, hsl(var(--noir)) 100%)",
                boxShadow: "0 1px 0 hsl(var(--brass) / 0.35) inset",
              }}
            >
              {name}
            </div>
          </div>

          {}
          <span
            aria-hidden
            className="absolute left-1.5 top-1.5 h-1 w-1 rotate-45 border"
            style={{ borderColor: "hsl(var(--brass) / 0.75)" }}
          />
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 h-1 w-1 rotate-45 border"
            style={{ borderColor: "hsl(var(--brass) / 0.75)" }}
          />
          <span
            aria-hidden
            className="absolute left-1.5 bottom-1.5 h-1 w-1 rotate-45 border"
            style={{ borderColor: "hsl(var(--brass) / 0.75)" }}
          />
          <span
            aria-hidden
            className="absolute right-1.5 bottom-1.5 h-1 w-1 rotate-45 border"
            style={{ borderColor: "hsl(var(--brass) / 0.75)" }}
          />

          {}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-1.5 rounded-[2px]"
            style={{ border: "1px solid hsl(var(--brass) / 0.22)" }}
          />

          {tag && (
            <div
              className="mb-1.5 inline-block rounded-[1px] border px-1.5 py-[1px] font-display text-[11px] uppercase tracking-[0.28em]"
              style={{
                color: "oklch(0.92 0.08 30)",
                borderColor: "oklch(0.55 0.14 30 / 0.65)",
                background: "oklch(0.18 0.08 30 / 0.55)",
              }}
            >
              {tag}
            </div>
          )}

          <p
            className="relative font-script text-[15px] leading-snug"
            style={{ color: "hsl(var(--ivory))", textShadow: "0 1px 0 hsl(var(--noir) / 0.6)" }}
          >
            <span
              aria-hidden
              className="mr-1 align-top text-[18px]"
              style={{ color: "hsl(var(--brass-bright))" }}
            >
              &ldquo;
            </span>
            {shown}
            <span
              aria-hidden
              className="ml-0.5 align-top text-[18px]"
              style={{ color: "hsl(var(--brass-bright))" }}
            >
              &rdquo;
            </span>
          </p>

          {}
          <div
            aria-hidden
            className="absolute -bottom-2 left-6 h-3 w-3 rotate-45"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--mahogany) / 0.9) 0%, hsl(var(--mahogany) / 0.9) 100%)",
              borderRight: "2px solid hsl(var(--brass) / 0.6)",
              borderBottom: "2px solid hsl(var(--brass) / 0.6)",
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
