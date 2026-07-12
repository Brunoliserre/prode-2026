import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { DreamTeamBuilder } from "@/components/DreamTeamBuilder"
import { MyDreamTeams } from "@/components/MyDreamTeams"
import { OthersDreamTeams } from "@/components/OthersDreamTeams"
import { DreamTeamStats } from "@/components/DreamTeamStats"
import { FORMATIONS, type Formation } from "@/lib/formations"
import { currentRound, KO_LABEL, myDreamTeams, dreamTeamStandings, othersDreamTeams, dreamTeamStats } from "@/lib/dreamteam-scoring"

export const revalidate = 0
export const metadata = { title: "Dream Team" }

export default async function DreamTeamPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")
  const userId = session.user.id

  const round = await currentRound()
  const roundLabel = KO_LABEL[round] ?? round

  // Equipos bloqueados: los de la ronda cuyo partido ya arrancó.
  const now = new Date()
  const roundFixtures = await prisma.fixture.findMany({
    where: { stage: round },
    select: { homeTeam: true, awayTeam: true, matchDate: true },
  })
  const lockedTeams = [
    ...new Set(
      roundFixtures.filter((f) => f.matchDate <= now).flatMap((f) => [f.homeTeam, f.awayTeam]),
    ),
  ]

  // Equipos disponibles para armar: solo los que juegan esta ronda (excluye
  // eliminados y los que aún no llegaron a esta instancia).
  const availableTeams = [...new Set(roundFixtures.flatMap((f) => [f.homeTeam, f.awayTeam]))]

  const dt = await prisma.dreamTeam.findUnique({
    where: { userId_round: { userId, round } },
    include: { picks: true },
  })
  const initialFormation: Formation | null =
    dt && FORMATIONS.includes(dt.formation as Formation) ? (dt.formation as Formation) : null
  const initialPicks = Object.fromEntries((dt?.picks ?? []).map((p) => [p.slot, p.playerId]))

  // Ratings ya cargados de la ronda (para mostrarlos en la cancha del armado).
  const roundScores = await prisma.playerScore.findMany({
    where: { round },
    select: { playerId: true, rating: true },
  })
  const ratings = Object.fromEntries(roundScores.map((s) => [s.playerId, s.rating]))

  const [myTeams, standings, others, stats] = await Promise.all([
    myDreamTeams(userId),
    dreamTeamStandings(),
    othersDreamTeams(),
    dreamTeamStats(),
  ])

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dream Team</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-neutral-500">
            Armá tu equipo de 7 (1 arquero + formación) para <span className="font-semibold">{roundLabel}</span>.
          </p>
        </div>
        <DreamTeamBuilder
          round={round}
          roundLabel={roundLabel}
          initialFormation={initialFormation}
          initialPicks={initialPicks}
          lockedTeams={lockedTeams}
          availableTeams={availableTeams}
          ratings={ratings}
        />
      </div>

      {/* Mis dream teams */}
      <div>
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Mis Dream Teams</h2>
        <MyDreamTeams teams={myTeams} />
      </div>

      {/* Dream teams de los demás, por ronda */}
      <div>
        <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Dream Teams de los demás</h2>
        <p className="mb-2 text-sm text-gray-400 dark:text-neutral-500">
          Mirá los equipos del resto una vez que empezaron los partidos de cada ronda.
        </p>
        <OthersDreamTeams rounds={others} />
      </div>

      {/* Tabla específica del dream team */}
      <div>
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Tabla Dream Team</h2>
        {standings.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-neutral-500">Todavía no hay participantes.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100/50 text-left dark:border-white/5 dark:bg-neutral-800/50">
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Jugador</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400">Pts para tabla general</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => {
                  const rankIcon = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1)
                  return (
                    <tr key={row.id} className="border-b border-gray-100 last:border-0 dark:border-white/5">
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
                      <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">{row.points}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div>
        <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Estadísticas</h2>
        <p className="mb-2 text-sm text-gray-400 dark:text-neutral-500">
          Jugadores más elegidos y los mejores puntajes cargados.
        </p>
        <DreamTeamStats mostPicked={stats.mostPicked} topRated={stats.topRated} />
      </div>
    </div>
  )
}
