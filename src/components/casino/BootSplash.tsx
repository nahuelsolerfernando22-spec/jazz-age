import { useEffect, useState } from "react";
import splashSrc from "@/assets/splash-tibestudio.webp";

const SESSION_KEY = "cuervo-boot-splash-shown-v1";
const MIN_VISIBLE_MS = 1600;
const GAME_MIN_VISIBLE_MS = 420;
const MAX_VISIBLE_MS = 980;
const FADE_MS = 220;

function isDirectGameBoot(): boolean {
  try {
    return new Set([
      "/blackjack",
      "/chinchon",
      "/truco",
      "/truco-parejas",
      "/mahjong",
      "/escoba",
      "/dados",
      "/ruleta",
      "/bagatelle",
      "/solitario",
    ]).has(window.location.pathname);
  } catch {
    return false;
  }
}

export function BootSplash() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      alreadyShown = false;
    }
    if (alreadyShown) return;
    setVisible(true);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    const started = performance.now();
    const minVisibleMs = isDirectGameBoot() ? GAME_MIN_VISIBLE_MS : MIN_VISIBLE_MS;
    let closed = false;
    const img = new Image();
    img.src = splashSrc;
    const hide = () => {
      if (closed) return;
      closed = true;
      const elapsed = performance.now() - started;
      const remaining = Math.max(0, minVisibleMs - elapsed);
      window.setTimeout(() => {
        setLeaving(true);
        window.setTimeout(() => setVisible(false), FADE_MS);
      }, remaining);
    };
    const maxTimer = window.setTimeout(hide, MAX_VISIBLE_MS);
    if (img.complete) hide();
    else {
      img.onload = hide;
      img.onerror = hide;
    }
    return () => window.clearTimeout(maxTimer);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at 50% 45%, #3a140d 0%, #1a0705 65%, #0a0403 100%)",
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <img
        src={splashSrc}
        alt=""
        width={1024}
        height={1536}
        className="max-h-[92vh] w-auto max-w-[86vw] object-contain select-none"
        style={{
          filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.6))",
          animation: "boot-splash-in 900ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        }}
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-x-0 flex justify-center"
        style={{ bottom: "calc(var(--sa-bottom) + 28px)" }}
      >
        <div
          className="h-[3px] w-40 overflow-hidden rounded-full"
          style={{ background: "rgba(201, 168, 76, 0.18)" }}
        >
          <div
            className="h-full w-1/3 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, var(--cd-gold-mid), transparent)",
              animation: "boot-splash-sheen 1400ms ease-in-out infinite",
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes boot-splash-in {
          0% { opacity: 0; transform: scale(0.94); }
          60% { opacity: 1; }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes boot-splash-sheen {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(420%); }
        }
      `}</style>
    </div>
  );
}
