import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { getRoomNote } from "@/lib/room-notes";
import { getTimeMeta } from "@/lib/time-of-day";
import { useUiScrim } from "@/store/ui-scrim";

const GAME_ROUTES_WITH_ACTION_BAR = new Set<string>([
  "/mahjong",
  "/chinchon",
  "/escoba",
  "/solitario",
  "/bagatelle",
  "/blackjack",
  "/ruleta",
  "/dados",
  "/truco",
]);

export function RoomNotePin() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const note = getRoomNote(pathname);
  const whisper = getTimeMeta().whisper;
  const storageKey = `room-note:dismissed:${pathname}:${new Date().toDateString()}`;
  const [open, setOpen] = useState(true);
  const scrimCount = useUiScrim((s) => s.count);

  useEffect(() => {
    try {
      setOpen(sessionStorage.getItem(storageKey) !== "1");
    } catch {}
  }, [storageKey]);

  if (!open || !note) return null;
  if (scrimCount > 0) return null;
  if (GAME_ROUTES_WITH_ACTION_BAR.has(pathname)) return null;

  return (
    <div
      className="pointer-events-auto fixed z-30 max-w-[280px] rotate-[-1.5deg] rounded-sm border border-amber-500/40 bg-[oklch(0.14_0.04_65/0.92)] p-3 pr-6 shadow-[0_6px_20px_oklch(0_0_0/0.5)] backdrop-blur-sm"
      style={{
        left: "calc(env(safe-area-inset-left, 0px) + 12px)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 148px)",
      }}
      role="note"
      aria-label="Nota del día en la sala"
    >
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          try {
            sessionStorage.setItem(storageKey, "1");
          } catch {}
        }}
        className="absolute right-0 top-0 grid h-11 w-11 place-items-center text-lg leading-none text-amber-200/60 hover:text-amber-100"
        aria-label="Cerrar nota"
      >
        ×
      </button>
      <div className="text-[11px] uppercase tracking-[0.28em] text-amber-400/70">Nota del día</div>
      <p className="mt-1 font-serif text-[12px] italic leading-snug text-amber-100/90">{note}</p>
      <p className="mt-2 text-[11px] italic text-amber-200/50">— {whisper}</p>
    </div>
  );
}
