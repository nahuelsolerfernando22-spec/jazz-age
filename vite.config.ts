import { defineConfig } from "vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

const APK = process.env.APK_BUILD === "1";
const OFFLINE_ALWAYS = true;
// En cualquier build de producción (APK o web publicada) borramos los logs
// de desarrollo del bundle final. `NODE_ENV` lo setea Vite automáticamente
// cuando corre `vite build`.
const IS_PROD = process.env.NODE_ENV === "production";

function manualChunks(id: string) {
  if (!id.includes("node_modules")) return;
  // tslib es un ayudante minúsculo que usan muchas librerías. Si cae dentro del
  // paquete de la nube, cualquier sala que lo toque arrastra 214 kB al arranque.
  if (id.includes("node_modules/tslib")) return "vendor-tslib";
  if (id.includes("@supabase") || id.includes("node_modules/iceberg-js"))
    return "vendor-supabase";

  if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils"))
    return "vendor-motion";
  if (id.includes("sonner")) return "vendor-sonner";
  if (id.includes("lucide-react")) return "vendor-lucide";
  if (id.includes("@radix-ui")) return "vendor-radix";
  if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core"))
    return "vendor-query";
  if (
    id.includes("@tanstack/react-router") ||
    id.includes("@tanstack/router-core") ||
    id.includes("@tanstack/history")
  )
    return "vendor-router";
  if (id.includes("@tanstack/react-start") || id.includes("@tanstack/start-"))
    return "vendor-start";
  if (id.includes("react-dom")) return "vendor-react-dom";
  if (/node_modules\/(?:react|scheduler)\//.test(id)) return "vendor-react";
  if (id.includes("zod")) return "vendor-zod";
}

export default defineConfig({
  ...(APK
    ? {
        nitro: false,
        tanstackStart: {
          spa: {
            enabled: true,
            prerender: {
              enabled: true,
              crawlLinks: false,
              outputPath: "/index",
              retryCount: 0,
            },
          },
        },
      }
    : {}),
  vite: {
    ...(APK || IS_PROD
      ? {
          esbuild: {
            pure: ["console.log", "console.info", "console.debug", "console.warn"],
            drop: ["debugger" as const],
            legalComments: "none" as const,
          },
        }
      : {}),
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
    environments: {
      client: {
        build: {
          // Mapas de origen sólo bajo pedido: sirven para auditar el peso del
          // paquete de arranque sin engordar el APK.
          sourcemap: process.env.SOURCEMAP === "1",
          rollupOptions: {
            output: {
              manualChunks,
            },
          },
        },
      },
    },

    define: {
      "import.meta.env.VITE_OFFLINE_DEMO": JSON.stringify(APK || OFFLINE_ALWAYS ? "1" : "0"),
      // El bundle del APK no lleva service worker: el WebView sirve los archivos
      // del propio paquete, así que registrarlo sólo produce errores en consola.
      "import.meta.env.VITE_APK_BUILD": JSON.stringify(APK ? "1" : "0"),
      ...(APK
        ? {
            "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(""),
            "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(""),
            "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(""),
          }
        : {}),
    },
  },
  plugins: [
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: "dist/stats.html",
            gzipSize: true,
            brotliSize: true,
            template: "treemap",
          }),
        ]
      : []),
    ...(!APK
      ? [
          VitePWA({
            registerType: "autoUpdate",
            injectRegister: null,
            filename: "sw.js",
            manifest: false,
            devOptions: { enabled: false },
            workbox: {
              navigateFallback: "/offline.html",
              navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
              cleanupOutdatedCaches: true,
              clientsClaim: true,
              skipWaiting: true,
              maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
              globPatterns: ["**/*.{js,css,html,ico,svg,woff,woff2,webmanifest}", "**/icon-*.png"],
              runtimeCaching: [
                {
                  urlPattern: ({ request, sameOrigin }) =>
                    sameOrigin && request.destination === "image",
                  handler: "CacheFirst",
                  options: {
                    cacheName: "cuervo-images-v2",
                    expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 90 },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
                {
                  urlPattern: ({ request, sameOrigin }) =>
                    sameOrigin &&
                    (request.destination === "audio" || request.destination === "video"),
                  handler: "CacheFirst",
                  options: {
                    cacheName: "cuervo-media-v1",
                    expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
                    rangeRequests: true,
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
                {
                  urlPattern: ({ url, sameOrigin }) =>
                    sameOrigin && url.pathname.startsWith("/_build/"),
                  handler: "CacheFirst",
                  options: {
                    cacheName: "cuervo-build-v1",
                    expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 },
                  },
                },
                {
                  urlPattern: ({
                    request,
                    sameOrigin,
                  }: {
                    request: Request;
                    sameOrigin: boolean;
                  }) => sameOrigin && request.mode === "navigate",
                  handler: "NetworkFirst" as const,
                  options: {
                    cacheName: "cuervo-pages-v1",
                    networkTimeoutSeconds: 4,
                    expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
                  },
                },
                {
                  urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/__l5e/"),
                  handler: "CacheFirst" as const,
                  options: {
                    cacheName: "cuervo-cdn-v2",
                    expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 90 },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
              ],
            },
          }),
        ]
      : []),
  ],
});
