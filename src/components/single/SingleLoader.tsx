import { memo, useEffect, useState } from "react";
import loaderArt from "@/assets/ambience/loader-speakeasy.webp";
import grain from "@/assets/ambience/grain-1928.webp";

const GLYPHS = ["♠", "♥", "♦", "♣", "★", "◉", "⚄"];

function SingleLoaderImpl({
  label,
  progress,
  lines,
}: {
  label?: string;
  progress?: number;
  lines?: string[];
}) {
  const hasProgress = typeof progress === "number" && !Number.isNaN(progress);
  const pct = hasProgress ? Math.max(0, Math.min(1, progress!)) : null;
  const pctText = pct !== null ? Math.round(pct * 100) : null;
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    if (!lines || lines.length <= 1) return;
    setLineIdx(Math.floor(Math.random() * lines.length));
    const id = window.setInterval(() => setLineIdx((i) => (i + 1) % lines.length), 1600);
    return () => window.clearInterval(id);
  }, [lines]);
  const noirLine = lines && lines.length > 0 ? lines[lineIdx] : null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        pctText !== null ? `Cargando sala de juegos — ${pctText}%` : "Cargando sala de juegos"
      }
      className="single-loader-root fixed inset-0 z-[180] flex items-end justify-center overflow-hidden bg-[#080605] text-[var(--marfil)]"
      style={{
        fontFamily: "'Barlow', system-ui, sans-serif",

        minHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        isolation: "isolate",
      }}
    >
      {}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 22%, rgba(201,168,76,0.22) 0%, transparent 62%), radial-gradient(70% 60% at 80% 95%, rgba(94,22,18,0.4) 0%, transparent 68%), linear-gradient(180deg, #14100c 0%, #080605 85%)",
        }}
      />
      {}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${loaderArt})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          opacity: 0.7,
          mixBlendMode: "screen",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 50% 40%, rgba(0,0,0,0) 0%, rgba(6,4,3,0.55) 70%, rgba(4,3,2,0.92) 100%), linear-gradient(180deg, rgba(4,3,2,0) 45%, rgba(4,3,2,0.85) 72%, rgba(4,3,2,0.96) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{ backgroundImage: `url(${grain})`, backgroundSize: "420px 420px" }}
      />
      {}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #c9a84c 0 1px, transparent 1px 22px), repeating-linear-gradient(-45deg, #c9a84c 0 1px, transparent 1px 22px)",
        }}
      />

      {}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {GLYPHS.map((g, i) => (
          <span
            key={i}
            className="single-loader-float absolute select-none text-[var(--oro)]/90"
            style={{
              top: `${8 + ((i * 13) % 82)}%`,
              left: `${(i * 17 + 6) % 94}%`,
              fontSize: `clamp(1.6rem, ${3.6 + (i % 3) * 1.4}vw, ${2.75 + (i % 3) * 1.25}rem)`,
              fontFamily: "'Bebas Neue', sans-serif",
              animationDelay: `${i * 0.35}s`,
            }}
          >
            {g}
          </span>
        ))}
      </div>

      {}
      <div className="single-loader-core relative flex w-full max-w-[min(560px,92vw)] flex-col items-center gap-[clamp(0.75rem,3vh,1.75rem)] px-4 pb-[14vh] text-center sm:px-6">
        {}
        <div
          className="relative"
          style={{
            width: "clamp(4.5rem, 18vw, 7rem)",
            height: "clamp(4.5rem, 18vw, 7rem)",
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className={
              pct === null ? "single-loader-spin block h-full w-full" : "block h-full w-full"
            }
            aria-hidden
            shapeRendering="geometricPrecision"
          >
            <defs>
              <linearGradient id="ring-brass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c9a84c" stopOpacity="0" />
                <stop offset="55%" stopColor="#c9a84c" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#c9a84c" stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#c9a84c"
              strokeOpacity="0.22"
              strokeWidth="2"
            />
            {}
            <circle
              cx="50"
              cy="50"
              r="37"
              fill="none"
              stroke="#c9a84c"
              strokeOpacity="0.35"
              strokeWidth="3"
              strokeDasharray="1.5 8.1"
              strokeLinecap="butt"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#ring-brass)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={pct === null ? "180 96" : `${Math.max(1, pct * 276.46)} 276.46`}
              transform="rotate(-90 50 50)"
              style={{ transition: pct === null ? undefined : "stroke-dasharray 300ms ease-out" }}
            />
          </svg>
          <div
            className="absolute inset-[14%] flex items-center justify-center rounded-full border border-[var(--oro)]/40 bg-[#150f0b]"
            style={{
              boxShadow: "inset 0 0 12px rgba(201,168,76,0.25), 0 4px 18px rgba(0,0,0,0.55)",
            }}
          >
            {pctText !== null ? (
              <span
                className="text-[var(--oro)] tabular-nums"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(1rem, 4vw, 1.4rem)",
                  lineHeight: 1,
                  letterSpacing: "0.04em",
                }}
              >
                {pctText}%
              </span>
            ) : (
              <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" aria-hidden>
                <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="#c9a84c" />
              </svg>
            )}
          </div>
        </div>

        <div
          className="hud-label"
          style={{
            fontSize: "clamp(0.62rem, 1.8vw, 0.75rem)",
            letterSpacing: "0.4em",
          }}
        >
          {label ?? "Repartiendo cartas…"}
        </div>

        {}
        {noirLine && (
          <p
            key={lineIdx}
            className="max-w-[min(420px,80vw)] px-2 text-center italic text-[#f0e8d5]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(1rem, 2.8vw, 1.25rem)",
              fontWeight: 600,
              textShadow: "0 1px 1px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.8)",
              animation: "single-loader-line-fade 1.6s ease-in-out both",
            }}
          >
            {noirLine}
          </p>
        )}

        {}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pctText ?? undefined}
          aria-valuetext={pctText !== null ? `${pctText}%` : "Cargando"}
          className={
            pct === null
              ? "single-loader-bar hud-bar mt-1 w-[min(240px,60vw)]"
              : "hud-bar mt-1 w-[min(240px,60vw)]"
          }
        >
          {pct === null ? (
            <span className="hud-bar-fill block w-1/3" />
          ) : (
            <span className="hud-bar-fill block" style={{ width: `${pct * 100}%` }} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes single-loader-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .single-loader-spin { animation: single-loader-spin 1.4s linear infinite; }
        @keyframes single-loader-float {
          0%, 100% { transform: translateY(0); opacity: 0.15; }
          50% { transform: translateY(-12px); opacity: 0.3; }
        }
        .single-loader-float { animation: single-loader-float 4.5s ease-in-out infinite; }
        @keyframes single-loader-bar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(360%); }
        }
        .single-loader-bar > span { animation: single-loader-bar 1.6s ease-in-out infinite; }
        @keyframes single-loader-line-fade {
          0% { opacity: 0; transform: translateY(4px); }
          20%, 85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }

        @media (max-height: 480px) and (orientation: landscape) {
          .single-loader-core { gap: 0.5rem !important; }
          .single-loader-core h1 { font-size: clamp(1.8rem, 5vw, 2.6rem) !important; }
          .single-loader-core > div[style*="conic-gradient"],
          .single-loader-core > .relative { }
        }
        @media (max-width: 340px) {
          .single-loader-float { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .single-loader-spin, .single-loader-float, .single-loader-bar > span {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export const SingleLoader = memo(SingleLoaderImpl);
