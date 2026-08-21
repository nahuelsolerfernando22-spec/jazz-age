import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { installLocalStoragePolyfill } from "./_localStorage-polyfill";
beforeAll(() => installLocalStoragePolyfill());
import {
  createProfile,
  deleteProfile,
  ensureProfileMigration,
  getActiveProfile,
  listProfiles,
  renameProfile,
  switchToProfile,
} from "@/lib/profiles";

describe("profiles", () => {
  beforeEach(() => localStorage.clear());

  it("lista 3 slots vacíos por defecto", () => {
    const list = listProfiles();
    expect(list).toHaveLength(3);
    expect(list.every((p) => !p.exists)).toBe(true);
    expect(getActiveProfile()).toBeNull();
  });

  it("crear, renombrar y borrar un perfil", () => {
    createProfile("p1", "Alba", "🌹");
    let list = listProfiles();
    expect(list[0].exists).toBe(true);
    expect(list[0].name).toBe("Alba");
    renameProfile("p1", "Beto", "🎩");
    list = listProfiles();
    expect(list[0].name).toBe("Beto");
    expect(list[0].avatar).toBe("🎩");
    deleteProfile("p1");
    expect(listProfiles()[0].exists).toBe(false);
  });

  it("switch aísla el save entre perfiles", () => {
    createProfile("p1", "Alba", "🌹");
    createProfile("p2", "Beto", "🎩");

    switchToProfile("p1", false);
    localStorage.setItem("cuervo:score", "111");

    switchToProfile("p2", false);
    expect(localStorage.getItem("cuervo:score")).toBeNull();
    localStorage.setItem("cuervo:score", "222");

    switchToProfile("p1", false);
    expect(localStorage.getItem("cuervo:score")).toBe("111");
    switchToProfile("p2", false);
    expect(localStorage.getItem("cuervo:score")).toBe("222");
  });

  it("ensureProfileMigration migra save existente a p1", () => {
    localStorage.setItem("cuervo:pre", "hola");
    ensureProfileMigration();
    expect(getActiveProfile()).toBe("p1");
    const list = listProfiles();
    expect(list[0].exists).toBe(true);

    expect(localStorage.getItem("cuervo:pre")).toBe("hola");
  });

  it("ensureProfileMigration es idempotente y no toca instalaciones limpias", () => {
    ensureProfileMigration();
    expect(getActiveProfile()).toBeNull();
    ensureProfileMigration();
    expect(getActiveProfile()).toBeNull();
  });
});
