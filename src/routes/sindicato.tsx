import { RASGO_POR_ID, dadosDefensa } from "@/lib/sindicato-rasgos";
import { normalizarReglas } from "@/lib/sindicato-variantes";
import { VARIANTE_NOMBRE } from "@/lib/sindicato-map-gen";
import { useCasino } from "@/store/casino";
import { useSyndicate, puedeAsaltar } from "@/store/syndicate";
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
import { PlacaDeTurno } from "@/components/casino/sindicato/PlacaDeTurno";
import {
  ConquistaFlash,
  type ConquistaAviso,
} from "@/components/casino/sindicato/ConquistaFlash";
import { faccionDe } from "@/lib/sindicato-facciones";
import {
  PATRONES_TABLERO,
  patronDeDueno,
  patronDeFaccion,
  varianteDeDueno,
} from "@/lib/sindicato-texturas";
import { configOla, OLAS_TOTALES } from "@/lib/sindicato-run";
import { ObjetivoCard } from "@/components/casino/sindicato/ObjetivoCard";
import { RunOverlay } from "@/components/casino/sindicato/RunOverlay";
import {
  SindicatoSorteo,
  type SorteoResultado,
} from "@/components/casino/SindicatoSorteo";

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
  Contrast,
  Minimize2,
  X,
  Plus,
} from "lucide-react";

