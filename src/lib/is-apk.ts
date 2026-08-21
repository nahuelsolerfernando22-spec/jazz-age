export function isApk(): boolean {
  if (typeof window === "undefined") return false;

  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (w.Capacitor?.isNativePlatform?.()) return true;
  if (/\bCapacitor\b/i.test(navigator.userAgent)) return true;
  return false;
}
