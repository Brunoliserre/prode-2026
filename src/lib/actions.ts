"use server"

import { revalidatePath } from "next/cache"
import { auth } from "./auth"
import { prisma } from "./prisma"
import { calcPoints } from "./utils"

// ── Predictions ────────────────────────────────────────────────────────────────

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

  revalidatePath("/fixtures")
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
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    throw new Error("No autorizado")
  }

  const homeTeam = (formData.get("homeTeam") as string).trim()
  const awayTeam = (formData.get("awayTeam") as string).trim()
  const matchDate = new Date(formData.get("matchDate") as string)
  const group = (formData.get("group") as string | null)?.trim() || null
  const matchdayRaw = formData.get("matchday") as string | null
  const matchday = matchdayRaw ? Number(matchdayRaw) : null

  if (!homeTeam || !awayTeam || isNaN(matchDate.getTime())) {
    throw new Error("Datos inválidos")
  }

  await prisma.fixture.create({
    data: { homeTeam, awayTeam, matchDate, group, matchday },
  })

  revalidatePath("/admin")
  revalidatePath("/fixtures")
}

// ── Admin: results ─────────────────────────────────────────────────────────────

export async function setFixtureResult(formData: FormData) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    throw new Error("No autorizado")
  }

  const fixtureId = formData.get("fixtureId") as string
  const homeScore = Number(formData.get("homeScore"))
  const awayScore = Number(formData.get("awayScore"))

  if (!fixtureId || isNaN(homeScore) || isNaN(awayScore)) {
    throw new Error("Datos inválidos")
  }

  await prisma.fixture.update({
    where: { id: fixtureId },
    data: { homeScore, awayScore },
  })

  const predictions = await prisma.prediction.findMany({ where: { fixtureId } })

  await Promise.all(
    predictions.map((p) =>
      prisma.prediction.update({
        where: { id: p.id },
        data: { points: calcPoints(homeScore, awayScore, p.homeScore, p.awayScore) },
      }),
    ),
  )

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/fixtures")
}
