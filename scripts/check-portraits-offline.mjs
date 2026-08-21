#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "src");
const ASSETS = join(ROOT, "assets");
const errors = [];

function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".asset.json")) errors.push(`pointer CDN remanente: ${p}`);
  }
}
walk(ROOT);

const codeExts = /\.(ts|tsx|js|jsx|mjs)$/;
const importRe = /from\s+["']([^"']+\.webp)["']|import\s+["']([^"']+\.webp)["']/g;
function scanCode(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) scanCode(p);
    else if (codeExts.test(e.name)) {
      const src = readFileSync(p, "utf8");
      let m;
      while ((m = importRe.exec(src))) {
        const spec = m[1] || m[2];
        let abs;
        if (spec.startsWith("@/")) abs = join(ROOT, spec.slice(2));
        else if (spec.startsWith(".")) abs = resolve(dirname(p), spec);
        else continue;
        if (!existsSync(abs)) errors.push(`import roto: ${p} -> ${spec}`);
      }
    }
  }
}
scanCode(ROOT);

const md5 = (f) => createHash("md5").update(readFileSync(f)).digest("hex");
const bases = ["idle", "portrait", "portrait-v2", "fullbody"];
const files = readdirSync(ASSETS).filter((f) => /-(win|lose)\.webp$/.test(f));
let duplicated = 0;
for (const f of files) {
  const npc = f.replace(/-(win|lose)\.webp$/, "");
  const baseFile = bases.map((b) => join(ASSETS, `${npc}-${b}.webp`)).find(existsSync);
  if (!baseFile) continue;
  if (md5(join(ASSETS, f)) === md5(baseFile)) {
    duplicated++;
    errors.push(`fallback idle: ${f} == ${baseFile.split("/").pop()}`);
  }
}

if (errors.length) {
  console.error(`[check-portraits] ${errors.length} problema(s):`);
  for (const e of errors) console.error("  -", e);
  process.exit(1);
}
console.log(
  `[check-portraits] OK — ${files.length} retratos win/lose locales, 0 pointers CDN, 0 imports rotos, 0 fallback idle.`,
);
