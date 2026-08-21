import { useCasino } from "@/store/casino";
import { useSyndicate } from "@/store/syndicate";
import {
  BARRIOS,
  sonVecinos,
  MAP_IMAGE_URL,
  type Territorio,
  type Point,
} from "@/lib/sindicato-data";
import { IconSindicato, IconFichas, IconManoContinuar } from "@/components/casino/DecoIcons";
import { createFileRoute } from "@tanstack/react-router";
import { useSyndicateRun } from "@/store/syndicate-run";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useHaptics } from "@/hooks/use-haptics";
import { toast } from "sonner";
import { TacticalCardsModal } from "@/components/casino/TacticalCardsModal";
import { DesafioDeMesa } from "@/components/casino/sindicato/DesafioDeMesa";
import { TurnBanner } from "@/components/casino/sindicato/TurnBanner";
import { ControlBar } from "@/components/casino/sindicato/ControlBar";
import { BarriosPanel } from "@/components/casino/sindicato/BarriosPanel";
import { ActionDock } from "@/components/casino/sindicato/ActionDock";
import { faccionDe } from "@/lib/sindicato-facciones";
import { PATRONES_TABLERO, patronDeFaccion } from "@/lib/sindicato-texturas";
import { configOla, OLAS_TOTALES } from "@/lib/sindicato-run";
import { ObjetivoCard } from "@/components/casino/sindicato/ObjetivoCard";
import { RunOverlay } from "@/components/casino/sindicato/RunOverlay";
import {
  Shield,
  Sword,
  Target,
  Zap,
  Users,
  Info,
  TrendingUp,
  Briefcase,
  AlertCircle,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Minus,
  Map as MapIcon,
} from "lucide-react";

// --- Visual Constants ---
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 1000;
const INITIAL_SCALE = 1.0;
const MIN_SCALE = 0.4;
const CONTENT_BOX_GEN = (territorios: Territorio[]) => {
  const xs = territorios.flatMap((t) => t.points.map((p) => p.x * 10));
  const ys = territorios.flatMap((t) => t.points.map((p) => p.y * 10));
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  return { width: maxX - minX, height: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
};

const MAX_SCALE = 4.0;

/** Ruido determinista por id de sector: el mismo mapa siempre dibuja el mismo borde. */
function ruido(semilla: string, i: number) {
  let h = 2166136261;
  const s = `${semilla}:${i}`;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

/** Convierte el polígono recto en un contorno irregular y redondeado, estilo mapa pintado. */
function bordeIrregular(points: Point[], semilla: string) {
  const pts = points.map((p) => ({ x: p.x * 10, y: p.y * 10 }));
  if (pts.length < 3) return "";
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  const nodos: { x: number; y: number }[] = [];
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    nodos.push(p);
    const mx = (p.x + q.x) / 2;
    const my = (p.y + q.y) / 2;
    const dx = mx - cx;
    const dy = my - cy;
    const len = Math.hypot(dx, dy) || 1;
    const desvio = ruido(semilla, i) * 14;
    nodos.push({ x: mx + (dx / len) * desvio, y: my + (dy / len) * desvio });
  });
  let d = `M ${(nodos[0].x + nodos[1].x) / 2} ${(nodos[0].y + nodos[1].y) / 2}`;
  for (let i = 1; i <= nodos.length; i++) {
    const actual = nodos[i % nodos.length];
    const siguiente = nodos[(i + 1) % nodos.length];
    d += ` Q ${actual.x} ${actual.y} ${(actual.x + siguiente.x) / 2} ${(actual.y + siguiente.y) / 2}`;
  }
  return `${d} Z`;
}


