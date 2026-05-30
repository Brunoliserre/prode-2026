import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PredictionForm } from "@/components/PredictionForm"
import { formatDate, cn } from "@/lib/utils"

export const revalidate = 0

type UserPrediction = { homeScore: number; awayScore: number; points: number }

export default async function FixturesPage() {
  const session = await auth()
  const userId = session?.user?.id
  const now = new Date()

  const fixtures = await prisma.fixture.findMany({
    orderBy: [{ group: "asc" }, { matchday: "asc" }, { matchDate: "asc" }],
  })

  // Fetch user predictions separately to avoid conditional-include type complexity
  const predMap = new Map<string, UserPrediction>()
  if (userId) {
    const preds = await prisma.prediction.findMany({
      where: { userId },
      select: { fixtureId: true, homeScore: true, awayScore: true, points: true },
    })
    for (const p of preds) predMap.set(p.fixtureId, p)
  }

  // Group fixtures by "group" field
  const grouped = new Map<string, typeof fixtures>()
  for (const f of fixtures) {
    const key = f.group ?? "Sin grupo"
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(f)
  }
  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#1a3a6b]">Partidos – Mundial 2026</h1>
      <p className="mb-6 text-sm text-gray-500">
        {userId
          ? "Ingresá tu pronóstico antes del inicio de cada partido."
          : "Iniciá sesión para pronosticar."}
      </p>

      {fixtures.length === 0 && (
        <p className="text-gray-500">No hay partidos cargados todavía.</p>
      )}

      <div className="space-y-8">
        {sortedGroups.map(([group, matches]) => (
          <section key={group}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Grupo {group}
            </h2>
            <div className="space-y-2">
              {matches.map((fixture) => {
                const started = fixture.matchDate <= now
                const finished = fixture.homeScore != null && fixture.awayScore != null
                const prediction = predMap.get(fixture.id) ?? null

                return (
                  <div
                    key={fixture.id}
                    className={cn(
                      "rounded-lg border bg-white p-4 shadow-sm",
                      finished && "border-gray-200",
                      started && !finished && "border-yellow-200 bg-yellow-50/40",
                      !started && "border-blue-100",
                    )}
                  >
                    {/* Header */}
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {fixture.matchday ? `Fecha ${fixture.matchday} · ` : ""}
                        {formatDate(fixture.matchDate)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          finished && "bg-gray-100 text-gray-600",
                          started && !finished && "bg-yellow-100 text-yellow-700",
                          !started && "bg-blue-50 text-blue-600",
                        )}
                      >
                        {finished ? "Final" : started ? "En curso" : "Próximo"}
                      </span>
                    </div>

                    {/* Teams */}
                    <div className="flex items-center gap-3">
                      <span className="flex-1 text-right font-semibold">{fixture.homeTeam}</span>
                      {finished ? (
                        <span className="rounded bg-gray-800 px-3 py-1 font-mono text-sm font-bold text-white">
                          {fixture.homeScore} – {fixture.awayScore}
                        </span>
                      ) : (
                        <span className="font-mono text-gray-300">vs</span>
                      )}
                      <span className="flex-1 font-semibold">{fixture.awayTeam}</span>
                    </div>

                    {/* Prediction */}
                    <div className="mt-3 border-t pt-3">
                      {!userId ? (
                        <p className="text-xs text-gray-400">Iniciá sesión para pronosticar</p>
                      ) : started ? (
                        <div className="flex items-center gap-2 text-sm">
                          {prediction ? (
                            <>
                              <span className="text-xs text-gray-500">Tu pronóstico:</span>
                              <span className="font-mono font-semibold">
                                {prediction.homeScore} – {prediction.awayScore}
                              </span>
                              {finished && (
                                <span
                                  className={cn(
                                    "ml-2 rounded-full px-2 py-0.5 text-xs font-bold",
                                    prediction.points === 3 && "bg-green-100 text-green-700",
                                    prediction.points === 1 && "bg-yellow-100 text-yellow-700",
                                    prediction.points === 0 && "bg-red-50 text-red-500",
                                  )}
                                >
                                  {prediction.points === 3 && "✓ Exacto · +3 pts"}
                                  {prediction.points === 1 && "~ Resultado · +1 pt"}
                                  {prediction.points === 0 && "✗ Sin puntos"}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs italic text-gray-400">Sin pronóstico registrado</span>
                          )}
                        </div>
                      ) : (
                        <PredictionForm
                          fixtureId={fixture.id}
                          initialHome={prediction?.homeScore}
                          initialAway={prediction?.awayScore}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
