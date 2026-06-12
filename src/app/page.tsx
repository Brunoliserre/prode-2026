import { auth, signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getWCEmblem } from "@/lib/competition"
import { cn, ENTRY_AMOUNT } from "@/lib/utils"
import { JoinPozoButton } from "@/components/JoinPozoButton"
import Image from "next/image"

export const revalidate = 60

export default async function Page() {
  const session = await auth()

  if (!session?.user) {
    return <LandingPage />
  }

  return <LeaderboardPage userId={session.user.id} />
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

async function LeaderboardPage({ userId }: { userId?: string }) {
  const users = await prisma.user.findMany({
    include: { predictions: true, tournamentPicks: true },
    orderBy: { name: "asc" },
  })

  const rows = users
    .map((u) => {
      const matchPts = u.predictions.reduce((s, p) => s + p.points, 0)
      const pickPts  = u.tournamentPicks.reduce((s, p) => s + p.points, 0)
      const total    = matchPts + pickPts
      const played   = u.predictions.length
      return { id: u.id, name: u.name, image: u.image, total, matchPts, pickPts, played }
    })
    .sort((a, b) => b.total - a.total)

  const me = userId ? users.find((u) => u.id === userId) : undefined
  const paidCount = users.filter((u) => u.hasPaid).length
  const pozo = paidCount * ENTRY_AMOUNT
  const pozoMax = users.length * ENTRY_AMOUNT
  const pozoPct = users.length > 0 ? Math.round((paidCount / users.length) * 100) : 0

  const rankIcon = (i: number) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1)

  // Soft full-row tint for the podium: gold, silver, copper
  const medalRow = [
    "bg-amber-100/60 hover:bg-amber-100/80 dark:bg-amber-400/10 dark:hover:bg-amber-400/15",
    "bg-slate-200/50 hover:bg-slate-200/70 dark:bg-slate-300/10 dark:hover:bg-slate-300/15",
    "bg-orange-100/50 hover:bg-orange-100/70 dark:bg-orange-400/10 dark:hover:bg-orange-400/15",
  ]

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Tabla de Posiciones</h1>

      {users.length > 0 && (
        <div className="mb-6 mt-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-neutral-900">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-xl dark:bg-emerald-500/10">
                💰
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  Pozo acumulado
                </p>
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                  $ {pozo.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {paidCount}/{users.length}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-neutral-500">transfirieron</p>
            </div>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-[width] duration-700 ease-out"
              style={{ width: `${pozoPct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-gray-300 dark:text-neutral-600">
            <span>$ 0</span>
            <span>$ {pozoMax.toLocaleString("es-AR")}</span>
          </div>

          {me && <JoinPozoButton hasPaid={me.hasPaid} wantsToJoin={me.wantsToJoin} />}
        </div>
      )}

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
                <th className="hidden px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">Partidos</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">Torneo</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400 sm:table-cell">Pronósticos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-gray-100 transition-colors last:border-0 dark:border-white/5",
                    medalRow[i] ?? "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                  )}
                >
                  <td className="px-4 py-3 font-mono text-gray-400 dark:text-neutral-500">{rankIcon(i)}</td>
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
                  <td className="hidden px-4 py-3 text-center text-gray-500 dark:text-neutral-400 sm:table-cell">{row.matchPts}</td>
                  <td className="hidden px-4 py-3 text-center text-gray-500 dark:text-neutral-400 sm:table-cell">{row.pickPts}</td>
                  <td className="hidden px-4 py-3 text-center text-gray-500 dark:text-neutral-400 sm:table-cell">{row.played}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
