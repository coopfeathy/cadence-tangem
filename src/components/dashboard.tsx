import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RTooltip, XAxis } from "recharts";
import { ArrowUpRight, Pause, Play, Repeat } from "lucide-react";
import { CadenceCard } from "@/components/cadence-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ASSET_BY_ID, NETWORKS } from "@/lib/assets";
import {
  compactMoney,
  frequencyLabel,
  money,
  pct,
  qty,
  relativeTime,
} from "@/lib/format";
import { holdingsFromFills, portfolioValue, valueSeries } from "@/lib/holdings";
import { countdownLabel } from "@/lib/schedule";
import { useCadence } from "@/lib/store";
import { usePrices } from "@/components/providers";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const wallets = useCadence((s) => s.wallets);
  const plans = useCadence((s) => s.plans);
  const fills = useCadence((s) => s.fills);
  const openComposer = useCadence((s) => s.openComposer);
  const requestCheckout = useCadence((s) => s.requestCheckout);
  const togglePlan = useCadence((s) => s.togglePlan);
  const { prices } = usePrices();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { value, spent } = portfolioValue(fills, prices);
  const pnl = value - spent;
  const pnlPct = spent > 0 ? (pnl / spent) * 100 : 0;
  const holdings = holdingsFromFills(fills, prices);
  const series = valueSeries(fills, prices);
  const next = plans
    .filter((p) => p.active)
    .slice()
    .sort((a, b) => a.nextRunAt - b.nextRunAt)[0];
  const primary = wallets[0];
  const networkLabel = primary
    ? NETWORKS.find((n) => n.id === primary.network)?.label
    : undefined;

  const chartData = useMemo(
    () =>
      series.map((row) => ({
        t: new Date(row.t).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: Number(row.value.toFixed(2)),
      })),
    [series],
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rise-in">
          <p className="text-xs tracking-[0.18em] text-subtle uppercase">
            Stacked on Tangem
          </p>
          <p className="font-display mt-2 text-5xl tracking-tight tabular-nums sm:text-6xl">
            {fills.length === 0 ? "$0.00" : compactMoney(value)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {spent > 0 ? (
              <>
                <span className={cn("tabular-nums", pnl >= 0 ? "text-gain" : "text-loss")}>
                  {pnl >= 0 ? "+" : ""}
                  {money(pnl)} ({pct(pnlPct)})
                </span>
                <span className="text-subtle">vs {money(spent)} spent</span>
              </>
            ) : (
              <span className="text-muted">
                No fills yet. Start a cadence and the stack will show here.
              </span>
            )}
          </div>

          {chartData.length >= 2 ? (
            <div className="mt-6 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stack" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <RTooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--color-fg)",
                    }}
                    formatter={(v) => [money(Number(v)), "Value"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-primary)"
                    strokeWidth={1.5}
                    fill="url(#stack)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {next ? (
            <p className="mt-5 text-sm text-muted">
              Next buy {countdownLabel(next.nextRunAt, now)} ·{" "}
              {money(next.amountUsd)} {ASSET_BY_ID[next.assetId].ticker} ·{" "}
              {frequencyLabel(next.frequency).toLowerCase()}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={openComposer}>
              <Repeat className="size-4" />
              New cadence
            </Button>
            {next ? (
              <Button
                variant="secondary"
                onClick={() => requestCheckout(next.id, true)}
              >
                Buy a slice now
              </Button>
            ) : null}
          </div>
        </div>

        <div className="rise-in rise-in-delay-1 flex items-center justify-center">
          <CadenceCard
            label={primary?.label ?? "Tangem"}
            address={primary?.address}
            networkLabel={networkLabel}
          />
        </div>
      </section>

      {holdings.length > 0 ? (
        <section>
          <h2 className="text-sm tracking-wide text-subtle uppercase">Holdings</h2>
          <ul className="mt-3 divide-y divide-border rounded-2xl bg-surface px-1 shadow-[var(--shadow-border)]">
            {holdings.map((h) => {
              const asset = ASSET_BY_ID[h.assetId];
              const change = prices[h.assetId]?.change24h ?? 0;
              return (
                <li
                  key={h.assetId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{asset.ticker}</p>
                    <p className="font-mono text-xs text-muted">{qty(h.quantity, asset.ticker)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm tabular-nums">{money(h.value)}</p>
                    <p
                      className={cn(
                        "text-xs tabular-nums",
                        change >= 0 ? "text-gain" : "text-loss",
                      )}
                    >
                      {pct(change)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm tracking-wide text-subtle uppercase">Cadences</h2>
          {plans.length > 0 ? (
            <button
              type="button"
              onClick={openComposer}
              className="text-sm text-muted hover:text-fg"
            >
              Add another
            </button>
          ) : null}
        </div>

        {plans.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-surface px-5 py-8 shadow-[var(--shadow-border)]">
            <p className="font-display text-2xl">Start with something small.</p>
            <p className="mt-2 max-w-md text-sm text-muted">
              $10 of bitcoin every Friday. $25 of ether on payday. Cadence
              repeats it, and each slice is aimed at your Tangem.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={openComposer}>Create a cadence</Button>
            </div>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => {
              const asset = ASSET_BY_ID[plan.assetId];
              return (
                <li
                  key={plan.id}
                  className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted">{asset.name}</p>
                      <p className="font-display mt-1 text-2xl">
                        {money(plan.amountUsd)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {frequencyLabel(plan.frequency)}
                      </p>
                    </div>
                    <Badge variant={plan.active ? "solid" : "default"}>
                      {plan.active ? "Live" : "Paused"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-xs text-subtle">
                    Next {countdownLabel(plan.nextRunAt, now)}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => requestCheckout(plan.id, true)}
                    >
                      <ArrowUpRight className="size-4" />
                      Buy now
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={plan.active ? "Pause" : "Resume"}
                      onClick={() => togglePlan(plan.id)}
                    >
                      {plan.active ? (
                        <Pause className="size-4" />
                      ) : (
                        <Play className="size-4" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {fills[0] ? (
        <p className="text-xs text-subtle">
          Last fill {relativeTime(fills[0].createdAt)} · {ASSET_BY_ID[fills[0].assetId].ticker}
        </p>
      ) : null}
    </div>
  );
}
