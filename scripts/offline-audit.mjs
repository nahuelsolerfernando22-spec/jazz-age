#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const DIST = "dist/client";
const FORBIDDEN = [
  /https?:\/\/[a-z0-9-]+\.supabase\.co/gi,
  /https?:\/\/[a-z0-9.-]+\.googleapis\.com/gi,
  /mahjong-(tiles|specials)-sheet[^"')\\s]*\.png/gi,
  /slot-cabinet-body-v4-nolever\.png/gi,
];
const EXTERNAL_URL_RX = /https?:\/\/[^"')\s<>]+/gi;
const ALLOWED_STATIC_URLS = new Set([
  "https://schema.org",
  "http://www.sitemaps.org/schemas/sitemap/0.9",
  "http://www.w3.org/2000/svg",
]);
const ALLOWED_URL_PREFIXES = [
  "http://www.w3.org/",
  "https://www.w3.org/",
  "http://x/",
  "https://react.dev/",
  "https://github.com/",
  "http://localho",
  "http://[",
  "https://[",
  "http://j",
  "https://j",
];
const LOCAL_ASSET_RX = /\/__l5e\/assets-v1\/[^"')\\\s]+/gi;
const TEXT_EXT = new Set([".js", ".mjs", ".css", ".html", ".json", ".map"]);
const IMG_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".svg", ".gif", ".avif"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push({ path: p, size: s.size });
  }
  return out;
}

let files;
try {
  files = walk(DIST);
} catch (e) {
  console.error(
    `[offline-audit] no se encontró ${DIST}. Corre \`APK_BUILD=1 bun run build\` primero.`,
  );
  process.exit(1);
}

const violations = [];
const images = [];
let totalImgBytes = 0;

for (const f of files) {
  const ext = extname(f.path).toLowerCase();
  if (IMG_EXT.has(ext)) {
    images.push({ path: f.path, size: f.size });
    totalImgBytes += f.size;
    continue;
  }
  if (!TEXT_EXT.has(ext)) continue;
  const content = readFileSync(f.path, "utf8");
  for (const rx of FORBIDDEN) {
    const hits = content.match(rx);
    if (hits) violations.push({ file: f.path, pattern: rx.source, hits: hits.slice(0, 3) });
  }
  const urlHits = content.match(EXTERNAL_URL_RX) ?? [];
  const blockedUrls = urlHits.filter((hit) => {
    const clean = hit.replace(/[.,;:]+$/, "");
    if (ALLOWED_STATIC_URLS.has(clean)) return false;
    if (ALLOWED_URL_PREFIXES.some((p) => clean.startsWith(p))) return false;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\b/i.test(clean)) return false;
    return true;
  });
  if (blockedUrls.length) {
    violations.push({
      file: f.path,
      pattern: EXTERNAL_URL_RX.source,
      hits: blockedUrls.slice(0, 3),
    });
  }
  const localAssetHits = content.match(LOCAL_ASSET_RX) ?? [];
  for (const hit of localAssetHits) {
    const assetPath = hit.split(/[?#]/)[0].replace(/^\//, "");
    if (!existsSync(join(DIST, assetPath))) {
      violations.push({ file: f.path, pattern: LOCAL_ASSET_RX.source, hits: [hit] });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  totalFiles: files.length,
  imageCount: images.length,
  imageMB: +(totalImgBytes / 1024 / 1024).toFixed(2),
  externalReferences: violations,
  ok: violations.length === 0,
};

writeFileSync("scripts/offline-audit.report.json", JSON.stringify(report, null, 2));

console.log(
  `[offline-audit] ${report.imageCount} imágenes locales (${report.imageMB} MB) · ${violations.length} referencias externas`,
);
if (violations.length) {
  for (const v of violations.slice(0, 10)) {
    console.log(`  ✗ ${v.file}  →  ${v.pattern}`);
  }
  process.exit(2);
}
console.log("[offline-audit] ✓ bundle libre de referencias externas");
