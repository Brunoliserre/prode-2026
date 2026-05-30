import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calcPoints } from "@/lib/utils"

// Maps football-data.org team names → local seed names
const API_TO_LOCAL: Record<string, string> = {
  "United States": "USA",
  "Côte d'Ivoire": "Ivory Coast",
  "Korea Republic": "South Korea",
  "IR Iran": "Iran",
  Türkiye: "Turkey",
  "Bosnia-Herzegovina": "Bosnia",
}

function normalize(name: string): string {
  return (API_TO_LOCAL[name] ?? name).toLowerCase()
}

export async function GET(req: NextRequest) {
  // Accept either an admin session or the Vercel cron secret
  const cronSecret = process.env.CRON_SECRET
  const isCron =
    cronSecret != null &&
    req.headers.get("authorization") === `Bearer ${cronSecret}`

  if (!isCron) {
    const session = await auth()
    if (session?.user?.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY no configurada" },
      { status: 500 },
    )
  }

  const apiRes = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED&season=2026",
    {
      headers: { "X-Auth-Token": apiKey },
      cache: "no-store",
    },
  )

  if (!apiRes.ok) {
    const text = await apiRes.text()
    return NextResponse.json(
      { error: `Error de la API externa (${apiRes.status}): ${text}` },
      { status: 502 },
    )
  }

  const data = await apiRes.json()
  const matches: unknown[] = data.matches ?? []

  const pending = await prisma.fixture.findMany({ where: { homeScore: null } })

  let updated = 0

  for (const match of matches) {
    const m = match as {
      homeTeam: { name: string }
      awayTeam: { name: string }
      score: { fullTime: { home: number | null; away: number | null } }
    }

    const homeScore = m.score?.fullTime?.home
    const awayScore = m.score?.fullTime?.away
    if (homeScore == null || awayScore == null) continue

    const homeNorm = normalize(m.homeTeam.name)
    const awayNorm = normalize(m.awayTeam.name)

    const fixture = pending.find(
      (f) =>
        normalize(f.homeTeam) === homeNorm &&
        normalize(f.awayTeam) === awayNorm,
    )
    if (!fixture) continue

    await prisma.fixture.update({
      where: { id: fixture.id },
      data: { homeScore, awayScore },
    })

    const predictions = await prisma.prediction.findMany({
      where: { fixtureId: fixture.id },
    })

    await Promise.all(
      predictions.map((p) =>
        prisma.prediction.update({
          where: { id: p.id },
          data: {
            points: calcPoints(homeScore, awayScore, p.homeScore, p.awayScore),
          },
        }),
      ),
    )

    updated++
  }

  if (updated > 0) {
    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/fixtures")
  }

  return NextResponse.json({ updated, checked: matches.length })
}
