#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = "src";
const FORBIDDEN = [
  /\broutes\/craps(\.tsx)?\b/,
  /\broutes\/baccarat(\.tsx)?\b/,
  /from\s+["']@\/routes\/(craps|baccarat)/,
  /import\(\s*["'][^"']*routes\/(craps|baccarat)/,
];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (EXTS.has(extname(p))) {
      const txt = readFileSync(p, "utf8");
      for (const re of FORBIDDEN) {
        if (re.test(txt)) hits.push(`${p}  ::  ${re}`);
      }
    }
  }
}
walk(ROOT);

if (hits.length) {
  console.error("✘ Referencias a rutas eliminadas (craps/baccarat) detectadas:");
  for (const h of hits) console.error("  " + h);
  process.exit(1);
}
console.log("✓ Sin referencias a rutas purgadas (craps, baccarat).");
