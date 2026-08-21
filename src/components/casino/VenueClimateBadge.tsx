import { useEffect, useState } from "react";
import { getClimate, CLIMATE_META, type Climate } from "@/lib/venue-climate";

export function VenueClimateBadge() {
  const [climate, setClimate] = useState<Climate>("neutro");

  useEffect(() => {
    const update = () => setClimate(getClimate());
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const meta = CLIMATE_META[climate];
  if (climate === "neutro") return null;

  return (
    <div
      className="pointer-events-none fixed bottom-3 left-3 z-30 rounded-full border border-[hsl(var(--brass)/0.35)] bg-[hsl(var(--noir)/0.85)] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--ivory)/0.85)] backdrop-blur"
      style={{ boxShadow: meta.glow }}
      title={meta.ambient}
    >
      <span className="text-[hsl(var(--brass))]">●</span> {meta.label}
    </div>
  );
}
