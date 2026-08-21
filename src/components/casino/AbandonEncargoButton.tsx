import { useState } from "react";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";

interface Props {
  onAbandon: () => void;
  className?: string;
  label?: string;
}

export function AbandonEncargoButton({ onAbandon, className, label = "Abandonar" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--marfil)]/80 active:bg-white/10"
        }
        style={{ touchAction: "manipulation", minHeight: 40 }}
      >
        {label}
      </button>
      <ConfirmSheet
        open={open}
        title="¿Abandonar el encargo?"
        description="Perdés el progreso del run actual. Podés volver a intentarlo desde el hub cuando quieras."
        confirmLabel="Abandonar"
        cancelLabel="Seguir jugando"
        destructive
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          onAbandon();
        }}
      />
    </>
  );
}
