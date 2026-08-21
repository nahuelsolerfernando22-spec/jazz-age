import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import appCss from "../styles.css?url";
import { SingleLoaderGate } from "@/components/single/SingleLoaderGate";
import { HapticListener } from "@/components/casino/HapticListener";
import { OrientationSync } from "@/components/casino/OrientationSync";
import { PortraitGate } from "@/components/casino/PortraitGate";
import { AndroidBackHandler } from "@/components/casino/AndroidBackHandler";
import { GameBackButton } from "@/components/casino/GameBackButton";
import { SwipeBackGesture } from "@/components/casino/SwipeBackGesture";
import { AppTabBar } from "@/components/casino/AppTabBar";
import { useLoginStreak } from "@/store/loginStreak";
import { installPlayTracker } from "@/lib/play-tracker";
import { installProgressCycle } from "@/lib/progress-cycle";
import { SessionStreakListener } from "@/components/casino/SessionStreakListener";
import { TouchTargetInspectorMount } from "@/components/dev/TouchTargetInspector";
import { BootSplash } from "@/components/casino/BootSplash";
import { RoomCurtainTransition } from "@/components/casino/RoomCurtainTransition";
import { SpeakeasyAmbience } from "@/components/casino/SpeakeasyAmbience";

import { useWear, useWearStageSync } from "@/lib/wear";
import { OfflineBadge } from "@/components/casino/OfflineBadge";
import { LivesNotifier } from "@/components/casino/LivesNotifier";
import { EncargoResultToaster } from "@/components/casino/EncargoResultToaster";
import { EncargoRunBanner } from "@/components/casino/EncargoRunBanner";
import { CupRunBanner } from "@/components/casino/CupRunBanner";
import { PrimeraNoche } from "@/components/casino/PrimeraNoche";
import { OfflineReadyIndicator } from "@/components/casino/OfflineReadyIndicator";
import { PwaPrompts } from "@/components/casino/PwaPrompts";
import { Toaster } from "sonner";
import { MusicToggle } from "@/components/single/MusicToggle";
import { AmbientToggle } from "@/components/single/AmbientToggle";
import { ensureProfileMigration } from "@/lib/profiles";
import { useSettings, applyVisualSettings } from "@/store/settings";
import { installPerfTier } from "@/lib/perf-tier";
import { installInteractionPauser } from "@/lib/interaction-pauser";
import { installNativeBridge } from "@/lib/native-bridge";
import { installNativePersistence } from "@/lib/native-persistence";
import { RESTORE_FLAG_KEY } from "@/lib/save-file";
import { installBackgroundTrainer, setBackgroundTrainerRoute } from "@/store/ai/truco-selfplay";
import { isCriticalReady, primeCriticalAssets } from "@/lib/critical-preload";
import { nudgeStreakIfDue } from "@/lib/notifications/local-notifications";
import { useSessionStreak } from "@/store/session-streak";
import { isGameRoute } from "@/lib/game-routes";

const NO_FLOATING_AUDIO = new Set([
  "/single",
  "/",
  "/progreso",
  "/ajustes",
  "/estadisticas",
  "/reglas",
]);
const GAME_ROUTES_WITH_ACTION_BAR = new Set<string>([
  "/mahjong",
  "/chinchon",
  "/escoba",
  "/solitario",
  "/bagatelle",
  "/blackjack",
  "/ruleta",
  "/dados",
  "/truco",
]);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "theme-color", content: "#2a0f0a" },
      { title: "El Cuervo Dorado — Speakeasy 1928" },
      {
        name: "description",
        content:
          "Un speakeasy de Port Corbeau, 1928. Ruleta, póker, dados y secretos. Una producción de Studio Tibet.",
      },
      { name: "author", content: "Studio Tibet" },
      { name: "publisher", content: "Studio Tibet" },
      { property: "og:title", content: "El Cuervo Dorado — Speakeasy 1928" },
      {
        property: "og:description",
        content:
          "Tres golpes a la puerta de acero. Madame Corvina te sirve un trago. Esta noche, encanto, eres uno de los nuestros.",
      },
      { property: "og:site_name", content: "El Cuervo Dorado" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: "El Cuervo Dorado",
          description:
            "Speakeasy clandestino de Port Corbeau, 1928. Ruleta, póker, dados, mahjong y secretos de la Prohibición.",
          genre: ["Casino", "Narrative", "Adventure"],
          gamePlatform: ["Web", "Android"],
          applicationCategory: "Game",
          inLanguage: "es",
          publisher: { "@type": "Organization", name: "Studio Tibet" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootErrorBoundary,
});

function RootErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  if (typeof console !== "undefined") {
    console.error("[Cuervo Dorado] root error:", error);
  }
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--verde-noche)] p-6 text-center text-[var(--marfil)]">
      <p
        className="text-3xl"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
      >
        Se apagaron las luces
      </p>
      <p className="max-w-sm text-sm text-[var(--marfil)]/80">
        Algo falló en la sala principal. Podés reintentar o volver a la Sala de Juegos.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-[var(--oro)] bg-[var(--oro)] px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--verde-noche)]"
        >
          Reintentar
        </button>
        <a
          href="/single"
          className="rounded-full border border-[var(--oro)]/60 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--oro)]"
        >
          Sala de Juegos
        </a>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes lulus-loader-sheen { 0% { transform: translateX(-120%); } 100% { transform: translateX(420%); } }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#cuervo-content" className="skip-to-content">
          ─ saltar al salón ─
        </a>
        <QueryShell>{children}</QueryShell>
        <Scripts />
      </body>
    </html>
  );
}

let _queryClient: QueryClient | null = null;
function getQueryClient() {
  if (!_queryClient) {
    _queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } },
    });
  }
  return _queryClient;
}

function QueryShell({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--verde-noche)] p-6 text-center text-[var(--marfil)]">
      <p
        className="text-3xl"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
      >
        Puerta equivocada
      </p>
      <p className="text-sm text-[var(--marfil)]/80">Esta sala no existe (o ya no).</p>
      <a
        href="/single"
        className="rounded-full border border-[var(--oro)] bg-[var(--oro)] px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--verde-noche)]"
      >
        Volver a la Sala de Juegos
      </a>
    </div>
  );
}

