import { Pause, Play, SkipForward, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ASSET_BY_ID } from "@/lib/assets";
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
            Each cadence is a repeating buy aimed at a Tangem address.
          </p>
        </div>
        <Button onClick={openComposer}>New cadence</Button>
      </header>

      {plans.length === 0 ? (
        <div className="rounded-2xl bg-surface px-5 py-10 shadow-[var(--shadow-border)]">
          <p className="font-display text-2xl">No cadences yet</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Create one to start stacking on a schedule.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => {
            const asset = ASSET_BY_ID[plan.assetId];
            const wallet = wallets.find((w) => w.id === plan.walletId);
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
                      {wallet
                        ? `${wallet.label} · ${shortenAddress(wallet.address)}`
                        : "Wallet missing"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Next {countdownLabel(plan.nextRunAt)}
                    </p>
                  </div>
                  <Badge variant={plan.active ? "solid" : "default"}>
                    {plan.active ? "Live" : "Paused"}
                  </Badge>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => requestCheckout(plan.id, true)}
                  >
                    Buy now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePlan(plan.id)}
                  >
                    {plan.active ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    {plan.active ? "Pause" : "Resume"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => skipNext(plan.id)}>
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
