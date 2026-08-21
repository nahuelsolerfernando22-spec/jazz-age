import { useEffect, useState } from "react";
import ambientIcon from "@/assets/hub/ambient-icon.png";
import { useSettings } from "@/store/settings";
import {
  isAmbientEnabled,
  setAmbientEnabled,
  applyAmbientVolume,
  suspendAmbient,
  resumeAmbientIfEnabled,
} from "@/lib/ambient-music";

export function AmbientToggle({
  className = "",
  size = "lg",
}: {
  className?: string;
  size?: "sm" | "lg";
}) {
  const muted = useSettings((s) => s.muted);
  const master = useSettings((s) => s.masterVolume);
  const music = useSettings((s) => s.musicVolume);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isAmbientEnabled());
  }, []);

  useEffect(() => {
    if (!on) return;

    const target = muted ? 0 : Math.max(0, Math.min(1, master * music * 0.55));
    applyAmbientVolume(target);
  }, [on, muted, master, music]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) suspendAmbient();
      else resumeAmbientIfEnabled();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    setAmbientEnabled(next);
    if (next) {
      const target = muted ? 0 : Math.max(0, Math.min(1, master * music * 0.55));
      applyAmbientVolume(target);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Silenciar ambiente del salón" : "Reproducir ambiente del salón"}
      aria-pressed={on}
      title={on ? "Silenciar ambiente" : "Reproducir ambiente"}
      className={
        "group relative inline-flex items-center justify-center rounded-full " +
        (size === "sm" ? "h-11 w-11 " : "h-12 w-12 ") +
        "border border-amber-900/60 bg-[#1a130a]/90 text-amber-200/90 shadow-[0_4px_14px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,200,120,0.08)] " +
        "backdrop-blur transition-all duration-200 " +
        "hover:border-amber-500/70 hover:text-amber-100 hover:shadow-[0_6px_18px_rgba(255,170,60,0.25),inset_0_0_0_1px_rgba(255,200,120,0.18)] " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0a05] " +
        "active:scale-95 " +
        className
      }
    >
      {on && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,180,80,0.35) 0%, rgba(255,180,80,0) 70%)",
            animation: "ambientHaloPulse 2.4s ease-in-out infinite",
          }}
        />
      )}
      <img
        src={ambientIcon}
        alt=""
        aria-hidden
        draggable={false}
        className={
          (size === "sm" ? "relative h-6 w-6 " : "relative h-7 w-7 ") +
          (on ? "opacity-100" : "opacity-55 grayscale")
        }
        style={{ filter: on ? "drop-shadow(0 0 4px rgba(255,180,80,0.55))" : undefined }}
      />
      <style>{`
        @keyframes ambientHaloPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
        }
      `}</style>
    </button>
  );
}
