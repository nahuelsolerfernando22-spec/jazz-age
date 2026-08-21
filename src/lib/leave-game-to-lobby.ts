import { toast } from "sonner";
import { useLives } from "@/store/lives";
import { useGameLock } from "@/store/gameLock";
import { useGamePause } from "@/store/game-pause";
import { useMembership } from "@/store/membership";
import { exitToMainMenu } from "@/lib/exit-to-menu";

type Navigator = (opts: { to: string }) => void | Promise<unknown>;

let lastPenalizedSession = -1;

export function leaveGameToLobby(navigate: Navigator): void {
  const lockState = useGameLock.getState();
  // Sólo se penaliza si la mesa estaba bloqueada Y la partida ya arrancó.
  // Salir antes del primer movimiento nunca cuesta vidas, igual que ser socio.
  const member = useMembership.getState().member;
  const inGame = lockState.locked && lockState.started && !member;
  const sessionId = lockState.sessionId;
  const alreadyPenalized = inGame && sessionId === lastPenalizedSession;
  let lostLife = false;
  if (inGame && !alreadyPenalized) {
    lostLife = useLives.getState().current > 0 && useLives.getState().spend();
    lastPenalizedSession = sessionId;
  }

  useGamePause.getState().setPaused(false);
  useGameLock.getState().setLocked(false);
  try {
    exitToMainMenu();
  } catch {
    /* noop */
  }
  void navigate({ to: "/single" });

  setTimeout(() => {
    const remaining = useLives.getState().current;
    const livesLabel = `Te queda${remaining === 1 ? "" : "n"} ${remaining} vida${remaining === 1 ? "" : "s"}.`;
    if (!inGame) {
      toast("Partida cancelada", {
        description: `Sin penalización. ${livesLabel}`,
        duration: 3200,
      });
    } else if (alreadyPenalized) {
      toast("Volviste al lobby", {
        description: livesLabel,
        duration: 2600,
      });
    } else if (lostLife) {
      toast.error("Perdiste 1 vida por abandonar", {
        description: livesLabel,
        duration: 3800,
      });
    } else {
      toast("Volviste al lobby", {
        description: "Sin vidas para descontar — quedaste en 0.",
        duration: 3200,
      });
    }
  }, 60);
}
