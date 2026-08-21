const NOISE_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.78  0 0 0 0 0.55  0 0 0 0.55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
  );

interface NoirOverlayProps {
  variant?: "dark" | "paper";
}

export function NoirOverlay({ variant = "dark" }: NoirOverlayProps) {
  const grainOpacity = variant === "paper" ? "opacity-[0.06]" : "opacity-[0.045]";
  const grainBlend = variant === "paper" ? "mix-blend-multiply" : "mix-blend-overlay";
  const vignette =
    variant === "paper"
      ? "inset 0 0 160px 20px rgba(90,58,26,0.28)"
      : "inset 0 0 240px 40px rgba(0,0,0,0.65)";

  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 -z-[5] ${grainOpacity} ${grainBlend}`}
        style={{ backgroundImage: `url("${NOISE_DATA_URI}")`, backgroundSize: "200px 200px" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[4]"
        style={{ boxShadow: vignette }}
      />
    </>
  );
}

export function GoldRhombus({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 24"
      aria-hidden
      className={`h-3 w-5 text-[var(--oro)] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    >
      <path d="M2 12c6-6 10 6 15 0" opacity="0.9" />
      <path d="M17 12c3.5-5 8-2 6.5 2.5S16 18 20 12s10-6 12.5-1.5S36 16 38 12" />
    </svg>
  );
}
