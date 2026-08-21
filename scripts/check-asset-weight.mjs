#!/usr/bin/env node
import { readdirSync, statSync } from "node:fs";
import { extname, join, basename } from "node:path";

const ROOT = "src/assets";

const BUDGETS = [
  { match: /^bg-.*\.(jpg|jpeg|webp)$/i, limitKB: 260, label: "fondo de juego" },
  { match: /^single-hub-bg\./i, limitKB: 260, label: "fondo hub" },
  {
    match:
      /-(scene-.*|win|lose|flirty|front|portrait|portrait-v2|idle|smile|happy|angry|serious|sad|surprised|smug|defeat|victory|reveal|neutral|thoughtful)\.webp$/i,
    limitKB: 260,
    label: "retrato/escena",
  },
  { match: /^(poker-felt|ruleta-.*|mahjong-tiles.*)\.webp$/i, limitKB: 260, label: "arte de mesa" },
  { match: /^trophy-medal\.webp$/i, limitKB: 150, label: "trofeo (WebP con alpha)" },
];

const DEFAULT_LIMIT_KB = Number(process.env.ASSET_LIMIT_KB ?? 512);
const STRICT = process.env.APK_STRICT === "1";

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT).filter((p) => /\.(webp|jpg|jpeg|png|gif|svg|avif)$/i.test(p));

const offenders = [];
let total = 0;
for (const p of files) {
  const size = statSync(p).size;
  total += size;
  const name = basename(p);
  const rule = BUDGETS.find((b) => b.match.test(name));
  const limitKB = rule?.limitKB ?? DEFAULT_LIMIT_KB;
  if (size > limitKB * 1024) {
    offenders.push({
      path: p,
      sizeKB: Math.round(size / 1024),
      limitKB,
      label: rule?.label ?? "genérico",
    });
  }
}

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      { totalMB: +(total / 1024 / 1024).toFixed(2), count: files.length, offenders },
      null,
      2,
    ),
  );
  process.exit(offenders.length && STRICT ? 1 : 0);
}

const mb = (total / 1024 / 1024).toFixed(2);
console.log(`[asset-weight] ${files.length} assets · ${mb} MB total`);
if (offenders.length === 0) {
  console.log("[asset-weight] ✓ todos dentro de presupuesto");
  process.exit(0);
}

console.error(`[asset-weight] ✗ ${offenders.length} asset(s) fuera de presupuesto:`);
for (const o of offenders.sort((a, b) => b.sizeKB - a.sizeKB)) {
  console.error(
    `  ${o.sizeKB.toString().padStart(5)} KB / ${o.limitKB} KB  (${o.label})  ${o.path}`,
  );
}
console.error(
  "\nRecomprimí con calidad ~82 (WebP method=6) o ajustá el presupuesto en scripts/check-asset-weight.mjs si el asset lo justifica.",
);
if (!STRICT) {
  console.warn("[asset-weight] aviso (no bloquea). Usá APK_STRICT=1 para exigir el presupuesto.");
  process.exit(0);
}
process.exit(1);
