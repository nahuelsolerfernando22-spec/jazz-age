import { useEffect, useState } from "react";

export { useOrientationLock } from "./use-orientation-lock";

export type Orientation = "portrait" | "landscape";

function read(): Orientation {
  if (typeof window === "undefined") return "portrait";
  return window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait";
}

export function useOrientation(): Orientation {
  const [o, setO] = useState<Orientation>(read);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const handler = () => setO(mq.matches ? "landscape" : "portrait");
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  useEffect(() => {
    document.body.dataset.orient = o;
    return () => {
      delete document.body.dataset.orient;
    };
  }, [o]);
  return o;
}
