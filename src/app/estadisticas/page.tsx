import { getCountryCode } from "@/lib/flags"
import * as Flags from "country-flag-icons/react/3x2"

export const revalidate = 900

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

type Match = {
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: { fullTime: { home: number | null; away: number | null } }
}

type EspnEvent = {
  status: { type: { state: string } }
  competitions: {
    competitors: { team: { id: string; displayName: string } }[]
    details?: {
      yellowCard: boolean
      redCard: boolean
      team?: { id: string }
    }[]
  }[]
}

type TeamCards = { yellow: number; red: number }

// ── Fetchers ───────────────────────────────────────────────────────────────────

async function fetchScorers(apiKey: string): Promise<Scorer[]> {
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/scorers?limit=30",
    { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 900 } },
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.scorers ?? []
}

async function fetchMatches(apiKey: string): Promise<Match[]> {
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 900 } },
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.matches ?? []
}

// Cards come from ESPN: the football-data free tier doesn't include bookings
async function fetchEspnEvents(): Promise<EspnEvent[]> {
  const res = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=300",
    { next: { revalidate: 900 } },
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.events ?? []
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function EstadisticasPage() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY

  if (!apiKey) {
    return <p className="text-gray-400 dark:text-neutral-500">API key no configurada.</p>
  }

  const [scorers, matches, espnEvents] = await Promise.all([
    fetchScorers(apiKey),
    fetchMatches(apiKey),
    fetchEspnEvents(),
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

  // Tarjetas por selección (eventos ESPN ya comenzados)
  const teamCards: Record<string, TeamCards> = {}
  for (const ev of espnEvents) {
    if (ev.status?.type?.state === "pre") continue
    const comp = ev.competitions?.[0]
    if (!comp) continue

    const teamById = new Map(comp.competitors.map((c) => [c.team.id, c.team.displayName]))
    // Seed every team that already played so the 0-card ones rank in Fair Play
    for (const name of teamById.values()) teamCards[name] ??= { yellow: 0, red: 0 }

    for (const d of comp.details ?? []) {
      const team = d.team?.id ? teamById.get(d.team.id) : undefined
      if (!team) continue
      if (d.redCard) teamCards[team].red++
      else if (d.yellowCard) teamCards[team].yellow++
    }
  }

  const yellowRows = Object.entries(teamCards)
    .filter(([, c]) => c.yellow > 0)
    .sort(([, a], [, b]) => b.yellow - a.yellow)
    .map(([team, c]) => ({ team, cards: c.yellow }))

  const redRows = Object.entries(teamCards)
    .filter(([, c]) => c.red > 0)
    .sort(([, a], [, b]) => b.red - a.red)
    .map(([team, c]) => ({ team, cards: c.red }))

  // Fair Play: Amarilla = 1 pt · Roja = 3 pts — gana el menor puntaje
  const fairPlayRows = Object.entries(teamCards)
    .map(([team, c]) => ({ team, yellow: c.yellow, red: c.red, points: c.yellow + c.red * 3 }))
    .sort((a, b) => a.points - b.points || a.team.localeCompare(b.team))

  const empty = scorers.length === 0 && matches.length === 0 && fairPlayRows.length === 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Estadísticas</h1>
        <p className="text-sm text-gray-400 dark:text-neutral-500">
          Datos actualizados cada 15 minutos
        </p>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-white/5 dark:bg-neutral-900">
          <p className="text-2xl">⏳</p>
          <p className="mt-2 font-medium text-gray-700 dark:text-neutral-300">El torneo aún no comenzó</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-neutral-500">Las estadísticas aparecerán cuando se jueguen los primeros partidos.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-2">
          {/* Goleadores */}
          <div className="md:col-span-2">
            <StatsTable
              title="Goleadores"
              icon="⚽"
              empty={scorers.length === 0}
              headers={[
                { label: "Jugador" },
                { label: "País" },
                { label: "Goles", center: true },
              ]}
            >
              {scorers.slice(0, 10).map((s, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                  <td className="max-w-0 px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">{s.player.name}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <TeamFlag team={s.team.name} />
                      <span className="text-xs text-gray-500 dark:text-neutral-400">{localName(s.team.name)}</span>
                    </div>
                  </td>
                  <td className="w-12 px-2 py-2.5 text-center font-bold text-gray-900 dark:text-white">{s.goals}</td>
                </tr>
              ))}
            </StatsTable>
          </div>

          {/* Goles por selección */}
          <StatsTable
            title="Goles por Selección"
            icon="🥅"
            empty={teamGoalRows.length === 0}
            headers={[{ label: "Selección" }, { label: "Goles", center: true }]}
          >
            {teamGoalRows.map((r, i) => (
              <tr key={r.team} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                <td className="max-w-0 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TeamFlag team={r.team} />
                    <span className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">{localName(r.team)}</span>
                  </div>
                </td>
                <td className="w-14 px-2 py-2.5 text-center font-bold text-gray-900 dark:text-white">{r.goals}</td>
              </tr>
            ))}
          </StatsTable>

          {/* Tarjetas amarillas */}
          <StatsTable
            title="Tarjetas Amarillas"
            icon="🟨"
            empty={yellowRows.length === 0}
            headers={[{ label: "Selección" }, { label: "Tarjetas", center: true }]}
          >
            {yellowRows.map((r, i) => (
              <tr key={r.team} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                <td className="max-w-0 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TeamFlag team={r.team} />
                    <span className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">{localName(r.team)}</span>
                  </div>
                </td>
                <td className="w-14 px-2 py-2.5 text-center">
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400">
                    {r.cards}
                  </span>
                </td>
              </tr>
            ))}
          </StatsTable>

          {/* Tarjetas rojas */}
          <StatsTable
            title="Tarjetas Rojas"
            icon="🟥"
            empty={redRows.length === 0}
            emptyText="Ninguna roja todavía 🧘"
            headers={[{ label: "Selección" }, { label: "Tarjetas", center: true }]}
          >
            {redRows.map((r, i) => (
              <tr key={r.team} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                <td className="max-w-0 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TeamFlag team={r.team} />
                    <span className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">{localName(r.team)}</span>
                  </div>
                </td>
                <td className="w-14 px-2 py-2.5 text-center">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    {r.cards}
                  </span>
                </td>
              </tr>
            ))}
          </StatsTable>

          {/* Fair Play */}
          <div className="md:col-span-2">
            <StatsTable
              title="Fair Play"
              icon="🤝"
              subtitle="Amarilla = 1 pt · Roja = 3 pts — el menor puntaje gana el Fair Play 🤝, el mayor se lleva el Rústico 💥"
              empty={fairPlayRows.length === 0}
              headers={[
                { label: "Selección" },
                { label: "🟨", center: true },
                { label: "🟥", center: true },
                { label: "Pts", center: true },
              ]}
            >
              {fairPlayRows.map((r, i) => (
                <tr
                  key={r.team}
                  className={`border-b border-gray-100 last:border-0 dark:border-white/5 ${
                    i === 0
                      ? "bg-emerald-50/70 dark:bg-emerald-500/[0.07]"
                      : i === fairPlayRows.length - 1 && fairPlayRows.length > 1
                        ? "bg-red-50/70 dark:bg-red-500/[0.07]"
                        : ""
                  }`}
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                  <td className="max-w-0 px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <TeamFlag team={r.team} />
                      <span className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">{localName(r.team)}</span>
                    </div>
                  </td>
                  <td className="w-12 px-2 py-2.5 text-center text-sm text-gray-500 dark:text-neutral-400">{r.yellow}</td>
                  <td className="w-12 px-2 py-2.5 text-center text-sm text-gray-500 dark:text-neutral-400">{r.red}</td>
                  <td className="w-14 px-2 py-2.5 text-center font-bold text-gray-900 dark:text-white">{r.points}</td>
                </tr>
              ))}
            </StatsTable>
          </div>
        </div>
      )}
    </div>
  )
}

function StatsTable({
  title, icon, subtitle, headers, empty, emptyText, children,
}: {
  title: string
  icon: string
  subtitle?: string
  headers: { label: string; center?: boolean }[]
  empty: boolean
  emptyText?: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-400 dark:text-neutral-500">{subtitle}</p>
        )}
      </div>
      {empty ? (
        <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-neutral-500">
          {emptyText ?? "Sin datos todavía"}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/5 dark:bg-neutral-800/50">
                <th className="w-8 px-3 py-2 text-left text-xs font-semibold text-gray-400 dark:text-neutral-500">#</th>
                {headers.map((h) => (
                  <th
                    key={h.label}
                    className={`px-3 py-2 text-xs font-semibold text-gray-400 dark:text-neutral-500 ${h.center ? "text-center" : "text-left"}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
