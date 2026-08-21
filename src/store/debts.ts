import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameKey } from "@/lib/economy";

export type DebtGameId = GameKey | "casa" | string;

export type DebtorRank = "novato" | "regular" | "conocido" | "habitual" | "casa";

export interface LoanOffer {
  amount: number;
  interest: number;
  payoutPenalty: number;
}

const LOAN_TABLE: Record<DebtorRank, LoanOffer> = {
  novato: { amount: 100, interest: 0.2, payoutPenalty: 0.25 },
  regular: { amount: 200, interest: 0.2, payoutPenalty: 0.2 },
  conocido: { amount: 400, interest: 0.15, payoutPenalty: 0.15 },
  habitual: { amount: 700, interest: 0.1, payoutPenalty: 0.1 },
  casa: { amount: 1200, interest: 0.05, payoutPenalty: 0.05 },
};

export function rankFromReputation(rep: number): DebtorRank {
  if (rep >= 40) return "casa";
  if (rep >= 25) return "habitual";
  if (rep >= 15) return "conocido";
  if (rep >= 5) return "regular";
  return "novato";
}

export function rankLabel(rank: DebtorRank): string {
  switch (rank) {
    case "casa":
      return "De la Casa";
    case "habitual":
      return "Habitual";
    case "conocido":
      return "Conocido";
    case "regular":
      return "Regular";
    default:
      return "Novato";
  }
}

export function getLoanOffer(reputation: number): LoanOffer & { rank: DebtorRank } {
  const rank = rankFromReputation(reputation);
  return { ...LOAN_TABLE[rank], rank };
}

export interface DebtEntry {
  gameId: DebtGameId;
  balance: number;
  principal: number;
  payoutPenalty: number;
  signedAt: number;
}

export interface FavorEntry {
  id: string;
  gameId: DebtGameId;
  hostessId: string;
  description: string;
  condition: string;
  required: number;
  progress: number;
  createdAt: number;
}

interface DebtState {
  debts: DebtEntry[];
  favors: FavorEntry[];
  lastLoanDay: number | null;

  totalDebt: () => number;
  debtFor: (gameId: DebtGameId) => number;
  payoutMultiplier: (gameId: DebtGameId) => number;

  signLoan: (gameId: DebtGameId, offer: LoanOffer) => number;
  repay: (gameId: DebtGameId, amount: number) => number;
  forgive: (gameId: DebtGameId) => void;

  pushFavor: (favor: Omit<FavorEntry, "progress" | "createdAt">) => void;
  recordFavorProgress: (gameId: DebtGameId, delta?: number) => void;
  redeemFavor: (id: string) => void;

  reset: () => void;
}

function todayKey(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export const useDebts = create<DebtState>()(
  persist(
    (set, get) => ({
      debts: [],
      favors: [],
      lastLoanDay: null,

      totalDebt: () => get().debts.reduce((a, d) => a + d.balance, 0),

      debtFor: (gameId) => get().debts.find((d) => d.gameId === gameId)?.balance ?? 0,

      payoutMultiplier: (gameId) => {
        const entry = get().debts.find((d) => d.gameId === gameId);
        if (!entry || entry.balance <= 0) return 1;
        return Math.max(0, 1 - entry.payoutPenalty);
      },

      signLoan: (gameId, offer) => {
        const s = get();
        if (s.lastLoanDay === todayKey()) return 0;
        if (s.debts.find((d) => d.gameId === gameId)) return 0;
        const balance = Math.round(offer.amount * (1 + offer.interest));
        const entry: DebtEntry = {
          gameId,
          balance,
          principal: offer.amount,
          payoutPenalty: offer.payoutPenalty,
          signedAt: Date.now(),
        };
        set({ debts: [...s.debts, entry], lastLoanDay: todayKey() });
        return offer.amount;
      },

      repay: (gameId, amount) => {
        if (amount <= 0) return 0;
        const s = get();
        const entry = s.debts.find((d) => d.gameId === gameId);
        if (!entry) return 0;
        const applied = Math.min(amount, entry.balance);
        const next = entry.balance - applied;
        const debts =
          next <= 0
            ? s.debts.filter((d) => d.gameId !== gameId)
            : s.debts.map((d) => (d.gameId === gameId ? { ...d, balance: next } : d));
        set({ debts });
        return applied;
      },

      forgive: (gameId) => set((s) => ({ debts: s.debts.filter((d) => d.gameId !== gameId) })),

      pushFavor: (favor) => {
        const s = get();
        if (s.favors.some((f) => f.id === favor.id)) return;
        set({
          favors: [...s.favors, { ...favor, progress: 0, createdAt: Date.now() }],
        });
      },

      recordFavorProgress: (gameId, delta = 1) => {
        set((s) => ({
          favors: s.favors.map((f) =>
            f.gameId === gameId ? { ...f, progress: Math.min(f.required, f.progress + delta) } : f,
          ),
        }));
      },

      redeemFavor: (id) => set((s) => ({ favors: s.favors.filter((f) => f.id !== id) })),

      reset: () => set({ debts: [], favors: [], lastLoanDay: null }),
    }),
    { name: "cuervo-debts:v1" },
  ),
);
