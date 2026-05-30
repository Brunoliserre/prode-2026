import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 2026 FIFA World Cup – Group Stage
// 12 groups of 4 teams, 6 matches per group, 72 total group stage matches.
// Dates are approximate based on the official tournament schedule (June 11 – July 1, 2026).
// All times are UTC.

const groups: Record<string, [string, string, string, string]> = {
  A: ["USA", "Panama", "Morocco", "Poland"],
  B: ["Mexico", "Peru", "Netherlands", "Cameroon"],
  C: ["Canada", "Honduras", "Germany", "Senegal"],
  D: ["Argentina", "Chile", "Japan", "Turkey"],
  E: ["Brazil", "Venezuela", "Nigeria", "France"],
  F: ["England", "Colombia", "Ivory Coast", "South Korea"],
  G: ["Spain", "Costa Rica", "Iran", "Serbia"],
  H: ["Portugal", "Uruguay", "Egypt", "Austria"],
  I: ["Belgium", "Saudi Arabia", "Ghana", "Croatia"],
  J: ["Switzerland", "Jamaica", "Tunisia", "Denmark"],
  K: ["Italy", "South Africa", "Australia", "Scotland"],
  L: ["Ecuador", "Paraguay", "Indonesia", "Ukraine"],
}

// MD1 start dates per group (staggered across June 11–17)
const md1Dates: Record<string, string> = {
  A: "2026-06-11",
  B: "2026-06-12",
  C: "2026-06-13",
  D: "2026-06-14",
  E: "2026-06-15",
  F: "2026-06-11",
  G: "2026-06-12",
  H: "2026-06-13",
  I: "2026-06-14",
  J: "2026-06-15",
  K: "2026-06-16",
  L: "2026-06-17",
}

// MD2 is 7 days after MD1
// MD3 is 14 days after MD1

function addDays(base: string, days: number): string {
  const d = new Date(base + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function buildDate(dateStr: string, hour: number): Date {
  return new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00Z`)
}

interface MatchInput {
  homeTeam: string
  awayTeam: string
  matchDate: Date
  matchday: number
  group: string
}

function buildGroupMatches(group: string, teams: [string, string, string, string]): MatchInput[] {
  const [t1, t2, t3, t4] = teams
  const md1Base = md1Dates[group]
  const md2Base = addDays(md1Base, 7)
  const md3Base = addDays(md1Base, 14)

  return [
    // Matchday 1
    { homeTeam: t1, awayTeam: t2, matchDate: buildDate(md1Base, 15), matchday: 1, group },
    { homeTeam: t3, awayTeam: t4, matchDate: buildDate(md1Base, 18), matchday: 1, group },
    // Matchday 2
    { homeTeam: t1, awayTeam: t3, matchDate: buildDate(md2Base, 15), matchday: 2, group },
    { homeTeam: t2, awayTeam: t4, matchDate: buildDate(md2Base, 18), matchday: 2, group },
    // Matchday 3 (simultaneous)
    { homeTeam: t1, awayTeam: t4, matchDate: buildDate(md3Base, 18), matchday: 3, group },
    { homeTeam: t2, awayTeam: t3, matchDate: buildDate(md3Base, 18), matchday: 3, group },
  ]
}

async function main() {
  console.log("Seeding group stage fixtures…")

  await prisma.fixture.deleteMany()

  const allMatches: MatchInput[] = []
  for (const [group, teams] of Object.entries(groups)) {
    allMatches.push(...buildGroupMatches(group, teams))
  }

  await prisma.fixture.createMany({ data: allMatches })

  console.log(`✓ Created ${allMatches.length} fixtures (12 groups × 6 matches)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
