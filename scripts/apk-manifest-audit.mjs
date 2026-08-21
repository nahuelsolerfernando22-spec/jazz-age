#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const manifestPath = "android/app/src/main/AndroidManifest.xml";

if (!existsSync(manifestPath)) {
  console.error("[apk-manifest-audit] falta", manifestPath);
  process.exit(1);
}

const manifest = readFileSync(manifestPath, "utf8");
const failures = [];
const stylesPath = "android/app/src/main/res/values/styles.xml";
const capacitorConfigPath = "capacitor.config.ts";

if (/android\.permission\.INTERNET/.test(manifest)) failures.push("permiso INTERNET presente");
if (!/android:usesCleartextTraffic="false"/.test(manifest))
  failures.push("cleartextTraffic no está bloqueado");
if (!/android:allowBackup="false"/.test(manifest)) failures.push("allowBackup no está desactivado");
if (!/android:dataExtractionRules="@xml\/data_extraction_rules"/.test(manifest))
  failures.push("faltan reglas de extracción");
if (!/android:fullBackupContent="@xml\/backup_rules"/.test(manifest))
  failures.push("faltan reglas de backup");
if (!/android:networkSecurityConfig="@xml\/network_security_config"/.test(manifest))
  failures.push("falta networkSecurityConfig");
if (!/android:screenOrientation="portrait"/.test(manifest))
  failures.push("orientación portrait no está bloqueada");
if (!existsSync(stylesPath)) {
  failures.push("falta el tema nativo de arranque");
} else {
  const styles = readFileSync(stylesPath, "utf8");
  if (!/name="postSplashScreenTheme">@style\/AppTheme\.NoActionBar</.test(styles))
    failures.push("el splash no define postSplashScreenTheme");
}
if (!existsSync(capacitorConfigPath)) {
  failures.push("falta capacitor.config.ts");
} else {
  const capacitorConfig = readFileSync(capacitorConfigPath, "utf8");
  if (!/launchAutoHide:\s*true/.test(capacitorConfig))
    failures.push("el splash puede quedar bloqueado: launchAutoHide debe ser true");
}

if (failures.length > 0) {
  console.error("[apk-manifest-audit] fallo:");
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}

console.log("[apk-manifest-audit] OK");
