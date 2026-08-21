import { create } from "zustand";
import { useEffect } from "react";

interface UiScrimState {
  count: number;
  push: () => void;
  pop: () => void;
}

export const useUiScrim = create<UiScrimState>((set) => ({
  count: 0,
  push: () => set((s) => ({ count: s.count + 1 })),
  pop: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));

export function useScrimLock(active: boolean) {
  const push = useUiScrim((s) => s.push);
  const pop = useUiScrim((s) => s.pop);
  useEffect(() => {
    if (!active) return;
    push();
    return () => pop();
  }, [active, push, pop]);
}
