const INACTIVITY_MS = 240;
let installed = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let active = false;

function setActive(next: boolean) {
  if (next === active) return;
  active = next;
  try {
    if (next) document.documentElement.setAttribute("data-interacting", "1");
    else document.documentElement.removeAttribute("data-interacting");
  } catch {}
}

function ping() {
  setActive(true);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => setActive(false), INACTIVITY_MS);
}

export function installInteractionPauser(): void {
  if (installed) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  installed = true;

  const opts: AddEventListenerOptions = { passive: true, capture: true };

  window.addEventListener("pointerdown", ping, opts);
  window.addEventListener("touchstart", ping, opts);
  window.addEventListener("touchmove", ping, opts);
  window.addEventListener("wheel", ping, opts);
  window.addEventListener("scroll", ping, opts);
  window.addEventListener("keydown", ping, opts);
}
