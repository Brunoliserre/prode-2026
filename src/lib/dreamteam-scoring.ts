import { prisma } from "./prisma"
import { plenoValue } from "./utils"
import { PLAYER_BY_ID } from "./dreamteam-mock"
import type { Formation } from "./formations"
import type { PitchPlayer } from "@/components/DreamTeamPitch"

export const KO_ORDER = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"]
export const KO_LABEL: Record<string, string> = {
  LAST_32: "16vos", LAST_16: "8vos", QUARTER_FINALS: "4tos",
  SEMI_FINALS: "Semis", THIRD_PLACE: "3er puesto", FINAL: "Final",
}

// Ronda activa: la primera (en orden) con algún partido sin jugar; si están
// todas jugadas, la última presente. Sin eliminatorias → LAST_32.
export async function currentRound(): Promise<string> {
  const ko = await prisma.fixture.findMany({
    where: { stage: { notIn: ["GROUP_STAGE"] }, NOT: { stage: null } },
    select: { stage: true, homeScore: true, awayScore: true },
  })
  const present = KO_ORDER.filter((s) => ko.some((f) => f.stage === s))
  return (
    present.find((s) => ko.some((f) => f.stage === s && (f.homeScore == null || f.awayScore == null))) ??
    present[present.length - 1] ??
    "LAST_32"
  )
}

const ptsForRank = (rank: number, pleno: number) =>
  pleno - (rank === 1 ? 0 : rank === 2 ? 2 : rank === 3 ? 3 : 4)

export type RoundStanding = { userId: string; score: number; position: number; points: number }

// Standings por ronda (solo rondas con algún rating cargado). Por ronda: suma de
// los 7 ratings define el puesto; puesto 1 = pleno de la ronda, 2º −2, 3º −3,
// 4º+ −4. Empates comparten puesto y puntos. Solo equipos completos (7).
async function computeRounds(): Promise<Map<string, RoundStanding[]>> {
  const [teams, scores] = await Promise.all([
    prisma.dreamTeam.findMany({ include: { picks: true } }),
    prisma.playerScore.findMany(),
  ])
  const ratingOf = new Map<string, number>()
  const scoredRounds = new Set<string>()
  for (const s of scores) {
    ratingOf.set(`${s.round}|${s.playerId}`, s.rating)
    scoredRounds.add(s.round)
  }

  const byRound = new Map<string, typeof teams>()
  for (const t of teams) {
    if (!byRound.has(t.round)) byRound.set(t.round, [])
    byRound.get(t.round)!.push(t)
  }

  const result = new Map<string, RoundStanding[]>()
  for (const [round, dts] of byRound) {
    if (!scoredRounds.has(round)) continue
    const ranked = dts
      .filter((t) => t.picks.length === 7)
      .map((t) => ({
        userId: t.userId,
        score: t.picks.reduce((s, p) => s + (ratingOf.get(`${round}|${p.playerId}`) ?? 0), 0),
      }))
      .sort((a, b) => b.score - a.score)

    const pleno = plenoValue(round)
    const standings: RoundStanding[] = []
    let i = 0
    while (i < ranked.length) {
      let j = i
      while (j + 1 < ranked.length && ranked[j + 1].score === ranked[i].score) j++
      const points = ptsForRank(i + 1, pleno)
      for (let k = i; k <= j; k++)
        standings.push({ userId: ranked[k].userId, score: ranked[k].score, position: i + 1, points })
      i = j + 1
    }
    result.set(round, standings)
  }
  return result
}

// Puntos del dream team por usuario (suma de todas las rondas puntuadas).
export async function dreamTeamPointsByUser(): Promise<Map<string, number>> {
  const rounds = await computeRounds()
  const out = new Map<string, number>()
  for (const standings of rounds.values())
    for (const s of standings) out.set(s.userId, (out.get(s.userId) ?? 0) + s.points)
  return out
}

// Tabla específica del dream team: participantes (cualquiera con equipo) ordenados
// por puntos acumulados.
export type DTStandingRow = { id: string; name: string | null; image: string | null; points: number }
export async function dreamTeamStandings(): Promise<DTStandingRow[]> {
  const [rounds, participants] = await Promise.all([
    computeRounds(),
    prisma.dreamTeam.findMany({ select: { userId: true } }),
  ])
  const pts = new Map<string, number>()
  for (const standings of rounds.values())
    for (const s of standings) pts.set(s.userId, (pts.get(s.userId) ?? 0) + s.points)

  const ids = [...new Set(participants.map((p) => p.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, image: true },
  })
  return users
    .map((u) => ({ id: u.id, name: u.name, image: u.image, points: pts.get(u.id) ?? 0 }))
    .sort((a, b) => b.points - a.points || (a.name ?? "").localeCompare(b.name ?? ""))
}

// "Mis dream teams": detalle por ronda del usuario (con cancha y puntaje).
export type MyDreamTeam = {
  round: string
  label: string
  formation: Formation
  picks: Record<string, PitchPlayer> // slot → jugador (rating de la ronda si está cargado)
  complete: boolean
  scored: boolean
  score: number | null // suma de ratings
  avg: number | null // promedio
  position: number | null
  points: number | null
}
export async function myDreamTeams(userId: string): Promise<MyDreamTeam[]> {
  const [teams, scores, rounds] = await Promise.all([
    prisma.dreamTeam.findMany({ where: { userId }, include: { picks: true } }),
    prisma.playerScore.findMany(),
    computeRounds(),
  ])
  const ratingOf = new Map<string, number>()
  for (const s of scores) ratingOf.set(`${s.round}|${s.playerId}`, s.rating)

  return teams
    .map((t) => {
      const picks: Record<string, PitchPlayer> = {}
      for (const p of t.picks) {
        const base = PLAYER_BY_ID.get(p.playerId)
        if (base) picks[p.slot] = { ...base, rating: ratingOf.get(`${t.round}|${p.playerId}`) ?? null }
      }
      const mine = rounds.get(t.round)?.find((s) => s.userId === userId)
      return {
        round: t.round,
        label: KO_LABEL[t.round] ?? t.round,
        formation: t.formation as Formation,
        picks,
        complete: t.picks.length === 7,
        scored: !!mine,
        score: mine?.score ?? null,
        avg: mine ? mine.score / 7 : null,
        position: mine?.position ?? null,
        points: mine?.points ?? null,
      }
    })
    .sort((a, b) => KO_ORDER.indexOf(a.round) - KO_ORDER.indexOf(b.round))
}
