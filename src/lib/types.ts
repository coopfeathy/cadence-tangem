import type { AssetId, NetworkId } from "./assets";
import type { CardBrand } from "./validate";

export type Frequency = "daily" | "weekly" | "biweekly" | "monthly";

export type Wallet = {
  id: string;
  label: string;
  network: NetworkId;
  address: string;
  createdAt: number;
};

export type PaymentRail = "demo" | "stripe";

export type PaymentCard = {
  id: string;
  brand: CardBrand;
  last4: string;
  expiry: string;
  holder: string;
  createdAt: number;
  processor: PaymentRail;
};

export type Plan = {
  id: string;
  assetId: AssetId;
  amountUsd: number;
  frequency: Frequency;
  walletId: string;
  cardId: string;
  active: boolean;
  createdAt: number;
  nextRunAt: number;
  buyNowOnCreate: boolean;
};

export type Fill = {
  id: string;
  planId: string;
  assetId: AssetId;
  usd: number;
  quantity: number;
  priceUsd: number;
  walletId: string;
  address: string;
  cardLast4: string;
  createdAt: number;
  ref: string;
  rail?: PaymentRail;
  stripeSessionId?: string;
};

export type PriceQuote = {
  usd: number;
  change24h: number;
};

export type PriceMap = Partial<Record<AssetId, PriceQuote>>;
