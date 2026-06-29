import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SyncResultsButton } from "@/components/SyncResultsButton"
import { SyncFixturesButton } from "@/components/SyncFixturesButton"
import { TournamentAdmin } from "@/components/TournamentAdmin"
import { DeleteUserForm } from "@/components/DeleteUserForm"
import { EmailAdmin } from "@/components/EmailAdmin"
import { UserTournamentPicksAdmin } from "@/components/UserTournamentPicksAdmin"
import { PaidUsersAdmin } from "@/components/PaidUsersAdmin"
import { DreamTeamScoringAdmin, type ScoringPlayer } from "@/components/DreamTeamScoringAdmin"
import { currentRound, KO_LABEL } from "@/lib/dreamteam-scoring"
import { PLAYER_BY_ID } from "@/lib/dreamteam-mock"
import type { Pos } from "@/lib/formations"
import { ALL_TEAMS } from "@/lib/flags"

export const revalidate = 0

export default async function AdminPage() {
  const session = await auth()

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/")
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, image: true, hasPaid: true, wantsToJoin: true },
  })

  const allPicks = await prisma.tournamentPick.findMany({
    select: { userId: true, category: true, value: true },
  })

  const picksByUser = new Map<string, Record<string, string>>()
  for (const pick of allPicks) {
    if (!picksByUser.has(pick.userId)) picksByUser.set(pick.userId, {})
    picksByUser.get(pick.userId)![pick.category] = pick.value
  }

  const usersWithPicks = users.map((u) => ({
    id: u.id,
    name: u.name,
    image: u.image,
    picks: picksByUser.get(u.id) ?? {},
  }))

  // Dream team: jugadores elegidos por alguien en la ronda activa + sus ratings.
  const dtRound = await currentRound()
  const dtRoundLabel = KO_LABEL[dtRound] ?? dtRound
  const dtTeams = await prisma.dreamTeam.findMany({ where: { round: dtRound }, include: { picks: true } })
  const dtScores = await prisma.playerScore.findMany({ where: { round: dtRound } })
  const ratingOf = new Map(dtScores.map((s) => [s.playerId, s.rating]))
  const countOf = new Map<string, number>()
  for (const t of dtTeams) for (const p of t.picks) countOf.set(p.playerId, (countOf.get(p.playerId) ?? 0) + 1)
  const dtPlayers: ScoringPlayer[] = [...countOf.keys()]
    .map((playerId) => {
      const pl = PLAYER_BY_ID.get(playerId)
      return {
        playerId,
        name: pl?.name ?? playerId,
        club: pl?.club ?? "",
        position: (pl?.position ?? "MED") as Pos,
        count: countOf.get(playerId)!,
        rating: ratingOf.get(playerId) ?? null,
      }
    })
    .sort((a, b) => b.count - a.count || a.club.localeCompare(b.club) || a.name.localeCompare(b.name))

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

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Picks de torneo por usuario</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-neutral-500">
          Predicciones de campeón, subcampeón y categorías especiales de cada participante.
          Usá el lápiz para cargar o corregir los picks de quien se olvidó de completarlos.
        </p>
        <UserTournamentPicksAdmin users={usersWithPicks} teams={ALL_TEAMS} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Dream Team · ratings ({dtRoundLabel})</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-neutral-500">
          Jugadores elegidos por los participantes en esta ronda. Cargá el rating de FotMob (1-10) de cada uno;
          la suma define el ranking del dream team, que se suma al total.
        </p>
        <DreamTeamScoringAdmin round={dtRound} roundLabel={dtRoundLabel} players={dtPlayers} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Pozo acumulado</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-neutral-500">
          Marcá quiénes ya transfirieron su entrada. El pozo y la barra de la página principal se actualizan solos.
        </p>
        <PaidUsersAdmin users={users} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Enviar correos</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-neutral-500">
          Enviá un mail a todos los usuarios registrados.  </p>
        <EmailAdmin userCount={users.length} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Eliminar usuario</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-neutral-500">
          Buscá por nombre o email y eliminá la cuenta junto con todos sus pronósticos.
        </p>
        <DeleteUserForm users={users} />
      </section>
    </div>
  )
}
