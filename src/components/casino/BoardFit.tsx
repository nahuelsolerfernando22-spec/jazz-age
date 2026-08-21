import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { getStableVh } from "@/hooks/use-stable-viewport";

interface Props {
  children: ReactNode;
  maxScale?: number;
  minScale?: number;
  reserveTop?: number;
  reserveBottom?: number;
  align?: "top" | "center";
  className?: string;
}

export function BoardFit({
  children,
  maxScale = 1.4,
  minScale = 0.6,
  reserveTop = 0,
  reserveBottom = 0,
  align = "top",
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [boxH, setBoxH] = useState<number>(0);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const compute = () => {
      const availW = wrap.clientWidth;
      // svh estable: la barra del navegador de Android no re-escala el tablero.
      const vh = getStableVh();
      const availH = Math.max(240, vh - reserveTop - reserveBottom);
      const naturalW = inner.scrollWidth || 1;
      const naturalH = inner.scrollHeight || 1;
      const s = Math.max(minScale, Math.min(maxScale, availW / naturalW, availH / naturalH));
      setScale(s);
      setBoxH(naturalH * s);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    ro.observe(inner);
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, [maxScale, minScale, reserveTop, reserveBottom]);

  return (
    <div
      ref={wrapRef}
      className={"relative w-full " + (className ?? "")}
      style={{ height: boxH || undefined }}
    >
      <div
        ref={innerRef}
        className="absolute left-1/2"
        style={{
          top: align === "center" ? "50%" : 0,
          transform:
            align === "center"
              ? `translate(-50%, -50%) scale(${scale})`
              : `translateX(-50%) scale(${scale})`,
          transformOrigin: align === "center" ? "center" : "top center",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
