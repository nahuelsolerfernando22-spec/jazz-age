import { EURO_ORDER, SLOT_DEG, colorOf, type Color } from "@/lib/roulette-math";

export function annularSectorPath(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  a0Deg: number,
  a1Deg: number,
): string {
  const toXY = (r: number, aDeg: number) => {
    const a = ((aDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const [x0o, y0o] = toXY(rOut, a0Deg);
  const [x1o, y1o] = toXY(rOut, a1Deg);
  const [x1i, y1i] = toXY(rIn, a1Deg);
  const [x0i, y0i] = toXY(rIn, a0Deg);
  const large = a1Deg - a0Deg > 180 ? 1 : 0;
  return [
    `M ${x0o} ${y0o}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${x0i} ${y0i}`,
    "Z",
  ].join(" ");
}

export function WheelSVGAnimated({
  wheelAngle,
  ballAngle,
  spinning,
  result,
  spinToken,
  lowFx = false,
}: {
  wheelAngle: number;
  ballAngle: number;
  spinning?: boolean;
  result?: number | null;
  spinToken?: number;
  lowFx?: boolean;
}) {
  const BOX = 400;
  const C = BOX / 2;
  const BALL_R = 176;
  const R_OUT = 196;
  const R_IN = 118;
  const R_TEXT = 158;

  const sectorFill = (color: Color) =>
    color === "red"
      ? "oklch(0.44 0.20 28 / 0.88)"
      : color === "black"
        ? "oklch(0.10 0.02 30 / 0.90)"
        : "oklch(0.48 0.20 150 / 0.95)";

  return (
    <svg
      viewBox={`0 0 ${BOX} ${BOX}`}
      className="block h-full w-full select-none"
      style={lowFx ? undefined : { filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.55))" }}
    >
      <defs>
        <radialGradient id="g-cradle" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="oklch(0 0 0 / 0)" />
          <stop offset="92%" stopColor="oklch(0.20 0.05 45 / 0.55)" />
          <stop offset="100%" stopColor="oklch(0.05 0.02 30 / 0.95)" />
        </radialGradient>
        <radialGradient id="g-vignette" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0 0 0 / 0)" />
          <stop offset="60%" stopColor="oklch(0 0 0 / 0)" />
          <stop offset="100%" stopColor="oklch(0 0 0 / 0.55)" />
        </radialGradient>
        <radialGradient id="g-ring-shade" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="oklch(0 0 0 / 0)" />
          <stop offset="100%" stopColor="oklch(0 0 0 / 0.45)" />
        </radialGradient>
        <radialGradient id="g-ball" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="oklch(1 0 0)" />
          <stop offset="35%" stopColor="oklch(0.96 0.012 85)" />
          <stop offset="75%" stopColor="oklch(0.82 0.025 75)" />
          <stop offset="100%" stopColor="oklch(0.55 0.04 55)" />
        </radialGradient>
        <radialGradient id="g-ball-glint" cx="30%" cy="25%" r="25%">
          <stop offset="0%" stopColor="oklch(1 0 0 / 0.95)" />
          <stop offset="100%" stopColor="oklch(1 0 0 / 0)" />
        </radialGradient>
        <radialGradient id="g-ball-trail" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.97 0.01 80 / 0.7)" />
          <stop offset="100%" stopColor="oklch(0.97 0.01 80 / 0)" />
        </radialGradient>
        <linearGradient id="g-pointer" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.95 0.13 82)" />
          <stop offset="55%" stopColor="oklch(0.78 0.15 78)" />
          <stop offset="100%" stopColor="oklch(0.42 0.10 55)" />
        </linearGradient>
        <filter id="f-ball-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" />
          <feOffset dx="0" dy="2.2" result="off" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.85" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="cp-wheel-disc">
          <circle cx={C} cy={C} r={C - 4} />
        </clipPath>
      </defs>

      <circle cx={C} cy={C} r={C - 2} fill="url(#g-cradle)" />

      <g
        data-anim="wheel"
        style={{
          transform: `rotate(${wheelAngle}deg)`,
          transformOrigin: `${C}px ${C}px`,
        }}
      >
        {EURO_ORDER.map((n, i) => {
          const a0 = i * SLOT_DEG - SLOT_DEG / 2;
          const a1 = a0 + SLOT_DEG;
          const d = annularSectorPath(C, C, R_IN, R_OUT, a0, a1);
          return (
            <path
              key={`sec-${n}`}
              d={d}
              fill={sectorFill(colorOf(n))}
              stroke="oklch(0.55 0.12 78 / 0.85)"
              strokeWidth={0.7}
            />
          );
        })}

        <circle
          cx={C}
          cy={C}
          r={R_OUT}
          fill="none"
          stroke="oklch(0.72 0.13 78)"
          strokeWidth={2.6}
        />
        <circle
          cx={C}
          cy={C}
          r={R_OUT - 3}
          fill="none"
          stroke="oklch(0.30 0.06 50 / 0.7)"
          strokeWidth={0.8}
        />
        <circle cx={C} cy={C} r={R_IN} fill="none" stroke="oklch(0.72 0.13 78)" strokeWidth={2.2} />
        <circle
          cx={C}
          cy={C}
          r={R_IN + 3}
          fill="none"
          stroke="oklch(0.30 0.06 50 / 0.7)"
          strokeWidth={0.8}
        />

        {EURO_ORDER.map((_, i) => {
          const aDeg = i * SLOT_DEG - SLOT_DEG / 2;
          const rad = ((aDeg - 90) * Math.PI) / 180;
          const r3 = (v: number) => Math.round(v * 1000) / 1000;
          const x1 = r3(C + (R_IN - 1) * Math.cos(rad));
          const y1 = r3(C + (R_IN - 1) * Math.sin(rad));
          const x2 = r3(C + (R_OUT + 1) * Math.cos(rad));
          const y2 = r3(C + (R_OUT + 1) * Math.sin(rad));
          return (
            <line
              key={`fret-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="oklch(0.78 0.14 78 / 0.85)"
              strokeWidth={1.1}
              strokeLinecap="round"
            />
          );
        })}

        {EURO_ORDER.map((n, i) => {
          const ang = i * SLOT_DEG;
          const rad = ((ang - 90) * Math.PI) / 180;
          const x = Math.round((C + R_TEXT * Math.cos(rad)) * 1000) / 1000;
          const y = Math.round((C + R_TEXT * Math.sin(rad)) * 1000) / 1000;
          const angR = Math.round(ang * 1000) / 1000;
          return (
            <text
              key={`num-${n}`}
              x={x}
              y={y}
              fill="oklch(0.99 0.02 80)"
              fontFamily="'Cinzel', Georgia, serif"
              fontSize={15}
              fontWeight={800}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${angR} ${x} ${y})`}
              style={{ paintOrder: "stroke", stroke: "oklch(0 0 0 / 0.95)", strokeWidth: 1.6 }}
            >
              {n}
            </text>
          );
        })}
      </g>

      <circle
        cx={C}
        cy={C}
        r={BALL_R}
        fill="none"
        stroke="oklch(0.55 0.10 78 / 0.55)"
        strokeWidth={6}
        pointerEvents="none"
      />

      {!lowFx && (
        <>
          <circle cx={C} cy={C} r={C - 6} fill="url(#g-vignette)" pointerEvents="none" />
          <circle cx={C} cy={C} r={R_OUT} fill="url(#g-ring-shade)" pointerEvents="none" />
        </>
      )}

      <g
        data-anim="ball"
        style={{
          transform: `rotate(${ballAngle}deg)`,
          transformOrigin: `${C}px ${C}px`,
        }}
      >
        <g key={`drop-${spinToken ?? 0}`} data-anim={spinning ? "ball-drop" : undefined}>
          {spinning && !lowFx && (
            <>
              <ellipse
                cx={C + 6}
                cy={C - BALL_R}
                rx={22}
                ry={5}
                fill="url(#g-ball-trail)"
                opacity={0.55}
                pointerEvents="none"
              />
              <ellipse
                cx={C + 14}
                cy={C - BALL_R}
                rx={12}
                ry={3}
                fill="url(#g-ball-trail)"
                opacity={0.3}
                pointerEvents="none"
              />
            </>
          )}
          <ellipse
            cx={C}
            cy={C - BALL_R + 7}
            rx={9}
            ry={2.8}
            fill="oklch(0 0 0 / 0.6)"
            pointerEvents="none"
          />
          <circle
            cx={C}
            cy={C - BALL_R}
            r={10}
            fill="url(#g-ball)"
            stroke="oklch(0.25 0.04 55 / 0.85)"
            strokeWidth={0.7}
            filter={lowFx ? undefined : "url(#f-ball-shadow)"}
          />
          <circle
            cx={C - 3.3}
            cy={C - BALL_R - 3.3}
            r={4.4}
            fill="url(#g-ball-glint)"
            pointerEvents="none"
          />
          <circle
            cx={C + 3}
            cy={C - BALL_R + 3.5}
            r={1.5}
            fill="oklch(1 0 0 / 0.5)"
            pointerEvents="none"
          />
        </g>
      </g>

      {result !== null && result !== undefined && !spinning && (
        <g
          key={`win-${spinToken ?? 0}-${result}`}
          style={{
            animation: "roulette-winner-pulse 1.6s ease-out forwards",
            transformOrigin: `${C}px ${C}px`,
          }}
          pointerEvents="none"
        >
          <path
            d={annularSectorPath(C, C, R_IN - 2, R_OUT + 2, -SLOT_DEG / 2, SLOT_DEG / 2)}
            fill="oklch(0.92 0.18 80 / 0.55)"
            stroke="oklch(0.95 0.20 78)"
            strokeWidth={2}
            style={
              lowFx ? undefined : { filter: "drop-shadow(0 0 12px oklch(0.85 0.20 80 / 0.95))" }
            }
          />
        </g>
      )}

      <g style={lowFx ? undefined : { filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.95))" }}>
        <polygon
          points={`${C - 13},0 ${C + 13},0 ${C},24`}
          fill="url(#g-pointer)"
          stroke="oklch(0.22 0.05 40)"
          strokeWidth={1.2}
        />
        <polygon
          points={`${C - 4},2 ${C + 4},2 ${C},14`}
          fill="oklch(1 0 0 / 0.45)"
          pointerEvents="none"
        />
        <circle
          cx={C}
          cy={3}
          r={2}
          fill="oklch(0.92 0.12 80)"
          stroke="oklch(0.25 0.06 45)"
          strokeWidth={0.6}
        />
      </g>
    </svg>
  );
}

