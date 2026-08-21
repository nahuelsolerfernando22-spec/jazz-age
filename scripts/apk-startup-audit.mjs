#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const APP_ID = "studio.tibet.cuervodorado";
const ACTIVITY = `${APP_ID}/.MainActivity`;
const TIMEOUT_MS = 15_000;
const args = process.argv.slice(2);
const installIndex = args.indexOf("--install");
const requestedApk = installIndex >= 0 ? args[installIndex + 1] : null;

function adb(parts, options = {}) {
  return spawnSync("adb", parts, {
    encoding: options.binary ? null : "utf8",
    stdio: "pipe",
    timeout: options.timeout ?? 30_000,
  });
}

function requireOk(result, label) {
  if (result.status === 0) return result;
  const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
}

function waitForDevice() {
  requireOk(adb(["version"]), "No encuentro adb");
  requireOk(adb(["wait-for-device"], { timeout: TIMEOUT_MS }), "Android no respondió");
  const devices = requireOk(adb(["devices"]), "No pude consultar dispositivos").stdout;
  if (!devices.split("\n").some((line) => /\tdevice$/.test(line.trim()))) {
    throw new Error("No hay un Android autorizado. Activá depuración USB y aceptá la clave RSA.");
  }
}

function shell(command, timeout = 30_000) {
  return adb(["shell", "sh", "-c", command], { timeout });
}

function processId() {
  const result = shell(`pidof ${APP_ID}`);
  return result.status === 0 ? String(result.stdout).trim().split(/\s+/)[0] : "";
}

function foregroundActivity() {
  const result = shell(
    "dumpsys activity activities | grep -m 1 -E 'mResumedActivity|topResumedActivity'",
  );
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

function waitForStartup() {
  const started = Date.now();
  let foreground = "";
  while (Date.now() - started < TIMEOUT_MS) {
    const pid = processId();
    foreground = foregroundActivity();
    if (pid && foreground.includes(APP_ID)) {
      return { elapsedMs: Date.now() - started, pid, foreground };
    }
    execFileSync(process.execPath, ["-e", "setTimeout(()=>{},250)"]);
  }
  throw new Error(`La pantalla inicial no quedó activa en ${TIMEOUT_MS} ms. Estado: ${foreground}`);
}

function capturePng(path) {
  const result = adb(["exec-out", "screencap", "-p"], { binary: true });
  requireOk(result, "No pude capturar la pantalla");
  if (!result.stdout || result.stdout.length < 10_000) {
    throw new Error("La captura está vacía o incompleta");
  }
  writeFileSync(path, result.stdout);
}

function relevantCrashes(log) {
  return log
    .split("\n")
    .filter((line) =>
      /FATAL EXCEPTION|AndroidRuntime|ANR in studio\.tibet\.cuervodorado|OutOfMemoryError|Render process.*gone|renderer.*killed|SIGSEGV|signal 11/i.test(
        line,
      ),
    );
}

function launch(label, outputDir, cold) {
  if (cold) requireOk(shell(`am force-stop ${APP_ID}`), "No pude detener la app");
  requireOk(adb(["logcat", "-c"]), "No pude limpiar logcat");
  const launch = requireOk(
    shell(`am start -W -n ${ACTIVITY}`, TIMEOUT_MS),
    `Falló el arranque ${label}`,
  );
  const state = waitForStartup();
  execFileSync(process.execPath, ["-e", "setTimeout(()=>{},1200)"]);
  if (!processId()) throw new Error(`El proceso murió después del arranque ${label}`);

  capturePng(join(outputDir, `${label}.png`));
  const logs = requireOk(adb(["logcat", "-d", "-v", "threadtime"]), "No pude leer logcat").stdout;
  writeFileSync(join(outputDir, `${label}-logcat.txt`), logs);
  const crashes = relevantCrashes(logs);
  if (crashes.length) {
    throw new Error(`Crash detectado en arranque ${label}:\n${crashes.slice(0, 12).join("\n")}`);
  }

  const totalTime = Number(
    String(launch.stdout).match(/TotalTime:\s*(\d+)/)?.[1] ?? state.elapsedMs,
  );
  return { label, totalTimeMs: totalTime, pid: state.pid, activity: state.foreground };
}

function main() {
  waitForDevice();
  if (requestedApk) {
    const apkPath = resolve(requestedApk);
    if (!existsSync(apkPath)) throw new Error(`No existe el APK: ${apkPath}`);
    requireOk(
      adb(["install", "-r", "-t", apkPath], { timeout: 120_000 }),
      "No pude instalar el APK",
    );
  }

  const installed = shell(`pm path ${APP_ID}`);
  requireOk(installed, `El paquete ${APP_ID} no está instalado`);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = join("reports", "android-startup", stamp);
  mkdirSync(outputDir, { recursive: true });

  const cold = launch("cold", outputDir, true);
  requireOk(shell("input keyevent KEYCODE_HOME"), "No pude mandar la app al fondo");
  execFileSync(process.execPath, ["-e", "setTimeout(()=>{},900)"]);
  const warm = launch("warm", outputDir, false);

  const memory = shell(`dumpsys meminfo ${APP_ID}`).stdout;
  writeFileSync(join(outputDir, "meminfo.txt"), memory);
  const report = {
    appId: APP_ID,
    testedAt: new Date().toISOString(),
    installedPackage: String(installed.stdout).trim(),
    cold,
    warm,
    screenshots: ["cold.png", "warm.png"],
    result: "PASS",
  };
  writeFileSync(join(outputDir, "startup-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, reportDir: outputDir }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`[apk-startup] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
