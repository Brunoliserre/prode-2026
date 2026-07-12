import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PICK_POINTS } from "@/lib/utils"
import { esTeamName } from "@/lib/flags"
import { TournamentResultsTable, TOURNAMENT_CATEGORIES } from "@/components/TournamentResultsTable"
import { TournamentPicksReadonly } from "@/components/TournamentPicksReadonly"

export const revalidate = 0
export const metadata = { title: "Predicciones de Torneo" }

export default async function PrediccionesTorneoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const [users, storedResults] = await Promise.all([
    prisma.user.findMany({
      include: { tournamentPicks: true },
      orderBy: { name: "asc" },
    }),
    prisma.tournamentResult.findMany(),
  ])

  // Resultados por categoría: ganador guardado o derivado del pick acertado.
  const storedByCategory = new Map(storedResults.map((r) => [r.category, r.value]))
  const winnerByCategory = new Map<string, string>()
  const scorersByCategory = new Map<string, string[]>()
  for (const u of users)
    for (const p of u.tournamentPicks)
      if (p.points > 0) {
        if (!winnerByCategory.has(p.category)) winnerByCategory.set(p.category, p.value)
        const list = scorersByCategory.get(p.category) ?? []
        list.push(u.name ?? "Anónimo")
        scorersByCategory.set(p.category, list)
      }
  const results = TOURNAMENT_CATEGORIES.map((c) => {
    const raw = storedByCategory.get(c.key) ?? winnerByCategory.get(c.key) ?? null
    const winner =
      raw == null ? null : raw.trim().toLowerCase() === "n/a" ? "Nadie" : c.type === "team" ? esTeamName(raw) : raw
    return {
      key: c.key,
      label: c.label,
      icon: c.icon,
      winner,
      scorers: (scorersByCategory.get(c.key) ?? []).sort((a, b) => a.localeCompare(b)),
      points: PICK_POINTS[c.key] ?? 0,
    }
  })

  const picksRows = users.map((u) => ({
    id: u.id,
    name: u.name,
    image: u.image,
    picks: Object.fromEntries(u.tournamentPicks.map((p) => [p.category, p.value])),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Predicciones de Torneo</h1>
        <p className="text-sm text-gray-400 dark:text-neutral-500">
          Resultados de cada premio y lo que votó cada participante.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Resultados del torneo</h2>
        <TournamentResultsTable rows={results} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Qué votó cada uno</h2>
        <TournamentPicksReadonly users={picksRows} />
      </div>
    </div>
  )
}
