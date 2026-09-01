import { Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeConfig } from "@/components/providers";
import type { PaymentCard, PaymentRail } from "@/lib/types";
import type { CardBrand } from "@/lib/validate";

export type CardDraft = Omit<PaymentCard, "id" | "createdAt">;

const PREVIEW_VISA: CardDraft = {
  brand: "visa",
  last4: "4242",
  expiry: "12/29",
  holder: "Preview test card",
  processor: "demo",
};

const STRIPE_RAIL: CardDraft = {
  brand: "unknown",
  last4: "stripe",
  expiry: "—",
  holder: "Stripe Crypto Onramp",
  processor: "stripe",
};

export function SecureCardPicker({
  onChoose,
  submitLabel = "Continue",
  onBack,
}: {
  onChoose: (card: CardDraft) => void;
  submitLabel?: string;
  onBack?: () => void;
}) {
  const { config, isLoading } = useStripeConfig();
  const live = Boolean(config?.configured);

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-elevated px-4 py-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Lock className="size-4 text-primary" />
          Card numbers never touch Cadence
        </p>
        <p className="mt-2 text-sm text-muted">
          Production charges run through Stripe Crypto Onramp — a PCI-certified
          iframe. We store only a rail label (brand + last four if Stripe
          returns them). CVC and the full number are never collected, logged,
          or written to this device.
        </p>
      </div>

      {live ? (
        <button
          type="button"
          onClick={() => onChoose(STRIPE_RAIL)}
          className="w-full rounded-xl bg-secondary px-4 py-4 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
        >
          <p className="text-sm font-medium">Pay with Stripe</p>
          <p className="mt-1 text-xs text-muted">
            No monthly fee. Card details stay on Stripe. Crypto is sent
            straight to your Tangem address. {config?.livemode ? "Live mode." : "Test mode."}
          </p>
        </button>
      ) : (
        <div className="rounded-xl bg-elevated px-4 py-4 text-sm text-muted">
          <p className="font-medium text-fg">Stripe is not connected yet</p>
          <p className="mt-1">
            Add free Stripe keys (`STRIPE_SECRET_KEY` and
            `VITE_STRIPE_PUBLISHABLE_KEY`) to take live card payments. Until
            then, buys are simulated at live prices.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => onChoose(PREVIEW_VISA)}
        className="w-full rounded-xl bg-elevated px-4 py-4 text-left"
      >
        <p className="text-sm font-medium">Preview test card ···· 4242</p>
        <p className="mt-1 text-xs text-muted">
          One tap. No number entry. For exploring Cadence only — nothing is
          charged.
        </p>
      </button>

      <p className="flex items-start gap-2 text-xs text-subtle">
        <Shield className="mt-0.5 size-3.5 shrink-0" />
        Stripe is the processor: no monthly fee, pay-as-you-go. Cadence is
        never merchant of record for the card.
      </p>

      {onBack ? (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onBack}>
            Back
          </Button>
          <Button className="flex-1" disabled={isLoading} onClick={() => onChoose(live ? STRIPE_RAIL : PREVIEW_VISA)}>
            {submitLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function railLabel(processor: PaymentRail | undefined, last4: string, brand: CardBrand) {
  if (processor === "stripe") return "Stripe Onramp";
  return `${brand === "unknown" ? "Card" : brand} ···· ${last4}`;
}
