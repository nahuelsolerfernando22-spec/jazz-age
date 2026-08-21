import { LEAGUE_TIERS, type LeagueTierId, tierById } from "@/lib/leagues-daily";
const cn = (...xs: Array<string | false | undefined | null>) => xs.filter(Boolean).join(" ");

type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = { sm: 72, md: 128, lg: 200 };

interface Props {
  tier: LeagueTierId;
  size?: Size;
  withLabel?: boolean;
  glow?: boolean;
  className?: string;
}

export function LeagueBadge({ tier, size = "md", withLabel = false, glow, className }: Props) {
  const t = tierById(tier);
  const px = SIZE_PX[size];
  const showGlow = glow ?? size !== "sm";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative shrink-0" style={{ width: px, height: px }} aria-label={t.fullName}>
        {showGlow && (
          <div
            className="absolute inset-[-15%] rounded-full blur-2xl opacity-50 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${t.glow} 0%, transparent 70%)` }}
          />
        )}
        <BadgeArt tier={tier} px={px} />
      </div>
      {withLabel && (
        <div className="text-center">
          <div
            className="font-serif tracking-wider uppercase"
            style={{
              color: t.glow,
              fontSize: size === "lg" ? 14 : 11,
              textShadow: `0 0 12px ${t.color}`,
            }}
          >
            {t.fullName}
          </div>
          <div className="text-[11px] text-ivory/40 tracking-[0.3em] uppercase mt-0.5">
            Liga {t.rank} de 9
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeArt({ tier, px }: { tier: LeagueTierId; px: number }) {
  const t = tierById(tier);
  switch (tier) {
    case "vagabundos":
      return <BurlapRope c={t.color} g={t.glow} px={px} />;
    case "parroquianos":
      return <TinMug c={t.color} g={t.glow} px={px} />;
    case "conocidas":
      return <SepiaPortrait c={t.color} g={t.glow} px={px} />;
    case "manofirme":
      return <OxbloodSeal c={t.color} g={t.glow} px={px} />;
    case "bronce":
      return <FeatherMedal c={t.color} g={t.glow} px={px} variant="bronze" />;
    case "plata":
      return <FeatherMedal c={t.color} g={t.glow} px={px} variant="silver" />;
    case "oro":
      return <FeatherMedal c={t.color} g={t.glow} px={px} variant="gold" />;
    case "circulo":
      return <WaxSeal c={t.color} g={t.glow} px={px} />;
    case "cuervoDorado":
      return <CrowCrown c={t.color} g={t.glow} px={px} />;
  }
}

function BurlapRope({ c, g, px }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" width={px} height={px}>
      <defs>
        <pattern id="burlap" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill={c} />
          <path d="M0 2 H4 M2 0 V4" stroke={g} strokeWidth="0.3" opacity="0.5" />
        </pattern>
      </defs>
      <rect
        x="10"
        y="20"
        width="80"
        height="60"
        rx="2"
        fill="url(#burlap)"
        stroke={g}
        strokeWidth="1.5"
      />
      <path
        d="M5 30 Q50 25 95 30 M5 70 Q50 75 95 70"
        stroke={c}
        strokeWidth="3"
        fill="none"
        opacity="0.9"
        strokeDasharray="2 1"
      />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fill={g}
        fontSize="11"
        fontFamily="'Cinzel', Georgia, serif"
        letterSpacing="2"
        fontWeight="bold"
        opacity="0.9"
      >
        VAGOS
      </text>
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fill={g}
        fontSize="6"
        fontFamily="'Cinzel', Georgia, serif"
        opacity="0.6"
      >
        DEL CALLEJÓN
      </text>
    </svg>
  );
}

function TinMug({ c, g, px }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" width={px} height={px}>
      <circle cx="50" cy="50" r="44" fill="oklch(0.18 0.02 40)" stroke={g} strokeWidth="1" />
      <path d="M30 30 L70 30 L66 75 L34 75 Z" fill={c} stroke={g} strokeWidth="1.5" />
      <path d="M68 38 Q80 42 80 55 Q80 68 68 65" fill="none" stroke={g} strokeWidth="2" />
      <path d="M30 30 L70 30 L68 36 L32 36 Z" fill={g} opacity="0.4" />
      <ellipse cx="42" cy="50" rx="3" ry="6" fill={g} opacity="0.3" />
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fill={g}
        fontSize="7"
        fontFamily="'Cinzel', Georgia, serif"
        letterSpacing="1.5"
        opacity="0.8"
      >
        CANTINA
      </text>
    </svg>
  );
}

function SepiaPortrait({ c, g, px }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" width={px} height={px}>
      <rect
        x="15"
        y="10"
        width="70"
        height="80"
        fill="oklch(0.22 0.04 60)"
        stroke={g}
        strokeWidth="1.5"
      />
      <rect
        x="18"
        y="13"
        width="64"
        height="74"
        fill="none"
        stroke={g}
        strokeWidth="0.5"
        opacity="0.6"
      />
      <ellipse cx="50" cy="48" rx="24" ry="30" fill={c} stroke={g} strokeWidth="1" />
      <circle cx="50" cy="40" r="9" fill={g} opacity="0.5" />
      <path d="M32 60 Q50 50 68 60 L68 75 L32 75 Z" fill={g} opacity="0.5" />
      <text
        x="50"
        y="83"
        textAnchor="middle"
        fill={g}
        fontSize="6"
        fontFamily="'Cinzel', Georgia, serif"
        letterSpacing="2"
        opacity="0.85"
      >
        CONOCIDA
      </text>
    </svg>
  );
}

