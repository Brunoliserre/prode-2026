import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calcPoints } from "@/lib/utils"

// ESPN scoreboard: sin API key y publica los resultados apenas termina el
// partido (football-data.org free tier los demora — el inaugural seguía
// sin score 30' después del final)
const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=300"

// Maps API team names → local seed names
const API_TO_LOCAL: Record<string, string> = {
  "United States": "USA",
  "Côte d'Ivoire": "Ivory Coast",
  "Korea Republic": "South Korea",
  "IR Iran": "Iran",
  Türkiye: "Turkey",
  "Bosnia-Herzegovina": "Bosnia",
  "Cabo Verde": "Cape Verde",
  "Cape Verde Islands": "Cape Verde",
  Czechia: "Czech Republic",
  "Congo DR": "DR Congo",
}

function normalize(name: string): string {
  return (API_TO_LOCAL[name] ?? name).toLowerCase()
}

function sameUtcDay(a: Date, b: Date): boolean {
  return Math.abs(a.getTime() - b.getTime()) < 24 * 60 * 60 * 1000
}

type EspnEvent = {
  date: string
  status: { type: { completed: boolean; name: string } }
  competitions: {
    competitors: {
      homeAway: "home" | "away"
      score?: string
      team: { displayName: string }
    }[]
  }[]
}

export async function GET(req: NextRequest) {
  // Accept either an admin session or the cron secret
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

  const apiRes = await fetch(ESPN_URL, { cache: "no-store" })

  if (!apiRes.ok) {
    const text = await apiRes.text()
    return NextResponse.json(
      { error: `Error de la API externa (${apiRes.status}): ${text.slice(0, 200)}` },
      { status: 502 },
    )
  }

  const data = await apiRes.json()
  const events: EspnEvent[] = data.events ?? []

  const fixtures = await prisma.fixture.findMany()

  let updated = 0
  let finished = 0
  const unmatched: string[] = []

  for (const ev of events) {
    if (!ev.status?.type?.completed) continue

    const competitors = ev.competitions?.[0]?.competitors ?? []
    const home = competitors.find((c) => c.homeAway === "home")
    const away = competitors.find((c) => c.homeAway === "away")
    if (!home || !away) continue

    let homeScore = Number(home.score)
    let awayScore = Number(away.score)
    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) continue

    finished++

    const evDate = new Date(ev.date)
    const homeNorm = normalize(home.team.displayName)
    const awayNorm = normalize(away.team.displayName)

    let fixture = fixtures.find(
      (f) =>
        normalize(f.homeTeam) === homeNorm &&
        normalize(f.awayTeam) === awayNorm &&
        sameUtcDay(new Date(f.matchDate), evDate),
    )
    // Same pairing but home/away swapped in the DB
    if (!fixture) {
      fixture = fixtures.find(
        (f) =>
          normalize(f.homeTeam) === awayNorm &&
          normalize(f.awayTeam) === homeNorm &&
          sameUtcDay(new Date(f.matchDate), evDate),
      )
      if (fixture) [homeScore, awayScore] = [awayScore, homeScore]
    }

    if (!fixture) {
      unmatched.push(`${home.team.displayName} vs ${away.team.displayName}`)
      continue
    }
    if (fixture.homeScore === homeScore && fixture.awayScore === awayScore) continue

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
            points: calcPoints(homeScore, awayScore, p.homeScore, p.awayScore, fixture.stage),
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
    revalidatePath("/predicciones")
  }

  return NextResponse.json({ updated, checked: finished, unmatched })
}
