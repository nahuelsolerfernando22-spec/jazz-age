import clientaBar from "@/assets/hostess-loading-bar.webp";
import clientaCurtain from "@/assets/hostess-loading-curtain.webp";
import clientaShimmy from "@/assets/hostess-loading-shimmy.webp";
import clientaShow from "@/assets/hostess-loading-show.webp";
import clientaShuffle from "@/assets/hostess-loading-shuffle.webp";
import { warmImages } from "@/lib/asset-manager";

export type LoadingPose = { id: string; src: string; alt: string; line: string };

export const LOADING_POSES: LoadingPose[] = [
  {
    id: "bar",
    src: clientaBar,
    alt: "Clienta pelirroja apoyada en la barra",
    line: "Preparando la casa…",
  },
  {
    id: "curtain",
    src: clientaCurtain,
    alt: "Clienta morena fumando en el reservado",
    line: "Encendiendo las luces del salón…",
  },
  {
    id: "shimmy",
    src: clientaShimmy,
    alt: "Danzarina en la pista",
    line: "Afinando el gramófono…",
  },
  {
    id: "show",
    src: clientaShow,
    alt: "Clienta reclinada en la chaise longue",
    line: "Sirviendo la primera copa…",
  },
  {
    id: "shuffle",
    src: clientaShuffle,
    alt: "Clienta rubia junto al piano",
    line: "Acomodando las mesas…",
  },
];

const LRU_KEY = "cuervo:loading-poses:lru";
const LRU_MAX = 3;

let warmed = false;

export function warmLoadingPoses(): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  const start = () => {
    void warmImages(
      LOADING_POSES.map((pose) => pose.src),
      {
        priority: 9,
        fetchPriority: "low",
        timeoutMs: 1600,
      },
    );
  };
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;
  if (typeof ric === "function") ric(start);
  else window.setTimeout(start, 40);
}

function readLru(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LRU_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeLru(list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LRU_KEY, JSON.stringify(list.slice(0, LRU_MAX)));
  } catch {}
}

export function pickWeightedPoseIndex(): number {
  const lru = readLru();
  const weights: number[] = LOADING_POSES.map((pose) => {
    const idx = lru.indexOf(pose.id);
    if (idx === -1) return 1;
    if (idx === 0) return 0;
    if (idx === 1) return 0.35;
    return 0.65;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    return Math.floor(Math.random() * LOADING_POSES.length);
  }
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export function markPoseUsed(index: number): void {
  const pose = LOADING_POSES[index];
  if (!pose) return;
  const lru = readLru().filter((id) => id !== pose.id);
  lru.unshift(pose.id);
  writeLru(lru);
}
