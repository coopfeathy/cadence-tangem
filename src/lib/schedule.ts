import type { Frequency } from "./types";

export function nextRun(from: number, frequency: Frequency): number {
  const date = new Date(from);
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return date.getTime();
}

export function makeRef(assetTicker: string): string {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${assetTicker.toLowerCase()}_${rand}`;
}

export function countdownParts(target: number, now = Date.now()) {
  const delta = Math.max(0, target - now);
  const totalSec = Math.floor(delta / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { delta, days, hours, minutes, seconds };
}

export function countdownLabel(target: number, now = Date.now()): string {
  const { delta, days, hours, minutes } = countdownParts(target, now);
  if (delta <= 0) return "Due now";
  if (days > 1) return `in ${days} days`;
  if (days === 1) return `in ${hours + 24}h`;
  if (hours >= 1) return `in ${hours}h ${minutes}m`;
  if (minutes >= 1) return `in ${minutes}m`;
  return "in under a minute";
}
