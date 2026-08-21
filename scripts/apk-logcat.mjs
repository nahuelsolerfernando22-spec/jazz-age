#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_DURATION_SECONDS = 240;

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith("--")) continue;
  const [key, inlineValue] = arg.slice(2).split("=");
  const next = process.argv[index + 1];
  const value = inlineValue ?? (next && !next.startsWith("--") ? next : "true");
  if (value === next) index += 1;
  args.set(key, value);
}

if (args.has("help") || args.has("h")) {
  console.log(`Uso:
  bun run apk:logs
  node scripts/apk-logcat.mjs --duration 300 --focus slots,mahjong --offline

Opciones:
  --duration <segundos>   Tiempo de captura. Default: ${DEFAULT_DURATION_SECONDS}
  --focus <texto>         Etiquetas para el reporte, ej: slots,mahjong
  --offline               Apaga Wi-Fi y datos móviles antes de abrir la app
  --keep-network          No toca Wi-Fi/datos aunque uses bun run apk:logs
  --no-launch             No intenta abrir la app automáticamente
`);
  process.exit(0);
}

const requestedDuration = Number(args.get("duration") ?? DEFAULT_DURATION_SECONDS);
const durationSeconds =
  Number.isFinite(requestedDuration) && requestedDuration > 0
    ? requestedDuration
    : DEFAULT_DURATION_SECONDS;
const focus = String(args.get("focus") ?? "slots,mahjong");
const forceOffline = args.has("offline") && !args.has("keep-network");
const noLaunch = args.has("no-launch");

function readAppId() {
  const capacitorConfig = readFileSync("capacitor.config.ts", "utf8");
  const match = capacitorConfig.match(/appId:\s*["']([^"']+)["']/);
  return match?.[1] ?? "studio.tibet.cuervodorado";
}

function runAdb(adbArgs) {
  return spawnSync("adb", adbArgs, { encoding: "utf8", stdio: "pipe" });
}

function ensureAdb() {
  const version = runAdb(["version"]);
  if (version.status !== 0) {
    console.error(
      "No encuentro adb. Abrí Android Studio una vez o agregá Android Platform Tools al PATH.",
    );
    process.exit(1);
  }
}

function ensureDevice() {
  const devices = runAdb(["devices"]);
  const connected = devices.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /\tdevice$/.test(line));

  if (connected.length === 0) {
    console.error(
      "No hay celular conectado por adb. Conectá el Android con depuración USB activada y aceptá el permiso RSA.",
    );
    process.exit(1);
  }
}

function captureCommandOutput(filePath, adbArgs) {
  const result = runAdb(adbArgs);
  writeFileSync(filePath, `${result.stdout ?? ""}${result.stderr ?? ""}`);
}

function summarize(lines) {
  const patterns = [
    ["crash", /FATAL EXCEPTION|AndroidRuntime|SIGSEGV|signal 11|RuntimeException/i],
    [
      "oom_memoria",
      /OutOfMemoryError|Failed to allocate|lowmemorykiller|Low Memory Killer|onTrimMemory|Memory pressure/i,
    ],
    [
      "webview_renderer",
      /Render process.*gone|renderer.*killed|crashpad|AwContents|WebView.*crash|chromium.*crash/i,
    ],
    [
      "gpu_texturas",
      /WebGL context lost|OpenGLRenderer|EGL|GL_OUT_OF_MEMORY|Texture|decode.*fail|Skia|BitmapFactory/i,
    ],
    [
      "assets_carga",
      /Unable to open asset|No such file|ERR_FILE_NOT_FOUND|404|not found|net::ERR_FILE/i,
    ],
    [
      "red_offline",
      /net::ERR_|Network request blocked|Cleartext|UnknownHostException|Failed to fetch|ERR_INTERNET_DISCONNECTED/i,
    ],
    ["anr", /ANR|Application Not Responding|Input dispatching timed out/i],
  ];

  const buckets = Object.fromEntries(patterns.map(([name]) => [name, []]));
  for (const line of lines) {
    for (const [name, regex] of patterns) {
      if (regex.test(line)) buckets[name].push(line);
    }
  }

  return buckets;
}

