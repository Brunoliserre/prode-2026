import { getCountryCode } from "@/lib/flags"
import * as Flags from "country-flag-icons/react/3x2"

const CATEGORIES = [
  { key: "CHAMPION",   label: "Campeón",     icon: "🏆" },
  { key: "RUNNER_UP",  label: "Subcampeón",  icon: "🥈" },
  { key: "MVP",        label: "MVP",         icon: "🌟" },
  { key: "PICHICHI",   label: "Pichichi",    icon: "👟" },
  { key: "REVELATION", label: "Revelación",  icon: "⭐" },
  { key: "RUSTICO",    label: "Rústico",     icon: "💥" },
  { key: "FAIR_PLAY",  label: "Fair Play",   icon: "🤝" },
  { key: "DESASTROZO", label: "Desastrozo",  icon: "🎯" },
  { key: "DECEPCION",  label: "Decepción",   icon: "😞" },
] as const

const PLAYER_CATEGORIES = new Set(["MVP", "PICHICHI"])

type CategoryKey = (typeof CATEGORIES)[number]["key"]

interface UserRow {
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
  return (
    <span className="inline-flex items-center gap-1.5">
      <TeamFlag team={value} />
      <span className="text-gray-700 dark:text-neutral-300">{value}</span>
    </span>
  )
}

export function UserTournamentPicksAdmin({ users }: { users: UserRow[] }) {
  const filled = users.filter((u) => Object.keys(u.picks).length > 0)
  const empty = users.filter((u) => Object.keys(u.picks).length === 0)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/5">
            <th className="sticky left-0 z-10 bg-white py-2 pr-4 text-left font-semibold text-gray-900 dark:bg-neutral-900 dark:text-white">
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
          {filled.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
              <td className="sticky left-0 z-10 bg-white py-2.5 pr-4 dark:bg-neutral-900">
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
                </div>
              </td>
              {CATEGORIES.map((cat) => (
                <td key={cat.key} className="whitespace-nowrap px-3 py-2.5 text-center text-xs">
                  <PickCell category={cat.key} value={user.picks[cat.key]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {empty.length > 0 && (
        <p className="mt-3 text-xs text-gray-400 dark:text-neutral-600">
          Sin predicciones: {empty.map((u) => u.name ?? u.id).join(", ")}
        </p>
      )}
    </div>
  )
}
