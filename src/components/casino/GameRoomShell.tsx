import { type ReactNode } from "react";
import { CasinoHUD } from "@/components/casino/CasinoHUD";
import { RoomBreadcrumbs } from "@/components/casino/RoomBreadcrumbs";
import { NpcDialogueBubble } from "@/components/casino/NpcDialogueBubble";
import { SceneFrame } from "@/components/casino/SceneFrame";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { GameSkeleton } from "@/components/casino/ui/GameStates";
import { useRoomAssetGate } from "@/hooks/use-room-asset-gate";

export interface GameRoomShellProps {
  bg: string;
  bgMedium?: string;
  bgHeavy?: string;
  room?: string;
  title: string;
  subtitle?: string;
  npcId?: string;
  npcRoom?: string;
  children: ReactNode;
}

export function GameRoomShell({
  bg,
  bgMedium,
  bgHeavy,
  room,
  title,
  subtitle,
  npcId,
  npcRoom,
  children,
}: GameRoomShellProps) {
  useWakeLock(true);
  const roomId = room ?? title.toLowerCase().replace(/\s+/g, "-");
  // El fondo se muestra igual detrás del esqueleto: no hace falta esperarlo tanto.
  // 600 ms alcanza para el caso en caché y evita la sensación de sala trabada.
  const ready = useRoomAssetGate([bg], 600);
  return (
    <SceneFrame
      bg={bg}
      bgMedium={bgMedium}
      bgHeavy={bgHeavy}
      room={roomId}
      title={title}
      subtitle={subtitle}
    >
      <CasinoHUD />
      <RoomBreadcrumbs />
      {npcId ? <NpcDialogueBubble npcId={npcId} room={npcRoom ?? `/${roomId}`} /> : null}
      {ready ? (
        children
      ) : (
        <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 py-8">
          <GameSkeleton label={`Preparando ${title.toLowerCase()}…`} minH={280} />
        </div>
      )}
    </SceneFrame>
  );
}
