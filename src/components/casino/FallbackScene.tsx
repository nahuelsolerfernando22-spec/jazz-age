import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import fallbackCelesteAsset from "@/assets/jade-portrait.webp";
import { RaidScreen } from "./RaidScreen";

export type FallbackKind = "not-found" | "loader" | "render";

const COPY: Record<FallbackKind, { title: string; body: React.ReactNode }> = {
  "not-found": {
    title: "esperá un momento",
    body: (
      <>
        Mirla se asoma desde la terraza — esta puerta no figura en su ronda.
        <br />
        Volvé al salón y elegí otra mesa, encanto.
      </>
    ),
  },
  loader: {
    title: "esperá un momento",
    body: (
      <>
        Mirla pide paciencia desde la terraza — la bandeja aún no llegó.
        <br />
        Respirá el humo y probá de nuevo en un instante.
      </>
    ),
  },
  render: {
    title: "esperá un momento",
    body: (
      <>
        Mirla apoya la bandeja — algo se cayó detrás del telón.
        <br />
        Dale un segundo y volvé a entrar, encanto.
      </>
    ),
  },
};

export function classifyError(error: Error): FallbackKind {
  const msg = (error?.message ?? "").toLowerCase();
  const stack = (error?.stack ?? "").toLowerCase();
  if (msg.includes("not found") || msg.includes("404")) return "not-found";
  if (
    stack.includes("loader") ||
    msg.includes("loader") ||
    msg.includes("fetch") ||
    msg.includes("network") ||
    error?.name === "ChunkLoadError"
  ) {
    return "loader";
  }
  return "render";
}

const FALLBACK_KEYFRAMES = `
@keyframes cuervoGlitchShift {
  0%, 94%, 100% { transform: translate(0,0); filter: saturate(0.92) contrast(1.05); }
  95% { transform: translate(-2px, 1px); filter: saturate(1.2) contrast(1.15) hue-rotate(-4deg); }
  96% { transform: translate(3px, -1px); filter: saturate(0.7) contrast(1.25); }
  97% { transform: translate(-1px, 2px); filter: saturate(1.05) contrast(1.1) hue-rotate(3deg); }
  98% { transform: translate(0,0); filter: saturate(0.92) contrast(1.05); }
}
@keyframes cuervoStatic {
  0%   { background-position: 0 0, 0 0; opacity: 0.18; }
  20%  { background-position: -30px 12px, 14px -8px; opacity: 0.22; }
  40%  { background-position: 18px -22px, -10px 18px; opacity: 0.16; }
  60%  { background-position: -8px 26px, 22px 4px; opacity: 0.24; }
  80%  { background-position: 24px 6px, -18px -14px; opacity: 0.18; }
  100% { background-position: 0 0, 0 0; opacity: 0.2; }
}
@keyframes cuervoScanline {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
@keyframes cuervoTitleFlicker {
  0%, 92%, 100% { opacity: 1; }
  93% { opacity: 0.55; }
  94% { opacity: 1; }
  96% { opacity: 0.75; }
  97% { opacity: 1; }
}
@keyframes cuervoFallbackFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .cuervo-fallback-img,
  .cuervo-fallback-static,
  .cuervo-fallback-scanline,
  .cuervo-fallback-title { animation: none !important; }
}
`;

