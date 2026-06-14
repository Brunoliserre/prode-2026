import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FixturesView } from "@/components/FixturesView"
import { getWCEmblem } from "@/lib/competition"

export const revalidate = 0

type UserPrediction = { homeScore: number; awayScore: number; points: number }

export default async function PrediccionesPage() {
  const session = await auth()
  const userId = session?.user?.id
  const now = new Date()
  const emblem = await getWCEmblem()

  const fixtures = await prisma.fixture.findMany({
    orderBy: [{ group: "asc" }, { matchday: "asc" }, { matchDate: "asc" }],
  })

  const predMap = new Map<string, UserPrediction>()
  if (userId) {
    const preds = await prisma.prediction.findMany({
      where: { userId },
      select: { fixtureId: true, homeScore: true, awayScore: true, points: true },
    })
    for (const p of preds) predMap.set(p.fixtureId, p)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Predicciones</h1>
        <p className="mb-6 text-sm text-gray-400 dark:text-neutral-500">
          {userId
            ? "Ingresá tu pronóstico antes del inicio de cada partido."
            : "Iniciá sesión para pronosticar."}
        </p>

        {fixtures.length === 0 ? (
          <p className="text-gray-400 dark:text-neutral-500">No hay partidos cargados todavía.</p>
        ) : (
          <FixturesView
            fixtures={fixtures}
            predMap={Object.fromEntries(predMap)}
            userId={userId}
            emblemUrl={emblem}
            now={now}
          />
        )}
      </div>
    </div>
  )
}
