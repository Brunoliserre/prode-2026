"use client"

import { useState } from "react"
import { User } from "lucide-react"
import { cn, ratingTextColor } from "@/lib/utils"
import { POS_LABEL, type Pos } from "@/lib/formations"

export type PickStat = {
  playerId: string; name: string; club: string; position: Pos
  count: number; rounds: string[]; photoUrl: string | null
}
export type RatingStat = {
  playerId: string; name: string; club: string; position: Pos
  round: string; roundLabel: string; rating: number; picks: number; photoUrl: string | null
}

function Face({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [err, setErr] = useState(false)
  return (
    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
      {photoUrl && !err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" onError={() => setErr(true)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-neutral-500">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

function PlayerCell({ name, club, position, photoUrl }: { name: string; club: string; position: Pos; photoUrl: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Face name={name} photoUrl={photoUrl} />
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-800 dark:text-neutral-100">{name}</p>
        <p className="truncate text-[11px] text-gray-400 dark:text-neutral-500">
          {club} · {POS_LABEL[position]}
        </p>
      </div>
    </div>
  )
}

export function DreamTeamStats({ mostPicked, topRated }: { mostPicked: PickStat[]; topRated: RatingStat[] }) {
  const [tab, setTab] = useState<"picks" | "rating">("picks")

  if (!mostPicked.length && !topRated.length) {
    return (
      <p className="text-sm text-gray-400 dark:text-neutral-500">
        Todavía no hay datos suficientes para las estadísticas.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-white/10">
        {([
          ["picks", "Más elegidos"],
          ["rating", "Mejores puntajes"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === key
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
        <div className="max-h-[28rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100/90 backdrop-blur dark:bg-neutral-800/90">
              <tr className="border-b border-gray-200 text-left dark:border-white/5">
                <th className="px-3 py-2.5 font-semibold text-gray-500 dark:text-neutral-400">#</th>
                <th className="px-2 py-2.5 font-semibold text-gray-500 dark:text-neutral-400">Jugador</th>
                {tab === "picks" ? (
                  <>
                    <th className="hidden px-3 py-2.5 text-left font-semibold text-gray-500 sm:table-cell dark:text-neutral-400">Rondas</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-gray-500 dark:text-neutral-400">Veces</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2.5 text-center font-semibold text-gray-500 dark:text-neutral-400">Ronda</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-gray-500 dark:text-neutral-400">Elegido</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-gray-500 dark:text-neutral-400">Rating</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tab === "picks"
                ? mostPicked.map((p, i) => (
                    <tr key={p.playerId} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                      <td className="px-2 py-2.5">
                        <PlayerCell name={p.name} club={p.club} position={p.position} photoUrl={p.photoUrl} />
                      </td>
                      <td className="hidden px-3 py-2.5 text-left text-xs text-gray-400 sm:table-cell dark:text-neutral-500">
                        {p.rounds.join(" · ")}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold tabular-nums text-gray-900 dark:text-white">{p.count}</td>
                    </tr>
                  ))
                : topRated.map((p, i) => (
                    <tr key={`${p.round}-${p.playerId}`} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">{i + 1}</td>
                      <td className="px-2 py-2.5">
                        <PlayerCell name={p.name} club={p.club} position={p.position} photoUrl={p.photoUrl} />
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-gray-500 dark:text-neutral-400">{p.roundLabel}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-gray-500 dark:text-neutral-400">{p.picks}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("rounded bg-white px-1.5 py-0.5 text-xs font-bold tabular-nums shadow-sm dark:bg-neutral-800", ratingTextColor(p.rating))}>
                          {p.rating.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
