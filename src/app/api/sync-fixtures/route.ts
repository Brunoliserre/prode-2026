import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Importa el calendario desde ESPN (misma fuente que "Sincronizar resultados").
// Este endpoint SOLO importa partidos (equipos, fecha, fase). NO toca resultados
// ni penales: de eso se encarga /api/sync-results (que separa la tanda) o la
// carga manual. Así este botón nunca puede romper el puntaje.
const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=400"

// Nombres de la API → nombres locales (seed).
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

// season.slug de ESPN → nuestra etapa.
const SLUG_TO_STAGE: Record<string, string> = {
  "group-stage": "GROUP_STAGE",
  "round-of-32": "LAST_32",
  "round-of-16": "LAST_16",
  quarterfinals: "QUARTER_FINALS",
  semifinals: "SEMI_FINALS",
  "3rd-place-match": "THIRD_PLACE",
  final: "FINAL",
}

const localName = (apiName: string) => API_TO_LOCAL[apiName] ?? apiName
const normalize = (name: string) => localName(name).toLowerCase()
// Equipos aún indefinidos vienen como "Quarterfinal 2 Winner", "Semifinal 1 Loser", etc.
const isPlaceholder = (name: string) => /winner|loser|runner/i.test(name)

type EspnEvent = {
  date: string
  season?: { slug?: string }
  competitions: {
    competitors: {
      homeAway: "home" | "away"
      team: { displayName: string }
    }[]
  }[]
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

  const existing = await prisma.fixture.findMany()

  let created = 0
  let skipped = 0

  for (const ev of events) {
    const competitors = ev.competitions?.[0]?.competitors ?? []
    const home = competitors.find((c) => c.homeAway === "home")
    const away = competitors.find((c) => c.homeAway === "away")
    if (!home || !away) continue

    const homeApi = home.team.displayName
    const awayApi = away.team.displayName
    // Partidos con equipos aún por definir: no se importan todavía.
    if (isPlaceholder(homeApi) || isPlaceholder(awayApi)) {
      skipped++
      continue
    }

    // Match por nombres normalizados en cualquier orientación.
    const fixture = existing.find(
      (f) =>
        (normalize(f.homeTeam) === normalize(homeApi) && normalize(f.awayTeam) === normalize(awayApi)) ||
        (normalize(f.homeTeam) === normalize(awayApi) && normalize(f.awayTeam) === normalize(homeApi)),
    )

    // Solo se crean los que faltan. A los existentes NO se los toca (ni fecha, ni
    // equipos, ni resultado/penales) para no pisar nada por diferencias mínimas.
    if (!fixture) {
      const stage = ev.season?.slug ? SLUG_TO_STAGE[ev.season.slug] ?? null : null
      await prisma.fixture.create({
        data: {
          homeTeam: localName(homeApi),
          awayTeam: localName(awayApi),
          matchDate: new Date(ev.date),
          stage,
          group: null,
          matchday: null,
        },
      })
      created++
    }
  }

  revalidatePath("/")
  revalidatePath("/fixtures")
  revalidatePath("/admin")

  return NextResponse.json({ created, skipped, checked: events.length })
}
