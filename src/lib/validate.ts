import type { NetworkId } from "./assets";

const PATTERNS: Record<NetworkId, RegExp> = {
  bitcoin: /^(bc1[a-z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  ethereum: /^0x[a-fA-F0-9]{40}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  ripple: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
  ton: /^(UQ|EQ)[A-Za-z0-9_-]{46}$/,
  litecoin: /^(ltc1[a-z0-9]{25,87}|[LM][a-km-zA-HJ-NP-Z1-9]{26,33})$/,
  dogecoin: /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/,
  cardano: /^addr1[a-z0-9]{20,}$/,
  avalanche: /^0x[a-fA-F0-9]{40}$/,
  bnb: /^0x[a-fA-F0-9]{40}$/,
};

export function isValidAddress(network: NetworkId, address: string): boolean {
  const trimmed = address.trim();
  return PATTERNS[network].test(trimmed);
}

export function detectNetwork(address: string): NetworkId | null {
  const trimmed = address.trim();
  const order: NetworkId[] = [
    "bitcoin",
    "ethereum",
    "ton",
    "ripple",
    "cardano",
    "litecoin",
    "dogecoin",
    "solana",
    "avalanche",
    "bnb",
  ];
  for (const network of order) {
    if (PATTERNS[network].test(trimmed)) {
      if (network === "ethereum") return "ethereum";
      return network;
    }
  }
  return null;
}

export function shortenAddress(address: string, left = 6, right = 4): string {
  const trimmed = address.trim();
  if (trimmed.length <= left + right + 1) return trimmed;
  return `${trimmed.slice(0, left)}…${trimmed.slice(-right)}`;
}

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export function brandLabel(brand: CardBrand): string {
  switch (brand) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "Amex";
    case "discover":
      return "Discover";
    default:
      return "Card";
  }
}
