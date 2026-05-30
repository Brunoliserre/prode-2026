import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CreateFixtureForm } from "@/components/CreateFixtureForm"
import { SetResultForm } from "@/components/SetResultForm"
import { formatDate } from "@/lib/utils"

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
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a6b]">Panel de administración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sesión como <strong>{session.user.email}</strong>
        </p>
      </div>

      {/* Create fixture */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Crear partido</h2>
        <CreateFixtureForm />
      </section>

      {/* Pending results */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Partidos pendientes de resultado{" "}
          <span className="text-sm font-normal text-gray-400">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">Todos los partidos tienen resultado.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">Partido</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Pronósticos</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {f.group && (
                        <span className="mr-2 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 font-semibold">
                          G{f.group}
                        </span>
                      )}
                      {f.homeTeam} vs {f.awayTeam}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                      {formatDate(f.matchDate)}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
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

      {/* Finished fixtures */}
      {finished.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Partidos con resultado{" "}
            <span className="text-sm font-normal text-gray-400">({finished.length})</span>
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">Partido</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Resultado</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Corregir</th>
                </tr>
              </thead>
              <tbody>
                {finished.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {f.group && (
                        <span className="mr-2 rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700 font-semibold">
                          G{f.group}
                        </span>
                      )}
                      {f.homeTeam} vs {f.awayTeam}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                      {formatDate(f.matchDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded bg-gray-800 px-2 py-0.5 font-mono text-xs font-bold text-white">
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
