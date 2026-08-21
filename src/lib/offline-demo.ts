const RUNTIME_FLAG = () => {
  if (typeof window === "undefined") return false;

  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (w.Capacitor?.isNativePlatform?.()) return true;
  return false;
};

export function isOfflineDemo(): boolean {
  if (import.meta.env.VITE_OFFLINE_DEMO === "0") {
    return RUNTIME_FLAG();
  }
  return true;
}

export function getLocalDemoUser() {
  if (typeof window === "undefined") return { id: "demo-ssr", alias: "Forastero" };

  const makeId = () => {
    const uuid = crypto.randomUUID?.();
    return uuid ?? `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  };

  let id = "demo-local";
  let alias = "Forastero";
  try {
    id = window.localStorage.getItem("cuervo:demo:uid") ?? makeId();
    window.localStorage.setItem("cuervo:demo:uid", id);
  } catch {
    id = makeId();
  }
  try {
    alias = window.localStorage.getItem("cuervo:alias") ?? "Forastero";
  } catch {
    alias = "Forastero";
  }
  return { id, alias };
}
