import { prisma } from "./prisma"
import { plenoValue } from "./utils"
import { PLAYER_BY_ID } from "./dreamteam-mock"
import type { Formation, Pos } from "./formations"
import type { PitchPlayer } from "@/components/DreamTeamPitch"

// Rondas del Dream Team. El 3er puesto y la final se juegan como UNA sola fecha
// ("FINAL"), para que con 4 equipos vivos siga entrando el tope de 2 por equipo.
export const KO_ORDER = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"]
export const KO_LABEL: Record<string, string> = {
  LAST_32: "16vos", LAST_16: "8vos", QUARTER_FINALS: "4tos",
  SEMI_FINALS: "Semis", FINAL: "Final y 3er puesto",
}

// Fixtures (stages reales) que componen cada ronda del Dream Team.
const ROUND_STAGES: Record<string, string[]> = {
  LAST_32: ["LAST_32"], LAST_16: ["LAST_16"], QUARTER_FINALS: ["QUARTER_FINALS"],
  SEMI_FINALS: ["SEMI_FINALS"], FINAL: ["FINAL", "THIRD_PLACE"],
}
export const stagesForRound = (round: string): string[] => ROUND_STAGES[round] ?? [round]
// stage real → ronda del Dream Team.
const ROUND_OF_STAGE = new Map<string, string>()
for (const r of KO_ORDER) for (const s of stagesForRound(r)) ROUND_OF_STAGE.set(s, r)

// Ronda activa: la primera (en orden) con algún partido sin jugar; si están
// todas jugadas, la última presente. Sin eliminatorias → LAST_32.
export async function currentRound(): Promise<string> {
  const ko = await prisma.fixture.findMany({
    where: { stage: { notIn: ["GROUP_STAGE"] }, NOT: { stage: null } },
    select: { stage: true, homeScore: true, awayScore: true },
  })
  const present = KO_ORDER.filter((r) => stagesForRound(r).some((s) => ko.some((f) => f.stage === s)))
  return (
    present.find((r) =>
      stagesForRound(r).some((s) => ko.some((f) => f.stage === s && (f.homeScore == null || f.awayScore == null))),
    ) ??
    present[present.length - 1] ??
    "LAST_32"
  )
}

// Puntos por puesto en cada ronda finalizada. El 1º vale el PLENO de esa ronda
// (8 en 16vos … 12 en la final); el 2º es −2 y de ahí −1 por puesto (3º −3, 4º −4,
// … 7º y siguientes −7). La relación entre puestos es la misma en todas las fases,
// desplazada según el pleno. No participar: nada.
const rankOffset = (rank: number) => (rank === 1 ? 0 : Math.min(rank, 7))
const ptsForRank = (rank: number, round: string) => plenoValue(round) - rankOffset(rank)

export type RoundStanding = { userId: string; score: number; position: number; points: number }

// Rondas finalizadas (cerradas por el admin). Solo esas otorgan puntos.
export async function finalizedRounds(): Promise<Set<string>> {
  const rows = await prisma.dreamRound.findMany({ where: { finalized: true }, select: { round: true } })
  return new Set(rows.map((r) => r.round))
}

