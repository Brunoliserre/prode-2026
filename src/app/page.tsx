import { auth, signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getWCEmblem } from "@/lib/competition"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"
import { RankHistoryChart, type RankSeries } from "@/components/RankHistoryChart"
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

  // Partidos finalizados, en orden cronológico.
  const finishedFx = await prisma.fixture.findMany({
    where: { homeScore: { not: null }, awayScore: { not: null }, matchday: { not: null } },
    orderBy: [{ matchDate: "asc" }, { id: "asc" }],
    select: { id: true, matchday: true },
  })

  // Puntos de torneo (estáticos) y puntos de cada usuario por fixture.
  const pickPtsById = new Map(
    users.map((u) => [u.id, u.tournamentPicks.reduce((s, p) => s + p.points, 0)]),
  )
  const ptsByUserFix = new Map(
    users.map((u) => [u.id, new Map(u.predictions.map((p) => [p.fixtureId, p.points]))]),
  )
  // Puesto (1-based) de cada jugador contando sólo los fixtures dados (acumulado).
  const standingsAt = (fixtureIds: Set<string>) => {
    const pos = new Map<string, number>()
    users
      .map((u) => {
        const fix = ptsByUserFix.get(u.id)!
        let pts = pickPtsById.get(u.id)!
        for (const fid of fixtureIds) pts += fix.get(fid) ?? 0
        return { id: u.id, name: u.name, pts }
      })
      .sort((a, b) => b.pts - a.pts || (a.name ?? "").localeCompare(b.name ?? ""))
      .forEach((s, i) => pos.set(s.id, i + 1))
    return pos
  }

  // Variación de puesto: comparamos contra el ranking justo ANTES del último
  // partido finalizado (partido a partido). Cada resultado nuevo mueve las flechas.
  const hasPrev = finishedFx.length >= 2
  const prevPos = hasPrev
    ? standingsAt(new Set(finishedFx.slice(0, -1).map((f) => f.id)))
    : null

  const base = users.map((u) => {
    const pickPts = pickPtsById.get(u.id)!
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

  const rows = [...base]
    .sort((a, b) => b.total - a.total || (a.name ?? "").localeCompare(b.name ?? ""))
    .map((r, i) => ({ ...r, delta: hasPrev ? prevPos!.get(r.id)! - (i + 1) : null }))

  // Evolución de posiciones, en dos granularidades:
  //   · por fecha   → puesto al cierre de cada jornada jugada
  //   · por partido → puesto después de cada partido finalizado (cronológico)
  const playedMds = [...new Set(finishedFx.map((f) => f.matchday!))].sort((a, b) => a - b)
  const seriesFrom = (snaps: Map<string, number>[]): RankSeries[] =>
    rows.map((r) => ({
      id: r.id,
      name: r.name ?? "Anónimo",
      positions: snaps.map((s) => s.get(r.id)!),
    }))

  const fechaSnaps = playedMds.map((md) =>
    standingsAt(new Set(finishedFx.filter((f) => f.matchday! <= md).map((f) => f.id))),
  )
  const counted = new Set<string>()
  const partidoSnaps = finishedFx.map((f) => {
    counted.add(f.id)
    return standingsAt(counted)
  })

  const historyByFecha = { labels: playedMds.map((md) => `Fecha ${md}`), series: seriesFrom(fechaSnaps) }
  const historyByPartido = { labels: finishedFx.map((_, i) => String(i + 1)), series: seriesFrom(partidoSnaps) }
  const showHistory = finishedFx.length >= 2

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
                <th className="py-3 pl-4 font-semibold text-gray-500 dark:text-neutral-400">#</th>
                <th className="py-3 pr-2" />
                <th className="py-3 pr-4 font-semibold text-gray-500 dark:text-neutral-400">Jugador</th>
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
                    <td className="py-3 pl-4 font-mono text-gray-400 dark:text-neutral-500">{rankIcon}</td>
                    <td className="py-3 pr-2 text-center"><RankDelta delta={row.delta} /></td>
                    <td className="py-3 pr-4">
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

      {showHistory && (
        <RankHistoryChart byFecha={historyByFecha} byPartido={historyByPartido} players={rows.length} />
      )}
    </div>
  )
}

// Variación de puesto respecto del ranking previo al último partido jugado.
//   delta > 0 → subió (verde) · delta < 0 → bajó (rojo) · 0 → se mantiene (=)
//   delta null → todavía no hay partido anterior para comparar
function RankDelta({ delta }: { delta: number | null }) {
  if (delta == null) return null
  if (delta === 0) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-gray-200/80 px-1.5 py-0.5 text-xs font-bold text-gray-500 dark:bg-white/10 dark:text-neutral-300">
        =
      </span>
    )
  }
  const up = delta > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        up
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-500 dark:text-red-400",
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  )
}
