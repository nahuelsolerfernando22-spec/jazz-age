import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { SingleHostessBubble } from "@/components/single/SingleHostessBubble";
import { SingleBackdrop } from "@/components/single/SingleBackdrop";
import { Fragment } from "react";
import { warmSingleBackgrounds } from "@/lib/single-bg-preload";
import { warmLoadingPoses } from "@/lib/loading-poses";

interface Opts {
  overrideLine?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  compact?: boolean;
  backdropOnly?: boolean;
  /** @deprecated */
  mobileOnly?: boolean;
}

export function useSingleHostessCorner(gameId: string, opts?: Opts) {
  // En las mesas queda sólo una burbuja compacta (no reserva alto en el
  // layout); los retratos en grande viven en /camerinos.
  const backdropOnly = opts?.backdropOnly ?? false;
  const mobileOnly = opts?.mobileOnly ?? false;
  useEffect(() => {
    if (typeof document === "undefined") return;
    warmSingleBackgrounds();
    warmLoadingPoses();
    const host = document.createElement("div");
    host.setAttribute("data-single-hostess-corner", gameId);
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);
    const cornerNode = backdropOnly
      ? null
      : createElement(SingleHostessBubble, {
          gameId,
          overrideLine: opts?.overrideLine,
        });
    root.render(
      createElement(Fragment, null, createElement(SingleBackdrop, { gameId }), cornerNode),
    );
    return () => {
      const r = root;
      root = null;
      queueMicrotask(() => {
        try {
          r?.unmount();
        } catch {}
        if (host.parentNode) host.parentNode.removeChild(host);
      });
    };
  }, [gameId, opts?.overrideLine, opts?.position, opts?.compact, backdropOnly, mobileOnly]);
}