// Standings por ronda — SOLO rondas finalizadas. Por ronda: suma de los 7 ratings
// define el puesto; los puntos salen de ptsForRank (1º = pleno, 2º −2, y −1 por puesto).
// Empates comparten puesto y puntos. Solo equipos completos (7).
async function computeRounds(): Promise<Map<string, RoundStanding[]>> {
  const [teams, scores, finalized] = await Promise.all([
    prisma.dreamTeam.findMany({ include: { picks: true } }),
    prisma.playerScore.findMany(),
    finalizedRounds(),
  ])
  const ratingOf = new Map<string, number>()
  for (const s of scores) ratingOf.set(`${s.round}|${s.playerId}`, s.rating)

  const byRound = new Map<string, typeof teams>()
  for (const t of teams) {
    if (!byRound.has(t.round)) byRound.set(t.round, [])
    byRound.get(t.round)!.push(t)
  }

  const result = new Map<string, RoundStanding[]>()
  for (const [round, dts] of byRound) {
    if (!finalized.has(round)) continue
    const ranked = dts
      .filter((t) => t.picks.length === 7)
      .map((t) => ({
        userId: t.userId,
        score: t.picks.reduce((s, p) => s + (ratingOf.get(`${round}|${p.playerId}`) ?? 0), 0),
      }))
      .sort((a, b) => b.score - a.score)

    const standings: RoundStanding[] = []
    let i = 0
    while (i < ranked.length) {
      let j = i
      while (j + 1 < ranked.length && ranked[j + 1].score === ranked[i].score) j++
      const points = ptsForRank(i + 1, round)
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
  finalized: boolean // si la fecha ya cerró (puntos oficiales)
  score: number | null // suma de ratings de los que ya jugaron (provisorio)
  avg: number | null // promedio de los que ya jugaron
  position: number | null // solo si la fecha cerró
  points: number | null // solo si la fecha cerró
}
export async function myDreamTeams(userId: string): Promise<MyDreamTeam[]> {
  const [teams, scores, rounds, finalized] = await Promise.all([
    prisma.dreamTeam.findMany({ where: { userId }, include: { picks: true } }),
    prisma.playerScore.findMany(),
    computeRounds(),
    finalizedRounds(),
  ])
  const ratingOf = new Map<string, number>()
  for (const s of scores) ratingOf.set(`${s.round}|${s.playerId}`, s.rating)

  return teams
    .map((t) => {
      const picks: Record<string, PitchPlayer> = {}
      const loaded: number[] = []
      for (const p of t.picks) {
        const r = ratingOf.get(`${t.round}|${p.playerId}`) ?? null
        if (r != null) loaded.push(r)
        const base = PLAYER_BY_ID.get(p.playerId)
        if (base) picks[p.slot] = { ...base, rating: r }
      }
      const sum = loaded.reduce((a, b) => a + b, 0)
      const mine = rounds.get(t.round)?.find((s) => s.userId === userId)
      return {
        round: t.round,
        label: KO_LABEL[t.round] ?? t.round,
        formation: t.formation as Formation,
        picks,
        complete: t.picks.length === 7,
        finalized: finalized.has(t.round),
        score: loaded.length ? sum : null,
        avg: loaded.length ? sum / loaded.length : null,
        position: mine?.position ?? null,
        points: mine?.points ?? null,
      }
    })
    .sort((a, b) => KO_ORDER.indexOf(a.round) - KO_ORDER.indexOf(b.round))
}

// "Dream teams de los demás": por cada ronda ya revelada, los equipos de todos.
// Una ronda se revela cuando TODOS sus partidos ya empezaron (o el admin la
// cerró), para no filtrar picks de equipos que todavía no jugaron.
export type OthersTeam = {
  userId: string
  name: string | null
  image: string | null
  formation: Formation
  picks: Record<string, PitchPlayer>
  complete: boolean
  score: number | null // suma de ratings ya cargados
  position: number | null // si la ronda está finalizada
  points: number | null
}
export type OthersRound = { round: string; label: string; finalized: boolean; teams: OthersTeam[] }

export async function othersDreamTeams(): Promise<OthersRound[]> {
  const now = new Date()
  const [teams, scores, koFixtures, rounds, finalized] = await Promise.all([
    prisma.dreamTeam.findMany({ include: { picks: true, user: { select: { id: true, name: true, image: true } } } }),
    prisma.playerScore.findMany(),
    prisma.fixture.findMany({
      where: { stage: { notIn: ["GROUP_STAGE"] }, NOT: { stage: null } },
      select: { stage: true, matchDate: true },
    }),
    computeRounds(),
    finalizedRounds(),
  ])
  const ratingOf = new Map<string, number>()
  for (const s of scores) ratingOf.set(`${s.round}|${s.playerId}`, s.rating)

  // Rondas reveladas: todos sus partidos empezaron, o fue finalizada.
  const fixturesByRound = new Map<string, Date[]>()
  for (const f of koFixtures) {
    if (!f.stage) continue
    const round = ROUND_OF_STAGE.get(f.stage) ?? f.stage
    if (!fixturesByRound.has(round)) fixturesByRound.set(round, [])
    fixturesByRound.get(round)!.push(f.matchDate)
  }
  const revealed = (round: string) =>
    finalized.has(round) ||
    (fixturesByRound.has(round) && fixturesByRound.get(round)!.every((d) => d <= now))

  const byRound = new Map<string, typeof teams>()
  for (const t of teams) {
    if (!byRound.has(t.round)) byRound.set(t.round, [])
    byRound.get(t.round)!.push(t)
  }

  const out: OthersRound[] = []
  for (const round of KO_ORDER) {
    if (!revealed(round)) continue
    const dts = byRound.get(round)
    if (!dts?.length) continue
    const standings = rounds.get(round)
    const rows: OthersTeam[] = dts.map((t) => {
      const picks: Record<string, PitchPlayer> = {}
      const loaded: number[] = []
      for (const p of t.picks) {
        const r = ratingOf.get(`${round}|${p.playerId}`) ?? null
        if (r != null) loaded.push(r)
        const base = PLAYER_BY_ID.get(p.playerId)
        if (base) picks[p.slot] = { ...base, rating: r }
      }
      const mine = standings?.find((s) => s.userId === t.userId)
      return {
        userId: t.userId,
        name: t.user.name,
        image: t.user.image,
        formation: t.formation as Formation,
        picks,
        complete: t.picks.length === 7,
        score: loaded.length ? loaded.reduce((a, b) => a + b, 0) : null,
        position: mine?.position ?? null,
        points: mine?.points ?? null,
      }
    })
    // Ordenar: por puesto si está finalizada, si no por score provisorio, luego nombre.
    rows.sort(
      (a, b) =>
        (a.position ?? 99) - (b.position ?? 99) ||
        (b.score ?? -1) - (a.score ?? -1) ||
        (a.name ?? "").localeCompare(b.name ?? ""),
    )
    out.push({ round, label: KO_LABEL[round] ?? round, finalized: finalized.has(round), teams: rows })
  }
  // Más nuevas primero (Final … 16vos).
  return out.reverse()
}

// Estadísticas del dream team: jugadores más elegidos y mejores puntajes.
export type PickStat = {
  playerId: string; name: string; club: string; position: Pos
  count: number // veces elegido (todas las rondas)
  rounds: string[] // etiquetas de rondas en las que fue elegido
  photoUrl: string | null
}
export type RatingStat = {
  playerId: string; name: string; club: string; position: Pos
  round: string; roundLabel: string; rating: number
  picks: number // en cuántos equipos estuvo esa ronda
  photoUrl: string | null
}

export async function dreamTeamStats(): Promise<{ mostPicked: PickStat[]; topRated: RatingStat[] }> {
  const [picks, scores] = await Promise.all([
    prisma.dreamTeamPick.findMany({ include: { dreamTeam: { select: { round: true } } } }),
    prisma.playerScore.findMany(),
  ])

  // Veces elegido por jugador (total) + rondas; y por (ronda,jugador) para anotar.
  const byPlayer = new Map<string, { count: number; rounds: Set<string> }>()
  const byRoundPlayer = new Map<string, number>()
  for (const p of picks) {
    const round = p.dreamTeam.round
    const agg = byPlayer.get(p.playerId) ?? { count: 0, rounds: new Set<string>() }
    agg.count++
    agg.rounds.add(round)
    byPlayer.set(p.playerId, agg)
    byRoundPlayer.set(`${round}|${p.playerId}`, (byRoundPlayer.get(`${round}|${p.playerId}`) ?? 0) + 1)
  }

  const mostPicked: PickStat[] = []
  for (const [playerId, { count, rounds }] of byPlayer) {
    const base = PLAYER_BY_ID.get(playerId)
    if (!base) continue
    mostPicked.push({
      playerId, name: base.name, club: base.club, position: base.position,
      count,
      rounds: [...rounds].sort((a, b) => KO_ORDER.indexOf(a) - KO_ORDER.indexOf(b)).map((r) => KO_LABEL[r] ?? r),
      photoUrl: base.photoUrl ?? null,
    })
  }
  mostPicked.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const topRated: RatingStat[] = []
  for (const s of scores) {
    const base = PLAYER_BY_ID.get(s.playerId)
    if (!base) continue
    topRated.push({
      playerId: s.playerId, name: base.name, club: base.club, position: base.position,
      round: s.round, roundLabel: KO_LABEL[s.round] ?? s.round, rating: s.rating,
      picks: byRoundPlayer.get(`${s.round}|${s.playerId}`) ?? 0,
      photoUrl: base.photoUrl ?? null,
    })
  }
  topRated.sort((a, b) => b.rating - a.rating || b.picks - a.picks || a.name.localeCompare(b.name))

  return { mostPicked, topRated }
}
