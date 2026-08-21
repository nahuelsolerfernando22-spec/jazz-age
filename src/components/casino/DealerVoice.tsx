import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { pushNpcCallback, useNpcCallback } from "@/lib/npc-callbacks";

export type DealerMood = "idle" | "win" | "lose" | "taunt";

interface DealerVoiceProps {
  portrait: string;
  name: string;
  line: string;
  mood?: DealerMood;
  accent?: string;
  npcId?: string;
}

const MOOD_BORDER: Record<DealerMood, string> = {
  idle: "oklch(0.55 0.10 65)",
  win: "oklch(0.55 0.22 25)",
  lose: "oklch(0.85 0.18 75)",
  taunt: "oklch(0.78 0.20 25)",
};

export function DealerVoice({
  portrait,
  name,
  line,
  mood = "idle",
  accent,
  npcId,
}: DealerVoiceProps) {
  const ring = accent ?? MOOD_BORDER[mood];

  const lastLine = useRef<string>("");
  useEffect(() => {
    if (!npcId || !line || line === lastLine.current) return;
    lastLine.current = line;
    pushNpcCallback({
      npcId,
      text: line,
      source: "dealer",
      priority: mood === "win" || mood === "lose" ? 65 : 50,
      ttl: 4500,
    });
  }, [line, npcId, mood]);
  const cb = useNpcCallback(npcId ?? null);
  const shown = cb?.text ?? line;
  return (
    <div className="flex items-center gap-3">
      <motion.div
        key={`${name}-${mood}`}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative size-16 shrink-0 overflow-hidden rounded-full border-2"
        style={{
          borderColor: ring,
          boxShadow: `0 0 14px ${ring}66, inset 0 0 8px oklch(0 0 0 / 0.5)`,
        }}
      >
        <img
          src={portrait}
          alt={name}
          className="h-full w-full object-cover"
          draggable={false}
          width={128}
          height={128}
          loading="lazy"
          decoding="async"
        />
      </motion.div>
      <div className="relative min-w-0 flex-1">
        <div
          className="font-display text-[11px] uppercase tracking-[0.4em]"
          style={{ color: ring }}
        >
          ─ {name} ─
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={shown}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="relative mt-1 inline-block max-w-full rounded-sm border bg-[var(--noir)]/85 px-3 py-1.5 backdrop-blur"
            style={{
              borderColor: `${ring}88`,
              boxShadow: `0 0 10px ${ring}33`,
            }}
          >
            {}
            <span
              aria-hidden
              className="absolute -left-1.5 top-3 size-3 rotate-45 border-b border-l"
              style={{
                background: "var(--noir)",
                borderColor: `${ring}88`,
              }}
            />
            <p className="font-script text-sm leading-tight text-[var(--ivory)]">
              &ldquo;{shown}&rdquo;
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
