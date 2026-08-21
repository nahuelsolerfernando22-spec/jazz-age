export function exitToMainMenu() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem("lulus-menu-seen");
  } catch {}
  window.dispatchEvent(new CustomEvent("open-main-menu"));
}
