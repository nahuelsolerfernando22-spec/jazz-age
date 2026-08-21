import { useEffect } from "react";

export type RouteVeil = "none" | "soft" | "default" | "strong" | "opaque";

export function useRouteVeil(level: RouteVeil = "default"): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.dataset.veil;
    if (level === "default") {
      delete document.body.dataset.veil;
    } else {
      document.body.dataset.veil = level;
    }
    return () => {
      if (prev === undefined) {
        delete document.body.dataset.veil;
      } else {
        document.body.dataset.veil = prev;
      }
    };
  }, [level]);
}
