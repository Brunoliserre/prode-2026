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
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

export function matchResult(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home"
  if (away > home) return "away"
  return "draw"
}

// Color del rating de un jugador (estilo FotMob, escala 1–10) para el dream team.
//   <3 rojo · 3–5.9 naranja · 6–6.9 amarillo · 7–8.9 verde suave · 9–10 verde oscuro
export function ratingColor(rating: number): string {
  if (rating < 3) return "bg-red-500/10 text-red-600 dark:text-red-400"
  if (rating < 6) return "bg-orange-500/10 text-orange-600 dark:text-orange-400"
  if (rating < 7) return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
  if (rating < 9) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  return "bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
}

// Entry fee per participant (ARS) — the pozo is ENTRY_AMOUNT × paid users
export const ENTRY_AMOUNT = 10_000

// World Cup 2026 start date — tournament picks lock after this
export const TOURNAMENT_START = new Date("2026-06-11T00:00:00-05:00")

export const PICK_POINTS: Record<string, number> = {
  CHAMPION:   15,
  RUNNER_UP:  13,
  MVP:        13,
  PICHICHI:   13,
  REVELATION: 10,
  FAIR_PLAY:  8,
  RUSTICO:    8,
  DESASTROSO: 10,
  DECEPCION:  10,
}

// Puntaje oficial (sistema "rodriPT"):
//   +4 si se acierta el signo (gana local / gana visitante / empate)
//   +1 por cada equipo cuyos goles se aciertan
//   +1 combo extra si se aciertan los dos → el resultado exacto queda en 7
// El parámetro `stage` se mantiene por compatibilidad de las llamadas; este
// sistema no escala por fase del torneo.
export function calcPoints(
  actualHome: number,
  actualAway: number,
  predHome: number,
  predAway: number,
  stage?: string | null,
): number {
  void stage
  let pts = 0
  if (matchResult(predHome, predAway) === matchResult(actualHome, actualAway)) pts += 4
  const homeOk = predHome === actualHome
  const awayOk = predAway === actualAway
  if (homeOk) pts += 1
  if (awayOk) pts += 1
  if (homeOk && awayOk) pts += 1 // combo por clavar el resultado exacto
  return pts
}
