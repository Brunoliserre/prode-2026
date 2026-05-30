import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

export function matchResult(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home"
  if (away > home) return "away"
  return "draw"
}

export function calcPoints(
  actualHome: number,
  actualAway: number,
  predHome: number,
  predAway: number,
): number {
  if (predHome === actualHome && predAway === actualAway) return 3
  if (matchResult(predHome, predAway) === matchResult(actualHome, actualAway)) return 1
  return 0
}
