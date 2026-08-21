import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { installLocalStoragePolyfill } from "./_localStorage-polyfill";
beforeAll(() => installLocalStoragePolyfill());
import {
  applyBackup,
  collectSaveKeys,
  exportSavesToObject,
  parseBackup,
  __test,
} from "@/lib/save-backup";

describe("save-backup", () => {
  beforeEach(() => localStorage.clear());

  it("solo colecta keys de juego (allowlist por prefijo)", () => {
    localStorage.setItem("cuervo:foo", "1");
    localStorage.setItem("mahjong-album", "2");
    localStorage.setItem("speakeasy:leagues:v1", "3");
    localStorage.setItem("__firebase:whatever", "no");
    localStorage.setItem("random-key", "no");
    const keys = collectSaveKeys();
    expect(keys).toContain("cuervo:foo");
    expect(keys).toContain("mahjong-album");
    expect(keys).toContain("speakeasy:leagues:v1");
    expect(keys).not.toContain("__firebase:whatever");
    expect(keys).not.toContain("random-key");
  });

  it("export → parse → apply es round-trip", () => {
    localStorage.setItem("cuervo:a", "1");
    localStorage.setItem("mahjong:x", "abc");
    const backup = exportSavesToObject();
    const text = JSON.stringify(backup);
    localStorage.clear();
    const parsed = parseBackup(text);
    expect(parsed.magic).toBe(__test.MAGIC);
    const applied = applyBackup(parsed, "replace");
    expect(applied).toBe(2);
    expect(localStorage.getItem("cuervo:a")).toBe("1");
    expect(localStorage.getItem("mahjong:x")).toBe("abc");
  });

  it("merge no pisa keys existentes", () => {
    localStorage.setItem("cuervo:a", "viejo");
    const backup = parseBackup(
      JSON.stringify({
        magic: "cuervo-save",
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { "cuervo:a": "nuevo", "cuervo:b": "b" },
      }),
    );
    applyBackup(backup, "merge");
    expect(localStorage.getItem("cuervo:a")).toBe("viejo");
    expect(localStorage.getItem("cuervo:b")).toBe("b");
  });

  it("rechaza versiones futuras", () => {
    const text = JSON.stringify({
      magic: "cuervo-save",
      version: 999,
      exportedAt: new Date().toISOString(),
      data: {},
    });
    expect(() => parseBackup(text)).toThrow();
  });
});
