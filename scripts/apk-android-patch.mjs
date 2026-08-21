#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ANDROID = "android";
if (!existsSync(ANDROID)) {
  console.error("[apk-android-patch] falta ./android — corré primero: bunx cap add android");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const versionName = pkg.cuervo?.versionName ?? pkg.version ?? "1.0.0";
const versionCode = pkg.cuervo?.versionCode ?? 1;

const manifestPath = join(ANDROID, "app/src/main/AndroidManifest.xml");
if (!existsSync(manifestPath)) {
  console.error("[apk-android-patch] falta", manifestPath);
  process.exit(1);
}
let manifest = readFileSync(manifestPath, "utf8");

manifest = manifest.replace(
  /<uses-permission[^/]*android:name="android\.permission\.INTERNET"[^/]*\/>\s*/g,
  "",
);
// El feedback háptico de las mesas necesita el permiso local de vibración
// (no da acceso a red ni a datos del usuario).
if (!/android\.permission\.VIBRATE/.test(manifest)) {
  manifest = manifest.replace(
    /(<manifest[^>]*>)/,
    '$1\n\n    <uses-permission android:name="android.permission.VIBRATE" />',
  );
}

manifest = manifest.replace(
  /android:usesCleartextTraffic="true"/g,
  'android:usesCleartextTraffic="false"',
);
if (!/android:usesCleartextTraffic=/.test(manifest)) {
  manifest = manifest.replace(
    /<application /,
    '<application android:usesCleartextTraffic="false" ',
  );
}
manifest = manifest.replace(/android:allowBackup="true"/g, 'android:allowBackup="false"');
if (!/android:allowBackup=/.test(manifest)) {
  manifest = manifest.replace(/<application /, '<application android:allowBackup="false" ');
}
if (!/android:dataExtractionRules=/.test(manifest)) {
  manifest = manifest.replace(
    /<application /,
    '<application android:dataExtractionRules="@xml/data_extraction_rules" ',
  );
}
if (!/android:fullBackupContent=/.test(manifest)) {
  manifest = manifest.replace(
    /<application /,
    '<application android:fullBackupContent="@xml/backup_rules" ',
  );
}
if (!/android:networkSecurityConfig=/.test(manifest)) {
  manifest = manifest.replace(
    /<application /,
    '<application android:networkSecurityConfig="@xml/network_security_config" ',
  );
}
manifest = manifest.replace(
  /android:screenOrientation="[^"]*"/g,
  'android:screenOrientation="portrait"',
);
if (!/android:screenOrientation=/.test(manifest)) {
  manifest = manifest.replace(
    /(<activity\s+[^>]*android:name="\.MainActivity")/,
    '$1 android:screenOrientation="portrait"',
  );
}
writeFileSync(manifestPath, manifest);

const xmlDir = join(ANDROID, "app/src/main/res/xml");
mkdirSync(xmlDir, { recursive: true });
writeFileSync(
  join(xmlDir, "backup_rules.xml"),
  '<?xml version="1.0" encoding="utf-8"?>\n<full-backup-content />\n',
);
writeFileSync(
  join(xmlDir, "data_extraction_rules.xml"),
  '<?xml version="1.0" encoding="utf-8"?>\n<data-extraction-rules>\n    <cloud-backup disableIfNoEncryptionCapabilities="true" />\n    <device-transfer />\n</data-extraction-rules>\n',
);
writeFileSync(
  join(xmlDir, "network_security_config.xml"),
  '<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n    <base-config cleartextTrafficPermitted="false" />\n</network-security-config>\n',
);

const gradlePath = join(ANDROID, "app/build.gradle");
if (existsSync(gradlePath)) {
  let gradle = readFileSync(gradlePath, "utf8");
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
  writeFileSync(gradlePath, gradle);
}

const valuesDir = join(ANDROID, "app/src/main/res/values");
if (existsSync(valuesDir)) {
  for (const name of readdirSync(valuesDir)) {
    if (!name.endsWith(".xml")) continue;
    const p = join(valuesDir, name);
    let xml = readFileSync(p, "utf8");
    xml = xml.replace(/#[0-9a-fA-F]{6}(?=<\/color>)/g, (m, ..._rest) => m);
    xml = xml.replace(
      /<color name="colorPrimary">#[0-9a-fA-F]{6}<\/color>/,
      '<color name="colorPrimary">#2a0f0a</color>',
    );
    xml = xml.replace(
      /<color name="colorPrimaryDark">#[0-9a-fA-F]{6}<\/color>/,
      '<color name="colorPrimaryDark">#0d0906</color>',
    );
    xml = xml.replace(
      /<color name="colorAccent">#[0-9a-fA-F]{6}<\/color>/,
      '<color name="colorAccent">#c9a24a</color>',
    );
    writeFileSync(p, xml);
  }
}

const stylesPath = join(valuesDir, "styles.xml");
if (existsSync(stylesPath)) {
  let styles = readFileSync(stylesPath, "utf8");
  if (!/name="postSplashScreenTheme"/.test(styles)) {
    styles = styles.replace(
      /(<style name="AppTheme\.NoActionBarLaunch"[\s\S]*?<item name="android:background">[^<]+<\/item>)/,
      '$1\n        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>',
    );
    writeFileSync(stylesPath, styles);
  }
}

console.log("[apk-android-patch] OK");
console.log("  versionName:", versionName, " versionCode:", versionCode);
console.log("  INTERNET permission eliminado, cleartext=false, backup=false, portrait bloqueado.");
