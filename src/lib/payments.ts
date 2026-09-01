import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { StripeConfig } from "./stripe-networks";
import { STRIPE_ONRAMP_ASSETS } from "./stripe-networks";
import type { AssetId } from "./assets";

function readStripeEnv() {
  const publishableKey =
    process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    "";
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  return { publishableKey, secretKey };
}

export const getStripeConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<StripeConfig> => {
    const { publishableKey, secretKey } = readStripeEnv();
    return {
      configured: Boolean(publishableKey && secretKey),
      publishableKey: publishableKey || null,
      livemode: secretKey.startsWith("sk_live"),
    };
  },
);

const OnrampInput = z.object({
  assetId: z.enum([
    "btc",
    "eth",
    "sol",
    "xrp",
    "ton",
    "ltc",
    "doge",
    "ada",
    "avax",
    "bnb",
  ]),
  amountUsd: z.number().min(5).max(2000),
  walletAddress: z.string().min(8).max(256),
  planId: z.string().min(1).max(80),
});

type StripeErrorBody = { error?: { message?: string } };
type StripeOnrampBody = {
  id?: string;
  client_secret?: string;
  error?: { message?: string };
};

export const createOnrampSession = createServerFn({ method: "POST" })
  .validator((input: unknown) => OnrampInput.parse(input))
  .handler(async ({ data }) => {
    const { publishableKey, secretKey } = readStripeEnv();
    if (!publishableKey || !secretKey) {
      return {
        ok: false as const,
        code: "not_configured" as const,
        message: "Stripe keys are not set.",
      };
    }

    const mapped = STRIPE_ONRAMP_ASSETS[data.assetId as AssetId];
    if (!mapped) {
      return {
        ok: false as const,
        code: "unsupported_asset" as const,
        message:
          "Stripe Onramp supports BTC, ETH, SOL, and AVAX to a Tangem address. Other assets stay in preview.",
      };
    }

    const body = new URLSearchParams();
    body.set("lock_wallet_address", "true");
    body.set("source_currency", "usd");
    body.set("source_amount", data.amountUsd.toFixed(2));
    body.set("destination_currency", mapped.currency);
    body.set("destination_network", mapped.network);
    body.append("destination_currencies[]", mapped.currency);
    body.append("destination_networks[]", mapped.network);
    body.set(`wallet_addresses[${mapped.walletKey}]`, data.walletAddress);
    body.set("metadata[planId]", data.planId);
    body.set("metadata[app]", "cadence");

    try {
      const res = await fetch("https://api.stripe.com/v1/crypto/onramp_sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const json = (await res.json()) as StripeOnrampBody & StripeErrorBody;
      if (!res.ok || !json.client_secret || !json.id) {
        return {
          ok: false as const,
          code: "stripe_error" as const,
          message: json.error?.message ?? "Stripe could not start this buy.",
        };
      }
      return {
        ok: true as const,
        clientSecret: json.client_secret,
        sessionId: json.id,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Stripe could not start this buy.";
      return {
        ok: false as const,
        code: "stripe_error" as const,
        message,
      };
    }
  });
