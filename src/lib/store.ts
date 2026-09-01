import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ASSET_BY_ID, type AssetId, walletMatchesAsset } from "./assets";
import { makeRef, nextRun } from "./schedule";
import type { Fill, Frequency, PaymentCard, Plan, PriceMap, Wallet } from "./types";

type CadenceState = {
  hydrated: boolean;
  onboardingComplete: boolean;
  wallets: Wallet[];
  cards: PaymentCard[];
  plans: Plan[];
  fills: Fill[];
  composerOpen: boolean;
  checkout: null | { planId: string; immediate: boolean };
  completeOnboarding: () => void;
  addWallet: (wallet: Omit<Wallet, "id" | "createdAt">) => string;
  removeWallet: (id: string) => void;
  addCard: (card: Omit<PaymentCard, "id" | "createdAt">) => string;
  removeCard: (id: string) => void;
  openComposer: () => void;
  closeComposer: () => void;
  createPlan: (input: {
    assetId: AssetId;
    amountUsd: number;
    frequency: Frequency;
    walletId: string;
    cardId: string;
    buyNow: boolean;
  }) => Plan | null;
  togglePlan: (id: string) => void;
  removePlan: (id: string) => void;
  skipNext: (id: string) => void;
  requestCheckout: (planId: string, immediate: boolean) => void;
  closeCheckout: () => void;
  settleBuy: (planId: string, prices: PriceMap, immediate: boolean) => Fill | null;
  catchUp: (prices: PriceMap) => number;
};

function nid(): string {
  return crypto.randomUUID();
}

const emptyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCadence = create<CadenceState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboardingComplete: false,
      wallets: [],
      cards: [],
      plans: [],
      fills: [],
      composerOpen: false,
      checkout: null,

      completeOnboarding: () => set({ onboardingComplete: true }),

      addWallet: (wallet) => {
        const id = nid();
        set((s) => ({
          wallets: [
            ...s.wallets,
            { ...wallet, id, createdAt: Date.now() },
          ],
        }));
        return id;
      },

      removeWallet: (id) =>
        set((s) => ({
          wallets: s.wallets.filter((w) => w.id !== id),
          plans: s.plans.map((p) =>
            p.walletId === id ? { ...p, active: false } : p,
          ),
        })),

      addCard: (card) => {
        const id = nid();
        set((s) => ({
          cards: [...s.cards, { ...card, id, createdAt: Date.now() }],
        }));
        return id;
      },

      removeCard: (id) =>
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== id),
        })),

      openComposer: () => set({ composerOpen: true }),
      closeComposer: () => set({ composerOpen: false }),

      createPlan: (input) => {
        const state = get();
        const wallet = state.wallets.find((w) => w.id === input.walletId);
        const card = state.cards.find((c) => c.id === input.cardId);
        if (!wallet || !card || !walletMatchesAsset(wallet, input.assetId)) {
          return null;
        }
        const now = Date.now();
        const plan: Plan = {
          id: nid(),
          assetId: input.assetId,
          amountUsd: input.amountUsd,
          frequency: input.frequency,
          walletId: wallet.id,
          cardId: card.id,
          active: true,
          createdAt: now,
          nextRunAt: nextRun(now, input.frequency),
          buyNowOnCreate: input.buyNow,
        };
        set((s) => ({
          plans: [plan, ...s.plans],
          composerOpen: false,
          checkout: input.buyNow ? { planId: plan.id, immediate: true } : null,
        }));
        return plan;
      },

      togglePlan: (id) =>
        set((s) => ({
          plans: s.plans.map((p) => {
            if (p.id !== id) return p;
            const turningOn = !p.active;
            if (turningOn) {
              const wallet = s.wallets.find((w) => w.id === p.walletId);
              if (!walletMatchesAsset(wallet, p.assetId)) return p;
            }
            return {
              ...p,
              active: !p.active,
              nextRunAt: turningOn
                ? Math.max(p.nextRunAt, Date.now() + 60_000)
                : p.nextRunAt,
            };
          }),
        })),

      removePlan: (id) =>
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

      skipNext: (id) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === id ? { ...p, nextRunAt: nextRun(Date.now(), p.frequency) } : p,
          ),
        })),

      requestCheckout: (planId, immediate) => {
        const state = get();
        const plan = state.plans.find((p) => p.id === planId);
        if (!plan) return;
        const wallet = state.wallets.find((w) => w.id === plan.walletId);
        if (!walletMatchesAsset(wallet, plan.assetId)) return;
        set({ checkout: { planId, immediate } });
      },

      closeCheckout: () => set({ checkout: null }),

      settleBuy: (planId, prices, immediate) => {
        const state = get();
        const plan = state.plans.find((p) => p.id === planId);
        if (!plan) return null;
        const wallet = state.wallets.find((w) => w.id === plan.walletId);
        const card = state.cards.find((c) => c.id === plan.cardId);
        const quote = prices[plan.assetId];
        if (
          !wallet ||
          !card ||
          !quote ||
          quote.usd <= 0 ||
          !walletMatchesAsset(wallet, plan.assetId)
        ) {
          return null;
        }

        const quantity = plan.amountUsd / quote.usd;
        const fill: Fill = {
          id: nid(),
          planId: plan.id,
          assetId: plan.assetId,
          usd: plan.amountUsd,
          quantity,
          priceUsd: quote.usd,
          walletId: wallet.id,
          address: wallet.address,
          cardLast4: card.last4,
          createdAt: Date.now(),
          ref: makeRef(ASSET_BY_ID[plan.assetId].ticker),
          rail: card.processor ?? "demo",
        };

        set((s) => ({
          fills: [fill, ...s.fills].slice(0, 400),
          plans: s.plans.map((p) =>
            p.id === plan.id
              ? {
                  ...p,
                  nextRunAt: nextRun(
                    immediate ? Date.now() : Math.max(p.nextRunAt, Date.now()),
                    p.frequency,
                  ),
                }
              : p,
          ),
        }));
        return fill;
      },

      catchUp: (prices) => {
        const now = Date.now();
        let executed = 0;
        const due = get()
          .plans.filter((p) => p.active && p.nextRunAt <= now)
          .slice(0, 8);
        for (const plan of due) {
          const card = get().cards.find((c) => c.id === plan.cardId);
          if ((card?.processor ?? "demo") === "stripe") continue;
          const fill = get().settleBuy(plan.id, prices, false);
          if (fill) executed += 1;
        }
        return executed;
      },
    }),
    {
      name: "cadence.v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? emptyStorage : localStorage,
      ),
      skipHydration: true,
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        wallets: s.wallets,
        cards: s.cards,
        plans: s.plans,
        fills: s.fills,
      }),
    },
  ),
);

export function useHasHydrated() {
  return useCadence((s) => s.hydrated);
}
