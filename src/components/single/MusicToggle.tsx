import { useEffect, useState } from "react";
import { IconGramola } from "@/components/casino/DecoIcons";
import { useSettings } from "@/store/settings";
import {
  isMusicEnabled,
  setMusicEnabled,
  applyMusicVolume,
  suspendMusic,
  resumeMusicIfEnabled,
} from "@/lib/background-music";

export function MusicToggle({
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
    setOn(isMusicEnabled());
  }, []);

  useEffect(() => {
    if (!on) return;
    const target = muted ? 0 : Math.max(0, Math.min(1, master * music));
    applyMusicVolume(target);
  }, [on, muted, master, music]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) suspendMusic();
      else resumeMusicIfEnabled();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    setMusicEnabled(next);
    if (next) {
      const target = muted ? 0 : Math.max(0, Math.min(1, master * music));
      applyMusicVolume(target);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Silenciar música del speakeasy" : "Reproducir música del speakeasy"}
      aria-pressed={on}
      title={on ? "Silenciar música" : "Reproducir música"}
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
      {}
      {on && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,180,80,0.35) 0%, rgba(255,180,80,0) 70%)",
            animation: "musicHaloPulse 2.4s ease-in-out infinite",
          }}
        />
      )}
      <IconGramola
        size={size === "sm" ? 22 : 26}
        className="relative"
        style={{
          color: on ? "var(--cd-gold-tab)" : "rgba(244,217,122,0.5)",
          filter: on ? "drop-shadow(0 0 5px rgba(255,180,80,0.5))" : undefined,
        }}
      />
      <style>{`
        @keyframes musicHaloPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
        }
      `}</style>
    </button>
  );
}
