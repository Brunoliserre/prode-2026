import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProfileForm } from "@/components/ProfileForm"

export const revalidate = 0

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

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-neutral-500">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total" value={total} highlight />
        <StatCard label="Partidos" value={matchPts} />
        <StatCard label="Torneo" value={pickPts} />
        <StatCard label="Jugados" value={played} />
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-neutral-900">
        <h2 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">Editar perfil</h2>
        <ProfileForm initialName={user.name ?? ""} initialImage={user.image ?? null} />
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center dark:border-white/5 dark:bg-neutral-900">
      <div className={`text-2xl font-bold ${highlight ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-neutral-200"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-gray-400 dark:text-neutral-500">{label}</div>
    </div>
  )
}
