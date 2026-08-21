import { useEffect, useState } from "react";

/**
 * El Cuervo Dorado es un juego vertical. En Android la orientación queda
 * bloqueada en portrait, pero en navegador (o si el sistema fuerza la
 * rotación) hay que evitar que las mesas se vean deformadas: mostramos una
 * cortina pidiendo girar el dispositivo en vez de reflujar mal el layout.
 */
export function PortraitGate() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      // Sólo en pantallas táctiles de mano: un monitor apaisado no molesta.
      setBlocked(coarse && w > h && h < 620);
    };

    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (blocked) document.body.dataset.rotateGate = "1";
    else delete document.body.dataset.rotateGate;
  }, [blocked]);

  if (!blocked) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Girá el dispositivo"
      style={{ zIndex: 2147483000 }}
      className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b0705] px-8 text-center"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-14 w-14 text-[#c9a24a]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="17" y="6" width="14" height="26" rx="3" />
        <path d="M22 9h4" />
        <path d="M12 38a14 14 0 0 0 24 0" />
        <path d="M36 38v-5" />
        <path d="M36 38h-5" />
      </svg>
      <p className="text-lg font-semibold text-[#f2d79a]">Girá el teléfono</p>
      <p className="max-w-xs text-sm text-[#f2d79a]/80">
        El casino se juega en vertical. Poné el dispositivo derecho para volver a la mesa.
      </p>
    </div>
  );
}