function OxbloodSeal({ c, g, px }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" width={px} height={px}>
      <defs>
        <radialGradient id="ox" cx="40%" cy="35%">
          <stop offset="0%" stopColor={g} stopOpacity="0.9" />
          <stop offset="60%" stopColor={c} />
          <stop offset="100%" stopColor="oklch(0.25 0.10 25)" />
        </radialGradient>
      </defs>
      <path
        d="M50 8 L75 18 L92 38 L92 62 L75 82 L50 92 L25 82 L8 62 L8 38 L25 18 Z"
        fill="url(#ox)"
        stroke={g}
        strokeWidth="0.8"
      />
      <path
        d="M50 30 Q44 35 44 45 L44 60 Q40 60 38 56 L36 50 Q33 52 35 60 Q37 68 45 70 L55 70 Q62 68 64 60 L64 42 Q64 35 58 32 Q54 30 50 30 Z"
        fill={g}
        opacity="0.85"
      />
      <text
        x="50"
        y="86"
        textAnchor="middle"
        fill="oklch(0.95 0.02 60)"
        fontSize="6"
        fontFamily="'Cinzel', Georgia, serif"
        letterSpacing="2"
        opacity="0.9"
      >
        FIRME
      </text>
    </svg>
  );
}

function FeatherMedal({ c, g, px, variant }: ArtProps & { variant: "bronze" | "silver" | "gold" }) {
  const rim =
    variant === "gold"
      ? "oklch(0.45 0.08 50)"
      : variant === "silver"
        ? "oklch(0.40 0.02 240)"
        : "oklch(0.30 0.06 40)";
  const rays = variant === "gold" ? 16 : variant === "silver" ? 12 : 8;
  return (
    <svg viewBox="0 0 100 100" width={px} height={px}>
      <defs>
        <radialGradient id={`med-${variant}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={g} />
          <stop offset="100%" stopColor={c} />
        </radialGradient>
      </defs>
      {}
      {Array.from({ length: rays }).map((_, i) => {
        const a = (i / rays) * Math.PI * 2;
        const x1 = 50 + Math.cos(a) * 38;
        const y1 = 50 + Math.sin(a) * 38;
        const x2 = 50 + Math.cos(a) * 48;
        const y2 = 50 + Math.sin(a) * 48;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={g}
            strokeWidth="1.2"
            opacity="0.7"
          />
        );
      })}
      <circle cx="50" cy="50" r="38" fill={rim} stroke={g} strokeWidth="2" />
      <circle cx="50" cy="50" r="32" fill={`url(#med-${variant})`} />
      <circle cx="50" cy="50" r="32" fill="none" stroke={rim} strokeWidth="1" />
      {}
      <path
        d="M50 22 Q42 35 42 55 Q42 70 50 78 Q58 70 58 55 Q58 35 50 22 Z"
        fill={rim}
        opacity="0.9"
      />
      <path d="M50 26 L50 76" stroke={g} strokeWidth="1" />
      {[32, 40, 48, 56, 64].map((y) => (
        <g key={y}>
          <path d={`M50 ${y} Q46 ${y + 2} 44 ${y + 5}`} stroke={g} strokeWidth="0.6" fill="none" />
          <path d={`M50 ${y} Q54 ${y + 2} 56 ${y + 5}`} stroke={g} strokeWidth="0.6" fill="none" />
        </g>
      ))}
    </svg>
  );
}

function WaxSeal({ c, g, px }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" width={px} height={px}>
      <defs>
        <radialGradient id="wax" cx="35%" cy="30%">
          <stop offset="0%" stopColor="oklch(0.30 0.08 25)" />
          <stop offset="70%" stopColor={c} />
          <stop offset="100%" stopColor="oklch(0.12 0.04 20)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#wax)" stroke={g} strokeWidth="0.5" />
      {}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={50 + Math.cos(a) * 42}
            cy={50 + Math.sin(a) * 42}
            r="2"
            fill="url(#wax)"
          />
        );
      })}
      {}
      <path
        d="M35 55 Q40 40 50 38 Q60 40 65 55 L62 60 L70 58 L60 65 L55 70 L45 70 L40 65 L30 58 L38 60 Z"
        fill={g}
        opacity="0.95"
      />
      <circle cx="55" cy="48" r="1.5" fill={c} />
      <path d="M65 50 L72 48 L66 53 Z" fill={g} opacity="0.95" />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke={g}
        strokeWidth="0.3"
        strokeDasharray="2 3"
        opacity="0.7"
      />
    </svg>
  );
}

