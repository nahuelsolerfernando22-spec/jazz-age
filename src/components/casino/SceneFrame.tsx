import { motion } from "framer-motion";
import { ReactNode, Suspense } from "react";
import { RoomBackdrop } from "@/components/casino/RoomBackdrop";
import { RoomRestingOverlay } from "@/components/casino/RoomRestingOverlay";
import { VenueClimateBadge } from "@/components/casino/VenueClimateBadge";
import { SpectatorPill } from "@/components/casino/SpectatorPill";
import { TimeOfDayLayer } from "@/components/casino/TimeOfDayLayer";
import { RoomNotePin } from "@/components/casino/RoomNotePin";
import { TourneyRoomNotice } from "@/components/casino/TourneyRoomNotice";
import { useOrientationLock } from "@/hooks/use-orientation";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { accentFor } from "@/lib/room-accents";
import { GameSkeleton } from "@/components/casino/ui/GameStates";
import { SceneErrorBoundary } from "@/components/casino/ui/SceneErrorBoundary";
import { GamePauseButton } from "@/components/casino/GamePauseButton";
import { FitToScreen } from "@/components/casino/FitToScreen";

const TABLE_ROOMS = new Set(["tables", "blackjack", "ruleta", "escoba", "chinchon", "truco"]);

interface SceneFrameProps {
  bg: string;
  bgMedium?: string;
  bgHeavy?: string;
  room?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SceneFrame({
  bg,
  bgMedium,
  bgHeavy,
  room,
  title,
  subtitle,
  children,
}: SceneFrameProps) {
  const roomId = room ?? title.toLowerCase().replace(/\s+/g, "-");
  const accent = accentFor(roomId);
  const isTable = TABLE_ROOMS.has(roomId);
  useOrientationLock("portrait");
  useSwipeBack();
  return (
    <main
      className="cuervo-game-root cuervo-scene-fit isolate relative flex min-h-svh flex-col overflow-x-hidden pb-6 sm:pb-16"
      data-game={roomId}
      style={{
        paddingTop: "var(--chrome-h)",
        // Sólo reservamos la barra nativa + safe-area: el colchón extra de 96px
        // robaba altura útil y forzaba a comprimir el juego en pantallas chicas.
        paddingBottom:
          "max(0.75rem, calc(var(--app-tabbar-h, 0px) + env(safe-area-inset-bottom, 0px) + 12px))",
      }}
    >
      {}
      {/* `overflow-hidden` es obligatorio: la copia difuminada del fondo se
          escala un 12% y sin recorte alarga el documento ~48px, lo que en
          Android provoca el rebote/scroll vertical dentro de los juegos. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <RoomBackdrop room={roomId} light={bg} medium={bgMedium} heavy={bgHeavy} />
        {}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent var(--room-scrim-radial-stop,58%), rgb(0 0 0 / var(--room-scrim-alpha,0.4)) 100%)",
          }}
        />
        {}
        <div
          className="absolute inset-0 mix-blend-soft-light"
          style={{
            background: `radial-gradient(ellipse at 20% 15%, ${accent.glow} 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, ${accent.glowAlt} 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgb(10 6 4 / var(--room-scrim-alpha-bottom,0.38)))",
          }}
        />
        {}
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 30%, oklch(0.6 0.05 60 / 0.18) 1px, transparent 1px), radial-gradient(circle at 75% 70%, oklch(0.5 0.05 60 / 0.14) 1px, transparent 1px)",
            backgroundSize: "3px 3px, 4px 4px",
          }}
        />
        {}
        <TimeOfDayLayer />
      </div>

      {}
      <span className="sr-only">
        {title}
        {subtitle ? ` · ${subtitle}` : ""}
      </span>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative z-10 flex min-h-0 flex-1 flex-col"
      >
        {}
        <SceneErrorBoundary scope={title}>
          <Suspense
            fallback={
              <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 py-8">
                <GameSkeleton label={`Preparando ${title.toLowerCase()}…`} minH={280} />
              </div>
            }
          >
            <FitToScreen>{children}</FitToScreen>
          </Suspense>
        </SceneErrorBoundary>
      </motion.section>

      <RoomRestingOverlay gameId={roomId} />
      <VenueClimateBadge />
      <SpectatorPill room={roomId} />
      <RoomNotePin />
      <TourneyRoomNotice />
      <GamePauseButton />
    </main>
  );
}
