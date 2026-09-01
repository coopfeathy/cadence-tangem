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

export function detectCardBrand(pan: string): CardBrand {
  const digits = pan.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^6/.test(digits)) return "discover";
  return "unknown";
}

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

export function luhnOk(pan: string): boolean {
  const digits = pan.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function formatPan(pan: string, amex = false): string {
  const digits = pan.replace(/\D/g, "").slice(0, amex ? 15 : 16);
  if (amex) {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function expiryValid(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month, 1);
  return exp > now;
}