function writeSummary({ reportDir, appId, startedAt, endedAt, logLines, focusLabel }) {
  const buckets = summarize(logLines);
  const problemCount = Object.values(buckets).reduce((sum, bucket) => sum + bucket.length, 0);
  const topLines = Object.entries(buckets)
    .map(([name, bucket]) => {
      if (bucket.length === 0) return `## ${name}\nSin señales.`;
      const shown = bucket
        .slice(0, 30)
        .map((line) => `- ${line}`)
        .join("\n");
      const hidden =
        bucket.length > 30 ? `\n- ... ${bucket.length - 30} líneas más en logcat-filtrado.txt` : "";
      return `## ${name}\n${shown}${hidden}`;
    })
    .join("\n\n");

  const status =
    problemCount === 0
      ? "No encontré señales críticas en los logs capturados."
      : `Encontré ${problemCount} señales para revisar.`;
  const content = `# Reporte APK Android — El Cuervo Dorado

- App ID: ${appId}
- Foco de prueba: ${focusLabel}
- Inicio: ${startedAt.toISOString()}
- Fin: ${endedAt.toISOString()}
- Resultado rápido: ${status}

Archivos útiles de esta carpeta:

- \`logcat-filtrado.txt\`: logs relevantes de Android/WebView/Capacitor.
- \`meminfo-before.txt\`: memoria antes de jugar.
- \`meminfo-after.txt\`: memoria al terminar.
- \`device.txt\`: modelo, versión Android y WebView.

${topLines}
`;
  writeFileSync(join(reportDir, "RESUMEN.md"), content);
}

ensureAdb();
ensureDevice();

const appId = readAppId();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportDir = join("reports", "android-apk", stamp);
mkdirSync(reportDir, { recursive: true });

console.log("=== Captura APK Android · El Cuervo Dorado ===");
console.log(`App ID: ${appId}`);
console.log(`Carpeta del reporte: ${reportDir}`);
console.log(`Duración: ${durationSeconds}s`);
console.log(`Foco: ${focus}`);

captureCommandOutput(join(reportDir, "device.txt"), [
  "shell",
  "sh",
  "-c",
  "getprop ro.product.manufacturer; getprop ro.product.model; getprop ro.build.version.release; dumpsys webviewupdate | head -80",
]);

if (forceOffline) {
  console.log("Modo offline: apago Wi-Fi y datos móviles para esta prueba.");
  runAdb(["shell", "svc", "wifi", "disable"]);
  runAdb(["shell", "svc", "data", "disable"]);
}

runAdb(["logcat", "-c"]);
captureCommandOutput(join(reportDir, "meminfo-before.txt"), ["shell", "dumpsys", "meminfo", appId]);

if (!noLaunch) {
  console.log("Abro la app en el celular...");
  runAdb(["shell", "monkey", "-p", appId, "-c", "android.intent.category.LAUNCHER", "1"]);
}

console.log(
  "Ahora probá el APK en el celular: abrí Slots, girá varias veces, después Mahjong, bloqueá/desbloqueá y volvés.",
);
console.log(
  "Podés cortar antes con Ctrl+C. Al finalizar, pasame la carpeta reports/android-apk/... o el RESUMEN.md.",
);

const logPath = join(reportDir, "logcat-filtrado.txt");
const logStream = createWriteStream(logPath, { flags: "a" });
const startedAt = new Date();
const relevantLines = [];
const filter = [
  "logcat",
  "-v",
  "threadtime",
  "Capacitor:D",
  "Capacitor/Console:D",
  "chromium:I",
  "cr_AwContents:I",
  "cr_ChildProcessConn:W",
  "AndroidRuntime:E",
  "ActivityManager:W",
  "OpenGLRenderer:W",
  "libc:E",
  "DEBUG:E",
  "System.err:W",
  "StrictMode:W",
  "*:S",
];

const logcat = spawn("adb", filter, { stdio: ["ignore", "pipe", "pipe"] });

function handleChunk(chunk) {
  const text = chunk.toString("utf8");
  logStream.write(text);
  for (const line of text.split("\n")) {
    const clean = line.trim();
    if (clean) relevantLines.push(clean);
  }
}

logcat.stdout.on("data", handleChunk);
logcat.stderr.on("data", handleChunk);

let finished = false;
function finish(reason) {
  if (finished) return;
  finished = true;
  if (logcat.pid) logcat.kill("SIGTERM");
  captureCommandOutput(join(reportDir, "meminfo-after.txt"), [
    "shell",
    "dumpsys",
    "meminfo",
    appId,
  ]);
  logStream.end();
  const endedAt = new Date();
  writeSummary({
    reportDir,
    appId,
    startedAt,
    endedAt,
    logLines: relevantLines,
    focusLabel: focus,
  });
  console.log(`\nCaptura finalizada (${reason}).`);
  console.log(`Reporte: ${reportDir}/RESUMEN.md`);
  if (forceOffline)
    console.log(
      "Si querés reactivar conexión: adb shell svc wifi enable && adb shell svc data enable",
    );
}

process.on("SIGINT", () => finish("Ctrl+C"));
process.on("SIGTERM", () => finish("SIGTERM"));
setTimeout(() => finish("tiempo completo"), durationSeconds * 1000);
