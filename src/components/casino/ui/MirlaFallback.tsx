import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import fallbackMirla from "@/assets/_placeholder.webp";

export function MirlaFallback({
  onRetry,
  title = "Esperá — a Mirla se le cayó una copa.",
  hint = "El garito tuvo un traspié. Probá otra vez o volvé al salón mientras Mirla barre los cristales.",
}: {
  onRetry?: () => void;
  title?: string;
  hint?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[110] overflow-hidden bg-[#0a0606]"
    >
      <img
        src={fallbackMirla}
        alt=""
        aria-hidden
        draggable={false}
        decoding="async"
        className="absolute inset-0 h-full w-full select-none object-cover"
        style={{ objectPosition: "right 40%" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 85%), linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      {}
      <div aria-hidden>
        {[
          "top-3 left-3 border-l-2 border-t-2",
          "top-3 right-3 border-r-2 border-t-2",
          "bottom-3 left-3 border-l-2 border-b-2",
          "bottom-3 right-3 border-r-2 border-b-2",
        ].map((pos) => (
          <span
            key={pos}
            className={`absolute h-10 w-10 sm:h-14 sm:w-14 pointer-events-none border-[hsl(var(--brass)/0.6)] ${pos} sm:${pos.replace("3", "5")}`}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-1 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-center">
        <p
          className="font-serif text-[0.65rem] uppercase tracking-[0.5em] text-[hsl(var(--brass)/0.75)] sm:text-xs"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}
        >
          Port Corbeau · Terraza
        </p>
        <h1
          className="font-display text-xl uppercase tracking-[0.18em] text-[hsl(var(--brass))] sm:text-3xl"
          style={{
            fontFamily: "'Limelight', 'Abril Fatface', serif",
            textShadow: "0 2px 12px rgba(0,0,0,0.95), 0 0 24px hsl(var(--blood) / 0.4)",
          }}
        >
          Un traspié en la mesa
        </h1>
        <span
          className="mt-1 inline-block h-px w-24 bg-[hsl(var(--brass)/0.6)] sm:w-32"
          aria-hidden
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:gap-4 sm:pb-10">
        <p
          className="max-w-[32ch] text-center font-serif text-sm italic text-[hsl(var(--ivory))] sm:max-w-[46ch] sm:text-base"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.95)" }}
        >
          {title}
        </p>
        <p
          className="max-w-[36ch] text-center font-serif text-[0.7rem] italic text-[hsl(var(--ivory)/0.75)] sm:max-w-[52ch] sm:text-xs"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.95)" }}
        >
          {hint}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[44px] rounded-sm border border-[hsl(var(--brass)/0.7)] bg-black/60 px-4 py-2 font-display text-[11px] uppercase tracking-[0.4em] text-[hsl(var(--brass))] transition hover:bg-[hsl(var(--oxblood)/0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--brass))]"
            >
              Reintentar
            </button>
          )}
          <Link
            to="/"
            className="min-h-[44px] inline-flex items-center rounded-sm border border-[hsl(var(--brass)/0.4)] bg-transparent px-4 py-2 font-display text-[11px] uppercase tracking-[0.4em] text-[hsl(var(--brass)/0.85)] transition hover:text-[hsl(var(--brass))] hover:border-[hsl(var(--brass)/0.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--brass))]"
          >
            Volver al salón
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
