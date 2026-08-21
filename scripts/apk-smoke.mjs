#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.cuervo?.versionName ?? pkg.version ?? "1.0.0";
const code = pkg.cuervo?.versionCode ?? 1;

const ROUTES = [
  "/",
  "/single",
  "/tables",
  "/duelo",
  "/encargos",
  "/progreso",
  "/logros",
  "/estadisticas",
  "/diario",
  "/dificultad",
  "/reglas",
  "/ajustes",
  "/privacidad",
  "/truco",
  "/chinchon",
  "/escoba",
  "/blackjack",
  "/poker",
  "/ruleta",
  "/dados",
  "/slots",
  "/solitario",
  "/sudoku",
  "/mahjong",
  "/bagatelle",
];

console.log(`=== APK smoke offline · v${version} (code ${code}) ===`);
console.log(`Rutas a validar: ${ROUTES.length}`);

const p = spawn("node", ["scripts/smoke-offline-routes.mjs"], { stdio: "inherit" });
p.on("close", (c) => process.exit(c ?? 0));
