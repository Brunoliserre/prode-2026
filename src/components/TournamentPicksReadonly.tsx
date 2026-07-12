import { getCountryCode, esTeamName } from "@/lib/flags"
import * as Flags from "country-flag-icons/react/3x2"

const CATEGORIES = [
  { key: "CHAMPION", label: "Campeón", icon: "🏆" },
  { key: "RUNNER_UP", label: "Subcampeón", icon: "🥈" },
  { key: "MVP", label: "MVP", icon: "🌟" },
  { key: "PICHICHI", label: "Pichichi", icon: "👟" },
  { key: "REVELATION", label: "Revelación", icon: "⭐" },
  { key: "RUSTICO", label: "Rústico", icon: "💥" },
  { key: "FAIR_PLAY", label: "Fair Play", icon: "🤝" },
  { key: "DESASTROSO", label: "Desastroso", icon: "🎯" },
  { key: "DECEPCION", label: "Decepción", icon: "😞" },
] as const

const PLAYER_CATEGORIES = new Set(["MVP", "PICHICHI"])

export interface PicksRow {
  id: string
  name: string | null
  image: string | null
  picks: Record<string, string>
}

function TeamFlag({ team }: { team: string }) {
  const code = getCountryCode(team)
  if (!code) return null
  const Flag = Flags[code as keyof typeof Flags]
  if (!Flag) return null
  return <Flag className="inline-block h-3.5 w-5 shrink-0 rounded-sm" />
}

function PickCell({ category, value }: { category: string; value: string | undefined }) {
  if (!value) return <span className="text-gray-300 dark:text-neutral-700">—</span>
  if (PLAYER_CATEGORIES.has(category)) {
    return <span className="text-gray-700 dark:text-neutral-300">{value}</span>
  }
  if (value.trim().toLowerCase() === "n/a") return <span className="text-gray-400 dark:text-neutral-500">N/A</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <TeamFlag team={value} />
      <span className="text-gray-700 dark:text-neutral-300">{esTeamName(value)}</span>
    </span>
  )
}

export function TournamentPicksReadonly({ users }: { users: PicksRow[] }) {
  const filled = users.filter((u) => Object.keys(u.picks).length > 0)
  const empty = users.filter((u) => Object.keys(u.picks).length === 0)
  const ordered = [...filled, ...empty]

  if (ordered.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-neutral-500">Todavía no hay predicciones.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1 dark:border-white/5 dark:bg-neutral-900">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/5">
            <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-semibold text-gray-900 dark:bg-neutral-900 dark:text-white">
              Usuario
            </th>
            {CATEGORIES.map((cat) => (
              <th
                key={cat.key}
                className="px-3 py-2 text-center font-medium text-gray-500 dark:text-neutral-400"
                title={cat.label}
              >
                <span className="block text-base leading-none">{cat.icon}</span>
                <span className="block text-xs">{cat.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
          {ordered.map((user) => {
            const hasPicks = Object.keys(user.picks).length > 0
            return (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="sticky left-0 z-10 bg-white px-3 py-2.5 dark:bg-neutral-900">
                  <div className="flex items-center gap-2">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt="" className="h-6 w-6 rounded-full" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-neutral-700" />
                    )}
                    <span className="whitespace-nowrap font-medium text-gray-800 dark:text-neutral-100">
                      {user.name ?? "Sin nombre"}
                    </span>
                    {!hasPicks && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        sin picks
                      </span>
                    )}
                  </div>
                </td>
                {CATEGORIES.map((cat) => (
                  <td key={cat.key} className="whitespace-nowrap px-3 py-2.5 text-center text-xs">
                    <PickCell category={cat.key} value={user.picks[cat.key]} />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