function DiceRoller({
  rolling,
  onResult,
  attackerCount = 3,
  defenderCount = 3,
  bribeUsed = false,
  bribeDice = 1,
  attackerTalismanes = [],
  defenderTalismanes = [],
}: {
  rolling: boolean;
  onResult: (attackerLoss: number, defenderLoss: number) => void;
  attackerCount?: number;
  defenderCount?: number;
  bribeUsed?: boolean;
  bribeDice?: number;
  attackerTalismanes?: string[];
  defenderTalismanes?: string[];
}) {
  const [attackerDice, setAttackerDice] = useState<number[]>([]);
  const [defenderDice, setDefenderDice] = useState<number[]>([]);

  useEffect(() => {
    if (rolling) {
      const interval = setInterval(() => {
        setAttackerDice(
          Array(attackerCount)
            .fill(0)
            .map(() => Math.floor(Math.random() * 6) + 1),
        );
        setDefenderDice(
          Array(defenderCount)
            .fill(0)
            .map(() => Math.floor(Math.random() * 6) + 1),
        );
      }, 80);

      const timer = setTimeout(() => {
        clearInterval(interval);
        const aFinal = Array(attackerCount)
          .fill(0)
          .map(() => Math.floor(Math.random() * 6) + 1);

        // Whisky Reserva: +1 a los dados solo en el primer asalto del turno
        const isFirstAttack =
          useSyndicate.getState().assaultsThisTurn === 0 &&
          attackerTalismanes.includes("whisky-reserva");


        // Dado Cargado: Descarta el peor dado una vez (simulamos re-roll si hay un 1)
        if (attackerTalismanes.includes("dado-cargado")) {
          const minIndex = aFinal.indexOf(Math.min(...aFinal));
          if (aFinal[minIndex] < 4) aFinal[minIndex] = Math.floor(Math.random() * 3) + 4; // Re-roll a 4,5,6
        }

        if (isFirstAttack) {
          for (let i = 0; i < aFinal.length; i++) {
            aFinal[i] = Math.min(6, aFinal[i] + 1);
          }
        }

        if (bribeUsed) {
          aFinal.sort((a, b) => b - a);
          for (let i = 0; i < Math.min(bribeDice, aFinal.length); i++) {
            aFinal[i] = Math.min(6, aFinal[i] + 1);
          }
        }

        aFinal.sort((a, b) => b - a);
        const dFinal = Array(defenderCount)
          .fill(0)
          .map(() => Math.floor(Math.random() * 6) + 1);

        // Anillo de Rubí: +1 dado al defender (lo simulamos sumando +1 al mejor dado)
        if (defenderTalismanes.includes("anillo-rubi")) {
          dFinal.sort((a, b) => b - a);
          dFinal[0] = Math.min(6, dFinal[0] + 1);
        }

        dFinal.sort((a, b) => b - a);

        setAttackerDice(aFinal);
        setDefenderDice(dFinal);

        let aLoss = 0;
        let dLoss = 0;
        const comparisons = Math.min(aFinal.length, dFinal.length);

        for (let i = 0; i < comparisons; i++) {
          if (aFinal[i] > dFinal[i]) dLoss++;
          else aLoss++;
        }

        navigator.vibrate?.([50, 30, 50]);
        onResult(aLoss, dLoss);
      }, 1500);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [rolling, attackerCount, defenderCount, onResult]);

  return (
    <div className="py-6 space-y-6">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--oro)] text-center font-bold font-serif italic">
          Invasores
        </p>
        <div className="flex gap-4 justify-center">
          {(attackerDice.length > 0 ? attackerDice : Array(attackerCount).fill(1)).map((v, i) => (
            <motion.div
              key={`a-${i}`}
              animate={
                rolling
                  ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.3, 1], y: [0, -10, 0] }
                  : {}
              }
              transition={{ duration: 0.15, repeat: rolling ? Infinity : 0 }}
              className="w-16 h-16 bg-[var(--crema-clara)] border-[4px] border-black rounded-lg flex items-center justify-center shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle at 30% 30%, #fff, transparent)" }}
              />
              <span className="font-serif italic font-bold text-5xl text-black drop-shadow-[2px_2px_0_rgba(255,255,255,0.8)]">
                {v}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[var(--oro)]/50 to-transparent" />
        <div className="w-12 h-12 border-2 border-[var(--oro)] rounded-full flex items-center justify-center rotate-45 bg-black shadow-[0_0_20px_rgba(201,168,76,0.5)]">
          <span className="font-serif italic font-bold text-xl text-[var(--oro)] -rotate-45 drop-shadow-[0_0_5px_var(--cd-gold-mid)]">
            VS
          </span>
        </div>
        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[var(--oro)]/50 to-transparent" />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-red-600 text-center font-bold font-serif italic">
          Resistencia
        </p>
        <div className="flex gap-4 justify-center">
          {(defenderDice.length > 0 ? defenderDice : Array(defenderCount).fill(1)).map((v, i) => (
            <motion.div
              key={`d-${i}`}
              animate={
                rolling
                  ? { rotate: [0, -90, -180, -270, -360], scale: [1, 1.3, 1], y: [0, 10, 0] }
                  : {}
              }
              transition={{ duration: 0.15, repeat: rolling ? Infinity : 0 }}
              className="w-16 h-16 bg-red-900 border-[4px] border-black rounded-lg flex items-center justify-center shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.3), transparent)",
                }}
              />
              <span className="font-serif italic font-bold text-5xl text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                {v}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sindicato")({
  component: SindicatoPage,
});

function SindicatoPage() {
  const { chips } = useCasino();
  const {
    players,
    currentPlayerIndex,
    conquerTerritory,
    updateTroops,
    conquests,
    unassignedTroops,
    assignTroops,
    confirmDeployment,
    cancelDeployment,
    pendingDeployment,
    spendChips,
    moveTroops,
    secretObjective,
    setSecretObjective,
    checkVictory,
    gameStarted,
    startGame,
    nextTurn,
    turnPhase,
    winner,
    botPlay,
    drawCard,
    tradeCards,
    playSpecialCard,
    activeEffects,
    activeTerritories,
    hasMovedFortification,

  } = useSyndicate();

  const currentPlayer = players[currentPlayerIndex];
  const myCards = currentPlayer?.cards || [];
  const myFaction = faccionDe(currentPlayer?.faction);
  const [bribeActive, setBribeActive] = useState(false);

  const controlCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(conquests).forEach((c) => {
      counts[c.ownerId] = (counts[c.ownerId] || 0) + 1;
    });
    return counts;
  }, [conquests]);

  const pendingTroops = useMemo(
    () => Object.values(pendingDeployment).reduce((a, b) => a + b, 0),
    [pendingDeployment],
  );

  const haptics = useHaptics();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const [rolling, setRolling] = useState(false);
  // Desafío de mesa del barrio: ganar suma un dado de asalto, perder se lo da al defensor.
  const [desafioOpen, setDesafioOpen] = useState(false);
  const [desafioBonus, setDesafioBonus] = useState<{ atk: number; def: number }>({
    atk: 0,
    def: 0,
  });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: INITIAL_SCALE });
  const [altoContraste, setAltoContraste] = useState(false);
  const [isCardsOpen, setIsCardsOpen] = useState(false);
  const [lastConflictId, setLastConflictId] = useState<string | null>(null);
  const [fitScale, setFitScale] = useState(INITIAL_SCALE);

  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  const territoriesKey = useMemo(
    () => activeTerritories.map((t) => t.id).join("|"),
    [activeTerritories],
  );

  const computeFit = useCallback(() => {
    // Espacio real reservado arriba (banner de turno + barra de control + fichas de barrio)
    // y abajo por el dock de acciones.
    const HEADER = 186;
    const NAVBAR = 148;
    const w = window.innerWidth;
    const h = Math.max(240, window.innerHeight - HEADER - NAVBAR);
    // Encuadre sobre el area jugable real (no sobre el lienzo de 1000x1000).
    const pad = 10;
    const contentBox = CONTENT_BOX_GEN(activeTerritories);
    const cw = contentBox.width + pad * 2;
    const ch = contentBox.height + pad * 2;
    // El area jugable entera entra en pantalla; el fondo fijo del main evita bandas negras.
    const base = Math.min(w / cw, h / ch);
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, base));



    setFitScale(s);
    const ox = (contentBox.cx - MAP_WIDTH / 2) * s;
    const oy = (contentBox.cy - MAP_HEIGHT / 2) * s;
    setTransform({ x: -ox, y: -oy + (HEADER - NAVBAR) / 2, scale: s });
  }, [activeTerritories]);

  useEffect(() => {
    computeFit();
    window.addEventListener("resize", computeFit);
    return () => window.removeEventListener("resize", computeFit);
  }, [territoriesKey, computeFit]);


  const runStatus = useSyndicateRun((s) => s.status);
  const runSeed = useSyndicateRun((s) => s.seed);
  const runOla = useSyndicateRun((s) => s.ola);
  const startRun = useSyndicateRun((s) => s.startRun);
  const ganarOla = useSyndicateRun((s) => s.ganarOla);
  const perderRun = useSyndicateRun((s) => s.perderRun);
  const runTalismanes = useSyndicateRun((s) => s.talismanes);
  const ola = useMemo(() => configOla(runSeed, runOla), [runSeed, runOla]);
  const enRun = runStatus === "playing";

  // Toda partida es una noche roguelike: si no hay run activa, se abre una.
  useEffect(() => {
    if (runStatus === "idle") startRun();
  }, [runStatus, startRun]);

  useEffect(() => {
    if (!enRun) return;
    if (!gameStarted) startGame(ola.rivales, undefined, ola.ventajaBot, ola.mapSeed);
  }, [enRun, gameStarted, startGame, ola]);

  // La oleada fija el objetivo COMÚN de la mesa; el secreto lo reparte el mazo.
  useEffect(() => {
    const target = String(ola.objetivo);
    useSyndicate.getState().setComunObjetivo(ola.objetivo);
    if (!secretObjective || secretObjective.target !== target) {
      setSecretObjective({
        type: "conquer",
        target,
        desc: `${ola.titulo}: controlá ${target} sectores`,
        completed: false,
      });
    }
  }, [secretObjective, setSecretObjective, ola]);

  // El desenlace del mapa también cierra la ronda del torneo, si hay uno abierto.
  useEffect(() => {
    if (!winner) return;
    void import("@/lib/nemesis").then(({ reportGameOutcome }) =>
      reportGameOutcome("sindicato", winner.isBot ? "loss" : "win"),
    );
  }, [winner]);

  useEffect(() => {
    if (!enRun || !winner) return;
    if (winner.isBot) {
      perderRun();
      toast.error("Te sacaron del barrio.");
    } else {
      ganarOla();
      toast.success("Barrio tomado.");
    }
  }, [enRun, winner, ganarOla, perderRun]);

  useEffect(() => {
    if (!enRun || !players.length) return;
    const yo = players[0];
    if (!yo || yo.eliminated) return;
    const mios = Object.values(conquests).filter((c) => c.ownerId === 0).length;
    if (mios === 0) {
      perderRun();
      toast.error("Perdiste todos tus sectores.");
    }
  }, [enRun, players, conquests, perderRun]);

  useEffect(() => {
    if (gameStarted && currentPlayer?.isBot && !winner) {
      const runBot = async () => {
        await new Promise((r) => setTimeout(r, 1500));
        await botPlay();
        haptics("tap");
      };
      runBot();
    }
  }, [currentPlayerIndex, turnPhase, gameStarted, currentPlayer?.isBot, botPlay, winner, haptics]);

  useEffect(() => {
    const vict = checkVictory();
    if (vict) {
      useSyndicate.setState({ winner: vict });
    }
  }, [conquests, checkVictory]);

  const selectedTerritory = useMemo(
    () => (selectedId ? activeTerritories.find((t) => t.id === selectedId) : null),
    [selectedId, activeTerritories],
  );

  const isMine = selectedId ? conquests[selectedId]?.ownerId === currentPlayerIndex : false;

  // Centros de cada sector (coordenadas del lienzo) para rutas y cartuchos.
  const centros = useMemo(() => {
    const m: Record<string, Point> = {};
    activeTerritories.forEach((t) => {
      m[t.id] = t.points.reduce(
        (acc: Point, p: Point) => ({
          x: acc.x + (p.x * 10) / t.points.length,
          y: acc.y + (p.y * 10) / t.points.length,
        }),
        { x: 0, y: 0 },
      );
    });
    return m;
  }, [activeTerritories]);

  // Rutas punteadas entre sectores vecinos (una sola por par).
  const conexiones = useMemo(() => {
    const vistas = new Set<string>();
    const out: { id: string; a: Point; b: Point }[] = [];
    activeTerritories.forEach((t) => {
      t.vecinos.forEach((vId) => {
        const key = [t.id, vId].sort().join("|");
        if (vistas.has(key)) return;
        const a = centros[t.id];
        const b = centros[vId];
        if (!a || !b) return;
        vistas.add(key);
        out.push({ id: key, a, b });
      });
    });
    return out;
  }, [activeTerritories, centros]);


  // Sector propio que lidera el asalto: se calcula una sola vez y se usa en dados y resolución.
  const attackerId = useMemo(() => {
    if (!selectedId || !currentPlayer) return null;
    const territory = activeTerritories.find((t) => t.id === selectedId);
    if (!territory) return null;
    return (
      territory.vecinos
        .filter((vId) => {
          const v = conquests[vId];
          return (
            v &&
            v.ownerId === currentPlayerIndex &&
            v.troops > 1 &&
            useSyndicate.getState().canAttack(vId, selectedId)
          );
        })
        .sort((a, b) => conquests[b].troops - conquests[a].troops)[0] ?? null
    );
  }, [selectedId, currentPlayerIndex, conquests, activeTerritories, currentPlayer]);

  const canAttack = !!attackerId;

  // Vecinos propios para el reagrupe (mover tropas al final del turno).
  const fortifyTargets = useMemo(() => {
    if (!selectedId || !isMine) return [];
    const territory = activeTerritories.find((t) => t.id === selectedId);
    if (!territory) return [];
    return territory.vecinos.filter((v) => conquests[v]?.ownerId === currentPlayerIndex);
  }, [selectedId, isMine, activeTerritories, conquests, currentPlayerIndex]);


  const handleSiege = () => {
    const activeBribe = Object.values(activeEffects).find(
      (e) => e.type === "bribe" && e.ownerId === currentPlayerIndex,
    );
    setBribeActive(!!activeBribe);
    setDesafioBonus({ atk: 0, def: 0 });
    setIsCombatOpen(true);
    haptics("heavy");
  };
  const runTalismanesList = useSyndicateRun((s) => s.talismanes);

  useEffect(() => {
    // Sincronizar talismanes activos en el store de juego
    const currentEffects = useSyndicate.getState().activeEffects;
    const newEffects = { ...currentEffects };
    let changed = false;
    runTalismanesList.forEach((t) => {
      const key = `talisman-${t}`;
      if (!newEffects[key]) {
        newEffects[key] = { type: "surprise", ownerId: 0, expiresAt: Infinity };
        changed = true;
      }
    });
    if (changed) {
      useSyndicate.setState({ activeEffects: newEffects });
    }
  }, [runTalismanesList]);

  const onDiceResult = useCallback(
    (aLoss: number, dLoss: number) => {
      setRolling(false);
      if (!selectedId || !attackerId) return;
      const atacante = conquests[attackerId];
      const defensor = conquests[selectedId];
      if (!atacante || !defensor) return;

      useSyndicate.getState().registerAssault();

      const dadosAtaque = Math.min(3, atacante.troops - 1);
      const bajasAtacante = Math.min(aLoss, Math.max(0, atacante.troops - 1));
      const bajasDefensor = Math.min(dLoss, defensor.troops);

      updateTroops(attackerId, -bajasAtacante);
      const defensorRestante = defensor.troops - bajasDefensor;

      if (defensorRestante <= 0) {
        const disponibles = atacante.troops - bajasAtacante - 1;
        const mueve = Math.max(1, Math.min(disponibles, dadosAtaque));
        updateTroops(attackerId, -mueve);
        conquerTerritory(selectedId, mueve, currentPlayerIndex);
        drawCard(currentPlayerIndex);

        // Moneda Doblada: +25 fichas por sector conquistado
        if (currentPlayerIndex === 0 && runTalismanesList.includes("moneda-doblada")) {
          useCasino.getState().addChips(25);
        }

        haptics("heavy");
        toast.success("¡Sector bajo control! Carta táctica recibida.");
        setIsCombatOpen(false);
        setLastConflictId(selectedId);
      } else {
        updateTroops(selectedId, -bajasDefensor);
        toast.error(
          bajasAtacante > bajasDefensor
            ? "Bajas pesadas en el asalto"
            : "Resistencia enemiga debilitada",
        );
        if (atacante.troops - bajasAtacante <= 1) {
          setIsCombatOpen(false);
        }
      }
    },
    [
      selectedId,
      attackerId,
      currentPlayerIndex,
      updateTroops,
      conquerTerritory,
      drawCard,
      haptics,
      conquests,
      runTalismanesList,
    ],
  );
  const handleRefit = useCallback(() => {
    computeFit();
    haptics("tap");
  }, [computeFit, haptics]);


  return (
    <div className="fixed inset-0 w-screen h-dvh min-h-dvh bg-[var(--cd-noir-0)] text-[var(--crema-clara)] flex flex-col font-body select-none overflow-hidden overscroll-none">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .safe-pt { padding-top: max(1rem, env(safe-area-inset-top)); }
        .safe-pb { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
        body { overflow: hidden; position: fixed; width: 100%; height: 100%; overscroll-behavior: none; }
      `,
        }}
      />

      <main
        ref={containerRef}
        className="fixed inset-0 z-0 w-screen h-dvh touch-none bg-[var(--cd-noir-2)] overflow-hidden"
        onPointerDown={(e) => {
          if ((e.target as Element).closest("g.pointer-events-auto")) return;
          if (e.button !== 0) return;
          let startX = e.clientX;
          let startY = e.clientY;
          const onPointerMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            startX = moveEvent.clientX;
            startY = moveEvent.clientY;
          };
          const onPointerUp = () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
          };
          window.addEventListener("pointermove", onPointerMove);
          window.addEventListener("pointerup", onPointerUp);
        }}
        onWheel={(e) => {
          setTransform((t) => ({
            ...t,
            scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale - e.deltaY * 0.001)),
          }));
        }}
      >
        {/* Fondo fijo: la ciudad se extiende a pantalla completa detras del lienzo jugable. */}
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${MAP_IMAGE_URL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: altoContraste
              ? "saturate(0.35) contrast(1.2) brightness(0.2) blur(5px)"
              : "saturate(0.8) contrast(1.1) brightness(0.42) blur(3px)",
          }}
        />

        <motion.div
          ref={mapRef}
          className="absolute left-1/2 top-1/2 -ml-[500px] -mt-[500px] h-[1000px] w-[1000px] shrink-0 origin-center z-[2] pointer-events-auto map-interactive-layer overflow-hidden"
          animate={{
            x: transform.x,
            y: transform.y,
            scale: transform.scale,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 150 }}
        >
          <div className="absolute inset-0 w-full h-full bg-[var(--cd-noir-0)]">
            <div
              className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
              style={{
                backgroundImage: `url(${MAP_IMAGE_URL})`,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
                filter: altoContraste
                  ? "saturate(0.4) contrast(0.9) brightness(0.45)"
                  : "saturate(1.1) contrast(1.08) brightness(1.05)",
              }}
            />

            <svg
              className="absolute inset-0 w-full h-full z-[3] pointer-events-auto"
              viewBox="0 0 1000 1000"
            >
              <defs>
                <filter id="glow-selected">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="bakelite-relief">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
                  <feSpecularLighting
                    in="blur"
                    surfaceScale="5"
                    specularConstant="0.75"
                    specularExponent="20"
                    lightingColor="#fff"
                    result="light"
                  >
                    <fePointLight x="-5000" y="-10000" z="20000" />
                  </feSpecularLighting>
                  <feComposite in="light" in2="SourceAlpha" operator="in" result="light-in" />
                  <feComposite in="SourceGraphic" in2="light-in" operator="over" />
                </filter>
                <marker
                  id="punta-asalto"
                  viewBox="0 0 12 12"
                  refX="9"
                  refY="6"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 12 6 L 0 12 z" fill="#ff5a4a" stroke="#000" strokeWidth="1" />
                </marker>

                {/* Latón: gradientes de ficha y bisel de sector */}
                <linearGradient id="laton-ficha" x1="0" y1="0" x2="0.4" y2="1">
                  <stop offset="0%" stopColor="#f4dfa6" />
                  <stop offset="45%" stopColor="#c9a24a" />
                  <stop offset="100%" stopColor="#6d4f18" />
                </linearGradient>
                <linearGradient id="laton-canto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffeec4" />
                  <stop offset="100%" stopColor="#8a6a24" />
                </linearGradient>
                {/* Mármol: veta diagonal tenue sobre el color del dueño */}
                <pattern
                  id="veta-marmol"
                  width="26"
                  height="26"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(38)"
                >
                  <rect width="26" height="26" fill="transparent" />
                  <line x1="0" y1="0" x2="0" y2="26" stroke="#fff6dc" strokeOpacity="0.14" strokeWidth="1.4" />
                  <line x1="9" y1="0" x2="9" y2="26" stroke="#000" strokeOpacity="0.18" strokeWidth="2.6" />
                  <line x1="18" y1="0" x2="18" y2="26" stroke="#fff6dc" strokeOpacity="0.07" strokeWidth="0.9" />
                </pattern>
                <radialGradient id="marmol-luz" cx="0.32" cy="0.22" r="0.9">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
                  <stop offset="60%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
                </radialGradient>
              </defs>

              {/* Rutas de contrabando: conexiones punteadas entre sectores vecinos */}
              <g className="pointer-events-none" opacity="0.4">
                {conexiones.map((c) => (
                  <line
                    key={c.id}
                    x1={c.a.x}
                    y1={c.a.y}
                    x2={c.b.x}
                    y2={c.b.y}
                    stroke="#c5a059"
                    strokeWidth={1.6}
                    strokeDasharray="7 6"
                    strokeLinecap="round"
                  />
                ))}
              </g>


              {activeTerritories.map((t) => {
                const conquest = conquests[t.id];
                const pending = pendingDeployment[t.id] || 0;
                const owner = conquest ? players[conquest.ownerId] : null;
                const isSelected = selectedId === t.id;
                const isMine = conquest?.ownerId === currentPlayerIndex;
                const canSeeTroops =
                  isMine ||
                  Object.values(activeEffects).some(
                    (e) => e.type === "informant" && e.ownerId === currentPlayerIndex,
                  );

                const center = t.points.reduce(
                  (acc: Point, p: Point) => ({
                    x: acc.x + (p.x * 10) / t.points.length,
                    y: acc.y + (p.y * 10) / t.points.length,
                  }),
                  { x: 0, y: 0 },
                );

                return (
                  <g
                    key={t.id}
                    className="pointer-events-auto cursor-pointer"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (turnPhase === "deployment" && isMine && unassignedTroops > 0) {
                        assignTroops(t.id, 1);
                        haptics("tap");
                      } else {
                        setSelectedId(t.id);
                        haptics("tap");
                      }
                    }}
                  >
                    {/* Sector en mármol: color del dueño + veta + luz cenital */}
                    <motion.path
                      d={bordeIrregular(t.points, t.id)}
                      initial={false}
                      animate={{
                        fill: owner
                          ? owner.color
                          : BARRIOS.find((b) => b.id === t.barrio)?.color || "#666",
                      }}
                      style={{
                        fillOpacity: isSelected ? 0.6 : owner ? 0.46 : 0.16,
                      }}
                    />
                    <path
                      d={bordeIrregular(t.points, t.id)}
                      fill="url(#veta-marmol)"
                      opacity={0.5}
                      className="pointer-events-none"
                    />
                    <path
                      d={bordeIrregular(t.points, t.id)}
                      fill="url(#marmol-luz)"
                      opacity={0.55}
                      className="pointer-events-none"
                    />

                    {/* Canto de latón: trazo oscuro exterior + filete dorado interior */}
                    <path
                      d={bordeIrregular(t.points, t.id)}
                      fill="none"
                      stroke="#0b0806"
                      strokeWidth={isSelected ? 8 : 6}
                      strokeLinejoin="round"
                      className="pointer-events-none"
                    />
                    <motion.path
                      d={bordeIrregular(t.points, t.id)}
                      fill="none"
                      initial={false}
                      animate={{
                        stroke: isSelected ? "#fff3c4" : isMine ? "#e3c67e" : "#9c7c38",
                        strokeWidth: isSelected ? 3.4 : 2,
                      }}
                      strokeLinejoin="round"
                      filter={isSelected ? "url(#glow-selected)" : "none"}
                      className="pointer-events-none"
                    />
                    <path
                      d={bordeIrregular(t.points, t.id)}
                      fill="none"
                      stroke="#fff8e0"
                      strokeWidth={0.8}
                      strokeOpacity={isMine ? 0.5 : 0.22}
                      strokeDasharray="3 5"
                      className="pointer-events-none"
                    />
                    {/* Cartucho déco con el nombre del sector */}
                    <g
                      transform={`translate(${center.x}, ${center.y - 34}) scale(${Math.min(2.2, Math.max(1, 1 / transform.scale)).toFixed(2)})`}
                      className="pointer-events-none"
                    >
                      {(() => {
                        const w = Math.max(52, t.nombre.length * 6.6 + 18);
                        const h = 17;
                        return (
                          <g>
                            <path
                              d={`M ${-w / 2 + 5} ${-h / 2} H ${w / 2 - 5} L ${w / 2} 0 L ${w / 2 - 5} ${h / 2} H ${-w / 2 + 5} L ${-w / 2} 0 Z`}
                              fill="#0b0806"
                              fillOpacity="0.9"
                              stroke="url(#laton-canto)"
                              strokeWidth="1.2"
                            />
                            <text
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#e9cf94"
                              fontSize="9.5"
                              fontWeight="900"
                              className="font-serif uppercase tracking-[0.18em]"
                            >
                              {t.nombre}
                            </text>
                          </g>
                        );
                      })()}
                    </g>


                    {(conquest || pending > 0) && (
                      <g
                        transform={`translate(${center.x}, ${center.y}) scale(${Math.min(1.8, Math.max(1, 1 / transform.scale)).toFixed(2)})`}
                      >

                        {/* Ficha de latón troquelada con la guarnición */}
                        <motion.g
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.3 }}
                        >
                          <ellipse rx="18" ry="7" cy="14" fill="#000" fillOpacity="0.7" />
                          <circle r="17" fill="#08060c" />
                          <circle r="16" fill="url(#laton-canto)" fillOpacity="0.9" />
                          <circle
                            r="14.5"
                            fill="url(#laton-ficha)"
                            filter="url(#bakelite-relief)"
                          />
                          <circle
                            r="11.5"
                            fill="none"
                            stroke="#3a2a08"
                            strokeOpacity="0.55"
                            strokeWidth="1"
                          />
                          <circle
                            r="9.5"
                            fill={owner?.color || "#1a1410"}
                            fillOpacity={owner ? 0.85 : 0.7}
                            stroke="#2b1f0a"
                            strokeWidth="0.8"
                          />
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#fff3d0"
                            fontSize="15"
                            fontWeight="900"
                            stroke="#000"
                            strokeWidth="3.5"
                            className="font-bebas text-contrast-outline"
                            style={{ paintOrder: "stroke" }}
                          >
                            {canSeeTroops ? (conquest?.troops || 0) + pending : "?"}
                          </text>
                        </motion.g>

                      </g>
                    )}
                  </g>
                );
              })}

              {/* Flecha de asalto: del sector propio que lidera el ataque al objetivo. */}
              {turnPhase === "attack" &&
                attackerId &&
                selectedId &&
                (() => {
                  const centroDe = (id: string) => {
                    const t = activeTerritories.find((x) => x.id === id);
                    if (!t) return null;
                    return t.points.reduce(
                      (acc: Point, p: Point) => ({
                        x: acc.x + (p.x * 10) / t.points.length,
                        y: acc.y + (p.y * 10) / t.points.length,
                      }),
                      { x: 0, y: 0 },
                    );
                  };
                  const a = centroDe(attackerId);
                  const b = centroDe(selectedId);
                  if (!a || !b) return null;
                  return (
                    <g className="pointer-events-none">
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke="#000"
                        strokeWidth={9}
                        strokeOpacity={0.7}
                        strokeLinecap="round"
                      />
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke="#ff5a4a"
                        strokeWidth={4.5}
                        strokeLinecap="round"
                        strokeDasharray="14 8"
                        markerEnd="url(#punta-asalto)"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="22"
                          to="0"
                          dur="0.7s"
                          repeatCount="indefinite"
                        />
                      </line>
                    </g>
                  );
                })()}
            </svg>
          </div>

        </motion.div>
      </main>

      <RunOverlay />
      <ObjetivoCard />

      {/* Estado de la noche roguelike */}
      <div className="fixed right-3 top-[172px] z-[80] flex max-w-[46vw] items-center gap-2 rounded-full border-2 border-[var(--oro)]/60 bg-black/85 px-3 py-1.5 backdrop-blur-md">
        <span className="text-sm text-[var(--oro)]">&#9824;</span>
        <span className="min-w-0">
          <span className="block font-bebas text-sm leading-none text-[var(--oro-palido)]">
            {ola.titulo}
          </span>
          <span className="block truncate text-[11px] font-black uppercase tracking-widest text-[var(--oro)]/80">
            {`Oleada ${runOla}/${OLAS_TOTALES} · meta ${ola.objetivo} · ${runTalismanes.length} talismanes`}
          </span>
        </span>
      </div>

      {/* Reencuadrar el mapa */}
      <button
        onClick={handleRefit}
        aria-label="Reencuadrar mapa"
        className="fixed right-3 top-[236px] z-[85] flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--oro)]/60 bg-black/85 text-[var(--oro)] backdrop-blur-md active:translate-y-[1px] touch-manipulation"
      >
        <Maximize2 size={18} />
      </button>

      {/* HUD de Efectos Activos y Talismanes */}
      <div className="fixed bottom-[210px] right-3 flex max-w-[52vw] flex-col items-end gap-2 pointer-events-none z-[80]">
        {runTalismanes.map((tId: string) => (
          <motion.div
            key={tId}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-black/90 border border-[var(--oro)]/40 px-2 py-1 rounded-md flex items-center gap-2 shadow-lg backdrop-blur-sm"
          >
            <span className="truncate text-[11px] font-black text-[var(--oro-palido)] uppercase tracking-tight">
              {tId.replaceAll("-", " ")}
            </span>
          </motion.div>
        ))}
        {Object.entries(activeEffects)
          .filter(([key]) => !key.startsWith("talisman-"))
          .map(
            ([key, effect]) =>
              effect.ownerId === currentPlayerIndex && (
                <motion.div
                  key={key}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-black/85 border-2 border-[var(--oro)] px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-md"
                >
                  <span className="truncate text-[11px] font-black text-[var(--oro)] uppercase tracking-widest">
                    {effect.type === "bribe"
                      ? "Soborno activo"
                      : effect.type === "informant"
                        ? "Informante activo"
                        : effect.type === "lockdown"
                          ? "Toque de queda"
                          : "Golpe sorpresa"}
                  </span>
                </motion.div>
              ),
          )}
      </div>


      <AnimatePresence>
        {selectedId && selectedTerritory && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 bg-black/95 border-t-4 border-[var(--oro-viejo)] p-5 z-50 rounded-2xl shadow-[0_-12px_60px_rgba(0,0,0,0.95)] ring-1 ring-[var(--oro-viejo)]/20"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20"
                    style={{
                      backgroundColor: BARRIOS.find((b) => b.id === selectedTerritory.barrio)
                        ?.color,
                    }}
                  />
                  <span className="text-[11px] font-black text-[var(--oro-viejo)] uppercase tracking-[0.2em]">
                    {BARRIOS.find((b) => b.id === selectedTerritory.barrio)?.nombre}
                  </span>
                </div>
                <h2 className="font-serif italic font-bold text-3xl text-[var(--crema-brillo)] uppercase leading-none drop-shadow-sm">
                  {selectedTerritory.nombre}
                </h2>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="w-8 h-8 flex items-center justify-center bg-black/40 border border-[var(--oro)]/40 rounded-full text-[var(--oro)] hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {isMine ? (
                <>
                  {turnPhase === "fortification" ? (
                    <div className="col-span-2 space-y-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--oro-viejo)]">
                        {hasMovedFortification
                          ? "Ya reagrupaste este turno"
                          : "Reagrupar: mandá tropas a un sector vecino"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {fortifyTargets.length === 0 && (
                          <span className="text-xs italic text-[var(--crema-clara)]/70">
                            Sin sectores propios vecinos.
                          </span>
                        )}
                        {fortifyTargets.map((vId) => (
                          <button
                            key={vId}
                            onClick={() => {
                              const cantidad = Math.max(
                                1,
                                Math.floor((conquests[selectedId!]?.troops || 1) / 2),
                              );
                              moveTroops(selectedId!, vId, cantidad);
                              haptics("heavy");
                              toast.success(
                                `${cantidad} tropas a ${activeTerritories.find((t) => t.id === vId)?.nombre ?? "vecino"}`,
                              );
                            }}
                            disabled={
                              hasMovedFortification || (conquests[selectedId!]?.troops || 1) <= 1
                            }
                            className="min-h-[44px] rounded-lg border-2 border-[var(--oro-viejo)] bg-black/50 px-3 font-bebas text-base uppercase text-[var(--oro)] disabled:opacity-40 touch-manipulation"
                          >
                            {activeTerritories.find((t) => t.id === vId)?.nombre ?? vId}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => assignTroops(selectedId!, 1)}
                      disabled={unassignedTroops === 0 || turnPhase !== "deployment"}
                      className="col-span-2 min-h-[56px] bg-[var(--oro-viejo)] text-black font-bebas text-xl leading-tight rounded-xl border-[3px] border-black flex items-center justify-center gap-2 px-3 text-center disabled:opacity-50 shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all"
                    >
                      <Plus size={20} className="shrink-0" />
                      <span className="truncate">
                        {unassignedTroops > 0
                          ? `ASIGNAR REFUERZO (${unassignedTroops})`
                          : "SIN REFUERZOS"}
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleSiege}
                    disabled={!canAttack || turnPhase !== "attack"}
                    className={`col-span-2 min-h-[56px] font-bebas text-xl leading-tight rounded-xl border-[3px] border-black flex items-center justify-center gap-2 px-3 transition-all shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none ${canAttack && turnPhase === "attack" ? "bg-red-700 text-white" : "bg-gray-950 text-gray-500 opacity-60"}`}
                  >
                    <Sword size={20} className="shrink-0" />
                    <span className="truncate">
                      {turnPhase !== "attack"
                        ? "NO ES FASE DE ASALTO"
                        : canAttack
                          ? "INICIAR ASALTO"
                          : "FUERA DE ALCANCE"}
                    </span>
                  </button>
                  {attackerId && turnPhase === "attack" && (
                    <p className="col-span-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-[var(--oro-viejo)]">
                      {`Desde ${activeTerritories.find((t) => t.id === attackerId)?.nombre} · ${Math.min(3, (conquests[attackerId]?.troops || 1) - 1)} dados`}
                    </p>
                  )}
                </>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCombatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-[90vw] max-w-sm bg-[var(--cd-noir-2)] border-[4px] border-black p-8 relative shadow-[0_0_80px_rgba(153,27,27,0.6)] rounded-xl"
            >
              <div className="text-center mb-8">
                <h2 className="font-serif italic font-bold text-4xl text-red-100 uppercase italic tracking-tighter drop-shadow-[0_4px_0_#000]">
                  ¡BANDAS EN GUERRA!
                </h2>
                <p className="text-[12px] text-red-500 font-black uppercase tracking-[0.2em]">
                  Disputa en {selectedTerritory?.nombre}
                </p>
              </div>
              <DiceRoller
                rolling={rolling}
                onResult={onDiceResult}
                attackerCount={Math.min(
                  4,
                  Math.max(1, Math.min(3, (conquests[attackerId ?? ""]?.troops || 2) - 1)) +
                    desafioBonus.atk,
                )}

                defenderCount={Math.min(
                  4,
                  Math.min(3, conquests[selectedId!]?.troops || 1) + desafioBonus.def,
                )}
                bribeUsed={bribeActive}
                bribeDice={myFaction.bribeDice}
                attackerTalismanes={currentPlayerIndex === 0 ? runTalismanesList : []}
                defenderTalismanes={conquests[selectedId!]?.ownerId === 0 ? runTalismanesList : []}
              />
              {(desafioBonus.atk > 0 || desafioBonus.def > 0) && (
                <p
                  className={`mt-4 text-center font-bebas text-xl uppercase drop-shadow-[0_2px_0_#000] ${desafioBonus.atk > 0 ? "text-[var(--oro)]" : "text-red-400"}`}
                >
                  {desafioBonus.atk > 0
                    ? "Mesa ganada · +1 dado de asalto"
                    : "Mesa perdida · +1 dado al defensor"}
                </p>
              )}
              <div className="mt-8 flex gap-4">
                {!rolling ? (
                  <>
                    <button
                      onClick={() => setIsCombatOpen(false)}
                      className="flex-1 min-h-[48px] border-2 border-red-900 text-red-300 font-bebas text-lg uppercase rounded-lg touch-manipulation"
                    >
                      RETIRADA
                    </button>
                    <button
                      onClick={() => setRolling(true)}
                      className="flex-[2] min-h-[48px] bg-red-900 text-white font-bebas text-xl uppercase border-2 border-black rounded-lg touch-manipulation"
                    >
                      LANZAR DADOS
                    </button>
                  </>
                ) : (
                  <div className="w-full py-4 text-center text-red-100 italic animate-pulse font-serif text-sm">
                    Decidiendo el destino del barrio...
                  </div>
                )}
              </div>
              {!rolling && desafioBonus.atk === 0 && desafioBonus.def === 0 && (
                <button
                  onClick={() => {
                    setDesafioOpen(true);
                    haptics("tap");
                  }}
                  className="mt-3 w-full min-h-[48px] rounded-lg border-2 border-[var(--oro-viejo)] bg-black/40 font-bebas text-lg uppercase text-[var(--oro)] touch-manipulation"
                >
                  Sentarse a la mesa del barrio
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TurnBanner
        playerName={currentPlayer?.name ?? "Sindicato"}
        playerColor={currentPlayer?.color ?? "var(--cd-gold-mid)"}
        factionId={currentPlayer?.faction}
        isBot={!!currentPlayer?.isBot}
        phase={turnPhase}
        unassignedTroops={unassignedTroops}
        pendingTroops={pendingTroops}
        territories={controlCounts[currentPlayerIndex] || 0}
        totalTerritories={activeTerritories.length}
        cards={myCards.length}
      />

      <ControlBar
        players={players}
        counts={controlCounts}
        total={activeTerritories.length}
        currentPlayerId={currentPlayerIndex}
      />

      <BarriosPanel
        territories={activeTerritories}
        conquests={conquests}
        myPlayerId={0}
        myColor={players[0]?.color ?? "var(--cd-gold-mid)"}
      />

      <ActionDock
        phase={turnPhase}
        unassignedTroops={unassignedTroops}
        pendingTroops={pendingTroops}
        cardsCount={myCards.length}
        locked={!!currentPlayer?.isBot || !!winner}
        onConfirmDeploy={() => {
          confirmDeployment();
          haptics("heavy");
          toast.success("Tropas desplegadas.");
        }}
        onCancelDeploy={() => {
          cancelDeployment();
          haptics("tap");
        }}
        onAdvance={() => {
          if (turnPhase === "deployment" && pendingTroops > 0) confirmDeployment();
          nextTurn();
          setSelectedId(null);
          haptics("heavy");
        }}
        onOpenCards={() => {
          setIsCardsOpen(true);
          haptics("tap");
        }}
      />

      <AnimatePresence>
        {isCardsOpen && (
          <TacticalCardsModal
            cards={myCards}
            factionId={currentPlayer?.faction}
            onTrade={(ids) => {
              tradeCards(currentPlayerIndex, ids);
              setIsCardsOpen(false);
              haptics("heavy");
              toast.success("Canje exitoso.");
            }}
            onPlaySpecial={(cardId) => {
              const card = myCards.find((c) => c.id === cardId);
              if (!card) return;
              if ((card.type === "surprise" || card.type === "informant") && !selectedId) {
                toast.error("Selecciona un territorio primero");
                return;
              }
              playSpecialCard(cardId, selectedId || undefined);
              setIsCardsOpen(false);
              haptics("heavy");
              toast.success(`Operación ${card.type} iniciada`);
            }}
            onClose={() => setIsCardsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {desafioOpen && selectedTerritory && (
          <DesafioDeMesa
            barrio={selectedTerritory.barrio}
            territorio={selectedTerritory.nombre}
            onResuelto={(gano) => {
              setDesafioBonus(gano ? { atk: 1, def: 0 } : { atk: 0, def: 1 });
              setDesafioOpen(false);
              haptics(gano ? "heavy" : "tap");
              if (gano) toast.success("Ganaste la mano: un dado más en el asalto.");
              else toast.error("Perdiste la mano: el defensor suma un dado.");
            }}
            onCerrar={() => setDesafioOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
