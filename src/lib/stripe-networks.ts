import type { AssetId, NetworkId } from "./assets";

/** Stripe Crypto Onramp destination currencies / networks we can lock. */
export const STRIPE_ONRAMP_ASSETS: Partial<
  Record<AssetId, { currency: string; network: string; walletKey: string }>
> = {
  btc: { currency: "btc", network: "bitcoin", walletKey: "bitcoin" },
  eth: { currency: "eth", network: "ethereum", walletKey: "ethereum" },
  sol: { currency: "sol", network: "solana", walletKey: "solana" },
  avax: { currency: "avax", network: "avalanche", walletKey: "avalanche" },
};

export function stripeOnrampFor(
  assetId: AssetId,
  network: NetworkId,
): { currency: string; network: string; walletKey: string } | null {
  const mapped = STRIPE_ONRAMP_ASSETS[assetId];
  if (!mapped) return null;
  if (mapped.walletKey !== network && assetId !== "avax") {
    // ETH-like 0x assets must sit on ethereum/avalanche as mapped.
    if (mapped.network !== network) return null;
  }
  return mapped;
}

export type StripeConfig = {
  configured: boolean;
  publishableKey: string | null;
  livemode: boolean;
};
