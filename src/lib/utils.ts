import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Null score (awaiting first assessment) renders gray. */
export function scoreColor(score: number | null | undefined): string {
  if (score == null) return "#94a3b8";
  if (score >= 90) return "#2563eb";
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

export function formatScore(score: number | null | undefined): string {
  return score == null ? "—" : String(score);
}
