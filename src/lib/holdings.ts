import type { AssetId } from "./assets";
import type { Fill, PriceMap } from "./types";

export type Holding = {
  assetId: AssetId;
  quantity: number;
  spent: number;
  value: number;
};

export function holdingsFromFills(fills: Fill[], prices: PriceMap): Holding[] {
  const map = new Map<AssetId, Holding>();
  for (const fill of fills) {
    const current = map.get(fill.assetId) ?? {
      assetId: fill.assetId,
      quantity: 0,
      spent: 0,
      value: 0,
    };
    current.quantity += fill.quantity;
    current.spent += fill.usd;
    map.set(fill.assetId, current);
  }
  return [...map.values()]
    .map((h) => ({
      ...h,
      value: h.quantity * (prices[h.assetId]?.usd ?? 0),
    }))
    .sort((a, b) => b.value - a.value);
}

export function portfolioValue(fills: Fill[], prices: PriceMap): {
  value: number;
  spent: number;
} {
  const rows = holdingsFromFills(fills, prices);
  return {
    value: rows.reduce((s, h) => s + h.value, 0),
    spent: rows.reduce((s, h) => s + h.spent, 0),
  };
}

export function valueSeries(fills: Fill[], prices: PriceMap) {
  const chronological = [...fills].sort((a, b) => a.createdAt - b.createdAt);
  const qty: Partial<Record<AssetId, number>> = {};
  let spent = 0;
  return chronological.map((fill) => {
    spent += fill.usd;
    qty[fill.assetId] = (qty[fill.assetId] ?? 0) + fill.quantity;
    let value = 0;
    for (const [id, amount] of Object.entries(qty)) {
      const assetId = id as AssetId;
      const price = prices[assetId]?.usd ?? fill.priceUsd;
      value += (amount ?? 0) * price;
    }
    return { t: fill.createdAt, spent, value };
  });
}
