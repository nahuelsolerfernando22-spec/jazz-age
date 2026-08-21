import { useEffect, useRef } from "react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALL_DISMISS_KEY = "cuervo:install-dismissed-at";
const INSTALL_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(INSTALL_DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < INSTALL_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function PwaPrompts() {
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    if (nav.Capacitor?.isNativePlatform?.()) return;

    const onUpdate = () => {
      toast("Nueva versión disponible", {
        description: "Un build más reciente está listo. Recargá para aplicar los cambios.",
        duration: 12000,
        action: {
          label: "Recargar",
          onClick: () => {
            try {
              window.location.reload();
            } catch {}
          },
        },
      });
    };

    const onInstall = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      if (recentlyDismissed()) return;
      toast("Instalar El Cuervo Dorado", {
        description: "Agregalo a tu pantalla de inicio para jugar sin abrir el navegador.",
        duration: 15000,
        action: {
          label: "Instalar",
          onClick: async () => {
            const p = promptRef.current;
            if (!p) return;
            try {
              await p.prompt();
              await p.userChoice;
            } catch {}
            promptRef.current = null;
          },
        },
        cancel: {
          label: "Ahora no",
          onClick: () => {
            try {
              localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
            } catch {}
          },
        },
      });
    };

    const onInstalled = () => {
      promptRef.current = null;
      try {
        localStorage.removeItem(INSTALL_DISMISS_KEY);
      } catch {}
    };

    window.addEventListener("cuervo:sw-update", onUpdate as EventListener);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("cuervo:sw-update", onUpdate as EventListener);
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
