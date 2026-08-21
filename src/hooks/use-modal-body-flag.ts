import { useEffect } from "react";

let openCount = 0;

/**
 * Marca el <body> mientras hay un modal abierto para que las UI fijas
 * de los juegos (zócalos, docks) puedan ocultarse debajo del overlay.
 */
export function useModalBodyFlag(open: boolean) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    openCount += 1;
    document.body.setAttribute("data-modal-open", "1");
    return () => {
      openCount = Math.max(0, openCount - 1);
      if (openCount === 0) document.body.removeAttribute("data-modal-open");
    };
  }, [open]);
}
