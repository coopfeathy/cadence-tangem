import { ASSET_BY_ID } from "@/lib/assets";
import { money, qty, stamp } from "@/lib/format";
import { useCadence } from "@/lib/store";
import { shortenAddress } from "@/lib/validate";

export function ActivityFeed() {
  const fills = useCadence((s) => s.fills);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Activity</h1>
        <p className="mt-2 text-sm text-muted">
          Every simulated fill, with the Tangem address it was aimed at.
        </p>
      </header>

      {fills.length === 0 ? (
        <div className="rounded-2xl bg-surface px-5 py-10 shadow-[var(--shadow-border)]">
          <p className="font-display text-2xl">No fills yet</p>
          <p className="mt-2 text-sm text-muted">
            When a cadence runs, it will show up here with amount, price, and
            destination.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl bg-surface shadow-[var(--shadow-border)]">
          {fills.map((fill) => {
            const asset = ASSET_BY_ID[fill.assetId];
            return (
              <li key={fill.id} className="px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Bought {qty(fill.quantity, asset.ticker)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {money(fill.usd)} at {money(fill.priceUsd, fill.priceUsd >= 100 ? 0 : 4)} ·{" "}
                      {fill.rail === "stripe" ? "Stripe" : "preview"}
                      {fill.cardLast4 && fill.cardLast4 !== "stripe"
                        ? ` ···· ${fill.cardLast4}`
                        : ""}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-subtle">
                      {shortenAddress(fill.address, 10, 8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-subtle">{stamp(fill.createdAt)}</p>
                    <p className="mt-1 font-mono text-xs text-subtle">{fill.ref}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
