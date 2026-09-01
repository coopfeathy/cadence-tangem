export type AssetId =
  | "btc"
  | "eth"
  | "sol"
  | "xrp"
  | "ton"
  | "ltc"
  | "doge"
  | "ada"
  | "avax"
  | "bnb";

export type NetworkId =
  | "bitcoin"
  | "ethereum"
  | "solana"
  | "ripple"
  | "ton"
  | "litecoin"
  | "dogecoin"
  | "cardano"
  | "avalanche"
  | "bnb";

export type Asset = {
  id: AssetId;
  name: string;
  ticker: string;
  network: NetworkId;
  networkLabel: string;
  coingeckoId: string;
  binanceSymbol: string;
};

export const ASSETS: Asset[] = [
  {
    id: "btc",
    name: "Bitcoin",
    ticker: "BTC",
    network: "bitcoin",
    networkLabel: "Bitcoin",
    coingeckoId: "bitcoin",
    binanceSymbol: "BTCUSDT",
  },
  {
    id: "eth",
    name: "Ethereum",
    ticker: "ETH",
    network: "ethereum",
    networkLabel: "Ethereum",
    coingeckoId: "ethereum",
    binanceSymbol: "ETHUSDT",
  },
  {
    id: "sol",
    name: "Solana",
    ticker: "SOL",
    network: "solana",
    networkLabel: "Solana",
    coingeckoId: "solana",
    binanceSymbol: "SOLUSDT",
  },
  {
    id: "xrp",
    name: "XRP",
    ticker: "XRP",
    network: "ripple",
    networkLabel: "XRP Ledger",
    coingeckoId: "ripple",
    binanceSymbol: "XRPUSDT",
  },
  {
    id: "ton",
    name: "Toncoin",
    ticker: "TON",
    network: "ton",
    networkLabel: "TON",
    coingeckoId: "the-open-network",
    binanceSymbol: "TONUSDT",
  },
  {
    id: "ltc",
    name: "Litecoin",
    ticker: "LTC",
    network: "litecoin",
    networkLabel: "Litecoin",
    coingeckoId: "litecoin",
    binanceSymbol: "LTCUSDT",
  },
  {
    id: "doge",
    name: "Dogecoin",
    ticker: "DOGE",
    network: "dogecoin",
    networkLabel: "Dogecoin",
    coingeckoId: "dogecoin",
    binanceSymbol: "DOGEUSDT",
  },
  {
    id: "ada",
    name: "Cardano",
    ticker: "ADA",
    network: "cardano",
    networkLabel: "Cardano",
    coingeckoId: "cardano",
    binanceSymbol: "ADAUSDT",
  },
  {
    id: "avax",
    name: "Avalanche",
    ticker: "AVAX",
    network: "avalanche",
    networkLabel: "Avalanche C-Chain",
    coingeckoId: "avalanche-2",
    binanceSymbol: "AVAXUSDT",
  },
  {
    id: "bnb",
    name: "BNB",
    ticker: "BNB",
    network: "bnb",
    networkLabel: "BNB Chain",
    coingeckoId: "binancecoin",
    binanceSymbol: "BNBUSDT",
  },
];

export const ASSET_BY_ID: Record<AssetId, Asset> = Object.fromEntries(
  ASSETS.map((asset) => [asset.id, asset]),
) as Record<AssetId, Asset>;

export const NETWORKS: { id: NetworkId; label: string; hint: string }[] = [
  { id: "bitcoin", label: "Bitcoin", hint: "bc1… or 1… / 3…" },
  { id: "ethereum", label: "Ethereum", hint: "0x…" },
  { id: "solana", label: "Solana", hint: "Base58 address" },
  { id: "ripple", label: "XRP Ledger", hint: "r…" },
  { id: "ton", label: "TON", hint: "UQ… or EQ…" },
  { id: "litecoin", label: "Litecoin", hint: "ltc1… or L…" },
  { id: "dogecoin", label: "Dogecoin", hint: "D…" },
  { id: "cardano", label: "Cardano", hint: "addr1…" },
  { id: "avalanche", label: "Avalanche C-Chain", hint: "0x…" },
  { id: "bnb", label: "BNB Chain", hint: "0x…" },
];

export function assetsOnNetwork(network: NetworkId): Asset[] {
  return ASSETS.filter((asset) => asset.network === network);
}

export const SAMPLE_ADDRESSES: Record<NetworkId, string> = {
  bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  ethereum: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  solana: "9zn3s7pBvB86ZSJPNtzhGPb2QYgLqVxwxZ2SrxNqpump",
  ripple: "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh",
  ton: "UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI",
  litecoin: "ltc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  dogecoin: "DBXu2kgdygjrsqtzq2n0yrf2493p83kkfjDoge1",
  cardano: "addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  avalanche: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  bnb: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
};
