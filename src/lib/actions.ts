"use server"

import { revalidatePath } from "next/cache"
import { auth } from "./auth"
import { prisma } from "./prisma"
import { calcPoints, PICK_POINTS, TOURNAMENT_START } from "./utils"
import { stagesForRound } from "./dreamteam-scoring"
import { FORMATIONS, lineCounts, type Formation, type Pos } from "./formations"
import { announcementEmail, joinRequestEmail, reminderEmail, sendAdminEmail, sendBulkEmail } from "./email"

// ── Admin: email ───────────────────────────────────────────────────────────────

export async function sendReminderEmail() {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")

  const users = await prisma.user.findMany({ select: { email: true, name: true } })
  return sendBulkEmail(users, (u) => reminderEmail(u.name))
}

export async function sendAnnouncementEmail(subject: string, body: string) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")

  if (!subject.trim() || !body.trim()) throw new Error("Asunto y mensaje son obligatorios")

  const users = await prisma.user.findMany({ select: { email: true, name: true } })
  return sendBulkEmail(users, (u) => announcementEmail(u.name, subject, body))
}

// ── Admin: users ───────────────────────────────────────────────────────────────

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")
  if (session.user?.id === userId) throw new Error("No podés eliminarte a vos mismo")

  await prisma.prediction.deleteMany({ where: { userId } })
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath("/admin")
  revalidatePath("/")
}

// Admin: mark whether a user transferred their entry money (pozo)
export async function setUserPaid(userId: string, paid: boolean) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")

  await prisma.user.update({ where: { id: userId }, data: { hasPaid: paid } })

  revalidatePath("/")
  revalidatePath("/admin")
}

// User: raise a hand to join the pozo — flags the user and notifies the admin
export async function requestToJoinPozo() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autenticado")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error("Usuario no encontrado")
  if (user.hasPaid) throw new Error("Ya estás participando del pozo")
  if (user.wantsToJoin) return // already requested, don't spam the admin

  await prisma.user.update({
    where: { id: user.id },
    data: { wantsToJoin: true },
  })

  // Best-effort: the request is saved even if the email fails
  try {
    const { subject, html } = joinRequestEmail(user.name, user.email)
    await sendAdminEmail(subject, html)
  } catch {}

  revalidatePath("/")
  revalidatePath("/admin")
}

// ── Match Predictions ──────────────────────────────────────────────────────────

export async function submitPrediction(
  fixtureId: string,
  homeScore: number,
  awayScore: number,
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autenticado")

  const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } })
  if (!fixture) throw new Error("Partido no encontrado")
  if (new Date(fixture.matchDate) <= new Date()) {
    throw new Error("El partido ya comenzó")
  }

  await prisma.prediction.upsert({
    where: { userId_fixtureId: { userId: session.user.id, fixtureId } },
    update: { homeScore, awayScore, points: 0 },
    create: { userId: session.user.id, fixtureId, homeScore, awayScore },
  })

  revalidatePath("/predicciones")
}

// Everyone's predictions for a fixture — only visible once the match started,
// so nobody can copy picks before kickoff
export async function getFixturePredictions(fixtureId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autenticado")

  const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } })
  if (!fixture) throw new Error("Partido no encontrado")
  if (new Date(fixture.matchDate) > new Date()) {
    throw new Error("El partido todavía no comenzó")
  }

  const predictions = await prisma.prediction.findMany({
    where: { fixtureId },
    select: {
      homeScore: true,
      awayScore: true,
      points: true,
      user: { select: { id: true, name: true, image: true } },
    },
  })

  return predictions
    .map((p) => ({
      userId: p.user.id,
      name: p.user.name,
      image: p.user.image,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      points: p.points,
    }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
}

// ── Tournament Picks ───────────────────────────────────────────────────────────

export async function saveTournamentPicks(picks: Record<string, string>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autenticado")
  if (new Date() >= TOURNAMENT_START) {
    throw new Error("Las predicciones del torneo están cerradas: el Mundial ya comenzó")
  }

  const validCategories = Object.keys(PICK_POINTS)

  await Promise.all(
    Object.entries(picks)
      .filter(([cat, val]) => validCategories.includes(cat) && val.trim())
      .map(([category, value]) =>
        prisma.tournamentPick.upsert({
          where: { userId_category: { userId: session.user.id, category } },
          update: { value: value.trim(), points: 0 },
          create: { userId: session.user.id, category, value: value.trim() },
        }),
      ),
  )

  revalidatePath("/predicciones")
  revalidatePath("/")
  revalidatePath("/profile")
}

// Admin: edit any user's tournament picks (for users who forgot to fill them).
// Empty values delete the pick.
export async function adminSaveUserPicks(userId: string, picks: Record<string, string>) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("Usuario no encontrado")

  const validCategories = Object.keys(PICK_POINTS)

  await Promise.all(
    Object.entries(picks)
      .filter(([cat]) => validCategories.includes(cat))
      .map(([category, value]) =>
        value.trim()
          ? prisma.tournamentPick.upsert({
              where: { userId_category: { userId, category } },
              update: { value: value.trim(), points: 0 },
              create: { userId, category, value: value.trim() },
            })
          : prisma.tournamentPick.deleteMany({ where: { userId, category } }),
      ),
  )

  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/predicciones")
}

