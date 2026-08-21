import { useSwipeBack } from "@/hooks/use-swipe-back";

// La navegación lateral entre juegos por gesto se eliminó a propósito:
// deslizar dentro de una mesa saltaba a otro juego (p. ej. Chinchón → Póker).
export function SwipeBackGesture() {
  useSwipeBack();
  return null;
}
