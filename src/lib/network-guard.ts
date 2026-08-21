let _installed = false;
const _warned = new Set<string>();

function sameOrigin(url: string): boolean {
  try {
    if (typeof window === "undefined") return true;
    if (
      url.startsWith("/") ||
      url.startsWith("./") ||
      url.startsWith("../") ||
      url.startsWith("#") ||
      url.startsWith("?")
    )
      return true;
    if (/^(blob:|data:|about:|file:|filesystem:)/i.test(url)) return true;
    const u = new URL(url, window.location.href);

    if (u.host === window.location.host) return true;

    if (u.protocol === "capacitor:" || u.protocol === "ionic:") return true;
    return false;
  } catch {
    return true;
  }
}

function warnBlocked(url: string, kind: string) {
  try {
    const host = (() => {
      try {
        return (
          new URL(url, typeof window !== "undefined" ? window.location.href : "http://x/").host ||
          url
        );
      } catch {
        return url;
      }
    })();
    const tag = `${kind}:${host}`;
    if (_warned.has(tag)) return;
    _warned.add(tag);

    console.warn(`[cuervo·offline] bloqueado ${kind} → ${host}`);

    void import("sonner")
      .then(({ toast }) => {
        toast.warning("Intento de conexión bloqueado", {
          description: `El juego es 100% sin internet. Se bloqueó ${kind} a ${host}.`,
          duration: 4200,
        });
      })
      .catch(() => {});
  } catch {}
}

export function installNetworkGuard(): void {
  if (_installed || typeof window === "undefined") return;
  _installed = true;

  const origFetch = window.fetch?.bind(window);
  if (origFetch) {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      if (!sameOrigin(url)) {
        warnBlocked(url, "fetch");
        return new Response(JSON.stringify({ error: "offline", blockedUrl: url }), {
          status: 503,
          statusText: "Offline Mode",
          headers: { "content-type": "application/json" },
        });
      }
      return origFetch(input as RequestInfo, init);
    };
  }

  const OrigXHR = window.XMLHttpRequest;
  if (OrigXHR) {
    const openOrig = OrigXHR.prototype.open;
    OrigXHR.prototype.open = function patchedOpen(
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      async?: boolean,
      user?: string | null,
      password?: string | null,
    ) {
      const asStr = typeof url === "string" ? url : url.toString();
      const args = [async ?? true, user ?? null, password ?? null] as const;
      if (!sameOrigin(asStr)) {
        warnBlocked(asStr, "XHR");
        return openOrig.call(this, method, "about:blank", ...args);
      }
      return openOrig.call(this, method, url as string, ...args);
    } as typeof OrigXHR.prototype.open;
  }

  const OrigWS = window.WebSocket;
  if (OrigWS) {
    const Patched = function (url: string | URL, protocols?: string | string[]) {
      const asStr = typeof url === "string" ? url : url.toString();
      if (!sameOrigin(asStr)) {
        warnBlocked(asStr, "WebSocket");

        return new OrigWS(
          `${window.location.protocol.replace("http", "ws")}//${window.location.host}/__blocked`,
          protocols,
        );
      }
      return new OrigWS(url, protocols);
    } as unknown as typeof WebSocket;
    Patched.prototype = OrigWS.prototype;
    (Patched as unknown as { CONNECTING: number }).CONNECTING = OrigWS.CONNECTING;
    (Patched as unknown as { OPEN: number }).OPEN = OrigWS.OPEN;
    (Patched as unknown as { CLOSING: number }).CLOSING = OrigWS.CLOSING;
    (Patched as unknown as { CLOSED: number }).CLOSED = OrigWS.CLOSED;
    window.WebSocket = Patched;
  }

  const OrigES = window.EventSource;
  if (OrigES) {
    const Patched = function (url: string | URL, init?: EventSourceInit) {
      const asStr = typeof url === "string" ? url : url.toString();
      if (!sameOrigin(asStr)) {
        warnBlocked(asStr, "EventSource");
        return new OrigES(`${window.location.origin}/__blocked`, init);
      }
      return new OrigES(url, init);
    } as unknown as typeof EventSource;
    Patched.prototype = OrigES.prototype;
    window.EventSource = Patched;
  }

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const orig = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = ((url: string | URL, data?: BodyInit | null) => {
      const asStr = typeof url === "string" ? url : url.toString();
      if (!sameOrigin(asStr)) {
        warnBlocked(asStr, "sendBeacon");
        return false;
      }
      return orig(url, data);
    }) as typeof navigator.sendBeacon;
  }
}

export function isNetworkGuardInstalled(): boolean {
  return _installed;
}
