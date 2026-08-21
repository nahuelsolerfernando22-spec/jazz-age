/**
 * Verifica que la versión que muestra la app coincida con la del build de Android
 * y que el versionCode sea un entero positivo. Se corre antes de armar el AAB.
 *
 *   bun scripts/check-version.ts
 */
import { readFileSync } from "node:fs";

const gradle = readFileSync("android/app/build.gradle", "utf8");
const ajustes = readFileSync("src/routes/ajustes.tsx", "utf8");

const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
const versionCode = gradle.match(/versionCode\s+(\d+)/)?.[1];
const appVersion = ajustes.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];

const errores: string[] = [];
if (!versionName) errores.push("No encontré versionName en android/app/build.gradle");
if (!versionCode) errores.push("No encontré versionCode en android/app/build.gradle");
if (!appVersion) errores.push("No encontré APP_VERSION en src/routes/ajustes.tsx");
if (versionName && appVersion && versionName !== appVersion) {
  errores.push(`versionName (${versionName}) != APP_VERSION (${appVersion})`);
}
if (versionName && !/^\d+\.\d+\.\d+$/.test(versionName)) {
  errores.push(`versionName "${versionName}" no es semver (x.y.z)`);
}
if (versionCode && Number(versionCode) < 1) {
  errores.push(`versionCode "${versionCode}" debe ser un entero positivo`);
}

if (errores.length > 0) {
  console.error("Versionado inconsistente:");
  for (const e of errores) console.error(` - ${e}`);
  process.exit(1);
}

console.log(`Versionado OK: ${versionName} (code ${versionCode})`);
