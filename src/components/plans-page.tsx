import { Pause, Play, SkipForward, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ASSET_BY_ID, walletMatchesAsset } from "@/lib/assets";
import { frequencyLabel, money } from "@/lib/format";
import { countdownLabel } from "@/lib/schedule";
import { useCadence } from "@/lib/store";
import { shortenAddress } from "@/lib/validate";

export function PlansPage() {
  const plans = useCadence((s) => s.plans);
  const wallets = useCadence((s) => s.wallets);
  const openComposer = useCadence((s) => s.openComposer);
  const togglePlan = useCadence((s) => s.togglePlan);
  const skipNext = useCadence((s) => s.skipNext);
  const removePlan = useCadence((s) => s.removePlan);
  const requestCheckout = useCadence((s) => s.requestCheckout);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Plans</h1>
          <p className="mt-2 text-sm text-muted">
            Each cadence buys only to a Tangem address you’ve already saved.
          </p>
        </div>
        <Button onClick={openComposer}>New cadence</Button>
      </header>

      {plans.length === 0 ? (
        <div className="rounded-2xl bg-surface px-5 py-10 shadow-[var(--shadow-border)]">
          <p className="font-display text-2xl">No cadences yet</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Create one to start stacking on a schedule. Destinations come from
            Wallet — you can’t type a new address at checkout.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => {
            const asset = ASSET_BY_ID[plan.assetId];
            const wallet = wallets.find((w) => w.id === plan.walletId);
            const destOk = walletMatchesAsset(wallet, plan.assetId);
            return (
              <li
                key={plan.id}
                className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">
                      {asset.ticker} · {frequencyLabel(plan.frequency)}
                    </p>
                    <p className="font-display mt-1 text-3xl">{money(plan.amountUsd)}</p>
                    <p className="mt-2 font-mono text-xs text-subtle">
                      {destOk && wallet
                        ? `${wallet.label} · ${shortenAddress(wallet.address)}`
                        : "Address removed — add it again to resume"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {destOk
                        ? `Next ${countdownLabel(plan.nextRunAt)}`
                        : "Paused until a matching address is saved"}
                    </p>
                  </div>
                  <Badge variant={plan.active && destOk ? "solid" : "default"}>
                    {plan.active && destOk ? "Live" : "Paused"}
                  </Badge>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!destOk}
                    onClick={() => requestCheckout(plan.id, true)}
                  >
                    Buy now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!destOk && !plan.active}
                    onClick={() => togglePlan(plan.id)}
                  >
                    {plan.active ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    {plan.active ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!destOk}
                    onClick={() => skipNext(plan.id)}
                  >
                    <SkipForward className="size-4" />
                    Skip next
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePlan(plan.id)}
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
