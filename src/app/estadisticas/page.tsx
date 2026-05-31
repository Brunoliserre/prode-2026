import { getCountryCode } from "@/lib/flags"
import * as Flags from "country-flag-icons/react/3x2"

export const revalidate = 3600

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

function TeamFlag({ team }: { team: string }) {
  const code = getCountryCode(localName(team))
  if (!code) return null
  const Flag = Flags[code as keyof typeof Flags]
  if (!Flag) return null
  return <Flag className="inline-block h-3.5 w-5 shrink-0 rounded-sm" />
}

// ── Types ──────────────────────────────────────────────────────────────────────

type Scorer = {
  player: { name: string }
  team: { name: string }
  goals: number
  assists: number
  penalties: number
}

type Booking = {
  team: { name: string }
  card: string
}

type Match = {
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: { fullTime: { home: number | null; away: number | null } }
  bookings?: Booking[]
}

// ── Fetchers ───────────────────────────────────────────────────────────────────

async function fetchScorers(apiKey: string): Promise<Scorer[]> {
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/scorers?limit=30",
    { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 3600 } },
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.scorers ?? []
}

async function fetchMatches(apiKey: string): Promise<Match[]> {
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 3600 } },
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.matches ?? []
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function EstadisticasPage() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY

  if (!apiKey) {
    return <p className="text-gray-400 dark:text-neutral-500">API key no configurada.</p>
  }

  const [scorers, matches] = await Promise.all([
    fetchScorers(apiKey),
    fetchMatches(apiKey),
  ])

  // Goles por selección
  const teamGoals: Record<string, number> = {}
  for (const m of matches) {
    const h = m.score.fullTime.home
    const a = m.score.fullTime.away
    if (h == null || a == null) continue
    teamGoals[m.homeTeam.name] = (teamGoals[m.homeTeam.name] ?? 0) + h
    teamGoals[m.awayTeam.name] = (teamGoals[m.awayTeam.name] ?? 0) + a
  }
  const teamGoalRows = Object.entries(teamGoals)
    .sort(([, a], [, b]) => b - a)
    .map(([team, goals]) => ({ team, goals }))

  // Tarjetas amarillas por selección
  const teamCards: Record<string, number> = {}
  for (const m of matches) {
    for (const b of m.bookings ?? []) {
      if (b.card === "YELLOW" || b.card === "YELLOW_CARD") {
        teamCards[b.team.name] = (teamCards[b.team.name] ?? 0) + 1
      }
    }
  }
  const cardRows = Object.entries(teamCards)
    .sort(([, a], [, b]) => b - a)
    .map(([team, cards]) => ({ team, cards }))

  const empty = scorers.length === 0 && matches.length === 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Estadísticas</h1>
        <p className="text-sm text-gray-400 dark:text-neutral-500">
          Datos actualizados cada hora desde football-data.org
        </p>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-white/5 dark:bg-neutral-900">
          <p className="text-2xl">⏳</p>
          <p className="mt-2 font-medium text-gray-700 dark:text-neutral-300">El torneo aún no comenzó</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-neutral-500">Las estadísticas aparecerán cuando se jueguen los primeros partidos.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Goleadores */}
          <StatsTable
            title="Goleadores"
            icon="⚽"
            empty={scorers.length === 0}
            headers={["Jugador", "País", "Goles", "Ast"]}
          >
            {scorers.map((s, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <p className="text-sm font-medium text-gray-800 dark:text-neutral-100">{s.player.name}</p>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TeamFlag team={s.team.name} />
                    <span className="text-xs text-gray-500 dark:text-neutral-400">{localName(s.team.name)}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-gray-900 dark:text-white">{s.goals}</td>
                <td className="px-4 py-2.5 text-center text-sm text-gray-500 dark:text-neutral-400">{s.assists}</td>
              </tr>
            ))}
          </StatsTable>

          {/* Goles por selección */}
          <StatsTable
            title="Goles por Selección"
            icon="🥅"
            empty={teamGoalRows.length === 0}
            headers={["Selección", "Goles"]}
          >
            {teamGoalRows.map((r, i) => (
              <tr key={r.team} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TeamFlag team={r.team} />
                    <span className="text-sm font-medium text-gray-800 dark:text-neutral-100">{localName(r.team)}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-gray-900 dark:text-white">{r.goals}</td>
              </tr>
            ))}
          </StatsTable>

          {/* Tarjetas amarillas */}
          <StatsTable
            title="Tarjetas Amarillas"
            icon="🟨"
            empty={cardRows.length === 0}
            headers={["Selección", "Tarjetas"]}
          >
            {cardRows.map((r, i) => (
              <tr key={r.team} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TeamFlag team={r.team} />
                    <span className="text-sm font-medium text-gray-800 dark:text-neutral-100">{localName(r.team)}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400">
                    {r.cards}
                  </span>
                </td>
              </tr>
            ))}
          </StatsTable>
        </div>
      )}
    </div>
  )
}

function StatsTable({
  title, icon, headers, empty, children,
}: {
  title: string
  icon: string
  headers: string[]
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-white/5">
        <span>{icon}</span>
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {empty ? (
        <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-neutral-500">Sin datos todavía</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/5 dark:bg-neutral-800/50">
              <th className="w-8 px-4 py-2 text-left text-xs font-semibold text-gray-400 dark:text-neutral-500">#</th>
              {headers.map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-400 dark:text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      )}
    </div>
  )
}
