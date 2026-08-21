import { readdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { join, relative, extname, basename, dirname } from "node:path";

const ROOT = process.cwd();
const ASSETS_DIR = join(ROOT, "src/assets");
const SRC_DIR = join(ROOT, "src");
const EXTS = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".mp3", ".ogg", ".wav"]);
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".html", ".json"]);
const DELETE = process.argv.includes("--delete");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allAssets = walk(ASSETS_DIR).filter((p) => EXTS.has(extname(p).toLowerCase()));
const codeFiles = walk(SRC_DIR).filter(
  (p) => CODE_EXTS.has(extname(p).toLowerCase()) && !p.startsWith(ASSETS_DIR),
);
const haystack = codeFiles.map((p) => readFileSync(p, "utf8")).join("\n");

function globPrefixes(hay) {
  const rx = /import\.meta\.glob\(\s*["'`]([^"'`]+)["'`]/g;
  const prefixes = new Set();
  let m;
  while ((m = rx.exec(hay))) {
    let pat = m[1];
    if (pat.startsWith("@/")) pat = pat.slice(2);
    else if (pat.startsWith("./") || pat.startsWith("../")) continue;

    const star = pat.indexOf("*");
    const prefix = star === -1 ? pat : pat.slice(0, star);
    if (prefix.startsWith("assets/")) {
      prefixes.add(join(ROOT, "src", prefix));
    }
  }
  return [...prefixes];
}

const GLOB_PREFIXES = globPrefixes(haystack);

function coveredByGlob(assetPath) {
  const dir = dirname(assetPath) + "/";
  return GLOB_PREFIXES.some((prefix) => dir.startsWith(prefix));
}

const orphans = [];
let totalBytes = 0;
let orphanBytes = 0;
for (const p of allAssets) {
  const size = statSync(p).size;
  totalBytes += size;
  const name = basename(p);
  const referenced = haystack.includes(name) || coveredByGlob(p);
  if (!referenced) {
    orphans.push({ path: p, size });
    orphanBytes += size;
  }
}

const mb = (b) => (b / 1024 / 1024).toFixed(2);

console.log(`\nAssets totales: ${allAssets.length}  ·  ${mb(totalBytes)} MB`);
console.log(`Globs detectados: ${GLOB_PREFIXES.length}`);
console.log(`Huérfanos:      ${orphans.length}  ·  ${mb(orphanBytes)} MB\n`);

if (orphans.length === 0) {
  console.log("✓ Sin huérfanos.");
  process.exit(0);
}

orphans
  .sort((a, b) => b.size - a.size)
  .forEach((o) => console.log(`  ${mb(o.size).padStart(7)} MB  ${relative(ROOT, o.path)}`));

if (DELETE) {
  console.log(`\nBorrando ${orphans.length} archivos…`);
  for (const o of orphans) unlinkSync(o.path);
  console.log(`✓ Liberados ${mb(orphanBytes)} MB.`);
} else {
  console.log(`\nRevisá la lista y corré con --delete si estás seguro.`);
  console.log(`Los .webp/.png de chinchon-v2, chess/, npcs/ suelen cargarse con import.meta.glob.`);
}