// Admin: award points to all users who picked the correct value for a category
export async function awardTournamentPoints(category: string, correctValue: string) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")

  const pts = PICK_POINTS[category]
  if (!pts) throw new Error("Categoría inválida")

  const normalize = (s: string) => s.trim().toLowerCase()

  const picks = await prisma.tournamentPick.findMany({ where: { category } })

  await Promise.all(
    picks.map((p) =>
      prisma.tournamentPick.update({
        where: { id: p.id },
        data: { points: normalize(p.value) === "n/a" ? 0 : normalize(p.value) === normalize(correctValue) ? pts : 0 },
      }),
    ),
  )

  // Guardar el resultado real para poder mostrarlo aunque nadie lo haya acertado.
  await prisma.tournamentResult.upsert({
    where: { category },
    create: { category, value: correctValue },
    update: { value: correctValue },
  })

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/profile")
}

// ── Profile ────────────────────────────────────────────────────────────────────

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autenticado")

  const name = (formData.get("name") as string).trim()
  const image = (formData.get("image") as string).trim() || null

  if (!name) throw new Error("El nombre no puede estar vacío")

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, image },
  })

  revalidatePath("/", "layout")
}

// ── Admin: fixtures ────────────────────────────────────────────────────────────

export async function createFixture(formData: FormData) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")

  const homeTeam = (formData.get("homeTeam") as string).trim()
  const awayTeam = (formData.get("awayTeam") as string).trim()
  const matchDate = new Date(formData.get("matchDate") as string)
  const group = (formData.get("group") as string | null)?.trim() || null
  const matchdayRaw = formData.get("matchday") as string | null
  const matchday = matchdayRaw ? Number(matchdayRaw) : null

  if (!homeTeam || !awayTeam || isNaN(matchDate.getTime())) throw new Error("Datos inválidos")

  await prisma.fixture.create({
    data: { homeTeam, awayTeam, matchDate, group, matchday },
  })

  revalidatePath("/admin")
  revalidatePath("/predicciones")
}

// ── Admin: results ─────────────────────────────────────────────────────────────

export async function setFixtureResult(formData: FormData) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")

  const fixtureId = formData.get("fixtureId") as string
  const homeScore = Number(formData.get("homeScore"))
  const awayScore = Number(formData.get("awayScore"))

  if (!fixtureId || isNaN(homeScore) || isNaN(awayScore)) throw new Error("Datos inválidos")

  // Penales (opcional): solo aplican en mata-mata que terminó empatado en el
  // tiempo regular. Se guardan aparte; el puntaje se calcula con el regular.
  const rawHomePens = formData.get("homePens")
  const rawAwayPens = formData.get("awayPens")
  const homePens = rawHomePens != null && rawHomePens !== "" ? Number(rawHomePens) : null
  const awayPens = rawAwayPens != null && rawAwayPens !== "" ? Number(rawAwayPens) : null
  if ((homePens != null && isNaN(homePens)) || (awayPens != null && isNaN(awayPens)))
    throw new Error("Penales inválidos")

  const fixture = await prisma.fixture.update({
    where: { id: fixtureId },
    data: { homeScore, awayScore, homePens, awayPens },
  })

  const predictions = await prisma.prediction.findMany({ where: { fixtureId } })

  await Promise.all(
    predictions.map((p) =>
      prisma.prediction.update({
        where: { id: p.id },
        data: { points: calcPoints(homeScore, awayScore, p.homeScore, p.awayScore, fixture.stage) },
      }),
    ),
  )

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/predicciones")
}

