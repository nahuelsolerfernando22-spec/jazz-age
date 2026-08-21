export interface LocalNotifyOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

export async function notifyLocal(opts: LocalNotifyOptions): Promise<boolean> {
  const ok = await ensureNotificationPermission();
  if (!ok) return false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) {
      await reg.showNotification(opts.title, {
        body: opts.body,
        tag: opts.tag,
        icon: opts.icon ?? "/icon-192.webp",
        badge: "/icon-192.webp",
      });
      return true;
    }
    new Notification(opts.title, {
      body: opts.body,
      tag: opts.tag,
      icon: opts.icon ?? "/icon-192.webp",
    });
    return true;
  } catch (err) {
    console.warn("[notify] fallo mostrar notificación", err);
    return false;
  }
}

export async function nudgeStreakIfDue(
  lastPlayIso: string | null,
  streakDays: number,
): Promise<void> {
  if (!lastPlayIso || streakDays <= 0) return;
  const last = new Date(lastPlayIso).getTime();
  const hours = (Date.now() - last) / 3_600_000;
  if (hours < 20 || hours > 26) return;
  await notifyLocal({
    title: "El Cuervo Dorado te espera",
    body: `Tu racha de ${streakDays} días está por caer. Pasá antes de medianoche.`,
    tag: "streak-nudge",
  });
}
