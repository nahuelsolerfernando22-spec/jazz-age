// Captura el último error no manejado del runtime del servidor para poder
// mostrarlo en la página de error en vez de un JSON opaco de h3.

let lastError: unknown;

function remember(error: unknown) {
  lastError = error;
}

const g = globalThis as typeof globalThis & { __cdErrorCapture?: boolean };

if (!g.__cdErrorCapture) {
  g.__cdErrorCapture = true;
  try {
    globalThis.addEventListener?.("unhandledrejection", (event) => {
      remember((event as PromiseRejectionEvent).reason);
    });
    globalThis.addEventListener?.("error", (event) => {
      remember((event as ErrorEvent).error ?? (event as ErrorEvent).message);
    });
  } catch {
    // Algunos runtimes no exponen addEventListener; no es crítico.
  }
}

/** Devuelve el último error capturado y limpia el registro. */
export function consumeLastCapturedError(): unknown {
  const error = lastError;
  lastError = undefined;
  return error;
}