function CrowCrown({ c, g, px }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" width={px} height={px}>
      <defs>
        <radialGradient id="crowngold" cx="50%" cy="40%">
          <stop offset="0%" stopColor="oklch(0.98 0.10 90)" />
          <stop offset="50%" stopColor={g} />
          <stop offset="100%" stopColor={c} />
        </radialGradient>
        <linearGradient id="crownshine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      {}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const len = i % 2 === 0 ? 48 : 42;
        const x1 = 50 + Math.cos(a) * 36;
        const y1 = 50 + Math.sin(a) * 36;
        const x2 = 50 + Math.cos(a) * len;
        const y2 = 50 + Math.sin(a) * len;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={g}
            strokeWidth={i % 2 === 0 ? 1.5 : 0.8}
            opacity="0.85"
          />
        );
      })}
      <circle
        cx="50"
        cy="50"
        r="34"
        fill="url(#crowngold)"
        stroke="oklch(0.45 0.08 50)"
        strokeWidth="1.5"
      />
      {}
      <path
        d="M30 42 L36 30 L44 38 L50 26 L56 38 L64 30 L70 42 L65 48 L35 48 Z"
        fill="oklch(0.55 0.12 50)"
        stroke={g}
        strokeWidth="0.5"
      />
      <circle cx="50" cy="32" r="2" fill="oklch(0.95 0.20 30)" />
      {}
      <path
        d="M36 60 Q42 50 50 50 Q58 50 64 60 L60 66 L68 64 L58 70 L52 75 L48 75 L42 70 L32 64 L40 66 Z"
        fill="oklch(0.20 0.04 30)"
      />
      <circle cx="54" cy="58" r="1.5" fill={g} />
      <circle cx="50" cy="50" r="34" fill="url(#crownshine)" />
    </svg>
  );
}

interface ArtProps {
  c: string;
  g: string;
  px: number;
}
