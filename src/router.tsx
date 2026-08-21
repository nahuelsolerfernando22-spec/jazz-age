import { createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import {
  DefaultNotFoundComponent,
  DelayedReveal,
  FallbackScene,
  classifyError,
} from "@/components/casino/FallbackScene";
import { LoadingScreen } from "@/components/casino/LoadingScreen";
import { getLastLocation } from "@/lib/raid-config";
import { markRouteError } from "@/lib/loading-lines";

export { DefaultNotFoundComponent };

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  if (typeof console !== "undefined") {
    console.error("[Cuervo Dorado] route error:", error);
  }

  const kind = classifyError(error);
  const delayMs = kind === "loader" ? 450 : 0;

  try {
    markRouteError(router.state.location.pathname);
  } catch {}

  return (
    <DelayedReveal delayMs={delayMs}>
      <FallbackScene
        kind={kind}
        error={error}
        onRetry={() => {
          const last = getLastLocation();
          const current = router.state.location.pathname;
          if (last && last.pathname !== current) {
            void router.navigate({ to: last.pathname + last.search, replace: true });
          }
          void router.invalidate();
          reset();
        }}
      />
    </DelayedReveal>
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
    defaultNotFoundComponent: DefaultNotFoundComponent,

    defaultPendingComponent: () => <LoadingScreen />,
    defaultPendingMs: 0,
    // Antes 800 ms: sumado al gate de assets, cualquier sala tardaba casi dos
    // segundos en aparecer aunque estuviera lista. 350 ms evita el parpadeo
    // sin que la carga se sienta trabada.
    defaultPendingMinMs: 350,
  });

  return router;
};
