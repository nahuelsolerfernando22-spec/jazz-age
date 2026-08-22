import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BARRIOS,
  TERRITORIOS_POR_BARRIO,
  TERRITORIOS_POR_ID,
  TERRITORIOS,
  sonVecinos,
  type Territorio,
} from "@/lib/sindicato-data";
import { FACCIONES, faccionDe, type FactionId } from "@/lib/sindicato-facciones";
import { generateSubMap, type VarianteMapa } from "@/lib/sindicato-map-gen";
import {
  bonosDeRasgos,
  dadosDefensa,
  RASGO_POR_ID,
  type MapaRasgos,
  type RasgoId,
} from "@/lib/sindicato-rasgos";
import {
  NIVEL_TUNING,
  amenaza,
  debeCanjear,
  mejorAsalto,
  planDeployment,
  planFortify,
  tuningDe,
  type AiBoard,
  type AiNivel,
} from "@/lib/sindicato-ai";
import { useCasino } from "@/store/casino";
import {
  evaluarObjetivo,
  repartirObjetivos,
  type Objetivo,
  type ProgresoObjetivo,
} from "@/lib/sindicato-objetivos";

export type SpecialCardType = "bribe" | "informant" | "surprise" | "lockdown";

export interface SyndicateCard {
  id: string;
  territoryId: string;
  symbol: "infantry" | "cavalry" | "artillery" | "wildcard";
  type?: SpecialCardType;
  artUrl: string;
}

export interface TerritoryConquest {
  id: string;
  conqueredAt: number;
  revenueCollectedAt: number;
  troops: number;
  ownerId: number;
}

interface Player {
  id: number;
  name: string;
  color: string;
  isBot: boolean;
  cards: SyndicateCard[];
  eliminated: boolean;
  avatar: string;
  chips: number;
  faction: FactionId;
}

interface SyndicateState {
  players: Player[];
  currentPlayerIndex: number;
  conquests: Record<string, TerritoryConquest>;
  activeTerritories: Territorio[];
  lastRevenueCheck: number;
  unassignedTroops: number;
  secretObjective: {
    type: "conquer" | "destroy";
    target: string;
    completed: boolean;
    desc?: string;
  } | null;
  turnPhase: "setup" | "deployment" | "attack" | "fortification";
  gameStarted: boolean;
  winner: Player | null;
  pendingDeployment: Record<string, number>;
  activeEffects: Record<string, { type: SpecialCardType; expiresAt: number; ownerId: number }>;

  deck: SyndicateCard[];
  hasMovedFortification: boolean;
  assaultsThisTurn: number;
  /** Marcas de sector de la ciudad de esta noche. */
  sectorRasgos: MapaRasgos;
  /** Forma que tomó la ciudad al generarse. */
  mapaVariante: VarianteMapa | null;
  /** Pares de sectores unidos por túnel. */
  tuneles: Array<[string, string]>;
  /** Rencor: cuántos golpes le debe cada capo a cada rival. */
  rencor: Record<number, Record<number, number>>;
  /** Cabeza de los capos rivales: matón, capo o consejero. */
  aiNivel: AiNivel;
  setAiNivel: (n: AiNivel) => void;
  tradeCount: number;

  /** Objetivo tapado de cada capo (id de jugador -> objetivo). */
  objectives: Record<number, Objetivo>;
  /** Objetivo común de la mesa: cantidad de sectores para ganar. */
  comunObjetivo: number;
  setComunObjetivo: (n: number) => void;
  /** Ronda completa de la mesa (todos jugaron una vez). */
  roundNumber: number;
  /** Orden de mesa sorteado con dados (ids de jugador). */
  turnOrder: number[];
  /** Tirada del sorteo: id de jugador -> dado. */
  ordenDados: Record<number, number>;
  /** T.E.G.: un solo naipe por turno, conquistes lo que conquistes. */
  cardDrawnThisTurn: boolean;
  /** Reagrupes usados en la fase de fortificación. */
  fortifyMoves: number;
  /** Sectores tomados en el turno en curso (define si te llevás naipe). */
  conquestsThisTurn: number;
  /** Último sector conquistado: ahí van las tropas del canje post-conquista. */
  lastConqueredId: string | null;
  objectiveProgress: (playerId: number) => ProgresoObjetivo;


