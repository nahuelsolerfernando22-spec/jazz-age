import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { isApk } from "@/lib/is-apk";
import { leaveGameToLobby } from "@/lib/leave-game-to-lobby";

interface BackListenerEvent {
  canGoBack: boolean;
}
interface CapacitorAppPlugin {
  addListener: (
    ev: "backButton",
    cb: (data: BackListenerEvent) => void,
  ) => Promise<{ remove: () => Promise<void> }>;
  exitApp?: () => Promise<void>;
  minimizeApp?: () => Promise<void>;
}

const HUB_ROUTES = new Set(["/", "/single"]);
const GAME_ROUTES = new Set([
  "/blackjack",
  "/chinchon",
  "/truco",
  "/mahjong",
  "/escoba",
  "/dados",
  "/ruleta",
  "/bagatelle",
  "/solitario",
  "/tables",
  "/generala",
  "/poker",
  "/sindicato",
  "/torneo",
]);


const CONFIRM_EXIT_WINDOW_MS = 2500;
let lastGameBackAt = 0;
let lastGameBackPath = "";

function firstSegment(path: string): string {
  return "/" + (path.split("/")[1] ?? "");
}

function tryCloseTopModal(): boolean {
  if (typeof document === "undefined") return false;
  const dialog = document.querySelector<HTMLElement>(
    '[role="dialog"][data-state="open"], [data-state="open"][role="alertdialog"]',
  );
  if (!dialog) return false;
  const closer = dialog.querySelector<HTMLButtonElement>(
    'button[data-dismiss], button[aria-label*="Cerrar" i], button[aria-label*="Close" i]',
  );
  if (closer) {
    closer.click();
    return true;
  }
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  return true;
}

function toastPressBackAgain() {
  try {
    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.style.cssText =
      "position:fixed;left:50%;bottom:calc(90px + var(--sa-bottom));" +
      "transform:translateX(-50%);z-index:10000;padding:10px 16px;border-radius:999px;" +
      "background:rgba(10,6,4,0.92);color:#f3e6c9;font:600 13px/1.2 system-ui;" +
      "border:1px solid rgba(196,148,86,0.55);box-shadow:0 6px 20px rgba(0,0,0,0.5);" +
      "pointer-events:none;letter-spacing:0.02em;";
    el.textContent = "Presioná atrás otra vez para salir · se pierde la mano";
    document.body.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, CONFIRM_EXIT_WINDOW_MS);
  } catch {
    /* noop */
  }
}

export function AndroidBackHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!isApk()) return;
    let sub: { remove: () => Promise<void> } | null = null;
    let cancelled = false;

    void import("@capacitor/app")
      .then(({ App }) => {
        if (cancelled) return;
        const plugin = App as unknown as CapacitorAppPlugin;
        return plugin
          .addListener("backButton", () => {
            const path = window.location.pathname;
            const seg = firstSegment(path);

            const cancel = new CustomEvent("cuervo:android-back", { cancelable: true });
            const consumed = !window.dispatchEvent(cancel);
            if (consumed) return;

            if (tryCloseTopModal()) return;

            if (HUB_ROUTES.has(path) || HUB_ROUTES.has(seg)) {
              plugin.minimizeApp?.().catch(() => plugin.exitApp?.());
              return;
            }

            if (GAME_ROUTES.has(seg)) {
              const now = Date.now();
              const recent =
                lastGameBackPath === path && now - lastGameBackAt < CONFIRM_EXIT_WINDOW_MS;
              if (!recent) {
                lastGameBackAt = now;
                lastGameBackPath = path;
                toastPressBackAgain();
                return;
              }
              lastGameBackAt = 0;
              lastGameBackPath = "";
              leaveGameToLobby((opts) => router.navigate(opts));
              return;
            }

            if (window.history.length > 1) router.history.back();
            else router.navigate({ to: "/single" });
          })
          .then((s) => {
            if (cancelled) void s.remove();
            else sub = s;
          });
      })
      .catch(() => {
        /* noop */
      });

    return () => {
      cancelled = true;
      void sub?.remove();
    };
  }, [router]);

  return null;
}
