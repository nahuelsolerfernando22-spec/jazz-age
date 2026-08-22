#!/usr/bin/env node
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

const DIST = process.argv[2] ?? "dist/client";
const SRC_ROOTS = ["src/assets", "public"];
const CDN_HOST = (
  process.env.APK_ASSETS_CDN ?? "https://id-preview--e6ad7ff0-65b4-494b-b3e4-b5c147b2b660.lovable.app"
).replace(/\/$/, "");

async function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const st = await stat(p);
    if (st.isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith(".asset.json")) out.push(p);
  }
  return out;
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const pointers = [];
  for (const root of SRC_ROOTS) pointers.push(...(await walk(root)));

  const urls = new Set();
  for (const file of pointers) {
    try {
      const ptr = JSON.parse(await readFile(file, "utf8"));
      if (ptr.url && ptr.url.startsWith("/__l5e/")) urls.add(ptr.url);
    } catch {}
  }
  const total = urls.size;
  console.log(`\n[bundle-assets-apk] ${pointers.length} pointers → ${total} assets únicos`);

  const manifest = [];
  const failures = [];
  let done = 0;
  const queue = [...urls];
  const CONCURRENCY = 8;

  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const target = join(DIST, url);
      try {
        let buf;
        if (existsSync(target)) {
          buf = await readFile(target);
        } else {
          const res = await fetch(CDN_HOST + url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          buf = Buffer.from(await res.arrayBuffer());
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, buf);
        }
        manifest.push({ url, size: buf.length, sha256: sha256(buf) });
        done++;
        if (done % 25 === 0 || done === total) {
          console.log(`  · ${done}/${total} embebidos`);
        }
      } catch (e) {
        failures.push({ url, error: e.message });
        console.warn(`  ! FALLÓ ${url} — ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  manifest.sort((a, b) => a.url.localeCompare(b.url));
  const totalBytes = manifest.reduce((s, m) => s + m.size, 0);
  const bundleChecksum = sha256(
    Buffer.from(manifest.map((m) => `${m.url}:${m.sha256}`).join("\n")),
  );

  const manifestPath = join(DIST, "asset-manifest.json");
  await writeFile(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: manifest.length,
        totalBytes,
        bundleChecksum,
        assets: manifest,
      },
      null,
      2,
    ),
  );

  const mb = (totalBytes / 1024 / 1024).toFixed(2);
  console.log(
    `\n══════════════════════════════════════════════════════════════\n` +
      ` REPORTE APK OFFLINE\n` +
      `══════════════════════════════════════════════════════════════\n` +
      ` Assets CDN copiados : ${manifest.length}/${total}\n` +
      ` Peso CDN copiado    : ${mb} MB\n` +
      ` Fallos           : ${failures.length}\n` +
      ` Checksum bundle  : ${bundleChecksum.slice(0, 16)}…\n` +
      ` Manifiesto       : ${manifestPath}\n` +
      `══════════════════════════════════════════════════════════════\n`,
  );

  if (total === 0) {
    console.log(
      "[bundle-assets-apk] No hay punteros CDN: los assets locales ya fueron incluidos por el build.\n",
    );
  }

  if (failures.length > 0) {
    console.error("[bundle-assets-apk] La APK NO es 100% offline. URLs que fallaron:");
    for (const f of failures) console.error(`  - ${f.url}: ${f.error}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
