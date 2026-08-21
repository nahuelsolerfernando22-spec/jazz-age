import { useCallback, useEffect, useRef, useState } from "react";
import { getPlayerAlias, setPlayerAlias } from "@/lib/player-alias";

interface Props {
  compact?: boolean;
}

export function NameEditor({ compact = false }: Props) {
  const [alias, setAlias] = useState<string>(() => getPlayerAlias());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(alias);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onChange = (ev: Event) => {
      const detail = (ev as CustomEvent<string>).detail;
      if (typeof detail === "string") setAlias(detail);
      else setAlias(getPlayerAlias());
    };
    window.addEventListener("cuervo:alias:changed", onChange);
    return () => window.removeEventListener("cuervo:alias:changed", onChange);
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(alias);
      setError(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, alias]);

  const save = useCallback(() => {
    try {
      setPlayerAlias(draft);
      setAlias(draft.trim().slice(0, 20));
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nombre inválido.");
    }
  }, [draft]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Cambiar nombre (actual: ${alias})`}
        title="Cambiar tu nombre"
        className={`group flex shrink-0 items-center gap-1.5 rounded-full border border-[#2d5a3d]/60 bg-[#152520]/80 text-[var(--marfil)] transition hover:border-[var(--oro)] hover:text-[var(--oro)] ${
          compact ? "h-11 w-11 justify-center px-0 text-[13px]" : "h-11 min-w-[44px] px-4 text-xs"
        }`}
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.14em" }}
      >
        {compact ? (
          <span aria-hidden className="font-bold uppercase text-[var(--oro-claro)]">
            {(alias.trim()[0] ?? "?").toUpperCase()}
          </span>
        ) : (
          <>
            <span className="inline-block whitespace-nowrap uppercase">Cambiar</span>
          </>
        )}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cambiar nombre"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#2d5a3d]/70 bg-[#0f1c18] p-5 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.34em] text-[var(--oro)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Tu nombre en la casa
            </div>
            <div className="mt-1 text-[13px] text-[var(--marfil)]/80">
              Se guarda sólo en este dispositivo. El juego no envía datos por internet.
            </div>

            <input
              ref={inputRef}
              type="text"
              value={draft}
              maxLength={20}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="ej. El Cuervo"
              className="mt-4 w-full rounded-lg border border-[#2d5a3d]/60 bg-[#152520] px-3 py-2.5 text-sm text-[var(--marfil)] placeholder:text-[var(--marfil)]/65 focus:border-[var(--oro)] focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--marfil)]/65">
              <span>
                {error ? <span className="text-red-400">{error}</span> : "2 – 20 caracteres"}
              </span>
              <span>{draft.trim().length}/20</span>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-[var(--marfil)]/80 hover:text-[var(--marfil)]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-full border border-[var(--oro)] bg-[var(--oro)]/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[var(--oro)] hover:bg-[var(--oro)]/25"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
