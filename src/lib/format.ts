import { formatDistanceToNowStrict, format } from "date-fns";
import type { Frequency } from "./types";

export function money(usd: number, digits = 2): string {
  if (!Number.isFinite(usd)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(usd);
}

export function compactMoney(usd: number): string {
  if (!Number.isFinite(usd)) return "—";
  if (Math.abs(usd) >= 1_000_000) {
    return `$${(usd / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(usd) >= 10_000) {
    return `$${(usd / 1_000).toFixed(1)}k`;
  }
  return money(usd);
}

export function qty(amount: number, ticker: string): string {
  if (!Number.isFinite(amount) || amount === 0) return `0 ${ticker}`;
  const abs = Math.abs(amount);
  const digits = abs >= 100 ? 2 : abs >= 1 ? 4 : abs >= 0.01 ? 6 : 8;
  const body = amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
  return `${body} ${ticker}`;
}

export function pct(change: number): string {
  if (!Number.isFinite(change)) return "—";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

export function relativeTime(ts: number): string {
  try {
    return formatDistanceToNowStrict(ts, { addSuffix: true });
  } catch {
    return "";
  }
}

export function stamp(ts: number): string {
  return format(ts, "MMM d, yyyy · h:mm a");
}

export function frequencyLabel(freq: Frequency): string {
  switch (freq) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "monthly":
      return "Monthly";
  }
}

export function frequencyShort(freq: Frequency): string {
  switch (freq) {
    case "daily":
      return "day";
    case "weekly":
      return "week";
    case "biweekly":
      return "2 weeks";
    case "monthly":
      return "month";
  }
}

export function buysPerYear(freq: Frequency): number {
  switch (freq) {
    case "daily":
      return 365;
    case "weekly":
      return 52;
    case "biweekly":
      return 26;
    case "monthly":
      return 12;
  }
}
