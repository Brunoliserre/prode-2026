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

// World Cup 2026 start date — tournament picks lock after this
export const TOURNAMENT_START = new Date("2026-06-11T00:00:00-05:00")

export const PICK_POINTS: Record<string, number> = {
  CHAMPION:   8,
  RUNNER_UP:  5,
  MVP:        5,
  PICHICHI:   5,
  REVELATION: 3,
  FAIR_PLAY:  3,
  RUSTICO:    3,
  DESASTROSO: 3,
  DECEPCION:  3,
}

const STAGE_POINTS: Record<string, number> = {
  LAST_32:        2,
  LAST_16:        3,
  QUARTER_FINALS: 4,
  SEMI_FINALS:    5,
  THIRD_PLACE:    6,
  FINAL:          6,
}

export function calcPoints(
  actualHome: number,
  actualAway: number,
  predHome: number,
  predAway: number,
  stage?: string | null,
): number {
  const tendency = matchResult(predHome, predAway) === matchResult(actualHome, actualAway)
  if (!tendency) return 0

  const isExact = predHome === actualHome && predAway === actualAway
  const isGroup = !stage || stage === "GROUP_STAGE"

  if (isGroup) return isExact ? 2 : 1
  return STAGE_POINTS[stage] ?? 2
}
