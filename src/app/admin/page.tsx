import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SetResultForm } from "@/components/SetResultForm"
import { SyncResultsButton } from "@/components/SyncResultsButton"
import { SyncFixturesButton } from "@/components/SyncFixturesButton"
import { TournamentAdmin } from "@/components/TournamentAdmin"
import { formatDate } from "@/lib/utils"
import { ALL_TEAMS } from "@/lib/flags"

export const revalidate = 0

export default async function AdminPage() {
  const session = await auth()

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/")
  }

  const fixtures = await prisma.fixture.findMany({
    orderBy: [{ matchDate: "asc" }],
    include: { _count: { select: { predictions: true } } },
  })

  const finished = fixtures.filter((f) => f.homeScore != null)
  const pending = fixtures.filter((f) => f.homeScore == null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de administración</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-neutral-500">
          Sesión como <span className="text-gray-600 dark:text-neutral-300">{session.user.email}</span>
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Importar partidos desde API</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-neutral-500">
          Crea los partidos del Mundial 2026 importándolos desde football-data.org. Solo crea partidos nuevos, no elimina los existentes.
        </p>
        <SyncFixturesButton />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Sincronizar resultados</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-neutral-500">
          Importa resultados finalizados desde football-data.org y actualiza los puntos automáticamente.
        </p>
        <SyncResultsButton />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Predicciones del Torneo</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-neutral-500">
          Ingresá el ganador de cada categoría para otorgar los puntos automáticamente.
        </p>
        <TournamentAdmin teams={ALL_TEAMS} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
          Partidos pendientes{" "}
          <span className="text-sm font-normal text-gray-400 dark:text-neutral-600">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-neutral-600">Todos los partidos tienen resultado.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100/50 text-left dark:border-white/5 dark:bg-neutral-800/50">
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Partido</th>
                  <th className="hidden px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">
                    Fecha
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">
                    Pronósticos
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/[0.03]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800 dark:text-neutral-100">
                      {f.group && (
                        <span className="mr-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
                          G{f.group}
                        </span>
                      )}
                      {f.homeTeam} vs {f.awayTeam}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-gray-400 dark:text-neutral-500 sm:table-cell">
                      {formatDate(f.matchDate)}
                    </td>
                    <td className="hidden px-4 py-3 text-center text-gray-500 dark:text-neutral-400 sm:table-cell">
                      {f._count.predictions}
                    </td>
                    <td className="px-4 py-3">
                      <SetResultForm fixtureId={f.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Partidos con resultado{" "}
            <span className="text-sm font-normal text-gray-400 dark:text-neutral-600">({finished.length})</span>
          </h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100/50 text-left dark:border-white/5 dark:bg-neutral-800/50">
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Partido</th>
                  <th className="hidden px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400">
                    Resultado
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Corregir</th>
                </tr>
              </thead>
              <tbody>
                {finished.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/[0.03]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800 dark:text-neutral-100">
                      {f.group && (
                        <span className="mr-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
                          G{f.group}
                        </span>
                      )}
                      {f.homeTeam} vs {f.awayTeam}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-gray-400 dark:text-neutral-500 sm:table-cell">
                      {formatDate(f.matchDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-lg bg-gray-100 px-3 py-1 font-mono text-xs font-bold text-gray-900 dark:bg-neutral-800 dark:text-white">
                        {f.homeScore} – {f.awayScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SetResultForm
                        fixtureId={f.id}
                        currentHome={f.homeScore}
                        currentAway={f.awayScore}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
