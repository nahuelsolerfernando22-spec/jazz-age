import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useWear, type WearTier } from "@/lib/wear";
import { RoomGrime } from "@/components/casino/RoomGrime";
import { useImageReady } from "@/hooks/use-image-ready";

interface RoomBackdropProps {
  room: string;
  light: string;
  medium?: string;
  heavy?: string;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
}

const CROSSFADE_MS = 1400;
const CROSSFADE_EASE = [0.45, 0.05, 0.25, 1] as [number, number, number, number];
const NOISE_MS = 1600;

function RoomBackdropImpl({
  room,
  light,
  medium,
  heavy,
  imgClassName = "room-bg-img h-full w-full object-cover",
  imgStyle,
}: RoomBackdropProps) {
  const { cachedTier, resolveTier } = useWear(
    useShallow((s) => ({
      cachedTier: s.cache[room],
      resolveTier: s.resolveTier,
    })),
  );

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated || cachedTier) return;
    resolveTier(room);
  }, [hydrated, cachedTier, room, resolveTier]);

  const tier: WearTier = hydrated ? (cachedTier ?? "light") : "light";
  const src = useMemo(() => {
    if (tier === "heavy") return heavy ?? medium ?? light;
    if (tier === "medium") return medium ?? heavy ?? light;
    return light;
  }, [tier, light, medium, heavy]);

  return (
    <>
      {}
      <IntegratedFallback room={room} />
      <BackdropLayer src={src} className={imgClassName} style={imgStyle} />
      <LowPerfGate>
        <NoiseBurst trigger={src} />
      </LowPerfGate>
      {}
      <RoomGrime />
    </>
  );
}

function LowPerfGate({ children }: { children: React.ReactNode }) {
  const [lowEnd, setLowEnd] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    setLowEnd(document.documentElement.getAttribute("data-perf") === "low");
  }, []);
  if (lowEnd) return null;
  return <>{children}</>;
}

const IntegratedFallback = memo(function IntegratedFallback({ room }: { room: string }) {
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < room.length; i++) h = (h * 31 + room.charCodeAt(i)) >>> 0;
    return h;
  }, [room]);
  const hue = 22 + (seed % 18);
  const tilt = (seed % 7) - 3;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{
        backgroundImage: [
          `radial-gradient(ellipse 70% 60% at 50% 35%, oklch(0.22 0.08 ${hue} / 0.55), transparent 70%)`,
          `radial-gradient(ellipse 100% 90% at 50% 100%, oklch(0.08 0.03 ${hue} / 0.85), transparent 75%)`,
          `radial-gradient(circle at 18% 28%, oklch(0.10 0.04 ${hue} / 0.55) 0%, transparent 28%)`,
          `radial-gradient(circle at 82% 72%, oklch(0.09 0.03 ${hue} / 0.5) 0%, transparent 32%)`,
          `radial-gradient(circle at 60% 18%, oklch(0.18 0.06 ${hue + 6} / 0.35) 0%, transparent 22%)`,
          `linear-gradient(${135 + tilt}deg, oklch(0.14 0.05 ${hue}) 0%, oklch(0.07 0.02 ${hue}) 55%, oklch(0.04 0.01 ${hue}) 100%)`,
        ].join(","),
      }}
    >
      {}
      <span
        className="pointer-events-none absolute"
        style={{
          left: `${10 + (seed % 30)}%`,
          top: "0%",
          width: "1px",
          height: "70%",
          background:
            "linear-gradient(180deg, transparent 0%, oklch(0 0 0 / 0.55) 25%, oklch(0 0 0 / 0.35) 60%, transparent 100%)",
          transform: `rotate(${(seed % 5) - 2}deg)`,
          filter: "blur(0.5px)",
          opacity: 0.55,
        }}
      />
      <span
        className="pointer-events-none absolute"
        style={{
          right: `${15 + (seed % 25)}%`,
          top: "20%",
          width: "1px",
          height: "55%",
          background:
            "linear-gradient(180deg, oklch(0 0 0 / 0.45) 0%, oklch(0 0 0 / 0.2) 70%, transparent 100%)",
          transform: `rotate(${-((seed % 4) + 1)}deg)`,
          filter: "blur(0.6px)",
          opacity: 0.45,
        }}
      />
      {}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 35% at 50% 28%, oklch(0.55 0.12 70 / 0.18), transparent 70%)",
          animation: "candle-flicker 5s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
});

const BackdropLayer = memo(function BackdropLayer({
  src,
  className,
  style,
}: {
  src: string;
  className: string;
  style?: React.CSSProperties;
}) {
  // El arte se monta recién cuando está decodificado: en el WebView de Android
  // pintar un <img> a medio cargar deja franjas negras o el cuadro en blanco.
  const state = useImageReady(src, { timeoutMs: 7000 });
  const [shown, setShown] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    if (state !== "ready" || shownRef.current === src) return;
    setPrevious(shownRef.current);
    shownRef.current = src;
    setShown(src);
    const t = window.setTimeout(() => setPrevious(null), CROSSFADE_MS + 60);
    return () => window.clearTimeout(t);
  }, [state, src]);

  return (
    <>
      {shown && (
        <img
          key={shown}
          src={shown}
          alt=""
          aria-hidden
          className={`absolute inset-0 ${className}`}
          style={style}
          draggable={false}
        />
      )}
      {previous && (
        <motion.img
          key={previous}
          src={previous}
          alt=""
          aria-hidden
          className={`absolute inset-0 ${className}`}
          style={{ ...style, willChange: "opacity" }}
          draggable={false}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: CROSSFADE_MS / 1000, ease: CROSSFADE_EASE }}
        />
      )}
    </>
  );
});

const NoiseBurst = memo(function NoiseBurst({ trigger }: { trigger: string }) {
  const controls = useAnimationControls();
  const firstRef = useRef(true);
  const lastRef = useRef(trigger);

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      lastRef.current = trigger;
      return;
    }
    if (trigger === lastRef.current) return;
    lastRef.current = trigger;
    controls.set({ opacity: 0.5 });
    controls.start({
      opacity: 0,
      transition: { duration: NOISE_MS / 1000, ease: [0.4, 0, 0.2, 1] },
    });
  }, [trigger, controls]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={controls}
      className="pointer-events-none absolute inset-0 mix-blend-overlay"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, oklch(0.85 0.04 70 / 0.35) 1px, transparent 1.4px), radial-gradient(circle at 70% 60%, oklch(0.4 0.03 50 / 0.3) 1px, transparent 1.4px), radial-gradient(circle at 45% 80%, oklch(0.6 0.04 60 / 0.28) 1px, transparent 1.4px)",
        backgroundSize: "3px 3px, 4px 4px, 5px 5px",
        willChange: "opacity",
      }}
    />
  );
});

export const RoomBackdrop = memo(RoomBackdropImpl);