export function DelayedReveal({
  delayMs,
  children,
}: {
  delayMs: number;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(delayMs === 0);
  useEffect(() => {
    if (delayMs === 0) return;
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  if (!show) return null;
  return <div style={{ animation: "cuervoFallbackFadeIn 220ms ease-out both" }}>{children}</div>;
}

export function FallbackScene({
  kind,
  error,
  onRetry,
}: {
  kind: FallbackKind;
  error?: Error;
  onRetry?: () => void;
}) {
  if (kind === "loader") {
    return <RaidScreen onRetry={onRetry} />;
  }
  const copy = COPY[kind];

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-8 sm:py-10">
      <style>{FALLBACK_KEYFRAMES}</style>

      <img
        src={fallbackCelesteAsset}
        alt=""
        aria-hidden
        className="cuervo-fallback-img pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-80"
        style={{ animation: "cuervoGlitchShift 6s steps(1, end) infinite" }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, oklch(0 0 0 / 0.15) 0%, oklch(0 0 0 / 0.55) 45%, oklch(0.05 0.01 25 / 0.92) 95%)",
        }}
      />

      <div
        aria-hidden
        className="cuervo-fallback-static pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0 0 0 / 0.6) 1px, transparent 1px), radial-gradient(oklch(1 0 0 / 0.08) 1px, transparent 1px)",
          backgroundSize: "3px 3px, 5px 5px",
          animation: "cuervoStatic 0.45s steps(6, end) infinite",
        }}
      />

      <div
        aria-hidden
        className="cuervo-fallback-scanline pointer-events-none absolute inset-x-0 h-[18%] mix-blend-screen"
        style={{
          background:
            "linear-gradient(to bottom, transparent, oklch(0.78 0.13 80 / 0.10) 45%, oklch(0.92 0.03 72 / 0.18) 50%, oklch(0.78 0.13 80 / 0.10) 55%, transparent)",
          animation: "cuervoScanline 5.5s linear infinite",
        }}
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        <h1
          className="cuervo-fallback-title"
          style={{
            fontFamily: "Limelight, Cinzel, Georgia, serif",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontSize: "clamp(20px, 6vw, 40px)",
            color: "oklch(0.82 0.14 80)",
            textShadow:
              "0 2px 0 oklch(0 0 0 / 0.85), 0 0 22px oklch(0.62 0.10 70 / 0.6), 0 0 60px oklch(0 0 0 / 0.9)",
            animation: "cuervoTitleFlicker 4.2s steps(1, end) infinite",
          }}
        >
          {copy.title}
        </h1>

        <p
          className="mt-3 italic sm:mt-4"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            color: "oklch(0.92 0.03 72)",
            fontSize: "clamp(14px, 3.6vw, 17px)",
            lineHeight: 1.55,
            textShadow: "0 1px 6px oklch(0 0 0 / 0.95)",
          }}
        >
          {copy.body}
        </p>

        {import.meta.env.DEV && error?.message && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md border border-[var(--brass)]/30 bg-[var(--noir)]/80 p-3 text-left font-mono text-[11px] text-[var(--blood)] sm:text-xs">
            {error.message}
          </pre>
        )}

        <div className="mt-6 flex flex-col items-stretch justify-center gap-2 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2 text-[11px] uppercase tracking-[0.28em] backdrop-blur-sm sm:text-xs sm:tracking-[0.32em]"
              style={{
                fontFamily: "Limelight, Cinzel, Georgia, serif",
                border: "1px solid oklch(0.62 0.10 70 / 0.7)",
                color: "oklch(0.82 0.14 80)",
                background:
                  "linear-gradient(180deg, oklch(0.13 0.025 22 / 0.85), oklch(0.07 0.012 25 / 0.85))",
                boxShadow: "0 8px 24px -10px oklch(0 0 0 / 0.9)",
              }}
            >
              ─ otra ronda ─
            </button>
          )}
          <Link
            to="/"
            className="px-5 py-2 text-[11px] uppercase tracking-[0.28em] backdrop-blur-sm sm:text-xs sm:tracking-[0.32em]"
            style={{
              fontFamily: "Limelight, Cinzel, Georgia, serif",
              border: "1px solid oklch(0.62 0.10 70 / 0.45)",
              color: "oklch(0.88 0.04 72)",
              background: "oklch(0.07 0.012 25 / 0.6)",
            }}
          >
            volver al salón
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DefaultNotFoundComponent() {
  return (
    <DelayedReveal delayMs={0}>
      <FallbackScene kind="not-found" />
    </DelayedReveal>
  );
}
