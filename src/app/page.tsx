import { auth, signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getWCEmblem } from "@/lib/competition"
import { cn } from "@/lib/utils"
import Image from "next/image"

export const revalidate = 0

export default async function Page() {
  const session = await auth()

  if (!session?.user) {
    return <LandingPage />
  }

  return <LeaderboardPage />
}

async function LandingPage() {
  const emblem = await getWCEmblem()

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex flex-col items-center gap-6 max-w-sm">
        {emblem ? (
          <Image src={emblem} alt="Mundial 2026" width={80} height={80} className="drop-shadow-md" />
        ) : (
          <span className="text-6xl">⚽</span>
        )}

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Prode Mundial 2026
          </h1>
          <p className="text-gray-500 dark:text-neutral-400">
            Pronosticá los partidos, sumá puntos y competí con tus amigos.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/profile" })
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              Ingresar con Google
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}

async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    include: { predictions: { include: { fixture: true } }, tournamentPicks: true },
    orderBy: { name: "asc" },
  })

  const rows = users
    .map((u) => {
      const pickPts = u.tournamentPicks.reduce((s, p) => s + p.points, 0)
      const played  = u.predictions.length

      // Desglose de los puntos de partidos:
      //   Completos = pts de pronósticos con resultado exacto (pleno = 7 c/u)
      //   Simples   = pts del resto de aciertos (signo correcto sin clavar, 4-6)
      let simplePts = 0
      let completosPts = 0
      for (const p of u.predictions) {
        if (p.fixture.homeScore == null || p.fixture.awayScore == null) continue
        const pleno = p.homeScore === p.fixture.homeScore && p.awayScore === p.fixture.awayScore
        if (pleno) completosPts += p.points
        else simplePts += p.points
      }

      const total = simplePts + completosPts + pickPts
      return { id: u.id, name: u.name, image: u.image, total, simplePts, completosPts, pickPts, played }
    })
    .sort((a, b) => b.total - a.total || (a.name ?? "").localeCompare(b.name ?? ""))

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Tabla de Posiciones</h1>

      {rows.length === 0 ? (
        <p className="text-gray-400 dark:text-neutral-500">Todavía no hay participantes.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100/50 text-left dark:border-white/5 dark:bg-neutral-800/50">
                <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">#</th>
                <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Jugador</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400">Pts</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">Simples</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">Completos</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">Torneo</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">Predicciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rankIcon =
                  i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1)
                // Soft full-row tint for the podium: gold, silver, copper
                const medalRow = [
                  "bg-amber-100/60 hover:bg-amber-100/80 dark:bg-amber-400/10 dark:hover:bg-amber-400/15",
                  "bg-slate-200/50 hover:bg-slate-200/70 dark:bg-slate-300/10 dark:hover:bg-slate-300/15",
                  "bg-orange-100/50 hover:bg-orange-100/70 dark:bg-orange-400/10 dark:hover:bg-orange-400/15",
                ]
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-gray-100 transition-colors last:border-0 dark:border-white/5",
                      medalRow[i] ?? "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-gray-400 dark:text-neutral-500">{rankIcon}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {row.image ? (
                          <Image src={row.image} alt={row.name ?? ""} width={28} height={28} className="rounded-full" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400 dark:bg-neutral-800 dark:text-neutral-500">
                            {row.name?.[0] ?? "?"}
                          </div>
                        )}
                        <span className="font-medium text-gray-800 dark:text-neutral-100">{row.name ?? "Anónimo"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">{row.total}</td>
                    <td className="hidden px-4 py-3 text-center text-gray-500 dark:text-neutral-400 sm:table-cell">{row.simplePts}</td>
                    <td className="hidden px-4 py-3 text-center text-gray-500 dark:text-neutral-400 sm:table-cell">{row.completosPts}</td>
                    <td className="hidden px-4 py-3 text-center text-gray-500 dark:text-neutral-400 sm:table-cell">{row.pickPts}</td>
                    <td className="hidden px-4 py-3 text-center text-gray-500 dark:text-neutral-400 sm:table-cell">{row.played}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
