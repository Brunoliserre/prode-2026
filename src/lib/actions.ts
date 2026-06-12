"use server"

import { revalidatePath } from "next/cache"
import { auth } from "./auth"
import { prisma } from "./prisma"
import { calcPoints, PICK_POINTS, TOURNAMENT_START } from "./utils"
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

  const fixture = await prisma.fixture.update({
    where: { id: fixtureId },
    data: { homeScore, awayScore },
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
