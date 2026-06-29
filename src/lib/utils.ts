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

// Solo el color de texto del rating (para badges sobre fondo blanco, ej. la cancha).
export function ratingTextColor(rating: number): string {
  if (rating < 3) return "text-red-600"
  if (rating < 6) return "text-orange-600"
  if (rating < 7) return "text-amber-600"
  if (rating < 9) return "text-emerald-600"
  return "text-emerald-700"
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

// Bonus por ronda de eliminatorias: se suma a una predicción con el signo
// acertado. Fase de grupos no escala. Así el rango de una predicción acertada:
//   grupos 4-7 · 16vos 5-8 · 8vos 6-9 · 4tos 7-10 · semis 8-11 · final 9-12
export const STAGE_BONUS: Record<string, number> = {
  LAST_32: 1,
  LAST_16: 2,
  QUARTER_FINALS: 3,
  SEMI_FINALS: 4,
  THIRD_PLACE: 4, // no especificado: lo igualo a semis
  FINAL: 5,
}

// Valor del pleno (resultado exacto) de una ronda = 7 + bonus. Lo usa el ranking
// del dream team (puesto 1 vale el pleno de esa ronda).
export function plenoValue(stage?: string | null): number {
  return 7 + (stage ? STAGE_BONUS[stage] ?? 0 : 0)
}

// Puntaje oficial (sistema "rodriPT"):
//   +4 si se acierta el signo (gana local / gana visitante / empate)
//   +1 por cada equipo cuyos goles se aciertan
//   +1 combo extra si se aciertan los dos → el resultado exacto queda en 7
//   + bonus de ronda (STAGE_BONUS) si se acertó el signo, en eliminatorias
export function calcPoints(
  actualHome: number,
  actualAway: number,
  predHome: number,
  predAway: number,
  stage?: string | null,
): number {
  const signOk = matchResult(predHome, predAway) === matchResult(actualHome, actualAway)
  let pts = 0
  if (signOk) pts += 4
  const homeOk = predHome === actualHome
  const awayOk = predAway === actualAway
  if (homeOk) pts += 1
  if (awayOk) pts += 1
  if (homeOk && awayOk) pts += 1 // combo por clavar el resultado exacto
  if (signOk && stage) pts += STAGE_BONUS[stage] ?? 0
  return pts
}
