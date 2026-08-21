#!/usr/bin/env node
/**
 * Genera la clave de firma de release y deja `android/key.properties` listo.
 *
 *   node scripts/apk-keystore.mjs --pass "MiClaveLarga" [--alias cuervo] [--out ~/keys]
 *
 * La keystore NUNCA se guarda en el repo: se escribe fuera del proyecto y
 * `key.properties` está ignorado por git. Si perdés el archivo o la clave,
 * Google Play no deja volver a publicar actualizaciones de la misma app.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const pass = arg("pass");
const alias = arg("alias", "cuervo");
const outDir = resolve(arg("out", `${homedir()}/keys`));
const storeFile = resolve(outDir, "cuervo-dorado.jks");
const propsFile = resolve(ROOT, "android", "key.properties");

if (!pass || pass.length < 8) {
  console.error("Falta --pass (mínimo 8 caracteres). Ej: node scripts/apk-keystore.mjs --pass 'ClaveLarga2026'");
  process.exit(1);
}

if (existsSync(storeFile)) {
  console.log(`✓ Ya existe la keystore en ${storeFile} (no se toca)`);
} else {
  mkdirSync(outDir, { recursive: true });
  execFileSync(
    "keytool",
    [
      "-genkeypair", "-v",
      "-keystore", storeFile,
      "-alias", alias,
      "-keyalg", "RSA",
      "-keysize", "2048",
      "-validity", "10000",
      "-storepass", pass,
      "-keypass", pass,
      "-dname", "CN=El Cuervo Dorado, OU=Tibet Studio, O=Tibet Studio, C=AR",
    ],
    { stdio: "inherit" },
  );
  console.log(`✓ Keystore creada en ${storeFile}`);
}

writeFileSync(
  propsFile,
  [
    "# Generado por scripts/apk-keystore.mjs — NO commitear.",
    `storeFile=${storeFile}`,
    `storePassword=${pass}`,
    `keyAlias=${alias}`,
    `keyPassword=${pass}`,
    "",
  ].join("\n"),
  "utf8",
);
console.log(`✓ ${propsFile} escrito. Ahora: bun run apk:release (el AAB queda firmado con tu clave).`);
console.log("⚠ Guardá una copia de la keystore y la contraseña fuera de la compu: sin eso no podés actualizar la app en Play.");
