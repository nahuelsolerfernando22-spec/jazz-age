import { getSupabase } from "@/integrations/supabase/lazy";
import { isOfflineDemo } from "@/lib/offline-demo";

const DEVICE_KEY = "cuervo:device_id";
const ALIAS_KEY = "cuervo:alias";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = uuid();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getStoredAlias(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ALIAS_KEY);
}

export function setStoredAlias(alias: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ALIAS_KEY, alias);
}

export async function upsertPlayer(alias: string): Promise<void> {
  const cleaned = alias.trim().slice(0, 24);
  if (cleaned.length < 2) throw new Error("El alias necesita al menos 2 letras.");
  if (isOfflineDemo()) {
    setStoredAlias(cleaned);
    return;
  }
  const device_id = getDeviceId();
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("players")
    .upsert({ device_id, alias: cleaned }, { onConflict: "device_id" });
  if (error) throw error;
  setStoredAlias(cleaned);
}
