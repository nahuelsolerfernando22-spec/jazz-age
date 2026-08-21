import { useCallback, useState } from "react";
import { useLives } from "@/store/lives";
import { useMembership } from "@/store/membership";

export function useTryStart() {
  const spend = useLives((s) => s.spend);
  const tick = useLives((s) => s.tick);
  const member = useMembership((s) => s.member);
  const [gateOpen, setGateOpen] = useState(false);

  const tryStart = useCallback(
    (run: () => void) => {
      tick();

      if (member) {
        run();
        return true;
      }
      if (spend()) {
        run();
        return true;
      }
      setGateOpen(true);
      return false;
    },
    [spend, tick, member],
  );

  return {
    tryStart,
    gateOpen,
    closeGate: () => setGateOpen(false),
  };
}
