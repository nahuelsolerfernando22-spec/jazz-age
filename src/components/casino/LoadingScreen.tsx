import { useEffect, useMemo, useRef, useState } from "react";
import {
  LOADING_POSES,
  markPoseUsed,
  pickWeightedPoseIndex,
  warmLoadingPoses,
} from "@/lib/loading-poses";
import { clearRouteError, consumeRouteErrorFlag, linesForRoute } from "@/lib/loading-lines";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const HOSTESS_POSES = LOADING_POSES;

const POSE_ROTATE_MS = 4200;

const POSE_XFADE_MS = 780;

const FALLBACK_LINES = [
  "El portero cuenta hasta tres antes de abrir.",
  "El humo se acomoda, la mesa espera.",
  "Última carta al fondo… ya vamos.",
  "Estamos montando el espectáculo…",
];

const ROTATE_MS = 2600;

function readPathname(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.location.pathname;
  } catch {
    return undefined;
  }
}

export function LoadingScreen({
  label,
  compact = false,
  route,
}: {
  label?: string;
  compact?: boolean;
  route?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lines = useMemo(() => {
    if (label) return [label];
    if (!mounted) return FALLBACK_LINES;
    const path = route ?? readPathname();
    const hadError = consumeRouteErrorFlag(path);
    const list = linesForRoute(path, hadError);
    return list.length ? list : FALLBACK_LINES;
  }, [label, mounted, route]);

  const reduceMotion = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [poseIdx, setPoseIdx] = useState(0);
  const [prevPoseIdx, setPrevPoseIdx] = useState<number | null>(null);
  const [xfadeTick, setXfadeTick] = useState(0);
  useEffect(() => {
    warmLoadingPoses();

    const picked = pickWeightedPoseIndex();
    setPoseIdx(picked);
    markPoseUsed(picked);
  }, []);

  useEffect(() => {
    if (!mounted || reduceMotion) return;
    if (HOSTESS_POSES.length <= 1) return;
    const id = window.setInterval(() => {
      const next = pickWeightedPoseIndex();
      setPoseIdx((current) => {
        if (next === current) return current;
        setPrevPoseIdx(current);
        setXfadeTick((t) => t + 1);
        markPoseUsed(next);
        return next;
      });
    }, POSE_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [mounted, reduceMotion]);

  useEffect(() => {
    if (prevPoseIdx === null) return;
    const t = window.setTimeout(() => setPrevPoseIdx(null), POSE_XFADE_MS + 40);
    return () => window.clearTimeout(t);
  }, [prevPoseIdx, xfadeTick]);

  const pose = HOSTESS_POSES[poseIdx] ?? HOSTESS_POSES[0];
  const prevPose = prevPoseIdx !== null ? HOSTESS_POSES[prevPoseIdx] : null;

  const [progress, setProgress] = useState(0);
  const startedAt = useRef<number>(0);
  useEffect(() => {
    if (!mounted) return;
    startedAt.current = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - startedAt.current;

      const eased = 1 - Math.exp(-elapsed / 1400);
      setProgress(Math.min(0.92, eased));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted]);
  const pctText = Math.round(progress * 100);

  useEffect(() => {
    if (!mounted) return;
    if (lines.length > 1) {
      setIdx(Math.floor(Math.random() * lines.length));
    }
  }, [mounted, lines]);

  useEffect(() => {
    if (lines.length <= 1) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % lines.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [lines]);

  useEffect(() => () => clearRouteError(), []);

  const line = lines[idx] ?? lines[0] ?? FALLBACK_LINES[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden ${compact ? "" : ""}`}
      style={{
        background: "#050303",
      }}
    >
      <style>{`
        @keyframes cuervoLoadFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cuervoLineFade {
          0% { opacity: 0; transform: translateY(4px); letter-spacing: 0.02em; }
          15%, 85% { opacity: 1; transform: translateY(0); letter-spacing: 0.06em; }
          100% { opacity: 0; transform: translateY(-4px); letter-spacing: 0.10em; }
        }
        @keyframes cuervoLoadDots {
          0%, 20% { opacity: 0.2 }
          50%     { opacity: 1 }
          100%    { opacity: 0.2 }
        }
        @keyframes cuervoPoseIn {
          0%   { opacity: 0; transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cuervoPoseOut {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.015); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-cuervo-anim] { animation: none !important; }
        }
      `}</style>

      {/* Fondo full-bleed con la ilustración */}
      {mounted && prevPose && !reduceMotion && (
        <img
          key={`prev-${xfadeTick}`}
          src={prevPose.src}
          alt=""
          aria-hidden
          draggable={false}
          data-cuervo-anim
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          style={{
            animation: `cuervoPoseOut ${POSE_XFADE_MS}ms ease-in-out both`,
            willChange: "opacity, transform",
          }}
        />
      )}
      {mounted && (
        <img
          key={`cur-${poseIdx}`}
          src={pose.src}
          alt={pose.alt}
          draggable={false}
          data-cuervo-anim
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          style={{
            animation:
              prevPose && !reduceMotion
                ? `cuervoPoseIn ${POSE_XFADE_MS}ms ease-in-out both`
                : "cuervoLoadFadeIn 420ms ease-out both",
            willChange: "opacity, transform",
          }}
        />
      )}

      {/* Scrim inferior para legibilidad de la UI */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            "linear-gradient(to top, rgba(5,3,3,0.92) 0%, rgba(5,3,3,0.72) 45%, rgba(5,3,3,0) 100%)",
        }}
      />

      {/* UI de carga sobre el fondo */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-[max(28px,env(safe-area-inset-bottom))]"
        style={{ paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}
      >
        <p
          className="text-[11px] uppercase tracking-[0.5em] text-[var(--oro)]/80"
          style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}
        >
          El Cuervo Dorado
        </p>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pctText}
          aria-valuetext={`Cargando — ${pctText}%`}
          className="mt-3 h-[3px] w-64 max-w-[70vw] overflow-hidden rounded-full"
          style={{
            background: "rgba(0,0,0,0.7)",
            boxShadow: "inset 0 0 6px rgba(0,0,0,0.9)",
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, var(--cd-gold-mid) 0%, #f5d497 55%, var(--cd-gold-mid) 100%)",
              boxShadow: "0 0 8px rgba(245,212,151,0.55)",
              transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
        <div
          className="mt-1 tabular-nums text-[11px] uppercase tracking-[0.4em] text-[var(--oro)]/80"
          style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}
          aria-hidden
        >
          {pctText}%
        </div>

        <p
          key={idx}
          data-cuervo-anim
          className="mt-3 max-w-[80vw] px-2 text-center"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(13px, 3.4vw, 16px)",
            lineHeight: 1.3,
            color: "#fbe8bf",
            opacity: 0.92,
            letterSpacing: "0.04em",
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            animation:
              lines.length > 1
                ? "cuervoLineFade 2.6s ease-in-out both"
                : "cuervoLoadFadeIn 500ms ease-out both",
          }}
        >
          {line}
          <span data-cuervo-anim style={{ animation: "cuervoLoadDots 1.4s ease-in-out infinite" }}>
            .
          </span>
          <span
            data-cuervo-anim
            style={{ animation: "cuervoLoadDots 1.4s ease-in-out infinite 0.2s" }}
          >
            .
          </span>
          <span
            data-cuervo-anim
            style={{ animation: "cuervoLoadDots 1.4s ease-in-out infinite 0.4s" }}
          >
            .
          </span>
        </p>
      </div>
    </div>
  );
}

export function LoadingOverlay({ label, route }: { label?: string; route?: string }) {
  return (
    <div className="relative min-h-[50vh] w-full">
      <LoadingScreen label={label} compact route={route} />
    </div>
  );
}
