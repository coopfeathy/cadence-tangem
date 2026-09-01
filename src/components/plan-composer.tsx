import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ASSET_BY_ID, ASSETS, type AssetId } from "@/lib/assets";
import { buysPerYear, frequencyLabel, money, qty } from "@/lib/format";
import { useCadence } from "@/lib/store";
import type { Frequency } from "@/lib/types";
import { cn } from "@/lib/utils";
import { brandLabel, shortenAddress } from "@/lib/validate";
import { usePrices } from "@/components/providers";

const AMOUNTS = [5, 10, 25, 50, 100, 250];
const FREQS: Frequency[] = ["daily", "weekly", "biweekly", "monthly"];

export function PlanComposer() {
  const open = useCadence((s) => s.composerOpen);
  const close = useCadence((s) => s.closeComposer);
  const wallets = useCadence((s) => s.wallets);
  const cards = useCadence((s) => s.cards);
  const createPlan = useCadence((s) => s.createPlan);
  const { prices } = usePrices();

  const [step, setStep] = useState(0);
  const [assetId, setAssetId] = useState<AssetId>("btc");
  const [amount, setAmount] = useState(25);
  const [custom, setCustom] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [walletId, setWalletId] = useState<string>("");
  const [cardId, setCardId] = useState<string>("");
  const [buyNow, setBuyNow] = useState(true);

  const asset = ASSET_BY_ID[assetId];
  const quote = prices[assetId];
  const matchingWallets = wallets.filter((w) => w.network === asset.network);
  const resolvedAmount = custom ? Number(custom) : amount;
  const amountOk =
    Number.isFinite(resolvedAmount) &&
    resolvedAmount >= 5 &&
    resolvedAmount <= 2000;

  const yearly = amountOk ? resolvedAmount * buysPerYear(frequency) : 0;
  const estQty =
    amountOk && quote?.usd ? resolvedAmount / quote.usd : 0;

  const canWallet = matchingWallets.length > 0 && cards.length > 0;

  function reset() {
    setStep(0);
    setAssetId("btc");
    setAmount(25);
    setCustom("");
    setFrequency("weekly");
    setWalletId("");
    setCardId("");
    setBuyNow(true);
  }

  const chosenWallet = useMemo(
    () => matchingWallets.find((w) => w.id === walletId) ?? matchingWallets[0],
    [matchingWallets, walletId],
  );
  const chosenCard = useMemo(
    () => cards.find((c) => c.id === cardId) ?? cards[0],
    [cards, cardId],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close();
          reset();
        }
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New cadence</DialogTitle>
          <DialogDescription>
            Recurring buy, delivered to your Tangem.
          </DialogDescription>
        </DialogHeader>

        {step === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Choose an asset</p>
            <div className="grid grid-cols-2 gap-2">
              {ASSETS.map((a) => {
                const p = prices[a.id];
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAssetId(a.id)}
                    className={cn(
                      "flex flex-col items-start rounded-xl bg-elevated px-3 py-3 text-left shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]",
                      assetId === a.id && "bg-secondary shadow-[var(--shadow-border-hover)]",
                    )}
                  >
                    <span className="text-sm font-medium">{a.ticker}</span>
                    <span className="text-xs text-subtle">{a.name}</span>
                    <span className="mt-2 font-mono text-xs tabular-nums text-muted">
                      {p ? money(p.usd, p.usd >= 100 ? 0 : 2) : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button className="mt-2 w-full" onClick={() => setStep(1)}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Amount, USD</Label>
              <div className="flex flex-wrap gap-2">
                {AMOUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setAmount(n);
                      setCustom("");
                    }}
                    className={cn(
                      "h-10 rounded-full px-3 text-sm",
                      !custom && amount === n
                        ? "bg-primary text-primary-fg"
                        : "bg-secondary text-muted",
                    )}
                  >
                    ${n}
                  </button>
                ))}
              </div>
              <Input
                inputMode="decimal"
                placeholder="Custom amount"
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))}
              />
              {!amountOk ? (
                <p className="text-xs text-danger">Between $5 and $2,000.</p>
              ) : quote ? (
                <p className="text-xs text-muted">
                  About {qty(estQty, asset.ticker)} at {money(quote.usd, quote.usd >= 100 ? 0 : 2)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>How often</Label>
              <div className="grid grid-cols-2 gap-2">
                {FREQS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={cn(
                      "h-11 rounded-xl text-sm",
                      frequency === f
                        ? "bg-primary text-primary-fg"
                        : "bg-secondary text-muted",
                    )}
                  >
                    {frequencyLabel(f)}
                  </button>
                ))}
              </div>
              {amountOk ? (
                <p className="text-xs text-muted">
                  About {money(yearly, 0)} per year, if you keep the cadence.
                </p>
              ) : null}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(0)}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button className="flex-1" disabled={!amountOk} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Tangem destination</Label>
              {matchingWallets.length === 0 ? (
                <p className="rounded-xl bg-elevated px-3 py-3 text-sm text-muted">
                  Add a {asset.networkLabel} address in Wallet before this
                  cadence can settle.
                </p>
              ) : (
                <div className="space-y-2">
                  {matchingWallets.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWalletId(w.id)}
                      className={cn(
                        "flex w-full flex-col items-start rounded-xl bg-elevated px-3 py-3 text-left",
                        (chosenWallet?.id === w.id) && "shadow-[var(--shadow-border-hover)] bg-secondary",
                      )}
                    >
                      <span className="text-sm">{w.label}</span>
                      <span className="font-mono text-xs text-muted">
                        {shortenAddress(w.address, 10, 6)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Charge to</Label>
              {cards.length === 0 ? (
                <p className="rounded-xl bg-elevated px-3 py-3 text-sm text-muted">
                  Add a card in Wallet first.
                </p>
              ) : (
                <div className="space-y-2">
                  {cards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCardId(c.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl bg-elevated px-3 py-3 text-left",
                        chosenCard?.id === c.id && "bg-secondary shadow-[var(--shadow-border-hover)]",
                      )}
                    >
                      <span className="text-sm">
                        {brandLabel(c.brand)} ···· {c.last4}
                      </span>
                      <span className="text-xs text-subtle">{c.expiry}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl bg-elevated px-3 py-3">
              <div>
                <p className="text-sm">Buy the first slice now</p>
                <p className="text-xs text-subtle">Then repeat on schedule</p>
              </div>
              <Switch checked={buyNow} onCheckedChange={setBuyNow} />
            </label>

            <div className="rounded-xl bg-elevated px-4 py-4">
              <p className="font-display text-lg">
                {money(resolvedAmount)} {frequencyLabel(frequency).toLowerCase()}
              </p>
              <p className="mt-1 text-sm text-muted">
                {asset.ticker} to {chosenWallet ? shortenAddress(chosenWallet.address) : "your Tangem"}
                {quote ? ` · ~${qty(estQty, asset.ticker)}` : ""}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!canWallet || !chosenWallet || !chosenCard || !amountOk}
                onClick={() => {
                  if (!chosenWallet || !chosenCard) return;
                  createPlan({
                    assetId,
                    amountUsd: resolvedAmount,
                    frequency,
                    walletId: chosenWallet.id,
                    cardId: chosenCard.id,
                    buyNow,
                  });
                  if (!buyNow) toast.success("Cadence is live");
                  reset();
                }}
              >
                {buyNow ? "Review & pay" : "Start cadence"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
