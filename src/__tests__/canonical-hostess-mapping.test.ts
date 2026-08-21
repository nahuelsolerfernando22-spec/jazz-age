import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { GAME_HOSTESS } from "@/lib/economy";
import { ROSTER } from "@/lib/hostess-rotation";

const CANONICAL_TITULARS: Record<string, string> = {
  ruleta: "clara",
  tables: "vita", // Blackjack
  mahjong: "lin",
  dados: "zelda",
  chinchon: "luisa",
  bagatelle: "lola",
  truco: "eulalia",
  solitario: "jade",
  escoba: "bettie",
};

const LEGACY_IDS = [
  "daphne",
  "madge",
  "pilar",
  "hernestina",
  "luciera",
  "popelin",
  "dorothy",
  "rocio",
  "ines",
];

describe("Canonical hostess mapping — GAME_HOSTESS", () => {
  for (const [game, expected] of Object.entries(CANONICAL_TITULARS)) {
    it(`${game} → ${expected}`, () => {
      expect(GAME_HOSTESS[game as keyof typeof GAME_HOSTESS]).toBe(expected);
    });
  }

  it("no legacy npcId appears as a GAME_HOSTESS value", () => {
    const values = Object.values(GAME_HOSTESS);
    for (const legacy of LEGACY_IDS) {
      expect(values, `GAME_HOSTESS uses legacy id "${legacy}"`).not.toContain(legacy);
    }
  });
});

describe("Canonical hostess mapping — ROSTER titulares", () => {
  it("titular de cada sala jugable coincide con el canon", () => {
    for (const [game, expected] of Object.entries(CANONICAL_TITULARS)) {
      const roster = ROSTER.find((r) => r.room === game);
      expect(roster, `ROSTER falta entry para ${game}`).toBeDefined();
      expect(roster!.titular).toBe(expected);
    }
  });

  it("no legacy npcId es titular ni suplente en ROSTER", () => {
    for (const r of ROSTER) {
      for (const legacy of LEGACY_IDS) {
        expect(r.titular, `${r.room}.titular = legacy ${legacy}`).not.toBe(legacy);
        expect(r.suplente, `${r.room}.suplente = legacy ${legacy}`).not.toBe(legacy);
      }
    }
  });
});

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(full);
  }
  return out;
}

const ACTIVE_PATTERNS: Record<string, RegExp[]> = {
  daphne: [/npcId:\s*["']daphne["']/i, /"daphne"|'daphne'/],
  madge: [/npcId:\s*["']madge["']/i],
  pilar: [/npcId:\s*["']pilar["']/i, /PilarPanel/],
  hernestina: [/isHernestina/, /npcId:\s*["']hernestina["']/i],
  luciera: [
    /npcId:\s*["']luciera["']/i,
    /luceraScene|luceraSerious|luceraSmile|luceraSad|luceraSurprised/,
  ],
  popelin: [/isPopelin/, /POPELIN_LINES/, /popelinPortrait/],
  dorothy: [/DOROTHY_MOOD/, /dorothyIdle|dorothySmile|dorothySerious|dorothySad|dorothySurprised/],
};

const LABEL_ALLOWLIST = ["NpcDialogueBubble.tsx"];

describe("Auditoría estática — rutas y componentes visibles", () => {
  const ROOTS = [resolve(__dirname, "../routes"), resolve(__dirname, "../components")];
  const files = ROOTS.flatMap((r) => walk(r));

  for (const [legacy, patterns] of Object.entries(ACTIVE_PATTERNS)) {
    it(`no queda uso activo de "${legacy}" en rutas/componentes`, () => {
      const hits: string[] = [];
      for (const f of files) {
        if (LABEL_ALLOWLIST.some((a) => f.endsWith(a))) continue;
        const src = readFileSync(f, "utf8");
        for (const p of patterns) {
          if (p.test(src)) hits.push(`${f}  →  ${p}`);
        }
      }
      expect(hits, `Residuos "${legacy}":\n${hits.join("\n")}`).toEqual([]);
    });
  }
});
