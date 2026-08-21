import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  clearPendingTourneyRoomToast,
  readPendingTourneyRoomToast,
  TOURNEY_ROOM_TOAST_EVENT,
  type TourneyRoomToastPayload,
} from "@/lib/tourney-room-toast";

type NoticeState = (TourneyRoomToastPayload & { at?: number }) | null;

export function TourneyRoomNotice() {
  const [notice, setNotice] = useState<NoticeState>(null);

  useEffect(() => {
    setNotice(readPendingTourneyRoomToast());

    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<TourneyRoomToastPayload>).detail;
      setNotice(detail);
    };

    window.addEventListener(TOURNEY_ROOM_TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(TOURNEY_ROOM_TOAST_EVENT, onToast as EventListener);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => {
      setNotice(null);
      clearPendingTourneyRoomToast();
    }, 5200);
    return () => window.clearTimeout(id);
  }, [notice]);

  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="pointer-events-none fixed bottom-32 left-4 z-40 w-[min(360px,calc(100vw-2rem))]"
        >
          <div className="rounded-sm border border-[var(--brass-bright)]/70 bg-[var(--noir)]/92 p-3 shadow-deep backdrop-blur">
            <div className="font-display text-[11px] uppercase tracking-[0.42em] text-[var(--brass)]/85">
              pizarra diaria
            </div>
            <div className="mt-1 font-script text-xl text-[var(--ivory)]">{notice.label}</div>
            <p className="mt-1 font-body text-xs italic text-[var(--smoke)]">
              Puntaje anotado: {notice.score.toLocaleString("es-AR")} · mejor del día:{" "}
              {notice.best.toLocaleString("es-AR")}
            </p>
            {notice.rewardGranted ? (
              <p className="mt-1 font-body text-xs text-[var(--brass-bright)]">
                +{notice.participationReward.toLocaleString("es-AR")} fichas por participar.
              </p>
            ) : (
              <p className="mt-1 font-body text-xs text-[var(--smoke)]/80">
                Tu propina de participación de hoy ya estaba cobrada.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
