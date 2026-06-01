import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calcPoints } from "@/lib/utils"

const API_TO_LOCAL: Record<string, string> = {
  "United States": "USA",
  "Côte d'Ivoire": "Ivory Coast",
  "Korea Republic": "South Korea",
  "IR Iran": "Iran",
  Türkiye: "Turkey",
  "Bosnia-Herzegovina": "Bosnia",
}

function localName(apiName: string): string {
  return API_TO_LOCAL[apiName] ?? apiName
}

function normalize(name: string): string {
  return localName(name).toLowerCase()
}

type ApiMatch = {
  utcDate: string
  status: string
  matchday: number | null
  group: string | null
  stage: string
  homeTeam: { name: string | null }
  awayTeam: { name: string | null }
  score: { fullTime: { home: number | null; away: number | null } }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const isCron =
    cronSecret != null &&
    cronSecret !== "" &&
    req.headers.get("authorization") === `Bearer ${cronSecret}`

  if (!isCron) {
    const session = await auth()
    if (session?.user?.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "FOOTBALL_DATA_API_KEY no configurada" }, { status: 500 })
  }

  const apiRes = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
    { headers: { "X-Auth-Token": apiKey }, cache: "no-store" },
  )

  if (!apiRes.ok) {
    const text = await apiRes.text()
    return NextResponse.json(
      { error: `Error de la API (${apiRes.status}): ${text}` },
      { status: 502 },
    )
  }

  const data = await apiRes.json()
  const matches: ApiMatch[] = data.matches ?? []

  // Load all existing fixtures once for comparison
  const existing = await prisma.fixture.findMany()

  let created = 0
  let resultsUpdated = 0

  for (const m of matches) {
    if (!m.homeTeam.name || !m.awayTeam.name) continue

    const home = localName(m.homeTeam.name)
    const away = localName(m.awayTeam.name)
    const matchDate = new Date(m.utcDate)
    // "GROUP_A" → "A", knockout stages → null
    const group = m.group?.startsWith("GROUP_") ? m.group.replace("GROUP_", "") : null
    const matchday = m.matchday ?? null
    const homeScore = m.score?.fullTime?.home ?? null
    const awayScore = m.score?.fullTime?.away ?? null
    const finished = m.status === "FINISHED"

    const fixture = existing.find(
      (f) =>
        normalize(f.homeTeam) === normalize(home) &&
        normalize(f.awayTeam) === normalize(away),
    )

    if (!fixture) {
      // Create new fixture
      await prisma.fixture.create({
        data: {
          homeTeam: home,
          awayTeam: away,
          matchDate,
          group,
          matchday,
          stage: m.stage ?? null,
          homeScore: finished ? homeScore : null,
          awayScore: finished ? awayScore : null,
        },
      })
      created++
    } else if (finished && homeScore != null && awayScore != null) {
      // Update result if not already set or different
      if (fixture.homeScore !== homeScore || fixture.awayScore !== awayScore) {
        await prisma.fixture.update({
          where: { id: fixture.id },
          data: { homeScore, awayScore },
        })

        // Recalculate points for all predictions of this fixture
        const predictions = await prisma.prediction.findMany({
          where: { fixtureId: fixture.id },
        })
        await Promise.all(
          predictions.map((p) =>
            prisma.prediction.update({
              where: { id: p.id },
              data: { points: calcPoints(homeScore, awayScore, p.homeScore, p.awayScore) },
            }),
          ),
        )
        resultsUpdated++
      }
    }
  }

  revalidatePath("/")
  revalidatePath("/fixtures")
  revalidatePath("/admin")

  return NextResponse.json({
    created,
    resultsUpdated,
    checked: matches.length,
  })
}
