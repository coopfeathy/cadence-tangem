import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Lock, Nfc } from "lucide-react";
import { toast } from "sonner";
import { loadStripeOnramp } from "@stripe/crypto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ASSET_BY_ID } from "@/lib/assets";
import { frequencyLabel, money, qty } from "@/lib/format";
import { createOnrampSession } from "@/lib/payments";
import { STRIPE_ONRAMP_ASSETS } from "@/lib/stripe-networks";
import { useCadence } from "@/lib/store";
import type { Fill } from "@/lib/types";
import { shortenAddress } from "@/lib/validate";
import { usePrices, useStripeConfig } from "@/components/providers";
import { cn } from "@/lib/utils";

const PHASES = [
  "Authorizing",
  "Buying at live price",
  "Routing to Tangem",
] as const;

export function CheckoutFlow() {
  const checkout = useCadence((s) => s.checkout);
  const close = useCadence((s) => s.closeCheckout);
  const plans = useCadence((s) => s.plans);
  const wallets = useCadence((s) => s.wallets);
  const cards = useCadence((s) => s.cards);
  const settleBuy = useCadence((s) => s.settleBuy);
  const { prices } = usePrices();
  const { config } = useStripeConfig();
  const pricesRef = useRef(prices);
  pricesRef.current = prices;

  const [phase, setPhase] = useState<-1 | 0 | 1 | 2 | 3>(-1);
  const [fill, setFill] = useState<Fill | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [onrampBusy, setOnrampBusy] = useState(false);
  const mountRef = useRef<HTMLDivElement | null>(null);

  const plan = plans.find((p) => p.id === checkout?.planId);
  const wallet = plan ? wallets.find((w) => w.id === plan.walletId) : undefined;
  const card = plan ? cards.find((c) => c.id === plan.cardId) : undefined;
  const asset = plan ? ASSET_BY_ID[plan.assetId] : undefined;
  const quote = plan ? prices[plan.assetId] : undefined;

  const useStripe =
    Boolean(config?.configured) &&
    (card?.processor ?? "demo") === "stripe" &&
    Boolean(plan && STRIPE_ONRAMP_ASSETS[plan.assetId]);

  useEffect(() => {
    if (!checkout) {
      setPhase(-1);
      setFill(null);
      setStripeError(null);
      setOnrampBusy(false);
    }
  }, [checkout]);

  useEffect(() => {
    if (phase < 0 || phase >= 3 || !plan || !checkout) return undefined;
    const t = window.setTimeout(() => {
      if (phase === 2) {
        const settled = settleBuy(
          plan.id,
          pricesRef.current,
          checkout.immediate,
        );
        if (settled) {
          setFill(settled);
          setPhase(3);
          const ticker = ASSET_BY_ID[settled.assetId].ticker;
          toast.success(`Stacked ${qty(settled.quantity, ticker)}`);
        } else {
          setPhase(-1);
          toast.error("Could not settle this buy. Check wallet, card, and price.");
        }
      } else {
        setPhase((p) => (p === -1 ? p : ((p + 1) as 0 | 1 | 2 | 3)));
      }
    }, 700);
    return () => window.clearTimeout(t);
  }, [phase, plan, checkout, settleBuy]);

  useEffect(() => {
    if (!checkout || !useStripe || !plan || !wallet || !config?.publishableKey) {
      return undefined;
    }
    let cancelled = false;
    setOnrampBusy(true);
    setStripeError(null);

    void (async () => {
      const session = await createOnrampSession({
        data: {
          assetId: plan.assetId,
          amountUsd: plan.amountUsd,
          walletAddress: wallet.address,
          planId: plan.id,
        },
      });
      if (cancelled) return;
      if (!session.ok) {
        setStripeError(session.message);
        setOnrampBusy(false);
        return;
      }
      const onramp = await loadStripeOnramp(config.publishableKey!);
      if (cancelled || !onramp || !mountRef.current) {
        setOnrampBusy(false);
        return;
      }
      mountRef.current.innerHTML = "";
      const ui = onramp.createSession({
        clientSecret: session.clientSecret,
        appearance: { theme: "dark" },
      });
      ui.mount(mountRef.current);
      ui.addEventListener("onramp_session_updated", (event) => {
        const status = event.payload.session.status;
        if (status === "fulfillment_complete") {
          const settled = settleBuy(plan.id, pricesRef.current, checkout.immediate);
          if (settled) {
            setFill(settled);
            setPhase(3);
            toast.success(
              `Stacked ${qty(settled.quantity, ASSET_BY_ID[settled.assetId].ticker)}`,
            );
          }
        }
        if (status === "rejected" || status === "error") {
          setStripeError("Stripe could not complete this buy.");
        }
      });
      setOnrampBusy(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [checkout, useStripe, plan, wallet, config?.publishableKey, settleBuy]);

  const est = plan && quote ? plan.amountUsd / quote.usd : 0;

  return (
    <Dialog
      open={Boolean(checkout)}
      onOpenChange={(open) => {
        if (!open && (phase < 0 || phase === 3 || stripeError)) close();
      }}
    >
      <DialogContent className={useStripe && phase !== 3 ? "max-w-lg" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {phase === 3 ? "On the way" : "Confirm buy"}
          </DialogTitle>
          <DialogDescription>
            {phase === 3
              ? useStripe
                ? "Stripe charged the card and routed crypto to your Tangem address."
                : "Recorded locally at the live price. Connect Stripe to send real crypto."
              : useStripe
                ? "Card details stay inside Stripe. Cadence never sees the number."
                : "Preview authorization — your card is not charged."}
          </DialogDescription>
        </DialogHeader>

        {plan && asset && wallet && card ? (
          phase === 3 && fill ? (
            <div className="space-y-5">
              <div className="flex size-12 items-center justify-center rounded-full bg-gain/20 text-gain">
                <Check className="size-6" />
              </div>
              <div>
                <p className="font-display text-3xl">
                  {qty(fill.quantity, asset.ticker)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {money(fill.usd)} · {frequencyLabel(plan.frequency).toLowerCase()} cadence
                </p>
              </div>
              <div className="rounded-xl bg-elevated px-4 py-3">
                <p className="flex items-center gap-2 text-xs tracking-wide text-subtle uppercase">
                  <Nfc className="size-3.5" />
                  Tangem
                </p>
                <p className="mt-1 font-mono text-sm">
                  {shortenAddress(wallet.address, 10, 8)}
                </p>
              </div>
              <Button className="w-full" onClick={close}>
                Done
              </Button>
            </div>
          ) : useStripe ? (
            <div className="space-y-3">
              {onrampBusy ? (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <LoaderCircle className="size-4 animate-spin" />
                  Opening Stripe's secure card frame
                </p>
              ) : null}
              {stripeError ? (
                <p className="text-sm text-danger">{stripeError}</p>
              ) : null}
              <div ref={mountRef} className="min-h-48 overflow-hidden rounded-xl" />
              <p className="flex items-center gap-2 text-xs text-subtle">
                <Lock className="size-3.5" />
                PCI DSS — numbers never post to Cadence
              </p>
            </div>
          ) : phase >= 0 ? (
            <ol className="space-y-3 py-2">
              {PHASES.map((label, i) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  {i < phase ? (
                    <Check className="size-4 text-gain" />
                  ) : i === phase ? (
                    <LoaderCircle className="size-4 animate-spin text-primary" />
                  ) : (
                    <span className="size-4 rounded-full shadow-[var(--shadow-border)]" />
                  )}
                  <span className={cn(i > phase ? "text-subtle" : "text-fg")}>
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl bg-elevated px-4 py-4">
                <p className="text-xs text-subtle">You pay</p>
                <p className="font-display mt-1 text-3xl">{money(plan.amountUsd)}</p>
                <p className="mt-2 text-sm text-muted">
                  ~{qty(est, asset.ticker)} at{" "}
                  {quote ? money(quote.usd, quote.usd >= 100 ? 0 : 2) : "live price"}
                </p>
              </div>
              <p className="text-sm text-muted">
                Preview rail ···· {card.last4} → {wallet.label} (
                {shortenAddress(wallet.address)})
              </p>
              <Button
                className="w-full"
                size="lg"
                disabled={!quote}
                onClick={() => setPhase(0)}
              >
                Simulate {money(plan.amountUsd)}
              </Button>
            </div>
          )
        ) : (
          <p className="text-sm text-muted">This cadence is missing a wallet or card.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
