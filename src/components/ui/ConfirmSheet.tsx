import { MobileSheet } from "@/components/ui/MobileSheet";

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <MobileSheet
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex w-full items-center gap-2 handed-row">
          <button
            type="button"
            onClick={onCancel}
            className="tap-comfort flex-1 rounded-md border border-white/15 bg-white/[0.03] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/85 active:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`tap-comfort flex-1 rounded-md px-4 text-xs font-semibold uppercase tracking-[0.2em] ${
              destructive
                ? "bg-[#b0403a] text-[var(--marfil)] active:brightness-110"
                : "bg-[var(--oro)] text-[var(--verde-noche)] active:brightness-110"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      {description ? (
        <p className="px-4 py-4 text-sm leading-relaxed text-[var(--marfil)]/85">{description}</p>
      ) : null}
    </MobileSheet>
  );
}