// --- Visual Constants ---
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 1000;
const INITIAL_SCALE = 1.0;
const MIN_SCALE = 0.25;
/** Margen de seguridad del encuadre: el tablero nunca roza el borde en Android. */
const FIT_MARGIN = 0.9;
const CONTENT_BOX_GEN = (territorios: Territorio[]) => {
  const xs = territorios.flatMap((t) => t.points.map((p) => p.x * 10));
  const ys = territorios.flatMap((t) => t.points.map((p) => p.y * 10));
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  return {
    width: maxX - minX,
    height: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    minX,
    maxX,
    minY,
    maxY,
  };
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
    roundNumber,
    winner,
    botPlay,
    drawCard,
    tradeCards,
    playSpecialCard,
    activeEffects,
    activeTerritories,
    hasMovedFortification,
    sectorRasgos,
    mapaVariante,

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
  /** Sector propio elegido como cabecera del asalto (paso 1 de 2). */
  const [attackFrom, setAttackFrom] = useState<string | null>(null);
  /** Panel plegable con barrios, control y objetivo: libera pantalla. */
  const [infoOpen, setInfoOpen] = useState(false);
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
  /** Aviso de sector tomado y racha de conquistas del turno. */
  const [aviso, setAviso] = useState<ConquistaAviso | null>(null);
  const rachaRef = useRef(0);
  const [sacudon, setSacudon] = useState(0);
  /** Previsualización de arte: pinta todo el tablero con la textura de un dueño. */
  const [isCardsOpen, setIsCardsOpen] = useState(false);
  const [lastConflictId, setLastConflictId] = useState<string | null>(null);
  const [fitScale, setFitScale] = useState(INITIAL_SCALE);

  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  /** Alto real del HUD superior: se mide para que el mapa nunca quede tapado. */
  const [hudH, setHudH] = useState(186);

  useEffect(() => {
    const el = hudRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setHudH(Math.round(el.getBoundingClientRect().height)));
    ro.observe(el);
    setHudH(Math.round(el.getBoundingClientRect().height));
    return () => ro.disconnect();
  }, []);

  const territoriesKey = useMemo(
    () => activeTerritories.map((t) => t.id).join("|"),
    [activeTerritories],
  );

  /** Límites reales del área jugable: usados para que ningún cartucho se salga. */
  const lienzo = useMemo(() => CONTENT_BOX_GEN(activeTerritories), [activeTerritories]);

  const computeFit = useCallback(() => {
    // Espacio real reservado arriba (HUD medido) y abajo por el dock de acciones.
    const HEADER = Math.max(120, hudH + 8);
    const NAVBAR = 148;
    // Columna de botones flotantes a la derecha: se descuenta para que ningún
    // cartucho del mapa quede tapado por ellos.
    const GUTTER = 64;
    const w = Math.max(200, window.innerWidth - GUTTER);
    const h = Math.max(240, window.innerHeight - HEADER - NAVBAR);
    // Encuadre sobre el area jugable real (no sobre el lienzo de 1000x1000).
    const pad = 10;
    const contentBox = CONTENT_BOX_GEN(activeTerritories);
    const cw = contentBox.width + pad * 2;
    const ch = contentBox.height + pad * 2;
    // El area jugable entera entra en pantalla con margen: nunca roza el borde.
    const base = Math.min(w / cw, h / ch) * FIT_MARGIN;
    const s = Math.min(MAX_SCALE, base);

    setFitScale(s);
    const ox = (contentBox.cx - MAP_WIDTH / 2) * s;
    const oy = (contentBox.cy - MAP_HEIGHT / 2) * s;
    setTransform({ x: -ox - GUTTER / 2, y: -oy + (HEADER - NAVBAR) / 2, scale: s });
  }, [activeTerritories, hudH]);

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

  // La mesa arranca recién cuando el jugador elige color y sortea el orden.
  const empezarConSorteo = useCallback(
    (r: SorteoResultado) => {
      startGame(
        ola.rivales,
        r.color,
        ola.ventajaBot,
        ola.mapSeed,
        ola.sectores,
        { turnOrder: r.turnOrder, dados: r.dados },
        r.reglas,
      );

    },
    [startGame, ola],
  );


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


  // Sector propio que lidera el asalto: primero el que eligió el jugador, si sirve.
  const attackerId = useMemo(() => {
    if (!selectedId || !currentPlayer) return null;
    if (attackFrom && useSyndicate.getState().canAttack(attackFrom, selectedId)) return attackFrom;
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
  }, [selectedId, currentPlayerIndex, conquests, activeTerritories, currentPlayer, attackFrom]);

  const canAttack = !!attackerId;

  /** Sectores enemigos alcanzables desde la cabecera elegida. */
  const objetivosValidos = useMemo(() => {
    if (turnPhase !== "attack" || !attackFrom) return new Set<string>();
    const t = activeTerritories.find((x) => x.id === attackFrom);
    if (!t) return new Set<string>();
    const st = useSyndicate.getState();
    return new Set(t.vecinos.filter((v) => st.canAttack(attackFrom, v)));
  }, [turnPhase, attackFrom, activeTerritories, conquests]);

  // Vecinos propios para el reagrupe (mover tropas al final del turno).
  const fortifyTargets = useMemo(() => {
    if (!selectedId || !isMine) return [];
    const territory = activeTerritories.find((t) => t.id === selectedId);
    if (!territory) return [];
    return territory.vecinos.filter((v) => conquests[v]?.ownerId === currentPlayerIndex);
  }, [selectedId, isMine, activeTerritories, conquests, currentPlayerIndex]);


  const handleSiege = useCallback(() => {
    const activeBribe = Object.values(useSyndicate.getState().activeEffects).find(
      (e) => e.type === "bribe" && e.ownerId === currentPlayerIndex,
    );
    setBribeActive(!!activeBribe);
    setDesafioBonus({ atk: 0, def: 0 });
    setIsCombatOpen(true);
    haptics("heavy");
  }, [currentPlayerIndex, haptics]);

  /**
   * Un solo gesto para todo: tocar un sector hace lo que corresponde a la fase.
   * Despliegue -> pone una ficha en lo tuyo. Asalto -> elegís cabecera y luego blanco.
   */
  const handleSectorTap = useCallback(
    (id: string) => {
      const st = useSyndicate.getState();
      if (st.players[st.currentPlayerIndex]?.isBot || st.winner) return;
      const c = st.conquests[id];
      const mine = c?.ownerId === st.currentPlayerIndex;

      if (st.turnPhase === "deployment") {
        if (mine && st.unassignedTroops > 0) {
          st.assignTroops(id, 1);
          haptics("tap");
          return;
        }
        setSelectedId(id);
        haptics("tap");
        return;
      }

      if (st.turnPhase === "attack") {
        if (mine) {
          if ((c?.troops ?? 0) > 1) {
            setAttackFrom(id);
            setSelectedId(null);
            haptics("tap");
          } else {
            setSelectedId(id);
            toast.error("Ese sector necesita al menos 2 tropas para salir al asalto.");
          }
          return;
        }
        if (attackFrom && st.canAttack(attackFrom, id)) {
          setSelectedId(id);
          handleSiege();
          return;
        }
        setSelectedId(id);
        haptics("tap");
        return;
      }

      setSelectedId(id);
      haptics("tap");
    },
    [attackFrom, haptics, handleSiege],
  );

  // La cabecera de asalto se limpia al cambiar de fase o de mano.
  useEffect(() => {
    setAttackFrom(null);
  }, [turnPhase, currentPlayerIndex]);

  // La racha de conquistas vive dentro del turno.
  useEffect(() => {
    rachaRef.current = 0;
  }, [currentPlayerIndex]);

  // El cartel de conquista se retira solo.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 1700);
    return () => clearTimeout(t);
  }, [aviso]);

  // Sacudón corto del tablero al tomar un sector (sobrio, sin marear).
  useEffect(() => {
    if (!sacudon) return;
    const el = containerRef.current;
    if (!el) return;
    el.classList.remove("sindicato-sacudon");
    void el.offsetWidth;
    el.classList.add("sindicato-sacudon");
    const t = setTimeout(() => el.classList.remove("sindicato-sacudon"), 360);
    return () => clearTimeout(t);
  }, [sacudon]);

  /** Texto guía: siempre dice el próximo paso concreto. */
  const guia = useMemo(() => {
    if (currentPlayer?.isBot) return "Juega el rival…";
    if (turnPhase === "deployment")
      return unassignedTroops > 0
        ? `Tocá tus sectores (borde blanco) para poner ${unassignedTroops} fichas`
        : pendingTroops > 0
          ? "Confirmá el despliegue abajo"
          : "Sin refuerzos: pasá al asalto";
    if (turnPhase === "attack") {
      if (!puedeAsaltar(roundNumber)) return "Vuelta de acomodo: todavía no se asalta";
      if (!attackFrom) return "Tocá un sector tuyo con 2+ tropas para atacar desde ahí";
      return objetivosValidos.size > 0
        ? "Ahora tocá un sector enemigo marcado en rojo"
        : "Ese sector no tiene vecinos enemigos: elegí otro";
    }
    if (turnPhase === "fortification") return "Reagrupá: tocá un sector tuyo y mandá tropas al vecino";
    return "";
  }, [
    currentPlayer?.isBot,
    turnPhase,
    unassignedTroops,
    pendingTroops,
    roundNumber,
    attackFrom,
    objetivosValidos,
  ]);
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

      const dadosAtaque = Math.min(reglasMesa.maxDadosAtaque, atacante.troops - 1);
      const bajasAtacante = Math.min(aLoss, Math.max(0, atacante.troops - 1));
      const bajasDefensor = Math.min(dLoss, defensor.troops);

      updateTroops(attackerId, -bajasAtacante);
      const defensorRestante = defensor.troops - bajasDefensor;

      if (defensorRestante <= 0) {
        const disponibles = atacante.troops - bajasAtacante - 1;
        const mueve = Math.max(1, Math.min(disponibles, dadosAtaque));
        updateTroops(attackerId, -mueve);
        conquerTerritory(selectedId, mueve, currentPlayerIndex);
        const naipesAntes = useSyndicate.getState().players[currentPlayerIndex]?.cards.length ?? 0;
        drawCard(currentPlayerIndex);
        const naipeNuevo =
          (useSyndicate.getState().players[currentPlayerIndex]?.cards.length ?? 0) > naipesAntes;

        // Moneda Doblada: +25 fichas por sector conquistado
        let fichas = 0;
        if (currentPlayerIndex === 0 && runTalismanesList.includes("moneda-doblada")) {
          useCasino.getState().addChips(25);
          fichas = 25;
        }

        haptics("heavy");
        setIsCombatOpen(false);
        setLastConflictId(selectedId);

        if (currentPlayerIndex === 0) {
          // Golpe propio: cartel de conquista, racha y un sacudón corto del tablero.
          rachaRef.current += 1;
          const nombre =
            activeTerritories.find((t) => t.id === selectedId)?.nombre ?? "Sector sin nombre";
          setAviso({
            key: Date.now(),
            sector: nombre,
            racha: rachaRef.current,
            fichas: fichas || undefined,
            naipe: naipeNuevo,
          });
          setSacudon((n) => n + 1);
        }
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
        .safe-pt { padding-top: max(1rem, var(--sa-top)); }
        .safe-pb { padding-bottom: max(1rem, var(--sa-bottom)); }
        body { overflow: hidden; position: fixed; width: 100%; height: 100%; overscroll-behavior: none; }
        @keyframes sindicato-sacudon {
          0% { transform: translate3d(0,0,0); }
          25% { transform: translate3d(-3px,2px,0); }
          55% { transform: translate3d(3px,-2px,0); }
          100% { transform: translate3d(0,0,0); }
        }
        .sindicato-sacudon { animation: sindicato-sacudon 0.34s ease-out; }
        @media (prefers-reduced-motion: reduce) { .sindicato-sacudon { animation: none; } }
      `,
        }}
      />

      <main
        ref={containerRef}
        data-pannable
        className="fixed inset-0 z-0 w-screen h-dvh touch-none bg-[var(--cd-noir-2)] overflow-hidden"
        onPointerDown={(e) => {
          if ((e.target as Element).closest("g.pointer-events-auto")) return;
          if (e.button !== 0) return;
          // No capturar el corredor de gestos del sistema (back swipe lateral).
          const edge = 16;
          if (e.clientX <= edge || e.clientX >= window.innerWidth - edge) return;
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

                {/* Arte raster: una textura pintada por facción + mármol neutro + latón */}
                {PATRONES_TABLERO.map((p) => (
                  <pattern
                    key={p.id}
                    id={p.id}
                    width="220"
                    height="220"
                    patternUnits="userSpaceOnUse"
                  >
                    <image href={p.href} width="220" height="220" preserveAspectRatio="xMidYMid slice" />
                  </pattern>
                ))}

                {/* Variante de arte por propietario: mismo lenguaje en todos sus barrios */}
                {players.map((p, i) => {
                  const v = varianteDeDueno(i, p.faction, p.color);
                  const tile = 220 * v.escala;
                  return (
                    <pattern
                      key={v.id}
                      id={v.id}
                      width={tile}
                      height={tile}
                      patternUnits="userSpaceOnUse"
                      patternTransform={`rotate(${v.rotacion})`}
                    >
                      <image
                        href={v.href}
                        width={tile}
                        height={tile}
                        preserveAspectRatio="xMidYMid slice"
                      />
                      <rect width={tile} height={tile} fill={v.color} opacity={v.tinte} />
                    </pattern>
                  );
                })}

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
                const esOrigen = attackFrom === t.id;
                const esObjetivo = objetivosValidos.has(t.id);
                const puedeRecibir =
                  turnPhase === "deployment" && isMine && unassignedTroops > 0;
                const d = bordeIrregular(t.points, t.id);
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
                    className="cursor-pointer"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handleSectorTap(t.id);
                    }}
                  >
                    {/* Zona táctil: todo el sector responde al toque, no sólo la ficha. */}
                    <path d={d} fill="#fff" fillOpacity={0.001} className="pointer-events-auto" />

                    {/* Sector: arte raster propio del dueño (o de la facción si es neutral) */}
                    <path
                      d={d}
                      fill={
                        (conquest ? patronDeDueno(conquest.ownerId) : null) ??
                        patronDeFaccion(owner?.faction)
                      }

                      fillOpacity={
                        altoContraste
                          ? isSelected
                            ? 0.98
                            : owner
                              ? 0.92
                              : 0.7
                          : isSelected
                            ? 0.72
                            : owner
                              ? 0.58
                              : 0.3
                      }
                      className="pointer-events-none"
                    />
                    <motion.path
                      d={d}
                      initial={false}
                      animate={{
                        fill: owner
                          ? owner.color
                          : BARRIOS.find((b) => b.id === t.barrio)?.color || "#666",
                      }}
                      style={{
                        fillOpacity: altoContraste
                          ? isSelected
                            ? 0.5
                            : owner
                              ? 0.42
                              : 0.2
                          : isSelected
                            ? 0.34
                            : owner
                              ? 0.24
                              : 0.12,
                      }}
                      className="pointer-events-none"
                    />

                    {/* Canto de latón raster: trazo oscuro exterior + filete de latón */}
                    <path
                      d={d}
                      fill="none"
                      stroke="#0b0806"
                      strokeWidth={altoContraste ? (isSelected ? 10 : 8) : isSelected ? 8 : 6}
                      strokeLinejoin="round"
                      className="pointer-events-none"
                    />
                    <motion.path
                      d={d}
                      fill="none"
                      stroke="url(#tex-laton)"
                      initial={false}
                      animate={{
                        strokeWidth: altoContraste
                          ? isSelected
                            ? 5
                            : 3.4
                          : isSelected
                            ? 3.4
                            : 2,
                        strokeOpacity: isSelected ? 1 : isMine ? 0.95 : 0.7,
                      }}
                      strokeLinejoin="round"
                      filter={isSelected ? "url(#glow-selected)" : "none"}
                      className="pointer-events-none"
                    />

                    {/* Lo tuyo se lee de un golpe: filete blanco marcado en tus sectores. */}
                    <path
                      d={d}
                      fill="none"
                      stroke="#fff8e0"
                      strokeWidth={isMine ? 2.4 : 0.8}
                      strokeOpacity={isMine ? 0.95 : 0.18}
                      strokeDasharray={isMine ? undefined : "3 5"}
                      className="pointer-events-none"
                    />

                    {/* Sector propio listo para recibir fichas en el despliegue. */}
                    {puedeRecibir && (
                      <path
                        d={d}
                        fill="none"
                        stroke="#8de89b"
                        strokeWidth={3.2}
                        strokeDasharray="10 8"
                        className="pointer-events-none"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="18"
                          to="0"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </path>
                    )}

                    {/* Cabecera del asalto elegida por el jugador. */}
                    {esOrigen && (
                      <path
                        d={d}
                        fill="none"
                        stroke="#ffe9a8"
                        strokeWidth={4.5}
                        strokeDasharray="14 9"
                        className="pointer-events-none"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="23"
                          to="0"
                          dur="0.8s"
                          repeatCount="indefinite"
                        />
                      </path>
                    )}

                    {/* Blancos válidos desde esa cabecera. */}
                    {esObjetivo && (
                      <path
                        d={d}
                        fill="none"
                        stroke="#ff5a4a"
                        strokeWidth={4}
                        strokeOpacity={0.95}
                        className="pointer-events-none"
                      >
                        <animate
                          attributeName="stroke-opacity"
                          values="0.4;1;0.4"
                          dur="1.1s"
                          repeatCount="indefinite"
                        />
                      </path>
                    )}

                    {/* Última plaza disputada: brasa de latón que respira. */}
                    {lastConflictId === t.id && (
                      <path
                        d={d}
                        fill="none"
                        stroke="#ffd98a"
                        strokeWidth={3}
                        className="pointer-events-none"
                      >
                        <animate
                          attributeName="stroke-opacity"
                          values="0.75;0.15;0.75"
                          dur="2.2s"
                          repeatCount="indefinite"
                        />
                      </path>
                    )}



                    {/* Cartucho déco con el nombre del sector */}
                    {(() => {
                      const esc = Math.min(2.2, Math.max(1, 1 / transform.scale));
                      const marca = sectorRasgos[t.id]
                        ? RASGO_POR_ID[sectorRasgos[t.id]].icono
                        : "";
                      const w = Math.max(52, t.nombre.length * 6.6 + 18);
                      const h = 17;
                      // El cartucho se mantiene dentro del área jugable visible
                      // (no solo del lienzo) en cualquier zoom y tamaño de pantalla.
                      const medioX = (w / 2) * esc + 4;
                      const medioY = (h / 2) * esc + 4;
                      const limX0 = Math.max(0, lienzo.minX) + medioX;
                      const limX1 = Math.min(MAP_WIDTH, lienzo.maxX) - medioX;
                      const limY0 = Math.max(0, lienzo.minY) + medioY;
                      const limY1 = Math.min(MAP_HEIGHT, lienzo.maxY) - medioY;
                      const cx =
                        limX1 > limX0
                          ? Math.min(limX1, Math.max(limX0, center.x))
                          : (limX0 + limX1) / 2;
                      const cyRaw = center.y - 34 * esc;
                      const cy =
                        limY1 > limY0
                          ? Math.min(limY1, Math.max(limY0, cyRaw))
                          : (limY0 + limY1) / 2;
                      return (
                        <g
                          transform={`translate(${cx}, ${cy}) scale(${esc.toFixed(2)})`}
                          className="pointer-events-none"
                        >
                          <g>
                            <path
                              d={`M ${-w / 2 + 5} ${-h / 2} H ${w / 2 - 5} L ${w / 2} 0 L ${w / 2 - 5} ${h / 2} H ${-w / 2 + 5} L ${-w / 2} 0 Z`}
                              fill="#0b0806"
                              fillOpacity={altoContraste ? 1 : 0.9}

                              stroke="url(#tex-laton)"
                              strokeWidth={altoContraste ? 1.8 : 1.2}
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
                            {marca && (
                              <text
                                x={-w / 2 - 7}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#e9cf94"
                                fontSize="10"
                                fontWeight="900"
                              >
                                {marca}
                              </text>
                            )}
                          </g>
                        </g>
                      );
                    })()}



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
                          <circle r="16" fill="url(#tex-laton)" fillOpacity="0.95" />
                          <circle
                            r="14.5"
                            fill="url(#tex-laton)"
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

      {enRun && !gameStarted && (
        <SindicatoSorteo playerCount={ola.rivales} onStart={empezarConSorteo} />
      )}


      {/* Controles flotantes: siempre por debajo del HUD medido */}
      <div
        className="fixed right-3 z-[85] flex flex-col items-end gap-2"
        style={{ top: hudH + 8 }}
      >
        <button
          onClick={handleRefit}
          aria-label="Reencuadrar mapa"
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--oro)]/60 bg-black/85 text-[var(--oro)] backdrop-blur-md active:translate-y-[1px] touch-manipulation"
        >
          <Maximize2 size={18} />
        </button>

        {/* Alto contraste: apaga el arte de fondo y refuerza sectores y cartuchos */}
        <button
          onClick={() => {
            setAltoContraste((v) => !v);
            haptics("tap");
          }}
          aria-label={altoContraste ? "Desactivar alto contraste" : "Activar alto contraste"}
          aria-pressed={altoContraste}
          className={`flex h-11 w-11 items-center justify-center rounded-full border-2 backdrop-blur-md active:translate-y-[1px] touch-manipulation ${
            altoContraste
              ? "border-[var(--oro-palido)] bg-[var(--oro)]/25 text-[var(--oro-palido)]"
              : "border-[var(--oro)]/60 bg-black/85 text-[var(--oro)]"
          }`}
        >
          <Contrast size={18} />
        </button>
      </div>


      {/* Efectos activos: una sola fila discreta, sin tapar el tablero. */}
      {(() => {
        const efectos = Object.entries(activeEffects)
          .filter(([key, e]) => !key.startsWith("talisman-") && e.ownerId === currentPlayerIndex)
          .map(([key, e]) =>
            e.type === "bribe"
              ? "Soborno"
              : e.type === "informant"
                ? "Informante"
                : e.type === "lockdown"
                  ? "Toque de queda"
                  : "Golpe sorpresa",
          );
        const etiquetas = [...runTalismanes.map((t: string) => t.replaceAll("-", " ")), ...efectos];
        if (etiquetas.length === 0) return null;
        return (
          <div className="pointer-events-none fixed bottom-[176px] left-2 right-2 z-[60] flex gap-1.5 overflow-hidden">
            {etiquetas.slice(0, 3).map((label) => (
              <span
                key={label}
                className="truncate rounded-full border border-[var(--oro)]/40 bg-black/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[var(--oro-palido)] backdrop-blur-sm"
              >
                {label}
              </span>
            ))}
            {etiquetas.length > 3 ? (
              <span className="shrink-0 rounded-full border border-[var(--oro)]/40 bg-black/80 px-2 py-0.5 text-[10px] font-black text-[var(--oro-palido)]">
                +{etiquetas.length - 3}
              </span>
            ) : null}
          </div>
        );
      })()}


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
                {sectorRasgos[selectedTerritory.id] && (
                  <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--oro)]/90">
                    {RASGO_POR_ID[sectorRasgos[selectedTerritory.id]].icono}{" "}
                    {RASGO_POR_ID[sectorRasgos[selectedTerritory.id]].nombre}
                    <span className="block normal-case tracking-normal text-[10px] text-[var(--crema-brillo)]/70 font-medium">
                      {RASGO_POR_ID[sectorRasgos[selectedTerritory.id]].desc}
                    </span>
                  </p>
                )}
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
                      {!puedeAsaltar(roundNumber)
                        ? "VUELTA DE ACOMODO"
                        : turnPhase !== "attack"
                        ? "NO ES FASE DE ASALTO"
                        : canAttack
                          ? "INICIAR ASALTO"
                          : "FUERA DE ALCANCE"}
                    </span>
                  </button>
                  {attackerId && turnPhase === "attack" && (
                    <p className="col-span-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-[var(--oro-viejo)]">
                      {`Desde ${activeTerritories.find((t) => t.id === attackerId)?.nombre} · ${Math.min(reglasMesa.maxDadosAtaque, (conquests[attackerId]?.troops || 1) - 1)} dados`}
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
                  Math.max(
                    1,
                    Math.min(
                      reglasMesa.maxDadosAtaque,
                      (conquests[attackerId ?? ""]?.troops || 2) - 1,
                    ),
                  ) +
                    desafioBonus.atk,
                )}

                defenderCount={Math.min(
                  4,
                  Math.min(
                    reglasMesa.maxDadosDefensa,
                    dadosDefensa(conquests[selectedId!]?.troops || 1, sectorRasgos[selectedId!]),
                  ) +
                    desafioBonus.def,
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

      {/* HUD superior: una sola columna medida, así nada se solapa en ninguna pantalla. */}
      <div ref={hudRef} className="pointer-events-none fixed inset-x-0 top-0 z-[70]">
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
          round={roundNumber}
          canAssault={puedeAsaltar(roundNumber)}
        />

        {/* Guía de una línea: siempre dice qué hacer ahora. */}
        <div className="mt-1.5 flex items-center gap-2 px-2">
          <p className="pointer-events-none min-w-0 flex-1 truncate rounded-xl border border-[var(--oro)]/40 bg-black/85 px-3 py-1.5 font-bebas text-base leading-none text-[var(--oro-palido)] backdrop-blur-md">
            {guia}
          </p>
          {mapaVariante && (
            <span className="pointer-events-none hidden shrink-0 rounded-xl border border-[var(--oro)]/30 bg-black/85 px-2 py-1.5 font-bebas text-xs uppercase leading-none tracking-[0.12em] text-[var(--oro)]/80 backdrop-blur-md xs:inline-block">
              {VARIANTE_NOMBRE[mapaVariante]}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setInfoOpen((v) => !v);
              haptics("tap");
            }}
            aria-label="Ver barrios, control y objetivo"
            aria-pressed={infoOpen}
            className={`pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 backdrop-blur-md touch-manipulation ${
              infoOpen
                ? "border-[var(--oro-palido)] bg-[var(--oro)]/25 text-[var(--oro-palido)]"
                : "border-[var(--oro)]/50 bg-black/85 text-[var(--oro)]"
            }`}
          >
            <Info size={16} />
          </button>
        </div>

        <AnimatePresence>
          {infoOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
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

              <div className="mt-1.5 flex items-start gap-2 px-2">
                <ObjetivoCard />
                <div className="pointer-events-none flex max-w-[46%] shrink-0 items-center gap-2 rounded-2xl border-2 border-[var(--oro)]/60 bg-black/85 px-3 py-2 backdrop-blur-md">
                  <span className="text-sm text-[var(--oro)]">&#9824;</span>
                  <span className="min-w-0">
                    <span className="block truncate font-bebas text-sm leading-none text-[var(--oro-palido)]">
                      {ola.titulo}
                    </span>
                    <span className="block truncate text-[11px] font-black uppercase tracking-widest text-[var(--oro)]/80">
                      {`Oleada ${runOla}/${OLAS_TOTALES} · meta ${ola.objetivo}`}
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Placa de turno noir y cartel de conquista. */}
      {currentPlayer && !winner ? (
        <PlacaDeTurno
          playerIndex={currentPlayerIndex}
          name={currentPlayer.name ?? "Sindicato"}
          color={currentPlayer.color ?? "var(--cd-gold-mid)"}
          factionId={currentPlayer.faction}
          isBot={!!currentPlayer.isBot}
          round={roundNumber}
          canAssault={puedeAsaltar(roundNumber)}
        />
      ) : null}
      <ConquistaFlash aviso={aviso} />


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
