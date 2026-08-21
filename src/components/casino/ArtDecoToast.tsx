import { motion, AnimatePresence } from "framer-motion";

export type ToastTone = "neutral" | "win" | "lose";

interface ArtDecoToastProps {
  message?: string | null;
  tone?: ToastTone;
  speaker?: string;
  className?: string;
  floating?: boolean;
}

const TONE_STYLES: Record<
  ToastTone,
  { border: string; bg: string; color: string; accent: string }
> = {
  neutral: {
    border: "var(--brass)/25",
    bg: "var(--noir)/75",
    color: "var(--smoke)",
    accent: "var(--brass)/70",
  },
  win: {
    border: "var(--brass-bright)/40",
    bg: "var(--brass-bright)/10",
    color: "var(--brass-bright)",
    accent: "var(--brass-bright)",
  },
  lose: {
    border: "var(--blood)/40",
    bg: "var(--blood)/10",
    color: "var(--ivory)",
    accent: "var(--blood)",
  },
};

export function ArtDecoToast({
  message,
  tone = "neutral",
  speaker,
  className = "",
  floating = false,
}: ArtDecoToastProps) {
  const s = TONE_STYLES[tone];
  const floatingClasses = floating
    ? "pointer-events-none fixed inset-x-0 bottom-[calc(var(--sa-bottom)+6rem)] z-50 mx-auto max-w-md text-center font-display text-[11px] uppercase tracking-[0.3em] not-italic"
    : "";
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: floating ? 20 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: floating ? 20 : -4 }}
          transition={{ duration: 0.22 }}
          className={`relative rounded-sm border px-4 py-2 ${floating ? "" : "text-sm italic"} shadow-deep ${floatingClasses} ${className}`}
          style={{
            borderColor: s.border,
            background: s.bg,
            color: floating ? "var(--brass-bright)" : s.color,
          }}
        >
          {}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1 top-1 h-1.5 w-1.5 rotate-45"
            style={{ background: s.accent, opacity: 0.7 }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 rotate-45"
            style={{ background: s.accent, opacity: 0.7 }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1 left-1 h-1.5 w-1.5 rotate-45"
            style={{ background: s.accent, opacity: 0.7 }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1 right-1 h-1.5 w-1.5 rotate-45"
            style={{ background: s.accent, opacity: 0.7 }}
          />
          {speaker && (
            <span
              className="mr-2 font-display text-[11px] not-italic uppercase tracking-[0.35em]"
              style={{ color: s.accent }}
            >
              {speaker} ·
            </span>
          )}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
