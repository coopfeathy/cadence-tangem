import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Wallet } from "lucide-react";
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
import {
  ASSET_BY_ID,
  assetsForNetworks,
  type AssetId,
  walletMatchesAsset,
} from "@/lib/assets";
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

  const buyable = useMemo(
    () => assetsForNetworks(wallets.map((w) => w.network)),
    [wallets],
  );

  const [step, setStep] = useState(0);
  const [assetId, setAssetId] = useState<AssetId>("btc");
  const [amount, setAmount] = useState(25);
  const [custom, setCustom] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [walletId, setWalletId] = useState<string>("");
  const [cardId, setCardId] = useState<string>("");
  const [buyNow, setBuyNow] = useState(true);

  const effectiveAssetId: AssetId =
    buyable.some((a) => a.id === assetId) ? assetId : (buyable[0]?.id ?? "btc");
  const asset = ASSET_BY_ID[effectiveAssetId];
  const quote = prices[effectiveAssetId];
  const matchingWallets = wallets.filter((w) =>
    walletMatchesAsset(w, effectiveAssetId),
  );
  const resolvedAmount = custom ? Number(custom) : amount;
  const amountOk =
    Number.isFinite(resolvedAmount) &&
    resolvedAmount >= 5 &&
    resolvedAmount <= 2000;

  const yearly = amountOk ? resolvedAmount * buysPerYear(frequency) : 0;
  const estQty =
    amountOk && quote?.usd ? resolvedAmount / quote.usd : 0;

  function reset() {
    setStep(0);
    setAssetId(buyable[0]?.id ?? "btc");
    setAmount(25);
    setCustom("");
    setFrequency("weekly");
    setWalletId("");
    setCardId("");
    setBuyNow(true);
  }

  const chosenWallet = useMemo(() => {
    const picked = matchingWallets.find((w) => w.id === walletId);
    if (picked) return picked;
    return matchingWallets.length === 1 ? matchingWallets[0] : undefined;
  }, [matchingWallets, walletId]);
  const chosenCard = useMemo(
    () => cards.find((c) => c.id === cardId) ?? (cards.length === 1 ? cards[0] : undefined),
    [cards, cardId],
  );

  const canCreate = Boolean(
    chosenWallet &&
      chosenCard &&
      amountOk &&
      walletMatchesAsset(chosenWallet, effectiveAssetId),
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
      <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>New cadence</DialogTitle>
          <DialogDescription>
            Recurring buy, delivered only to a Tangem address you’ve saved.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto pr-1">

        {buyable.length === 0 ? (
          <div className="space-y-4 py-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-elevated">
              <Wallet className="size-5 text-muted" />
            </div>
            <p className="font-display text-2xl leading-tight">
              Add an address first
            </p>
            <p className="text-sm text-muted">
              Cadence will not buy to an address you haven’t saved. Paste a
              receive address from the Tangem app, then come back.
            </p>
            <Button asChild className="w-full">
              <Link
                to="/wallet"
                onClick={() => {
                  close();
                  reset();
                }}
              >
                Add a Tangem address
              </Link>
            </Button>
          </div>
        ) : null}

        {buyable.length > 0 && step === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Only coins that match an address you’ve added.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {buyable.map((a) => {
                const p = prices[a.id];
                const destCount = wallets.filter((w) =>
                  walletMatchesAsset(w, a.id),
                ).length;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAssetId(a.id);
                      setWalletId("");
                    }}
                    className={cn(
                      "flex flex-col items-start rounded-xl bg-elevated px-3 py-3 text-left shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]",
                      effectiveAssetId === a.id &&
                        "bg-secondary shadow-[var(--shadow-border-hover)]",
                    )}
                  >
                    <span className="text-sm font-medium">{a.ticker}</span>
                    <span className="text-xs text-subtle">{a.name}</span>
                    <span className="mt-2 font-mono text-xs tabular-nums text-muted">
                      {p ? money(p.usd, p.usd >= 100 ? 0 : 2) : "—"}
                    </span>
                    <span className="mt-1 text-xs text-subtle">
                      {destCount} {destCount === 1 ? "address" : "addresses"}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button
              className="mt-2 w-full"
              onClick={() => {
                setAssetId(effectiveAssetId);
                setStep(1);
              }}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : null}

        {buyable.length > 0 && step === 1 ? (
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

        {buyable.length > 0 && step === 2 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Tangem destination</Label>
              <p className="text-xs text-subtle">
                Saved {asset.networkLabel} addresses only. Add another on Wallet
                if you need a different one.
              </p>
              {matchingWallets.length === 0 ? (
                <p className="rounded-xl bg-elevated px-3 py-3 text-sm text-muted">
                  No {asset.networkLabel} address saved. Add one before this
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
                        chosenWallet?.id === w.id &&
                          "bg-secondary shadow-[var(--shadow-border-hover)]",
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
                        chosenCard?.id === c.id &&
                          "bg-secondary shadow-[var(--shadow-border-hover)]",
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
                {asset.ticker} to{" "}
                {chosenWallet
                  ? `${chosenWallet.label} · ${shortenAddress(chosenWallet.address)}`
                  : "a saved Tangem address"}
                {quote ? ` · ~${qty(estQty, asset.ticker)}` : ""}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!canCreate}
                onClick={() => {
                  if (!chosenWallet || !chosenCard) return;
                  const plan = createPlan({
                    assetId: effectiveAssetId,
                    amountUsd: resolvedAmount,
                    frequency,
                    walletId: chosenWallet.id,
                    cardId: chosenCard.id,
                    buyNow,
                  });
                  if (!plan) {
                    toast.error(
                      "That cadence needs a Tangem address you’ve already saved.",
                    );
                    return;
                  }
                  if (!buyNow) toast.success("Cadence is live");
                  reset();
                }}
              >
                {buyNow ? "Review & pay" : "Start cadence"}
              </Button>
            </div>
          </div>
        ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
