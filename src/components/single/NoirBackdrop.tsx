import { useReducedMotion } from "@/hooks/use-reduced-motion";

const WOOD_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220"><g stroke="#3a2716" stroke-opacity="0.28" stroke-width="0.6" fill="none"><path d="M0 30 C 140 22, 280 42, 420 32"/><path d="M0 68 C 140 76, 280 60, 420 74"/><path d="M0 108 C 140 96, 280 118, 420 104"/><path d="M0 150 C 140 158, 280 140, 420 152"/><path d="M0 192 C 140 182, 280 200, 420 188"/></g><g stroke="#1a0f07" stroke-opacity="0.35" stroke-width="0.4" fill="none"><path d="M0 12 C 140 18, 280 8, 420 16"/><path d="M0 210 C 140 202, 280 214, 420 206"/></g></svg>`,
  );

const NOISE_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.78  0 0 0 0 0.55  0 0 0 0.55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
  );

interface NoirBackdropProps {
  variant?: "hub" | "logros";
}

export function NoirBackdrop({ variant = "hub" }: NoirBackdropProps) {
  const reduced = useReducedMotion();
  const isLogros = variant === "logros";

  const halos = isLogros
    ? [
        "radial-gradient(60% 45% at 82% -3%, rgba(232,178,86,0.26) 0%, rgba(201,138,54,0.10) 35%, transparent 65%)",
        "radial-gradient(55% 45% at 12% 20%, rgba(178,72,38,0.20) 0%, transparent 60%)",
        "radial-gradient(90% 55% at 50% 100%, rgba(18,42,32,0.50) 0%, rgba(10,20,16,0.22) 45%, transparent 75%)",
      ]
    : [
        "radial-gradient(65% 50% at 15% -5%, rgba(232,178,86,0.28) 0%, rgba(201,138,54,0.10) 35%, transparent 65%)",
        "radial-gradient(55% 45% at 92% 6%, rgba(178,72,38,0.22) 0%, transparent 60%)",
        "radial-gradient(90% 55% at 50% 95%, rgba(18,42,32,0.55) 0%, rgba(10,20,16,0.25) 45%, transparent 75%)",
      ];

  return (
    <>
      {}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: [
            ...halos,
            "linear-gradient(180deg, #1c1108 0%, #14100a 40%, #0a0705 100%)",
          ].join(", "),
          backgroundColor: "#14100a",
        }}
      />
      {}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[8] opacity-[0.28] mix-blend-overlay"
        style={{
          backgroundImage: `url("${WOOD_DATA_URI}")`,
          backgroundSize: "420px 220px",
        }}
      />
      {}
      {!reduced && (
        <div
          aria-hidden
          className="pointer-events-none fixed -z-[7] will-change-transform"
          style={{
            top: "-10%",
            left: isLogros ? "-15%" : "-25%",
            width: "140%",
            height: "60%",
            background:
              "radial-gradient(closest-side, rgba(232,213,170,0.10) 0%, rgba(232,213,170,0.04) 45%, transparent 75%)",
            filter: "blur(30px)",
            animation: `noir-smoke-drift ${isLogros ? "48s" : "56s"} ease-in-out infinite`,
            animationDelay: isLogros ? "-14s" : "0s",
          }}
        />
      )}
      {}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[5] opacity-[0.045] mix-blend-overlay"
        style={{ backgroundImage: `url("${NOISE_DATA_URI}")`, backgroundSize: "200px 200px" }}
      />
      {}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[4]"
        style={{ boxShadow: "inset 0 0 240px 40px rgba(0,0,0,0.65)" }}
      />
    </>
  );
}
