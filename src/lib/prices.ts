import { createServerFn } from "@tanstack/react-start";
import { ASSETS, type AssetId } from "./assets";
import type { PriceMap } from "./types";

const TTL_MS = 45_000;

let cache: { at: number; data: PriceMap } | null = null;

const FALLBACK: PriceMap = {
  btc: { usd: 109_400, change24h: 0 },
  eth: { usd: 4_280, change24h: 0 },
  sol: { usd: 208, change24h: 0 },
  xrp: { usd: 2.85, change24h: 0 },
  ton: { usd: 6.4, change24h: 0 },
  ltc: { usd: 112, change24h: 0 },
  doge: { usd: 0.22, change24h: 0 },
  ada: { usd: 0.84, change24h: 0 },
  avax: { usd: 36, change24h: 0 },
  bnb: { usd: 690, change24h: 0 },
};

async function fromBinance(): Promise<PriceMap> {
  const symbols = ASSETS.map((a) => a.binanceSymbol);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`binance ${res.status}`);
  const rows = (await res.json()) as Array<{
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
  }>;
  const bySymbol = new Map(rows.map((row) => [row.symbol, row]));
  const map: PriceMap = {};
  for (const asset of ASSETS) {
    const row = bySymbol.get(asset.binanceSymbol);
    if (!row) continue;
    map[asset.id] = {
      usd: Number(row.lastPrice),
      change24h: Number(row.priceChangePercent),
    };
  }
  if (Object.keys(map).length === 0) throw new Error("binance empty");
  return map;
}

async function fromCoinGecko(): Promise<PriceMap> {
  const ids = ASSETS.map((a) => a.coingeckoId).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const json = (await res.json()) as Record<
    string,
    { usd?: number; usd_24h_change?: number }
  >;
  const map: PriceMap = {};
  for (const asset of ASSETS) {
    const row = json[asset.coingeckoId];
    if (!row?.usd) continue;
    map[asset.id] = {
      usd: row.usd,
      change24h: row.usd_24h_change ?? 0,
    };
  }
  if (Object.keys(map).length === 0) throw new Error("coingecko empty");
  return map;
}

function mergeFallback(partial: PriceMap): PriceMap {
  const out: PriceMap = { ...FALLBACK };
  (Object.keys(partial) as AssetId[]).forEach((id) => {
    const quote = partial[id];
    if (quote && Number.isFinite(quote.usd) && quote.usd > 0) {
      out[id] = quote;
    }
  });
  return out;
}

export const fetchPrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<PriceMap> => {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

    let data: PriceMap = FALLBACK;
    try {
      data = mergeFallback(await fromBinance());
    } catch {
      try {
        data = mergeFallback(await fromCoinGecko());
      } catch {
        data = cache?.data ?? FALLBACK;
      }
    }

    cache = { at: Date.now(), data };
    return data;
  },
);
