export function DecoStar({
  size = 12,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "-0.15em",
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.55))",
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <radialGradient id="deco-coin" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fff3c0" />
            <stop offset="55%" stopColor="#d4a23a" />
            <stop offset="100%" stopColor="#6b4310" />
          </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="url(#deco-coin)" stroke="#3a230a" strokeWidth="1" />
        <circle
          cx="12"
          cy="12"
          r="8.5"
          fill="none"
          stroke="#3a230a"
          strokeWidth="0.6"
          opacity="0.6"
        />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontFamily="Cinzel, serif"
          fontWeight="700"
          fontSize="11"
          fill="#3a230a"
        >
          C
        </text>
      </svg>
    </span>
  );
}