  startGame: (
    playerCount: number,
    userColor?: string,
    botBonusTroops?: number,
    mapSeed?: string,
    mapSize?: number,
    sorteo?: { turnOrder: number[]; dados: Record<number, number> },
  ) => void;

  conquerTerritory: (id: string, troopsRemaining: number, playerId: number) => void;
  updateTroops: (id: string, delta: number) => void;
  assignTroops: (id: string, amount: number) => void;
  confirmDeployment: () => void;
  cancelDeployment: () => void;
  spendChips: (playerId: number, amount: number) => boolean;
  moveTroops: (fromId: string, toId: string, amount: number) => void;
  collectRevenue: () => { chips: number; troops: number };
  drawCard: (playerId: number) => void;
  tradeCards: (playerId: number, cardIds: string[]) => void;
  setSecretObjective: (objective: SyndicateState["secretObjective"]) => void;
  setPhase: (phase: SyndicateState["turnPhase"]) => void;
  checkVictory: () => Player | null;
  resetGame: () => void;
  nextTurn: () => void;
  playSpecialCard: (cardId: string, territoryId?: string) => void;
  botPlay: () => Promise<void>;
  canAttack: (fromId: string, toId: string) => boolean;
  registerAssault: () => void;
}


const INITIAL_DECK: SyndicateCard[] = [
  ...TERRITORIOS.map((t, i) => ({
    id: `card-${t.id}`,
    territoryId: t.id,
    symbol: (["infantry", "cavalry", "artillery"] as const)[i % 3],
    artUrl: "",
  })),
  // Cartas Especiales (Mazo táctico)
  ...Array(3)
    .fill(null)
    .map((_, i) => ({
      id: `special-bribe-${i}`,
      territoryId: "special",
      symbol: "wildcard" as const,
      type: "bribe" as SpecialCardType,
      artUrl: "",
    })),
  ...Array(3)
    .fill(null)
    .map((_, i) => ({
      id: `special-informant-${i}`,
      territoryId: "special",
      symbol: "wildcard" as const,
      type: "informant" as SpecialCardType,
      artUrl: "",
    })),
  ...Array(3)
    .fill(null)
    .map((_, i) => ({
      id: `special-surprise-${i}`,
      territoryId: "special",
      symbol: "wildcard" as const,
      type: "surprise" as SpecialCardType,
      artUrl: "",
    })),
  ...Array(2)
    .fill(null)
    .map((_, i) => ({
      id: `special-sabotaje-${i}`,
      territoryId: "special",
      symbol: "wildcard" as const,
      type: "surprise" as SpecialCardType, // Mapeamos sabotaje a una acción de sorpresa
      artUrl: "",
    })),
];

