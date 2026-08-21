import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useSyncExternalStore } from "react";
import { isLowPower, onLowPowerChange } from "@/lib/low-power";
import { useSettings } from "@/store/settings";

function useLowPower() {
  return useSyncExternalStore(
    (cb) => onLowPowerChange(cb),
    () => isLowPower(),
    () => false,
  );
}

interface Props {
  burstKey: number;
  tone?: "dust" | "gold";
  count?: number;
}

export function BurstParticles({ burstKey, tone = "dust", count = 14 }: Props) {
  const lowPower = useLowPower();
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const effectiveCount = reduceMotion
    ? 0
    : lowPower
      ? Math.max(4, Math.round(count * 0.35))
      : count;
  const particles = useMemo(() => {
    return Array.from({ length: effectiveCount }, (_, i) => {
      const angle = (i / Math.max(1, effectiveCount)) * Math.PI * 2 + Math.random() * 0.6;
      const dist = 40 + Math.random() * (tone === "gold" ? 130 : 70);
      return {
        id: i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - (tone === "gold" ? 20 : 8),
        size: tone === "gold" ? 4 + Math.random() * 5 : 2 + Math.random() * 3,
        delay: Math.random() * 0.08,
        rot: (Math.random() - 0.5) * 360,
      };
    });
  }, [burstKey, effectiveCount, tone]);

  if (!burstKey || effectiveCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={burstKey}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background:
                tone === "gold"
                  ? "radial-gradient(circle, oklch(0.92 0.16 85) 0%, oklch(0.75 0.18 65 / 0.9) 60%, transparent 100%)"
                  : "radial-gradient(circle, oklch(0.85 0.05 70 / 0.85) 0%, oklch(0.55 0.04 60 / 0.6) 60%, transparent 100%)",
              boxShadow:
                tone === "gold"
                  ? "0 0 8px oklch(0.85 0.18 75 / 0.8)"
                  : "0 0 4px oklch(0.6 0.05 60 / 0.4)",
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{
              x: p.dx,
              y: p.dy,
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1.1, 1, 0.6],
              rotate: p.rot,
            }}
            transition={{
              duration: tone === "gold" ? 1.1 : 0.7,
              delay: p.delay,
              ease: "easeOut",
              times: [0, 0.15, 0.7, 1],
            }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
