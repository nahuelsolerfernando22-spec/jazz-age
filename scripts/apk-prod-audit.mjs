#!/usr/bin/env node
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist/client";
const LIMIT_MB = Number(process.env.APK_SIZE_LIMIT_MB ?? 120);
const STRICT = process.env.APK_STRICT === "1";

if (!existsSync(DIST)) {
  console.error(`[apk-audit] falta ${DIST}. Corré primero: bun run build:apk`);
  process.exit(1);
}

let total = 0;
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else {
      files.push({ p, size: st.size });
      total += st.size;
    }
  }
}
walk(DIST);

let sourcemaps = 0;
// Hosts/URLs que solo aparecen dentro de librerías (mensajes de error, JSON Schema,
// plantillas de string sin resolver). No se piden en runtime, no rompen el modo offline.
const ALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "schema.org",
  "www.w3.org",
  "react.dev",
  "json-schema.org",
  "github.com",
  "x",
]);
const ALLOWED_URL = [
  /\$\{/, // plantillas sin resolver dentro de vendor chunks (zod, etc.)
];
const BRAND_BLOCKLIST = [
  "bG92YWJsZQ==",
  "Z3B0LTQ=",
  "Y2xhdWRlLTM=",
  "Y2xhdWRlLXNvbm5ldA==",
  "Y2xhdWRlLW9wdXM=",
];
const forbidden = new RegExp(
  "(" + BRAND_BLOCKLIST.map((s) => Buffer.from(s, "base64").toString("utf8")).join("|") + ")",
  "i",
);
let leaks = 0;
let externalUrls = 0;
for (const f of files) {
  if (f.p.endsWith(".map")) sourcemaps++;
  if (/\.(js|css|html|json|webmanifest)$/.test(f.p)) {
    const txt = readFileSync(f.p, "utf8");
    if (forbidden.test(txt)) {
      leaks++;
      console.error("[apk-audit] fuga:", relative(DIST, f.p));
    }
    const matches = txt.match(/https?:\/\/[^\s"'`<>)]+/g) ?? [];
    for (const url of matches) {
      if (ALLOWED_URL.some((re) => re.test(url))) continue;
      try {
        const host = new URL(url).hostname;
        if (!ALLOWED_HOSTS.has(host)) {
          externalUrls++;
          console.error("[apk-audit] URL externa:", relative(DIST, f.p), url);
        }
      } catch {
        externalUrls++;
        console.error("[apk-audit] URL externa inválida:", relative(DIST, f.p), url);
      }
    }
  }
}

const top = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
const mb = (n) => (n / 1024 / 1024).toFixed(2);

console.log("=== APK production audit ===");
console.log("Archivos:", files.length, "  Total:", mb(total), "MB");
console.log("Top 10 pesos:");
for (const f of top) console.log(`  ${mb(f.size).padStart(7)} MB  ${relative(DIST, f.p)}`);
console.log("Sourcemaps:", sourcemaps, sourcemaps === 0 ? "✓" : "⚠");
console.log("Fugas de marca:", leaks, leaks === 0 ? "✓" : "✗");
console.log("URLs externas:", externalUrls, externalUrls === 0 ? "✓" : "✗");

const fail = sourcemaps > 0 || leaks > 0 || externalUrls > 0 || total / 1024 / 1024 > LIMIT_MB;
if (fail) {
  const msg = `[apk-audit] fuera de objetivo — límite ${LIMIT_MB} MB / 0 maps / 0 fugas / 0 URLs externas`;
  if (STRICT) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(`${msg} (aviso: no bloquea; usá APK_STRICT=1 para exigirlo)`);
}
console.log("[apk-audit] OK");
