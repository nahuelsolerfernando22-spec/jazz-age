import { motion } from "framer-motion";
import { getDailyEmotionalState } from "@/lib/hostess-emotion";
import { tellFor, TELL_LABEL, type Tell } from "@/lib/hostess-tells";

export function HostessTellOverlay({ npcId }: { npcId: string }) {
  const state = getDailyEmotionalState(npcId);
  const tell = tellFor(state);
  if (tell === "still") return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      data-tell={tell}
      title={TELL_LABEL[tell]}
    >
      <TellFx tell={tell} />
    </div>
  );
}

function TellFx({ tell }: { tell: Tell }) {
  switch (tell) {
    case "spark":
      return (
        <motion.div
          className="absolute left-1/2 top-[32%] h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--brass-bright)]"
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.6, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: "0 0 8px 2px var(--brass)" }}
        />
      );
    case "glow":
      return (
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(ellipse at 50% 35%, var(--brass) 0%, transparent 55%)",
            mixBlendMode: "screen",
          }}
        />
      );
    case "focus":
      return (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, transparent 40%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      );
    case "veil":
      return (
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(120,90,60,0.18) 0%, transparent 60%)",
            mixBlendMode: "multiply",
          }}
        />
      );
    case "tilt":
      return (
        <motion.div
          className="absolute left-1/2 top-[28%] h-6 w-6 -translate-x-1/2 rounded-full border border-[var(--brass)]/40"
          animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      );
    case "guard":
      return (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      );
    case "flare":
      return (
        <motion.div
          className="absolute left-1/2 top-[46%] h-2 w-4 -translate-x-1/2 rounded-full"
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "var(--blood)",
            boxShadow: "0 0 10px 2px var(--blood)",
            mixBlendMode: "screen",
          }}
        />
      );
    case "drift":
      return (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-[var(--ivory)]/40"
              style={{ left: `${30 + i * 20}%`, top: "20%" }}
              animate={{ y: ["0%", "180%"], opacity: [0, 0.6, 0] }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "linear",
              }}
            />
          ))}
        </>
      );
    case "tension":
      return (
        <motion.div
          className="absolute inset-0 border border-[var(--blood)]/25"
          animate={{ x: [0, -0.6, 0.6, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 3 }}
        />
      );
    case "shield":
      return (
        <motion.div
          className="absolute inset-x-4 bottom-[22%] h-8 rounded-full"
          animate={{ opacity: [0.1, 0.35, 0.1] }}
          transition={{ duration: 3.5, repeat: Infinity }}
          style={{
            background: "radial-gradient(ellipse at 50% 50%, var(--brass) 0%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
      );
    default:
      return null;
  }
}