export const useSyndicate = create<SyndicateState>()(
  persist(
    (set, get) => ({
      players: [],
      currentPlayerIndex: 0,
      conquests: {},
      activeTerritories: TERRITORIOS,
      lastRevenueCheck: Date.now(),
      unassignedTroops: 0,
      secretObjective: null,
      turnPhase: "setup",
      gameStarted: false,
      winner: null,
      deck: [...INITIAL_DECK],
      hasMovedFortification: false,
      assaultsThisTurn: 0,
      aiNivel: "capo",
      setAiNivel: (aiNivel) => set({ aiNivel }),
      sectorRasgos: {},
      mapaVariante: null,
      tuneles: [],
      rencor: {},
      tradeCount: 0,
      pendingDeployment: {},
      activeEffects: {},

      objectives: {},
      comunObjetivo: 20,
      setComunObjetivo: (n) => set({ comunObjetivo: n }),
      roundNumber: 1,
      turnOrder: [],
      ordenDados: {},

      cardDrawnThisTurn: false,
      fortifyMoves: 0,
      conquestsThisTurn: 0,
      lastConqueredId: null,

      objectiveProgress: (playerId) => {
        const s = get();
        return evaluarObjetivo(
          s.objectives[playerId] ?? null,
          {
            conquests: s.conquests,
            territories: s.activeTerritories,
            eliminados: Object.fromEntries(s.players.map((p) => [p.id, p.eliminated])),
            comun: s.comunObjetivo,
          },
          playerId,
        );
      },

      registerAssault: () => set((state) => ({ assaultsThisTurn: state.assaultsThisTurn + 1 })),


      playSpecialCard: (cardId, territoryId) =>
        set((state) => {
          const player = state.players[state.currentPlayerIndex];
          const card = player.cards.find((c) => c.id === cardId);
          if (!card || !card.type) return state;

          const newPlayers = state.players.map((p) =>
            p.id === player.id ? { ...p, cards: p.cards.filter((c) => c.id !== cardId) } : p,
          );

          const newEffects = { ...state.activeEffects };
          const key = territoryId || `global-${card.type}-${player.id}`;
          newEffects[key] = {
            type: card.type,
            ownerId: player.id,
            expiresAt: Date.now() + 1000 * 60 * 60,
          };

          const newConquests = { ...state.conquests };
          if (card.type === "surprise" && territoryId) {
            if (newConquests[territoryId]) {
              if (card.id.includes("sabotaje")) {
                newConquests[territoryId] = {
                  ...newConquests[territoryId],
                  troops: Math.max(1, Math.floor(newConquests[territoryId].troops / 2)),
                };
              } else {
                newConquests[territoryId] = {
                  ...newConquests[territoryId],
                  troops:
                    newConquests[territoryId].troops + faccionDe(player.faction).surpriseTroops,
                };
              }
            }
          }

          return { players: newPlayers, activeEffects: newEffects, conquests: newConquests };
        }),

      canAttack: (fromId: string, toId: string) => {
        const state = get();
        const from = state.conquests[fromId];
        const to = state.conquests[toId];
        if (!from || !to || from.ownerId === to.ownerId || from.troops <= 1) return false;
        // Rondas de acomodo: nadie asalta hasta la tercera vuelta.
        if (!puedeAsaltar(state.roundNumber)) return false;

        // Efecto del naipe: Toque de Queda (lockdown global)
        const activeLockdowns = Object.values(state.activeEffects).filter(
          (e) => e.type === "lockdown" && e.ownerId !== from.ownerId,
        );
        if (activeLockdowns.length > 0) return false;

        return esVecinoActivo(state.activeTerritories, fromId, toId);
      },

      confirmDeployment: () =>
        set((state) => {
          const newConquests = { ...state.conquests };
          Object.entries(state.pendingDeployment).forEach(([id, amount]) => {
            if (newConquests[id]) {
              newConquests[id] = { ...newConquests[id], troops: newConquests[id].troops + amount };
            }
          });
          return { conquests: newConquests, pendingDeployment: {} };
        }),
      cancelDeployment: () =>
        set((state) => {
          let returned = 0;
          Object.values(state.pendingDeployment).forEach((v) => (returned += v));
          return { unassignedTroops: state.unassignedTroops + returned, pendingDeployment: {} };
        }),
      spendChips: (playerId, amount) => {
        const state = get();
        const player = state.players.find((p) => p.id === playerId);
        if (!player || player.chips < amount) return false;

        set({
          players: state.players.map((p) =>
            p.id === playerId ? { ...p, chips: p.chips - amount } : p,
          ),
        });
        return true;
      },

      setPhase: (phase) => set({ turnPhase: phase }),

      startGame: (playerCount, userColor, botBonusTroops = 0, mapSeed, mapSize, sorteo) =>
        set(() => {
          // Determinar territorios activos
          let activeTerrs = TERRITORIOS;
          let rasgos: MapaRasgos = {};
          let variante: VarianteMapa | null = null;
          let tuneles: Array<[string, string]> = [];
          if (mapSeed) {
            // El tamaño del mapa crece con la oleada de la noche.
            const target = Math.max(10, Math.min(TERRITORIOS.length, mapSize ?? 20));
            const gen = generateSubMap(mapSeed, target);
            activeTerrs = gen.territorios;
            rasgos = gen.rasgos;
            variante = gen.variante;
            tuneles = gen.tuneles;
          }

          const colors = ["var(--cd-gold-mid)", "#A83A3A", "var(--cd-teal)", "#6B7A3A", "#5B4B8A"];
          const finalColors = userColor
            ? [userColor, ...colors.filter((c) => c !== userColor)]
            : colors;

          const avatars = [
            "https://loveable-uploads.s3.us-west-2.amazonaws.com/b39a7b7c-3f4a-4c1c-9b1b-7a3a3a3a3a3a.png",
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
            "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=200&h=200&fit=crop",
          ];

          const players: Player[] = Array.from({ length: playerCount }).map((_, i) => {
            const faction = FACCIONES[i % FACCIONES.length];
            return {
              id: i,
              name: i === 0 ? "El Cuervo" : faction.nombre,
              color: finalColors[i % finalColors.length],
              isBot: i > 0,
              cards: [],
              eliminated: false,
              avatar: avatars[i % avatars.length],
              chips: 500,
              faction: faction.id,
            };
          });

          const shuffledTerritories = [...activeTerrs].sort(() => Math.random() - 0.5);
          const conquests: Record<string, TerritoryConquest> = {};

          shuffledTerritories.forEach((t, index) => {
            const playerId = index % playerCount;
            conquests[t.id] = {
              id: t.id,
              conqueredAt: Date.now(),
              revenueCollectedAt: Date.now(),
              troops: playerId === 0 ? 1 : 1 + Math.max(0, botBonusTroops),
              ownerId: playerId,
            };
          });

          const comun = Math.max(8, Math.ceil(activeTerrs.length * 0.6));

          // Orden de mesa: si vino del sorteo de dados se respeta, si no es 0..n.
          const turnOrder =
            sorteo?.turnOrder?.length === playerCount
              ? sorteo.turnOrder
              : players.map((p) => p.id);

          return {
            players,
            conquests,
            gameStarted: true,
            activeTerritories: activeTerrs,
            turnPhase: "deployment",
            currentPlayerIndex: turnOrder[0],
            turnOrder,
            ordenDados: sorteo?.dados ?? {},
            unassignedTroops: 5,

            winner: null,
            // El mazo sólo lleva naipes de sectores que existen esta noche.
            deck: INITIAL_DECK.filter(
              (c) =>
                c.territoryId === "special" || activeTerrs.some((t) => t.id === c.territoryId),
            ).sort(() => Math.random() - 0.5),
            hasMovedFortification: false,
            assaultsThisTurn: 0,
            sectorRasgos: rasgos,
            mapaVariante: variante,
            tuneles,
            rencor: {},
            objectives: repartirObjetivos(
              `${Date.now()}-${activeTerrs.length}`,
              players.map((p) => p.id),
              activeTerrs,
              comun,
              rasgos,
            ),
            comunObjetivo: comun,
            roundNumber: 1,
            cardDrawnThisTurn: false,
            fortifyMoves: 0,
            conquestsThisTurn: 0,
            lastConqueredId: null,
            tradeCount: 0,
            activeEffects: {},
          };
        }),

      nextTurn: () =>
        set((state) => {
          // T.E.G.: en las dos primeras rondas sólo se colocan fichas, nadie asalta.
          if (state.turnPhase === "deployment")
            return { turnPhase: puedeAsaltar(state.roundNumber) ? "attack" : "fortification" };
          if (state.turnPhase === "attack") return { turnPhase: "fortification" };

          let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
          while (state.players[nextIndex].eliminated) {
            nextIndex = (nextIndex + 1) % state.players.length;
            if (nextIndex === state.currentPlayerIndex) break;
          }

          // Nueva ronda cuando la mesa vuelve a dar la vuelta.
          const roundNumber =
            nextIndex <= state.currentPlayerIndex ? state.roundNumber + 1 : state.roundNumber;

          const playerTerritories = Object.values(state.conquests).filter(
            (c) => c.ownerId === nextIndex,
          );
          // Refuerzos T.E.G.: 5 la primera ronda, 3 la segunda, después mitad de sectores.
          const terrCountBonus =
            roundNumber === 1 ? 5 : roundNumber === 2 ? 3 : Math.max(3, Math.floor(playerTerritories.length / 2));
          const faccion = faccionDe(state.players[nextIndex]?.faction);

          // --- TALISMANES y RUMORES ---
          // Para el jugador humano (index 0)
          let reinforcements = terrCountBonus + faccion.reinforceBonus;
          let chipRevenue = playerTerritories.length * 5;

          // Rumor: Inspección de la Liga (paga extra por territorio)
          const { currentRumor } = useCasino.getState();
          if (nextIndex === 0 && currentRumor?.id === "inspeccion-liga") {
            chipRevenue += playerTerritories.length * 10;
          }

          BARRIOS.forEach((barrio) => {
            const terrsInBarrio = state.activeTerritories.filter((t) => t.barrio === barrio.id);
            const ownsAll =
              terrsInBarrio.length > 0 &&
              terrsInBarrio.every((t) => state.conquests[t.id]?.ownerId === nextIndex);
            if (ownsAll) {
              // Reloj Parado: Bonos de barrio dobles
              const multiplier =
                nextIndex === 0 && state.activeEffects["talisman-reloj-parado"] ? 2 : 1;
              reinforcements += (barrio.bonus || 2) * multiplier;
              chipRevenue += (barrio.bonus || 2) * 20 * multiplier;
            }
          });

          // Rasgos del mapa: cuarteles, contrabando, ruinas.
          const bonos = bonosDeRasgos(
            playerTerritories.map((c) => c.id),
            state.sectorRasgos,
          );
          reinforcements += bonos.refuerzo;
          chipRevenue += bonos.renta;

          // Puro Apagado: +2 refuerzos al abrir cada turno
          if (nextIndex === 0 && state.activeEffects["talisman-puro-apagado"]) {
            reinforcements += 2;
          }

          return {
            players: state.players.map((p) =>
              p.id === nextIndex ? { ...p, chips: p.chips + chipRevenue } : p,
            ),
            currentPlayerIndex: nextIndex,
            turnPhase: "deployment",
            unassignedTroops: reinforcements,
            hasMovedFortification: false,
            assaultsThisTurn: 0,
            roundNumber,
            cardDrawnThisTurn: false,
            fortifyMoves: 0,
            conquestsThisTurn: 0,
            lastConqueredId: null,

            // Limpiar efectos caducados del jugador que empieza
            activeEffects: Object.fromEntries(
              Object.entries(state.activeEffects).filter(([_, e]) => e.ownerId !== nextIndex),
            ),
          };
        }),

      moveTroops: (fromId, toId, amount) =>
        set((state) => {
          const from = state.conquests[fromId];
          const to = state.conquests[toId];
          if (!from || !to || from.ownerId !== to.ownerId || from.troops <= amount) return state;
          if (state.turnPhase === "fortification" && state.hasMovedFortification) return state;

          // Reagrupe T.E.G.: hasta 3 movimientos por fase de fortificación.
          const fortifyMoves =
            state.turnPhase === "fortification" ? state.fortifyMoves + 1 : state.fortifyMoves;

          return {
            conquests: {
              ...state.conquests,
              [fromId]: { ...from, troops: from.troops - amount },
              [toId]: { ...to, troops: to.troops + amount },
            },
            fortifyMoves,
            hasMovedFortification:
              state.turnPhase === "fortification" ? fortifyMoves >= 3 : state.hasMovedFortification,
          };
        }),

      drawCard: (playerId) =>
        set((state) => {
          if (state.deck.length === 0) return state;
          // Un solo naipe por turno, como manda la mesa.
          if (playerId === state.currentPlayerIndex && state.cardDrawnThisTurn) return state;
          // T.E.G.: hace falta 1 sector tomado, o 2 si ya hiciste 3 canjes o más.
          if (
            playerId === state.currentPlayerIndex &&
            state.conquestsThisTurn < naipesRequeridos(state.tradeCount)
          )
            return state;
          const newDeck = [...state.deck];
          const card = newDeck.pop()!;
          const newPlayers = state.players.map((p) =>
            p.id === playerId ? { ...p, cards: [...p.cards, card] } : p,
          );
          return {
            deck: newDeck,
            players: newPlayers,
            cardDrawnThisTurn:
              playerId === state.currentPlayerIndex ? true : state.cardDrawnThisTurn,
          };
        }),

      tradeCards: (playerId, cardIds) =>
        set((state) => {
          const player = state.players.find((p) => p.id === playerId);
          if (!player) return state;

          const tradedCards = player.cards.filter((c) => cardIds.includes(c.id));
          // La mesa sólo acepta tríos legales: tres iguales, tres distintos o con comodín.
          if (!esTrioValido(tradedCards)) return state;
          const remainingCards = player.cards.filter((c) => !cardIds.includes(c.id));

          const newPlayers = state.players.map((p) =>
            p.id === playerId ? { ...p, cards: remainingCards } : p,
          );

          const newDeck = [...state.deck, ...tradedCards].sort(() => Math.random() - 0.5);
          const reinforcementsList = [4, 7, 10, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
          const bonus =
            reinforcementsList[Math.min(state.tradeCount, reinforcementsList.length - 1)] +
            faccionDe(player.faction).tradeBonus;

          // Contrabando (efecto pasivo de naipe extra si estuviera activo)
          // Por ahora lo simplificamos a la lógica base de trade.

          const updatedConquests = { ...state.conquests };
          tradedCards.forEach((card) => {
            if (updatedConquests[card.territoryId]?.ownerId === playerId) {
              updatedConquests[card.territoryId] = {
                ...updatedConquests[card.territoryId],
                troops: updatedConquests[card.territoryId].troops + 2,
              };
            }
          });

          // T.E.G.: si ya conquistaste este turno, el canje se coloca sí o sí
          // en el último sector tomado; si no, engrosa el pozo de refuerzos.
          const destinoForzado =
            playerId === state.currentPlayerIndex &&
            state.lastConqueredId &&
            updatedConquests[state.lastConqueredId]?.ownerId === playerId
              ? state.lastConqueredId
              : null;
          if (destinoForzado) {
            updatedConquests[destinoForzado] = {
              ...updatedConquests[destinoForzado],
              troops: updatedConquests[destinoForzado].troops + bonus,
            };
          }

          return {
            players: newPlayers,
            deck: newDeck,
            unassignedTroops: destinoForzado
              ? state.unassignedTroops
              : state.unassignedTroops + bonus,
            tradeCount: state.tradeCount + 1,
            conquests: updatedConquests,
          };
        }),

      conquerTerritory: (id, troopsRemaining, playerId) =>
        set((state) => {
          const now = Date.now();
          const oldOwnerId = state.conquests[id]?.ownerId;
          const newConquests = {
            ...state.conquests,
            [id]: {
              id,
              conqueredAt: now,
              revenueCollectedAt: now,
              troops: troopsRemaining,
              ownerId: playerId,
            },
          };

          let newPlayers = [...state.players];
          if (oldOwnerId !== undefined && oldOwnerId !== playerId) {
            const hasTerritories = Object.values(newConquests).some(
              (c) => c.ownerId === oldOwnerId,
            );
            if (!hasTerritories) {
              newPlayers = newPlayers.map((p) =>
                p.id === oldOwnerId ? { ...p, eliminated: true } : p,
              );
              const eliminatedPlayer = state.players.find((p) => p.id === oldOwnerId);
              if (eliminatedPlayer && eliminatedPlayer.cards.length > 0) {
                newPlayers = newPlayers.map((p) =>
                  p.id === playerId ? { ...p, cards: [...p.cards, ...eliminatedPlayer.cards] } : p,
                );
              }
            }
          }
          const esTurnoDelJugador = playerId === state.currentPlayerIndex;
          // El que pierde el sector se lo anota: los capos devuelven golpes.
          const rencor = { ...state.rencor };
          if (oldOwnerId !== undefined && oldOwnerId !== playerId) {
            const previo = { ...(rencor[oldOwnerId] ?? {}) };
            previo[playerId] = (previo[playerId] ?? 0) + 1;
            rencor[oldOwnerId] = previo;
          }
          return {
            conquests: newConquests,
            players: newPlayers,
            rencor,
            conquestsThisTurn: esTurnoDelJugador
              ? state.conquestsThisTurn + 1
              : state.conquestsThisTurn,
            lastConqueredId: esTurnoDelJugador ? id : state.lastConqueredId,
          };
        }),

      updateTroops: (id, delta) =>
        set((state) => {
          const conquest = state.conquests[id];
          if (!conquest) return state;
          return {
            conquests: {
              ...state.conquests,
              [id]: { ...conquest, troops: Math.max(1, conquest.troops + delta) },
            },
          };
        }),

      assignTroops: (id, amount) =>
        set((state) => {
          const conquest = state.conquests[id];
          if (!conquest || state.unassignedTroops < amount) return state;

          const player = state.players[state.currentPlayerIndex];
          if (player?.isBot) {
            return {
              unassignedTroops: state.unassignedTroops - amount,
              conquests: {
                ...state.conquests,
                [id]: { ...conquest, troops: conquest.troops + amount },
              },
            };
          }
          return {
            unassignedTroops: state.unassignedTroops - amount,
            pendingDeployment: {
              ...state.pendingDeployment,
              [id]: (state.pendingDeployment[id] || 0) + amount,
            },
          };
        }),

      collectRevenue: () => {
        const state = get();
        const now = Date.now();
        let totalChips = 0;
        let totalTroops = 0;
        const updatedConquests = { ...state.conquests };
        const hoursPassed = Math.floor((now - state.lastRevenueCheck) / (1000 * 60 * 60));

        if (hoursPassed >= 1) {
          Object.values(updatedConquests).forEach((c) => {
            const terr = TERRITORIOS_POR_ID[c.id];
            if (!terr) return;
            let chipRate = 5;
            let troopRate = 1;
            const barrioTerrs = state.activeTerritories.filter((t) => t.barrio === terr.barrio);
            const allConquered = barrioTerrs.every(
              (t) => state.conquests[t.id]?.ownerId === c.ownerId,
            );

            if (allConquered) {
              const barrio = BARRIOS.find((b) => b.id === terr.barrio);
              chipRate += barrio?.bonus ?? 0;
              troopRate += 1;
            }
            totalChips += hoursPassed * chipRate;
            totalTroops += hoursPassed * troopRate;
            updatedConquests[c.id] = { ...c, revenueCollectedAt: now };
          });
          set({
            conquests: updatedConquests,
            lastRevenueCheck: now,
            unassignedTroops: state.unassignedTroops + totalTroops,
          });
        }
        return { chips: totalChips, troops: totalTroops };
      },

      setSecretObjective: (objective) => set({ secretObjective: objective }),
      checkVictory: () => {
        const state = get();
        const activePlayers = state.players.filter((p) => !p.eliminated);
        if (activePlayers.length === 1) return activePlayers[0];

        const board = {
          conquests: state.conquests,
          territories: state.activeTerritories,
          eliminados: Object.fromEntries(state.players.map((p) => [p.id, p.eliminated])),
          comun: state.comunObjetivo,
          rasgos: state.sectorRasgos,
        };

        // El que está en turno tiene prioridad; después se revisa el resto de la mesa.
        const orden = [
          ...activePlayers.filter((p) => p.id === state.currentPlayerIndex),
          ...activePlayers.filter((p) => p.id !== state.currentPlayerIndex),
        ];
        for (const p of orden) {
          const objetivo = state.objectives[p.id] ?? null;
          if (objetivo?.kind === "destruir") {
            const target = state.players.find((x) => x.id === objetivo.targetId);
            const sinSectores =
              !Object.values(state.conquests).some((c) => c.ownerId === objetivo.targetId);
            if (target && (target.eliminated || sinSectores)) {
              // Sólo cuenta si lo bajó él; si no, cae al objetivo común.
              if (state.currentPlayerIndex === p.id && sinSectores) return p;
            }
          }
          if (evaluarObjetivo(objetivo, board, p.id).cumplido) return p;
        }
        return null;
      },
      resetGame: () => set({ gameStarted: false, winner: null }),

      botPlay: async () => {
        const state = get();
        const bot = state.players[state.currentPlayerIndex];
        if (!bot || !bot.isBot || bot.eliminated) return;

        const tuning = tuningDe(state.aiNivel ?? "capo", bot.faction);
        const board = (): AiBoard => {
          const s = get();
          // Quién va ganando la mesa (para que los capos le hagan frente).
          const conteo = new Map<number, number>();
          for (const c of Object.values(s.conquests)) {
            conteo.set(c.ownerId, (conteo.get(c.ownerId) ?? 0) + 1);
          }
          let liderId: number | null = null;
          let mejor = -1;
          for (const [pid, n] of conteo) {
            if (pid !== bot.id && n > mejor) {
              mejor = n;
              liderId = pid;
            }
          }
          return {
            botId: bot.id,
            conquests: s.conquests,
            territories: s.activeTerritories,
            rasgos: s.sectorRasgos,
            liderId,
            rencor: s.rencor[bot.id] ?? {},
          };
        };

        if (state.turnPhase === "deployment") {
          // Antes de repartir, canjea naipes si tiene un trío: refuerzos gratis.
          const trio = findValidSet(bot.cards);
          if (trio && debeCanjear(bot.cards.length, true)) {
            get().tradeCards(
              bot.id,
              trio.map((c) => c.id),
            );
            await new Promise((r) => setTimeout(r, 350));
          }

          const plan = planDeployment(board(), get().unassignedTroops, tuning);
          for (const paso of plan) {
            get().assignTroops(paso.id, paso.troops);
          }
          // Lo que sobre (por redondeos) va al frente más débil.
          const sobra = get().unassignedTroops;
          if (sobra > 0) {
            const resto = planDeployment(board(), sobra, tuning);
            for (const paso of resto) get().assignTroops(paso.id, paso.troops);
          }
          get().confirmDeployment();
          await new Promise((r) => setTimeout(r, 700));
          get().nextTurn();
          return;
        }

        if (state.turnPhase === "attack") {
          for (let asalto = 0; asalto < tuning.maxAsaltos; asalto++) {
            const s = get();
            const plan = mejorAsalto(board(), tuning, (from, to) => s.canAttack(from, to));
            if (!plan) break;

            const origen = plan.from;
            const destino = plan.to;
            const atkDados = Math.min(3, get().conquests[origen].troops - 1);
            const defDados = dadosDefensa(
              get().conquests[destino].troops,
              get().sectorRasgos[destino],
            );
            const { bajasAtacante, bajasDefensor } = tirarAsalto(atkDados, defDados);

            get().updateTroops(origen, -bajasAtacante);
            const defRestantes = get().conquests[destino].troops - bajasDefensor;
            if (defRestantes <= 0) {
              // Ocupa con fuerza suficiente para seguir empujando, pero deja
              // guarnición si el sector de origen está amenazado.
              const disponibles = get().conquests[origen].troops - 1;
              const guardia = amenaza(board(), origen) > 0 ? 1 : 0;
              const mueve = Math.max(1, Math.min(disponibles - guardia, Math.max(atkDados, 2)));
              get().updateTroops(origen, -mueve);
              get().conquerTerritory(destino, mueve, bot.id);
              get().drawCard(bot.id);
            } else {
              get().updateTroops(destino, -bajasDefensor);
            }
            await new Promise((r) => setTimeout(r, 500));
          }
          get().nextTurn();
          return;
        }

        if (state.turnPhase === "fortification") {
          const plan = planFortify(board(), tuning);
          if (plan) get().moveTroops(plan.from, plan.to, plan.amount);
          await new Promise((r) => setTimeout(r, 400));
          get().nextTurn();
        }
      },
    }),
    { name: "syndicate-storage" },
  ),
);

/** Vecindad de la noche: incluye los túneles que abrió el mapa procedural. */
export function esVecinoActivo(territories: Territorio[], a: string, b: string): boolean {
  const t = territories.find((x) => x.id === a);
  if (t) return t.vecinos.includes(b);
  return sonVecinos(a, b);
}

/** Resuelve un asalto al estilo T.E.G.: se comparan dados ordenados de mayor a menor. */
export function tirarAsalto(dadosAtacante: number, dadosDefensor: number) {
  const tirar = (n: number) =>
    Array.from({ length: Math.max(0, n) }, () => Math.floor(Math.random() * 6) + 1).sort(
      (a, b) => b - a,
    );
  const a = tirar(dadosAtacante);
  const d = tirar(dadosDefensor);
  let bajasAtacante = 0;
  let bajasDefensor = 0;
  for (let i = 0; i < Math.min(a.length, d.length); i++) {
    if (a[i] > d[i]) bajasDefensor++;
    else bajasAtacante++;
  }
  return { bajasAtacante, bajasDefensor, dadosA: a, dadosD: d };
}

/**
 * Rondas de acomodo del T.E.G. original: en la primera se colocan 5 fichas y en
 * la segunda 3, sin poder asaltar. Recién en la tercera se abre el fuego.
 */
export const RONDAS_SIN_ASALTO = 2;
export function puedeAsaltar(roundNumber: number): boolean {
  return roundNumber > RONDAS_SIN_ASALTO;
}

/**
 * T.E.G.: para llevarte un naipe hace falta haber tomado al menos un sector,
 * o dos si ya canjeaste tres veces o más en la partida.
 */
export function naipesRequeridos(tradeCount: number): number {
  return tradeCount >= 3 ? 2 : 1;
}

/** ¿Tres naipes forman un canje legal? */
export function esTrioValido(cards: SyndicateCard[]): boolean {
  if (cards.length !== 3) return false;
  const symbols = cards.map((c) => c.symbol);
  return (
    new Set(symbols).size === 1 || new Set(symbols).size === 3 || symbols.includes("wildcard")
  );
}

function findValidSet(cards: SyndicateCard[]) {


  if (cards.length < 3) return null;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        const trio = [cards[i], cards[j], cards[k]];
        const symbols = trio.map((c) => c.symbol);
        const allSame = new Set(symbols).size === 1;
        const allDifferent = new Set(symbols).size === 3;
        const hasWildcard = symbols.includes("wildcard");
        if (allSame || allDifferent || hasWildcard) return trio;
      }
    }
  }
  return null;
}
