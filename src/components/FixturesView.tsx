"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { GroupsSection } from "./GroupsSection"
import { GroupCard } from "./GroupCard"

type Fixture = {
  id: string
  homeTeam: string
  awayTeam: string
  matchDate: Date
  matchday: number | null
  group: string | null
  homeScore: number | null
  awayScore: number | null
}

type Prediction = { homeScore: number; awayScore: number; points: number }

interface Props {
  fixtures: Fixture[]
  predMap: Record<string, Prediction>
  userId?: string
  now: Date
  emblemUrl?: string
}

export function FixturesView({ fixtures, predMap, userId, now, emblemUrl }: Props) {
  const [mode, setMode] = useState<"group" | "date">("group")

  const byGroup = useMemo(() => {
    const map = new Map<string, Fixture[]>()
    const sorted = [...fixtures].sort(
      (a, b) =>
        (a.group ?? "").localeCompare(b.group ?? "") ||
        (a.matchday ?? 0) - (b.matchday ?? 0) ||
        new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
    )
    for (const f of sorted) {
      const key = f.group ?? "Sin grupo"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [fixtures])

  const byDate = useMemo(() => {
    const map = new Map<number, Fixture[]>()
    const sorted = [...fixtures].sort(
      (a, b) =>
        (a.matchday ?? 0) - (b.matchday ?? 0) ||
        new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
    )
    for (const f of sorted) {
      const key = f.matchday ?? 0
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b)
  }, [fixtures])

  return (
    <div>
      <div className="mb-3 flex">
        <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-white/10">
          <button
            onClick={() => setMode("group")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "group"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200",
            )}
          >
            Por grupo
          </button>
          <button
            onClick={() => setMode("date")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "date"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200",
            )}
          >
            Por fecha
          </button>
        </div>
      </div>

      {mode === "group" ? (
        <GroupsSection count={byGroup.length} emblemUrl={emblemUrl} subtitle={`${byGroup.length} grupos`}>
          {byGroup.map(([group, matches]) => (
            <GroupCard
              key={group}
              group={group}
              matches={matches}
              predMap={predMap}
              userId={userId}
              emblemUrl={emblemUrl}
              now={now}
            />
          ))}
        </GroupsSection>
      ) : (
        <GroupsSection count={byDate.length} emblemUrl={emblemUrl} subtitle={`${byDate.length} fechas`}>
          {byDate.map(([matchday, matches]) => (
            <GroupCard
              key={matchday}
              group={String(matchday)}
              headerLabel={`Fecha ${matchday}`}
              dateMode
              matches={matches}
              predMap={predMap}
              userId={userId}
              emblemUrl={emblemUrl}
              now={now}
            />
          ))}
        </GroupsSection>
      )}
    </div>
  )
}
