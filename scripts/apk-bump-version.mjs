#!/usr/bin/env node
/**
 * Bumps `cuervo.versionCode` in package.json and syncs
 * android/app/build.gradle so every APK build gets a unique code.
 *
 * Usage:
 *   node scripts/apk-bump-version.mjs           # auto-increment versionCode
 *   node scripts/apk-bump-version.mjs --set 42  # force a specific versionCode
 *   node scripts/apk-bump-version.mjs --name 1.2.3  # also set versionName
 *
 * Google Play requires versionCode to strictly increase on every upload.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const pkgPath = resolve(root, "package.json");
const gradlePath = resolve(root, "android/app/build.gradle");

const args = process.argv.slice(2);
function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.cuervo ??= { versionName: "1.0.0", versionCode: 1 };

const forcedCode = argVal("--set");
const forcedName = argVal("--name");

const currentCode = Number(pkg.cuervo.versionCode ?? 1);
const nextCode = forcedCode ? Number(forcedCode) : currentCode + 1;
const nextName = forcedName || pkg.cuervo.versionName || "1.0.0";

if (!Number.isFinite(nextCode) || nextCode < 1) {
  console.error(`[apk-bump-version] invalid versionCode: ${nextCode}`);
  process.exit(1);
}

pkg.cuervo.versionCode = nextCode;
pkg.cuervo.versionName = nextName;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// Patch android/app/build.gradle
let gradle = readFileSync(gradlePath, "utf8");
const beforeCode = gradle;
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${nextCode}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${nextName}"`);
if (gradle === beforeCode) {
  console.warn(
    "[apk-bump-version] warning: no versionCode/versionName lines found in build.gradle",
  );
}
writeFileSync(gradlePath, gradle);

console.log(`[apk-bump-version] ${currentCode} -> ${nextCode} (name ${nextName})`);
