import { memo } from "react";
import { useTimeMeta, TIME_META_FADE_MS } from "@/hooks/use-time-meta";
import type { TimeBand } from "@/lib/time-of-day";

export function TimeOfDayLayer() {
  const { meta, prev } = useTimeMeta();
  return (
    <>
      {prev && (
        <BandLayer key={`prev-${prev.band}`} band={prev.band} tint={prev.tint} fading="out" />
      )}
      <BandLayer key={`cur-${meta.band}`} band={meta.band} tint={meta.tint} fading="in" />
    </>
  );
}

const FADE_S = `${TIME_META_FADE_MS}ms`;

const BandLayer = memo(function BandLayer({
  band,
  tint,
  fading,
}: {
  band: TimeBand;
  tint: string;
  fading: "in" | "out";
}) {
  return (
    <div
      aria-hidden
      data-band={band}
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: fading === "out" ? 0 : 1,
        transition: `opacity ${FADE_S} ease-in-out`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{ background: tint }}
      />
      <AmbientArt band={band} />
    </div>
  );
});

const AmbientArt = memo(function AmbientArt({ band }: { band: TimeBand }) {
  switch (band) {
    case "amanecer":
      return <SunRays hue="oklch(0.82 0.16 55 / 0.28)" angle={-18} />;
    case "manana":
      return <DustMotes tint="oklch(0.85 0.10 70 / 0.55)" count={22} />;
    case "dia":
      return <SunRays hue="oklch(0.90 0.10 90 / 0.20)" angle={-4} />;
    case "tarde":
      return <SunRays hue="oklch(0.68 0.18 32 / 0.32)" angle={22} />;
    case "noche":
      return <Moonlight />;
    case "madrugada":
      return <VioletMist />;
  }
});

function SunRays({ hue, angle }: { hue: string; angle: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-screen opacity-70"
      style={{
        background: `
          radial-gradient(ellipse 40% 35% at 78% 12%, ${hue} 0%, transparent 70%),
          repeating-linear-gradient(${angle}deg,
            transparent 0px, transparent 42px,
            ${hue} 42px, ${hue} 44px,
            transparent 44px, transparent 96px)
        `,
        maskImage: "radial-gradient(ellipse 65% 55% at 78% 15%, black 0%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 78% 15%, black 0%, transparent 75%)",
      }}
    />
  );
}

function DustMotes({ tint, count }: { tint: string; count: number }) {
  const seed = 137;
  const motes = Array.from({ length: count }, (_, i) => {
    const x = ((i * seed) % 100) + (i % 3) * 0.7;
    const y = ((i * 53) % 100) + (i % 5) * 0.3;
    const r = 0.6 + ((i * 7) % 10) / 10;
    const delay = (i % 8) * 0.7;
    const dur = 6 + (i % 5);
    return { x, y, r, delay, dur, i };
  });
  return (
    <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-80">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {motes.map((m) => (
          <circle
            key={m.i}
            cx={m.x}
            cy={m.y}
            r={m.r * 0.18}
            fill={tint}
            style={{
              animation: `cuervo-dust-drift ${m.dur}s ease-in-out ${m.delay}s infinite alternate`,
            }}
          />
        ))}
      </svg>
      <style>{`
        @keyframes cuervo-dust-drift {
          0%   { transform: translate3d(0, 0, 0); opacity: 0.35; }
          50%  { transform: translate3d(-1.2%, -2.4%, 0); opacity: 0.85; }
          100% { transform: translate3d(1.6%, -3.6%, 0); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function Moonlight() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-screen opacity-70"
      style={{
        background: `
          radial-gradient(circle 220px at 14% 10%, oklch(0.88 0.06 230 / 0.32) 0%, transparent 70%),
          radial-gradient(ellipse 55% 40% at 10% 8%, oklch(0.70 0.10 260 / 0.18) 0%, transparent 80%)
        `,
      }}
    />
  );
}

function VioletMist() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-screen opacity-50"
        style={{
          background: `
            radial-gradient(ellipse 90% 40% at 50% 105%, oklch(0.42 0.09 265 / 0.30) 0%, transparent 70%),
            radial-gradient(ellipse 60% 30% at 20% 90%, oklch(0.50 0.07 255 / 0.20) 0%, transparent 75%)
          `,
          animation: "cuervo-mist-drift 22s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes cuervo-mist-drift {
          0%   { transform: translate3d(-2%, 1%, 0); }
          100% { transform: translate3d(3%, -2%, 0); }
        }
      `}</style>
    </>
  );
}
