import { z } from "zod";

const MAGIC = "cuervo-save";
const VERSION = 1;

const KEY_PREFIXES = [
  "cuervo",
  "cuervo-",
  "cuervo:",
  "speakeasy",
  "speakeasy-",
  "speakeasy:",
  "slots",
  "slots:",
  "mahjong",
  "mahjong-",
  "mahjong:",
  "collectibles",
  "hostess",
  "hostess-",
  "hostess:",
  "chinchon",
  "generala",
  "truco",
  "escoba",
  "blackjack",
  "ruleta",
  "dados",
  "solitario",
  "bagatelle",
  "pinball",
  "logros",
  "diario",
  "prestige",
  "casino",
  "leagues",
  "liga",
];

function isGameKey(key: string): boolean {
  if (key === "cuervo:activeProfile" || key.startsWith("cuervo:profile:")) return false;
  return KEY_PREFIXES.some(
    (p) => key === p || key.startsWith(p + ":") || key.startsWith(p + "-") || key.startsWith(p),
  );
}

const BackupSchema = z.object({
  magic: z.literal(MAGIC),
  version: z.number().int().positive(),
  exportedAt: z.string(),
  data: z.record(z.string(), z.string()),
});

export type Backup = z.infer<typeof BackupSchema>;

export function collectSaveKeys(): string[] {
  if (typeof localStorage === "undefined") return [];
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && isGameKey(k)) out.push(k);
  }
  return out.sort();
}

export function exportSavesToObject(): Backup {
  const data: Record<string, string> = {};
  for (const k of collectSaveKeys()) {
    const v = localStorage.getItem(k);
    if (v != null) data[k] = v;
  }
  return { magic: MAGIC, version: VERSION, exportedAt: new Date().toISOString(), data };
}

export async function downloadSaveFile(): Promise<
  { ok: true; keys: number } | { ok: false; reason: string }
> {
  try {
    const backup = exportSavesToObject();
    const json = JSON.stringify(backup, null, 2);
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `cuervo-${stamp}.cuervo`;
    const blob = new Blob([json], { type: "application/json" });

    const w = window as Window & {
      showSaveFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle>;
    };
    if (typeof w.showSaveFilePicker === "function") {
      try {
        const handle = await w.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "El Cuervo Dorado",
              accept: { "application/json": [".cuervo", ".json"] },
            },
          ],
        });
        const writable = await (
          handle as FileSystemFileHandle & {
            createWritable: () => Promise<{
              write: (b: Blob) => Promise<void>;
              close: () => Promise<void>;
            }>;
          }
        ).createWritable();
        await writable.write(blob);
        await writable.close();
        return { ok: true, keys: Object.keys(backup.data).length };
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") {
          return { ok: false, reason: "cancelado" };
        }
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, keys: Object.keys(backup.data).length };
  } catch (e) {
    return { ok: false, reason: (e as Error)?.message ?? "error desconocido" };
  }
}

export function parseBackup(text: string): Backup {
  const raw = JSON.parse(text);
  const parsed = BackupSchema.parse(raw);
  if (parsed.version > VERSION) {
    throw new Error(
      `Este archivo es de una versión más nueva (v${parsed.version}). Actualizá la app antes de importar.`,
    );
  }
  return parsed;
}

export function applyBackup(backup: Backup, mode: "replace" | "merge"): number {
  if (mode === "replace") {
    for (const k of collectSaveKeys()) localStorage.removeItem(k);
  }
  let applied = 0;
  for (const [k, v] of Object.entries(backup.data)) {
    if (!isGameKey(k)) continue;
    if (mode === "merge" && localStorage.getItem(k) != null) continue;
    localStorage.setItem(k, v);
    applied++;
  }
  return applied;
}

export async function importSaveFromFile(
  file: File,
  mode: "replace" | "merge" = "replace",
): Promise<{ ok: true; applied: number } | { ok: false; reason: string }> {
  try {
    const text = await file.text();
    const backup = parseBackup(text);
    const applied = applyBackup(backup, mode);
    return { ok: true, applied };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, reason: "El archivo no tiene el formato esperado." };
    }
    return { ok: false, reason: (e as Error)?.message ?? "error al importar" };
  }
}

export const __test = { isGameKey, MAGIC, VERSION };