// ── Dream Team ───────────────────────────────────────────────────────────────────

// Guarda (o reemplaza) el dream team del usuario para una ronda.
export async function saveDreamTeam(
  round: string,
  formation: string,
  picks: { slot: string; playerId: string }[],
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")
  const userId = session.user.id

  if (!FORMATIONS.includes(formation as Formation)) throw new Error("Formación inválida")
  const counts = lineCounts(formation as Formation)
  const validSlots = new Set<string>()
  for (const pos of ["GK", "DEF", "MED", "FWD"] as Pos[])
    for (let i = 0; i < counts[pos]; i++) validSlots.add(`${pos}${i}`)

  const seen = new Set<string>()
  for (const p of picks) {
    if (!validSlots.has(p.slot)) throw new Error(`Slot inválido: ${p.slot}`)
    if (seen.has(p.slot)) throw new Error("Slot repetido")
    seen.add(p.slot)
  }

  const teamOf = (pid: string) => pid.slice(0, pid.lastIndexOf("-"))

  const now = new Date()
  const rf = await prisma.fixture.findMany({
    where: { stage: { in: stagesForRound(round) } },
    select: { homeTeam: true, awayTeam: true, matchDate: true },
  })

  // Máximo 2 jugadores por equipo (solo si la ronda tiene al menos 4 equipos; en
  // fases con menos no alcanzarían para 7 y se relaja).
  const roundTeams = new Set(rf.flatMap((f) => [f.homeTeam, f.awayTeam]))
  if (roundTeams.size >= 4) {
    const perTeam = new Map<string, number>()
    for (const p of picks) {
      const t = teamOf(p.playerId)
      const n = (perTeam.get(t) ?? 0) + 1
      perTeam.set(t, n)
      if (n > 2) throw new Error("Máximo 2 jugadores por equipo")
    }
  }

  // Lock por equipo: no se pueden modificar jugadores de equipos cuyo partido
  // de esta ronda ya arrancó.
  const lockedTeams = new Set(
    rf.filter((f) => f.matchDate <= now).flatMap((f) => [f.homeTeam, f.awayTeam]),
  )
  if (lockedTeams.size) {
    const prev = await prisma.dreamTeam.findUnique({
      where: { userId_round: { userId, round } },
      include: { picks: true },
    })
    const lockedMap = (ps: { slot: string; playerId: string }[]) => {
      const m = new Map<string, string>()
      for (const p of ps) if (lockedTeams.has(teamOf(p.playerId))) m.set(p.slot, p.playerId)
      return m
    }
    const before = lockedMap(prev?.picks ?? [])
    const after = lockedMap(picks)
    const same =
      before.size === after.size && [...before].every(([s, id]) => after.get(s) === id)
    if (!same) throw new Error("No se pueden modificar jugadores de equipos cuyo partido ya empezó")
  }

  const dt = await prisma.dreamTeam.upsert({
    where: { userId_round: { userId, round } },
    update: { formation },
    create: { userId, round, formation },
  })
  await prisma.dreamTeamPick.deleteMany({ where: { dreamTeamId: dt.id } })
  if (picks.length)
    await prisma.dreamTeamPick.createMany({
      data: picks.map((p) => ({ dreamTeamId: dt.id, slot: p.slot, playerId: p.playerId })),
    })

  revalidatePath("/dreamteam")
  revalidatePath("/") // el total del ranking incluye los puntos del dream team
}

// Admin: carga/actualiza los ratings (FotMob) de jugadores en una ronda.
export async function saveDreamPlayerScores(
  round: string,
  scores: { playerId: string; rating: number | null }[],
) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")

  for (const s of scores) {
    if (s.rating == null || Number.isNaN(s.rating)) {
      await prisma.playerScore.deleteMany({ where: { round, playerId: s.playerId } })
    } else {
      await prisma.playerScore.upsert({
        where: { round_playerId: { round, playerId: s.playerId } },
        update: { rating: s.rating },
        create: { round, playerId: s.playerId, rating: s.rating },
      })
    }
  }

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/dreamteam")
}

// Admin: finaliza (o reabre) una ronda del dream team. Solo al finalizar se
// calculan los puestos y los puntos suman al total.
export async function setDreamRoundFinalized(round: string, finalized: boolean) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) throw new Error("No autorizado")

  await prisma.dreamRound.upsert({
    where: { round },
    update: { finalized },
    create: { round, finalized },
  })

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/dreamteam")
}