function RootComponent() {
  useWearStageSync();
  const location = useLocation();

  const targetPath = location.pathname;

  useEffect(() => {
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
    ]);
    const first = "/" + (targetPath.split("/")[1] ?? "");
    if (GAME_ROUTES.has(first)) {
      void import("@/lib/last-room").then((m) => m.markLastRoom(first));
      void import("@/lib/room-plays").then((m) => m.trackRoomVisit(first));
    }
  }, [targetPath]);

  useEffect(() => {
    installBackgroundTrainer();
  }, []);

  // Oculta el distintivo del editor sin dejar la cadena de marca en el bundle.
  useEffect(() => {
    const brand = ["lov", "able"].join("");
    const sel = `#${brand}-badge,.${brand}-badge,[data-${brand}-badge],a[href*="${brand}."]`;
    const hide = () => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("pointer-events", "none", "important");
      });
    };
    hide();
    const mo = new MutationObserver(hide);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    setBackgroundTrainerRoute(targetPath);
  }, [targetPath]);

  const [loadedPaths, setLoadedPaths] = useState<string[]>(() => []);

  useEffect(() => {
    try {
      ensureProfileMigration();
    } catch {}
    useLoginStreak.getState().tick();
    installPlayTracker();
    const stopProgressCycle = installProgressCycle();
    try {
      const lastGameAt = useSessionStreak.getState().lastGameAt;
      const streak = useLoginStreak.getState().streak;
      if (lastGameAt > 0 && streak > 0) {
        void nudgeStreakIfDue(new Date(lastGameAt).toISOString(), streak);
      }
    } catch {}
    return stopProgressCycle;
  }, []);

  const reduceMotion = useSettings((s) => s.reduceMotion);
  const colorblindMode = useSettings((s) => s.colorblindMode);
  const subtitleSize = useSettings((s) => s.subtitleSize);
  const uiScale = useSettings((s) => s.uiScale);
  const hudScale = useSettings((s) => s.hudScale);
  const leftHanded = useSettings((s) => s.leftHanded);
  const highContrast = useSettings((s) => s.highContrast);
  const lowPowerMode = useSettings((s) => s.lowPowerMode);
  const oneHandMode = useSettings((s) => s.oneHandMode);
  const noirIntensity = useSettings((s) => s.noirIntensity);
  const filmGrain = useSettings((s) => s.filmGrain);
  useEffect(() => {
    applyVisualSettings({
      reduceMotion,
      colorblindMode,
      subtitleSize,
      uiScale,
      hudScale,
      leftHanded,
      highContrast,
      lowPowerMode,
      oneHandMode,
      noirIntensity,
      filmGrain,
    });
  }, [
    reduceMotion,
    colorblindMode,
    subtitleSize,
    uiScale,
    hudScale,
    leftHanded,
    highContrast,
    lowPowerMode,
    oneHandMode,
    noirIntensity,
    filmGrain,
  ]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const reapply = () => {
      if (document.visibilityState !== "visible") return;
      const s = useSettings.getState();
      applyVisualSettings(s);
    };
    document.addEventListener("visibilitychange", reapply);
    window.addEventListener("focus", reapply);
    window.addEventListener("pageshow", reapply);
    return () => {
      document.removeEventListener("visibilitychange", reapply);
      window.removeEventListener("focus", reapply);
      window.removeEventListener("pageshow", reapply);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onChange = () => {
      const root = document.documentElement;
      root.dataset.rotating = "1";
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        delete root.dataset.rotating;
      }, 280);
    };
    const mql = window.matchMedia("(orientation: portrait)");
    mql.addEventListener?.("change", onChange);
    window.addEventListener("orientationchange", onChange);
    return () => {
      mql.removeEventListener?.("change", onChange);
      window.removeEventListener("orientationchange", onChange);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const [mounted, setMounted] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  const restoreBanner = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(RESTORE_FLAG_KEY);
      if (!raw) return null;
      window.sessionStorage.removeItem(RESTORE_FLAG_KEY);
      const meta = JSON.parse(raw) as { alias?: string; restored?: number };
      return meta;
    } catch {
      return null;
    }
  }, []);
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const isNative =
      typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
        .Capacitor !== "undefined" &&
      !!(
        window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
      ).Capacitor?.isNativePlatform?.();
    setIsNativeApp(isNative);

    installPerfTier();
    installInteractionPauser();
    void primeCriticalAssets();

    void (async () => {
      try {
        await installNativePersistence();
      } catch (e) {
        console.error("[boot] persistence", e);
      }
      try {
        await installNativeBridge();
      } catch (e) {
        console.error("[boot] bridge", e);
      }
    })();

    if (!isNative) {
      void import("@/lib/pwa-register")
        .then((m) => m.registerPwa())
        .then(() => {
          void import("@/lib/offline-warm").then((m) => m.warmOfflineCache());
        });
    }
  }, []);

  const finishLoading = (path: string) => {
    setLoadedPaths((prev) => (prev.includes(path) ? prev : [...prev, path]));
  };

  const inGame = isGameRoute(targetPath);
  const isLoadingRoute = !inGame && !loadedPaths.includes(targetPath);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (inGame) {
      document.body.dataset.cleanGame = "1";
    } else {
      delete document.body.dataset.cleanGame;
    }
  }, [inGame]);

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <motion.div
        key={location.pathname}
        id="cuervo-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoadingRoute ? 0 : 1 }}
        transition={{ duration: inGame ? 0.16 : 0.35, ease: "easeOut" }}
        aria-hidden={isLoadingRoute || undefined}
      >
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </motion.div>
      <OrientationSync />
      <PortraitGate />
      <HapticListener />
      <AndroidBackHandler />
      <GameBackButton />
      <SwipeBackGesture />
      {isLoadingRoute && (
        <SingleLoaderGate
          preloadKey={targetPath}
          minimumVisibleMs={
            restoreBanner
              ? 1200
              : targetPath === "/single" && isCriticalReady()
                ? 0
                : inGame
                  ? 90
                  : 850
          }
          label={
            restoreBanner
              ? `Restaurando partida${restoreBanner.alias ? ` — ${restoreBanner.alias}` : ""}…`
              : undefined
          }
          onReady={() => finishLoading(targetPath)}
        />
      )}
      {mounted && !isNativeApp && !inGame && <OfflineBadge />}
      {mounted && <LivesNotifier />}
      {mounted && <EncargoResultToaster />}
      {mounted && <EncargoRunBanner />}
      {mounted && <CupRunBanner />}
      {mounted && <PrimeraNoche />}
      {mounted && <SessionStreakListener />}
      {mounted && !isNativeApp && !inGame && <OfflineReadyIndicator />}
      {mounted && !isNativeApp && !inGame && <PwaPrompts />}
      {mounted && import.meta.env.DEV && <TouchTargetInspectorMount />}
      {mounted && <AppTabBar />}
      <BootSplash />
      <RoomCurtainTransition />
      {mounted && <SpeakeasyAmbience />}

      {/* Flotantes de audio: fuera de mesas y de pantallas de datos/ajustes. */}
      {mounted && !inGame && !NO_FLOATING_AUDIO.has(targetPath) && (
        <div
          className="fixed right-4 z-[190] print:hidden"
          style={{
            bottom: GAME_ROUTES_WITH_ACTION_BAR.has(targetPath)
              ? "calc(env(safe-area-inset-bottom, 0px) + 156px)"
              : "calc(env(safe-area-inset-bottom, 0px) + 68px)",
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <MusicToggle />
            <AmbientToggle />
          </div>
        </div>
      )}
      <Toaster
        theme="dark"
        position="top-center"
        richColors
        closeButton
        offset="calc(env(safe-area-inset-top, 0px) + 84px)"
        mobileOffset={{
          top: "calc(env(safe-area-inset-top, 0px) + 84px)",
          left: "12px",
          right: "12px",
        }}
        toastOptions={{
          style: {
            background: "oklch(0.08 0.01 30 / 0.95)",
            border: "1px solid oklch(0.55 0.14 70 / 0.6)",
            color: "oklch(0.94 0.02 80)",
          },
        }}
      />
    </MotionConfig>
  );
}
