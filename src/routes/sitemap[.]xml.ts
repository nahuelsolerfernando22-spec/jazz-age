import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

// Solo rutas que existen de verdad en src/routes/. Si agregás una página nueva,
// sumala acá también.
const ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/single", changefreq: "weekly", priority: "0.9" },
  { path: "/tables", changefreq: "weekly", priority: "0.9" },
  { path: "/encargos", changefreq: "daily", priority: "0.8" },

  { path: "/truco", changefreq: "monthly", priority: "0.8" },
  { path: "/chinchon", changefreq: "monthly", priority: "0.8" },
  { path: "/escoba", changefreq: "monthly", priority: "0.8" },
  { path: "/blackjack", changefreq: "monthly", priority: "0.8" },
  { path: "/ruleta", changefreq: "monthly", priority: "0.8" },
  { path: "/dados", changefreq: "monthly", priority: "0.8" },
  { path: "/mahjong", changefreq: "monthly", priority: "0.8" },
  { path: "/bagatelle", changefreq: "monthly", priority: "0.8" },
  { path: "/solitario", changefreq: "monthly", priority: "0.8" },

  { path: "/logros", changefreq: "weekly", priority: "0.6" },
  { path: "/estadisticas", changefreq: "weekly", priority: "0.6" },
  { path: "/diario", changefreq: "weekly", priority: "0.6" },
  { path: "/reglas", changefreq: "monthly", priority: "0.5" },
  { path: "/dificultad", changefreq: "monthly", priority: "0.4" },
  { path: "/ajustes", changefreq: "monthly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = ENTRIES.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
