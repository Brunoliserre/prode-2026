"use client"

import { useState, useMemo } from "react"
import { Eye, EyeOff } from "lucide-react"
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
  stage: string | null
  homeScore: number | null
  awayScore: number | null
  homePens: number | null
  awayPens: number | null
}

// Rondas de eliminatorias: orden y etiqueta corta.
const KO_STAGES = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"] as const
const KO_LABEL: Record<string, string> = {
  LAST_32: "16vos",
  LAST_16: "8vos",
  QUARTER_FINALS: "4tos",
  SEMI_FINALS: "Semis",
  THIRD_PLACE: "3er puesto",
  FINAL: "Final",
}
const isKnockout = (f: Fixture) => !!f.stage && f.stage !== "GROUP_STAGE"

type Prediction = { homeScore: number; awayScore: number; points: number }

interface Props {
  fixtures: Fixture[]
  predMap: Record<string, Prediction>
  userId?: string
  now: Date
  emblemUrl?: string
}

// "Hoy" según el huso de Argentina (igual que los horarios mostrados).
const arDay = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })

export function FixturesView({ fixtures, predMap, userId, now, emblemUrl }: Props) {
  const [mode, setMode] = useState<"group" | "date">("group")
  const [hideFinished, setHideFinished] = useState(false)

  // Un partido "jugado" es el que ya tiene resultado cargado.
  const visibleFixtures = useMemo(
    () =>
      hideFinished
        ? fixtures.filter((f) => f.homeScore == null || f.awayScore == null)
        : fixtures,
    [fixtures, hideFinished],
  )

  const todayMatches = useMemo(() => {
    const today = arDay(now)
    return [...visibleFixtures]
      .filter((f) => arDay(f.matchDate) === today)
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
  }, [visibleFixtures, now])

  // Fase de grupos vs eliminatorias.
  const groupFixtures = useMemo(() => visibleFixtures.filter((f) => !isKnockout(f)), [visibleFixtures])
  const koFixtures = useMemo(() => visibleFixtures.filter(isKnockout), [visibleFixtures])

  // Eliminatorias agrupadas por ronda (solo rondas con partidos). Las fases más
  // nuevas van primero (Final … 16vos).
  const byStage = useMemo(() => {
    const map = new Map<string, Fixture[]>()
    for (const f of koFixtures) {
      const key = f.stage!
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    for (const list of map.values())
      list.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
    return KO_STAGES.filter((s) => map.has(s)).reverse().map((s) => [s, map.get(s)!] as const)
  }, [koFixtures])

  const byGroup = useMemo(() => {
    const map = new Map<string, Fixture[]>()
    const sorted = [...groupFixtures].sort(
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
  }, [groupFixtures])

  const byDate = useMemo(() => {
    const map = new Map<number, Fixture[]>()
    const sorted = [...groupFixtures].sort(
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
  }, [groupFixtures])

  return (
    <div>
      {todayMatches.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
              Partidos de hoy
            </h2>
            <span className="text-xs text-gray-300 dark:text-neutral-600">
              {now.toLocaleDateString("es-AR", {
                weekday: "long", day: "numeric", month: "long",
                timeZone: "America/Argentina/Buenos_Aires",
              })}
            </span>
          </div>
          <GroupCard
            group="hoy"
            headerLabel={`Hoy · ${todayMatches.length} partido${todayMatches.length === 1 ? "" : "s"}`}
            dateMode
            matches={todayMatches}
            predMap={predMap}
            userId={userId}
            emblemUrl={emblemUrl}
            now={now}
          />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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

        <button
          onClick={() => setHideFinished((v) => !v)}
          aria-pressed={hideFinished}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            hideFinished
              ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
              : "border-gray-200 text-gray-500 hover:text-gray-700 dark:border-white/10 dark:text-neutral-400 dark:hover:text-neutral-200",
          )}
        >
          {hideFinished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          Ocultar jugados
        </button>
      </div>

      {/* Eliminatorias (arriba, abierta) */}
      {byStage.length > 0 && (
        <div className="mb-3">
          <GroupsSection
            title="Eliminatorias"
            count={byStage.length}
            emblemUrl={emblemUrl}
            subtitle={byStage.map(([s]) => KO_LABEL[s]).join(" · ")}
            defaultOpen
          >
            {byStage.map(([stage, matches]) => (
              <GroupCard
                key={stage}
                group={stage}
                headerLabel={KO_LABEL[stage]}
                dateMode
                matches={matches}
                predMap={predMap}
                userId={userId}
                emblemUrl={emblemUrl}
                now={now}
              />
            ))}
          </GroupsSection>
        </div>
      )}

      {/* Fase de grupos (cerrada por defecto) */}
      {mode === "group" ? (
        <GroupsSection count={byGroup.length} emblemUrl={emblemUrl} subtitle={`${byGroup.length} grupos`} defaultOpen={false}>
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
        <GroupsSection count={byDate.length} emblemUrl={emblemUrl} subtitle={`${byDate.length} fechas`} defaultOpen={false}>
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
