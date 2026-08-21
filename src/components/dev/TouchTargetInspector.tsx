import { useEffect, useState } from "react";

const MIN = 44;

type Mark = {
  x: number;
  y: number;
  w: number;
  h: number;
  ok: boolean;
  label: string;
};

function isInteractive(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.hasAttribute("disabled")) return false;
  const tag = el.tagName;
  if (tag === "BUTTON" || tag === "A") return true;
  if (tag === "INPUT") {
    const t = (el as HTMLInputElement).type;
    return ["button", "submit", "reset", "checkbox", "radio"].includes(t);
  }
  const role = el.getAttribute("role");
  if (role === "button" || role === "link" || role === "switch" || role === "tab") return true;
  if (el.getAttribute("tabindex") === "0" && el.onclick != null) return true;
  return false;
}

function scan(): Mark[] {
  const marks: Mark[] = [];
  const nodes = document.querySelectorAll(
    "button, a, [role='button'], [role='link'], [role='switch'], [role='tab'], input",
  );
  nodes.forEach((n) => {
    if (!isInteractive(n)) return;
    const rect = (n as HTMLElement).getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const ok = rect.width >= MIN && rect.height >= MIN;
    const label =
      (n as HTMLElement).getAttribute("aria-label") ||
      (n as HTMLElement).innerText?.trim().slice(0, 18) ||
      n.tagName.toLowerCase();
    marks.push({ x: rect.left, y: rect.top, w: rect.width, h: rect.height, ok, label });
  });
  return marks;
}

export function TouchTargetInspector({ onClose }: { onClose: () => void }) {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [showOk, setShowOk] = useState(false);

  useEffect(() => {
    const run = () => setMarks(scan());
    run();
    const id = window.setInterval(run, 700);
    window.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("scroll", run);
      window.removeEventListener("resize", run);
    };
  }, []);

  const bad = marks.filter((m) => !m.ok);
  const visible = showOk ? marks : bad;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {visible.map((m, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            left: m.x,
            top: m.y,
            width: m.w,
            height: m.h,
            border: m.ok ? "1.5px solid rgba(80,220,120,0.75)" : "2px solid rgba(255,80,80,0.95)",
            background: m.ok ? "rgba(80,220,120,0.08)" : "rgba(255,60,60,0.18)",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        >
          {!m.ok && (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: -14,
                fontSize: 10,
                lineHeight: "12px",
                background: "rgba(255,60,60,0.95)",
                color: "#fff",
                padding: "1px 4px",
                fontFamily: "monospace",
                whiteSpace: "nowrap",
              }}
            >
              {Math.round(m.w)}×{Math.round(m.h)} · {m.label}
            </span>
          )}
        </div>
      ))}
      <div
        style={{ pointerEvents: "auto" }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/30 bg-black/85 px-3 py-2 text-xs text-white backdrop-blur"
      >
        <span className="font-mono">
          <b className="text-red-400">{bad.length}</b> &lt; {MIN}px
          <span className="opacity-60"> / {marks.length} total</span>
        </span>
        <button
          type="button"
          onClick={() => setShowOk((v) => !v)}
          className="min-h-[36px] rounded-full border border-white/25 px-3 py-1 text-[11px] uppercase tracking-widest active:bg-white/10"
        >
          {showOk ? "solo malos" : "mostrar ok"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[36px] rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[11px] uppercase tracking-widest active:bg-white/25"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function TouchTargetInspectorMount() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "t" || e.key === "T")) setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    try {
      if (new URLSearchParams(window.location.search).get("tapdebug") === "1") setOpen(true);
    } catch {}
    try {
      if (localStorage.getItem("cuervo:tapdebug") === "1") setOpen(true);
    } catch {}
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!open) return null;
  return <TouchTargetInspector onClose={() => setOpen(false)} />;
}
