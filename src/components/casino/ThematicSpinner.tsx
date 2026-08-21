import type { CSSProperties } from "react";

type Variant = "roulette" | "card" | "coin";

interface Props {
  variant?: Variant;
  size?: number;
  label?: string;
  className?: string;
}

export function ThematicSpinner({ variant = "roulette", size = 44, label, className = "" }: Props) {
  const style: CSSProperties = { width: size, height: size };

  return (
    <div
      role="status"
      aria-label={label ?? "Cargando"}
      className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}
    >
      <style>{`
        @keyframes cuervoSpin { to { transform: rotate(360deg); } }
        @keyframes cuervoSpinRev { to { transform: rotate(-360deg); } }
        @keyframes cuervoFlip {
          0%   { transform: rotateY(0deg); }
          50%  { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-cuervo-spinner] { animation-duration: 6s !important; }
        }
      `}</style>

      {variant === "roulette" && (
        <svg viewBox="0 0 44 44" style={style} aria-hidden>
          <defs>
            <radialGradient id="rlt-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3a0a0e" />
              <stop offset="100%" stopColor="#120607" />
            </radialGradient>
          </defs>
          <circle cx="22" cy="22" r="21" fill="url(#rlt-bg)" stroke="#c9a84c" strokeWidth="1" />
          <g
            data-cuervo-spinner
            style={{ transformOrigin: "22px 22px", animation: "cuervoSpin 1.6s linear infinite" }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={i}
                x="21"
                y="3"
                width="2"
                height="7"
                fill={i % 2 === 0 ? "#c9a84c" : "#7a1e22"}
                transform={`rotate(${i * 45} 22 22)`}
              />
            ))}
          </g>
          <circle cx="22" cy="22" r="3" fill="#c9a84c" />
        </svg>
      )}

      {variant === "card" && (
        <svg viewBox="0 0 44 44" style={style} aria-hidden>
          <g
            data-cuervo-spinner
            style={{
              transformOrigin: "22px 22px",
              animation: "cuervoFlip 1.8s ease-in-out infinite",
            }}
          >
            <rect
              x="10"
              y="6"
              width="24"
              height="32"
              rx="3"
              fill="#0f0708"
              stroke="#c9a84c"
              strokeWidth="1.2"
            />
            <rect
              x="13"
              y="9"
              width="18"
              height="26"
              rx="2"
              fill="none"
              stroke="#c9a84c"
              strokeWidth="0.6"
              opacity="0.7"
            />
            <text
              x="22"
              y="26"
              textAnchor="middle"
              fontFamily="Cinzel, Georgia, serif"
              fontSize="10"
              fill="#c9a84c"
            >
              CD
            </text>
          </g>
        </svg>
      )}

      {variant === "coin" && (
        <svg viewBox="0 0 44 44" style={style} aria-hidden>
          <g
            data-cuervo-spinner
            style={{
              transformOrigin: "22px 22px",
              animation: "cuervoFlip 1.4s ease-in-out infinite",
            }}
          >
            <circle cx="22" cy="22" r="18" fill="#1a0a0c" stroke="#c9a84c" strokeWidth="1.4" />
            <circle
              cx="22"
              cy="22"
              r="13"
              fill="none"
              stroke="#c9a84c"
              strokeWidth="0.5"
              opacity="0.6"
            />
            <text
              x="22"
              y="27"
              textAnchor="middle"
              fontFamily="Cinzel, Georgia, serif"
              fontSize="14"
              fill="#c9a84c"
            >
              C
            </text>
          </g>
        </svg>
      )}

      {label && (
        <span
          className="text-[11px] uppercase tracking-[0.35em] text-[var(--oro)]/80"
          style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