export function WheelMotion({
  wheelAngle,
  ballAngle,
  spinning,
  result,
  spinToken,
  lowFx = false,
}: {
  wheelAngle: number;
  ballAngle: number;
  spinning: boolean;
  result: number | null;
  spinToken: number;
  lowFx?: boolean;
}) {
  const wheelEase = spinning
    ? "cubic-bezier(0.08, 0.72, 0.18, 1.0)"
    : "cubic-bezier(0.4, 0.0, 0.2, 1)";
  const ballEase = spinning
    ? "cubic-bezier(0.14, 0.55, 0.22, 1.08)"
    : "cubic-bezier(0.4, 0.0, 0.2, 1)";
  // En APK/gama baja el giro dura la mitad: la WebView no aguanta 5s de
  // transición sobre 37 sectores sin comerse los toques del jugador.
  const wheelDur = spinning ? (lowFx ? "2.6s" : "5.2s") : "0.18s";
  const ballDur = spinning ? (lowFx ? "2.5s" : "5.0s") : "0.18s";
  return (
    <div className="relative h-full w-full">
      <style>{`
        .wheel-svg g[data-anim="wheel"] { transition: transform ${wheelDur} ${wheelEase}; }
        .wheel-svg g[data-anim="ball"]  { transition: transform ${ballDur} ${ballEase}; }
        @keyframes roulette-ball-drop {
          0%, 78%   { transform: translateY(0); }
          88%       { transform: translateY(16px); }
          92%       { transform: translateY(10px); }
          96%       { transform: translateY(19px); }
          100%      { transform: translateY(18px); }
        }
        @keyframes roulette-winner-pulse {
          0%   { opacity: 0; }
          12%  { opacity: 0.95; }
          100% { opacity: 0; }
        }
        .wheel-svg g[data-anim="ball-drop"] {
          animation: roulette-ball-drop ${lowFx ? "2.4s" : "5s"} cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-box: fill-box;
        }
      `}</style>
      <div className="wheel-svg h-full w-full">
        <WheelSVGAnimated
          wheelAngle={wheelAngle}
          ballAngle={ballAngle}
          spinning={spinning}
          result={result}
          spinToken={spinToken}
          lowFx={lowFx}
        />
      </div>
    </div>
  );
}
