#!/usr/bin/env node
/**
 * Presupuesto de MEMORIA DE DECODIFICACIÓN (no de bytes en disco).
 *
 * En un APK Android el WebView descomprime cada imagen a un bitmap RGBA en RAM:
 *   RAM = ancho * alto * 4 bytes
 * Un WebP de 200 KB de 1264x848 ocupa 4,1 MB de RAM al dibujarse. Con decenas
 * de imágenes en pantalla eso agota el presupuesto del WebView y Android
 * descarta texturas -> "cuadros negros" / assets rotos, incluso offline.
 *
 * Este check falla si alguna imagen supera el límite de píxeles para su
 * categoría, o si el total del proyecto se dispara.
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, basename, relative } from "node:path";

const ROOT = "src/assets";

// Límites por dimensión mayor (px). Pensados para un teléfono de 412 dp @ ~2.6 dpr.
const RULES = [
  { match: /^mahjong-tiles-sheet/i, max: 620, label: "lámina de fichas mahjong" },
  { match: /^mahjong-specials-sheet/i, max: 720, label: "lámina especiales mahjong" },
  { match: /^slot-sym-/i, max: 288, label: "símbolo de slots" },
  { match: /^tab-/i, max: 288, label: "icono de pestaña" },
  { match: /^bg-/i, max: 960, label: "fondo de juego" },
  { match: /^zone-/i, max: 900, label: "arte de zona" },
  { match: /-hero\.webp$/i, max: 960, label: "hero" },
  { match: /-(portrait|angry|lose|thinking|win)\.webp$/i, max: 680, label: "retrato" },
  { match: /^ad-\d/i, max: 680, label: "aviso falso" },
  { match: /^hostess-loading-/i, max: 680, label: "carga hostess" },
];
const CARD_DIR = /(^|\/)(cards|cards-ivory|chinchon-v2)(\/|$)/;
const CARD_MAX = 380;
const DEFAULT_MAX = 900;
const TOTAL_RAM_BUDGET_MB = Number(process.env.ASSET_RAM_BUDGET_MB ?? 300);
const STRICT = process.env.APK_STRICT === "1";

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Lee dimensiones de WebP / PNG / JPEG sin dependencias. */
function dimensions(path) {
  const buf = readFileSync(path);
  if (
    buf.slice(0, 4).toString("ascii") === "RIFF" &&
    buf.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    const fmt = buf.slice(12, 16).toString("ascii");
    if (fmt === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    if (fmt === "VP8 ")
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (fmt === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  if (buf.slice(1, 4).toString("ascii") === "PNG") {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

const files = walk(ROOT).filter((p) => /\.(webp|png|jpg|jpeg)$/i.test(p));
const offenders = [];
// Un set responsive (mismo arte en 320/640/900 y en avif/webp/jpg) sólo carga
// una variante en runtime: para el presupuesto de RAM cuenta una sola vez, la
// más grande del grupo.
const variantGroups = new Map();
let totalRam = 0;

for (const p of files) {
  const dim = dimensions(p);
  if (!dim) continue;
  const ramMB = (dim.w * dim.h * 4) / 1048576;
  const rel = relative(ROOT, p).replace(/\\/g, "/");
  const name = basename(p);
  const groupKey = rel
    .replace(/-\d+\.(webp|png|jpe?g)$/i, "")
    .replace(/\.(webp|png|jpe?g)$/i, "")
    // bg-thumbs/<juego> es el mismo arte que bg-<juego>: misma textura en runtime.
    .replace(/^bg-thumbs\/(.+)$/, "bg-$1");
  variantGroups.set(groupKey, Math.max(variantGroups.get(groupKey) ?? 0, ramMB));

  const rule = RULES.find((r) => r.match.test(name));
  const max = rule?.max ?? (CARD_DIR.test(rel) ? CARD_MAX : DEFAULT_MAX);
  const biggest = Math.max(dim.w, dim.h);
  if (biggest > max) {
    offenders.push({
      p,
      dim,
      max,
      ramMB,
      label: rule?.label ?? (CARD_DIR.test(rel) ? "naipe" : "imagen"),
    });
  }
}
for (const ram of variantGroups.values()) totalRam += ram;

for (const o of offenders) {
  console.error(
    `[assets-ram] ${o.p} — ${o.dim.w}x${o.dim.h} (${o.ramMB.toFixed(1)} MB en RAM) supera ${o.max}px para "${o.label}"`,
  );
}
console.log(
  `[assets-ram] total decodificado: ${totalRam.toFixed(0)} MB (presupuesto ${TOTAL_RAM_BUDGET_MB} MB) · ${files.length} imágenes`,
);

if (offenders.length || totalRam > TOTAL_RAM_BUDGET_MB) {
  console.error(
    "[assets-ram] presupuesto excedido — conviene reducir la resolución de origen: " +
      "el WebView de Android descarta texturas cuando el bitmap total no entra en memoria.",
  );
  if (STRICT) process.exit(1);
  console.warn("[assets-ram] aviso (no bloquea). Usá APK_STRICT=1 para exigirlo.");
  process.exit(0);
}
console.log("[assets-ram] ok");
