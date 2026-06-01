import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProfileForm } from "@/components/ProfileForm"

export const revalidate = 0

const PICK_LABELS: Record<string, { label: string; icon: string; points: number }> = {
  CHAMPION:   { label: "Campeón del Mundo", icon: "🏆", points: 15 },
  RUNNER_UP:  { label: "Subcampeón",        icon: "🥈", points: 8  },
  MVP:        { label: "MVP del Mundial",   icon: "🌟", points: 5  },
  PICHICHI:   { label: "Pichichi",          icon: "👟", points: 5  },
  REVELATION: { label: "Equipo Revelación", icon: "⭐", points: 3  },
  FAIR_PLAY:  { label: "Premio Fair Play",  icon: "🤝", points: 3  },
  RUSTICO:    { label: "Premio Rústico",    icon: "💥", points: 3  },
  DESASTROZO: { label: "Premio Desastrozo", icon: "🎯", points: 3  },
  DECEPCION:  { label: "Premio Decepción",  icon: "😞", points: 3  },
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { predictions: true, tournamentPicks: true },
  })
  if (!user) redirect("/")

  const matchPts = user.predictions.reduce((s, p) => s + p.points, 0)
  const pickPts  = user.tournamentPicks.reduce((s, p) => s + p.points, 0)
  const total    = matchPts + pickPts
  const played   = user.predictions.length

  const picksByCategory = Object.fromEntries(
    user.tournamentPicks.map((p) => [p.category, p])
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-neutral-500">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-4 sm:divide-y-0 dark:divide-white/5">
          <Stat icon="🏆" value={total} label="Puntos totales" sublabel="partidos + torneo" highlight />
          <Stat icon="⚽" value={matchPts} label="Pts de partidos" sublabel="pronósticos acertados" />
          <Stat icon="🎯" value={pickPts} label="Pts de torneo" sublabel="predicciones generales" />
          <Stat icon="📋" value={played} label="Pronósticos" sublabel="partidos jugados" />
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Left: edit form */}
        <div className="self-start rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
          <h2 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">Editar perfil</h2>
          <ProfileForm initialName={user.name ?? ""} initialImage={user.image ?? null} />
        </div>

        {/* Right: tournament picks */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-white/5">
            <h2 className="font-semibold text-gray-900 dark:text-white">🎯 Predicciones del Torneo</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {Object.entries(PICK_LABELS).map(([key, meta]) => {
              const pick = picksByCategory[key]
              return (
                <div key={key} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 shrink-0 text-center text-base">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 dark:text-neutral-500">{meta.label}</p>
                    <p className={`truncate text-sm font-medium ${pick ? "text-gray-800 dark:text-neutral-100" : "italic text-gray-300 dark:text-neutral-600"}`}>
                      {pick ? pick.value : "Sin selección"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {pick && pick.points > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        +{pick.points}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-neutral-700">+{meta.points}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

function Stat({ icon, value, label, sublabel, highlight }: { icon: string; value: number; label: string; sublabel: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-5 text-center">
      <span className="text-xl">{icon}</span>
      <span className={`text-2xl font-bold tabular-nums ${highlight ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-neutral-200"}`}>
        {value}
      </span>
      <span className="text-xs font-medium text-gray-600 dark:text-neutral-400">{label}</span>
      <span className="text-[10px] text-gray-400 dark:text-neutral-600">{sublabel}</span>
    </div>
  )
}
