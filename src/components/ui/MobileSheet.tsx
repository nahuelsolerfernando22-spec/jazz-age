import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { ReactNode, useEffect } from "react";

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  dismissOnBackdrop?: boolean;
  maxHeight?: string;
}

export function MobileSheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  ariaLabel,
  dismissOnBackdrop = true,
  maxHeight = "86dvh",
}: MobileSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const body = document.body;
    const key = "cdModalCount";
    const current = Number(body.dataset[key] ?? "0");
    body.dataset[key] = String(current + 1);
    body.classList.add("cd-modal-open");
    return () => {
      const next = Math.max(0, Number(body.dataset[key] ?? "1") - 1);
      body.dataset[key] = String(next);
      if (next === 0) body.classList.remove("cd-modal-open");
    };
  }, [open]);

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? title}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={dismissOnBackdrop ? onClose : undefined}
            tabIndex={-1}
          />
          <motion.div
            className="relative flex w-full max-w-lg flex-col rounded-t-3xl border-t border-[var(--brass,var(--cd-gold-mid))]/50 bg-[var(--verde-noche)]/98 shadow-[0_-24px_70px_rgba(0,0,0,0.85)] sm:mb-6 sm:rounded-3xl sm:border"
            style={{ maxHeight, paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDrag}
          >
            <div className="flex items-center justify-center pt-2 pb-1" aria-hidden="true">
              <span className="h-1.5 w-12 rounded-full bg-white/25" />
            </div>

            {(title || eyebrow) && (
              <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/5 px-4 py-2">
                <div className="min-w-0">
                  {eyebrow && (
                    <div className="font-display text-[11px] uppercase tracking-[0.32em] text-[var(--brass,var(--cd-gold-mid))]/70">
                      {eyebrow}
                    </div>
                  )}
                  {title && (
                    <h2
                      className="mt-0.5 truncate text-lg text-[var(--brass,var(--cd-gold-mid))] sm:text-xl"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
                    >
                      {title}
                    </h2>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[var(--brass,var(--cd-gold-mid))]/45 bg-[var(--brass,var(--cd-gold-mid))]/10 text-xl text-[var(--brass,var(--cd-gold-mid))] active:scale-95 active:bg-[var(--brass,var(--cd-gold-mid))]/25"
                  style={{ touchAction: "manipulation" }}
                >
                  ×
                </button>
              </header>
            )}

            <div className="app-scroll flex-1 px-5 py-4 text-[var(--ivory,#ecebe6)]/90">
              {children}
            </div>

            {footer && (
              <footer
                className="shrink-0 border-t border-white/10 bg-[var(--verde-noche)]/95 px-4 py-3"
                style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
              >
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
