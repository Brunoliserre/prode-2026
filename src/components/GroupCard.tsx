"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronUp, Check, Loader, Save } from "lucide-react"
import { cn, matchResult } from "@/lib/utils"
import { getCountryCode, esTeamName } from "@/lib/flags"
import { submitPrediction } from "@/lib/actions"
import { MatchPredictionsModal } from "./MatchPredictionsModal"
import * as Flags from "country-flag-icons/react/3x2"

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

type InputState = { home: string; away: string; status: "idle" | "ok" | "error"; saving: boolean }

interface GroupCardProps {
  group: string
  matches: Fixture[]
  predMap: Record<string, Prediction>
  userId?: string
  now: Date
  emblemUrl?: string
  headerLabel?: string
  dateMode?: boolean
}

function TeamFlag({ team }: { team: string }) {
  const code = getCountryCode(team)
  if (!code) return null
  const Flag = Flags[code as keyof typeof Flags]
  if (!Flag) return null
  return (
    <span className="shrink-0">
      <Flag className="block h-4 w-6 rounded-sm" />
    </span>
  )
}

const inputCls =
  "w-10 rounded border border-gray-300 bg-white text-center text-sm font-semibold tabular-nums tracking-tight text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"

const AR_TZ = "America/Argentina/Buenos_Aires"

// Fecha y hora de inicio del partido. Antes de montar usamos AR (igual que el
// servidor, para no romper la hidratación); ya en el cliente, `mounted` pasa a
// la zona horaria local de quien entra (timeZone undefined = zona del navegador).
function Kickoff({ date, stacked, mounted }: { date: Date; stacked?: boolean; mounted?: boolean }) {
  const d = new Date(date)
  const tz = mounted ? undefined : AR_TZ
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz })
  if (stacked) {
    const day = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: tz })
    return (
      <span className="whitespace-nowrap text-xs font-medium tabular-nums text-gray-400 dark:text-neutral-500">
        {day} · {time}
      </span>
    )
  }
  const day = d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: tz })
  return (
    <span className="whitespace-nowrap text-[11px] text-gray-400 dark:text-neutral-500">
      <span className="capitalize">{day}</span> · {time}
    </span>
  )
}

export function GroupCard({ group, matches, predMap, userId, now: initialNow, emblemUrl, headerLabel, dateMode }: GroupCardProps) {
  const [open, setOpen] = useState(true)
  const [now, setNow] = useState(initialNow)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // ya en el cliente: formatear horarios en la zona local del visitante
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const [inputs, setInputs] = useState<Record<string, InputState>>(() => {
    const init: Record<string, InputState> = {}
    for (const f of matches) {
      const p = predMap[f.id]
      // Si ya hay pronóstico guardado, arranca en "ok" (botón verde "Guardado").
      init[f.id] = { home: p != null ? String(p.homeScore) : "", away: p != null ? String(p.awayScore) : "", status: p != null ? "ok" : "idle", saving: false }
    }
    return init
  })

  function setField(id: string, field: "home" | "away", value: string) {
    setInputs(prev => ({ ...prev, [id]: { ...prev[id], [field]: value, status: "idle" } }))
  }

  async function save(fixtureId: string) {
    const s = inputs[fixtureId]
    if (s.home === "" || s.away === "") return
    setInputs(prev => ({ ...prev, [fixtureId]: { ...prev[fixtureId], saving: true, status: "idle" } }))
    try {
      await submitPrediction(fixtureId, Number(s.home), Number(s.away))
      setInputs(prev => ({ ...prev, [fixtureId]: { ...prev[fixtureId], saving: false, status: "ok" } }))
    } catch {
      setInputs(prev => ({ ...prev, [fixtureId]: { ...prev[fixtureId], saving: false, status: "error" } }))
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-b border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2.5">
          {emblemUrl
            ? <Image src={emblemUrl} alt="Mundial 2026" width={18} height={18} />
            : <span className="text-sm">⚽</span>}
          <span className="text-sm font-semibold tracking-wide text-gray-900 dark:text-white">{headerLabel ?? `Grupo ${group}`}</span>
        </div>
        <ChevronUp className={cn("h-4 w-4 text-gray-300 transition-transform duration-200 dark:text-neutral-600", !open && "rotate-180")} />
      </button>

      {open && (
        <div>
          {matches.map((fixture) => {
            const started = fixture.matchDate <= now
            const finished = fixture.homeScore != null && fixture.awayScore != null
            const prediction = predMap[fixture.id] ?? null
            const result = finished ? matchResult(fixture.homeScore!, fixture.awayScore!) : null
            const inp = inputs[fixture.id]
            const canPredict = !!userId && !started && !finished

            const live = started && !finished

            return (
              <div key={fixture.id} className="border-b border-gray-100 last:border-0 dark:border-white/5">

              {/* ── Mobile: equipos apilados (Local arriba, Visitante abajo) ── */}
              <div className="flex flex-col gap-2 px-3 py-2.5 sm:hidden">
                {/* Top row: estado + pred/real/hora/guardar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge started={started} finished={finished} matchday={fixture.matchday} group={dateMode ? fixture.group : undefined} />
                    {!started && !finished && <Kickoff date={fixture.matchDate} mounted={mounted} />}
                  </div>

                  {canPredict ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => save(fixture.id)}
                        disabled={inp.saving || inp.home === "" || inp.away === ""}
                        className={cn(
                          "flex h-6 items-center gap-1 rounded px-2 text-xs font-semibold transition-colors disabled:opacity-40",
                          inp.status === "ok"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                        )}
                      >
                        {inp.saving ? <Loader className="h-3 w-3 animate-spin" /> : inp.status === "ok" ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
                        {inp.saving ? "Guardando" : inp.status === "ok" ? "Guardado" : "Guardar"}
                      </button>
                      {inp.status === "error" && <span className="text-[10px] text-red-500">!</span>}
                    </div>
                  ) : prediction ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        {finished && <span className="text-[10px] text-gray-300 dark:text-neutral-600">pred</span>}
                        <span className="font-mono text-xs text-gray-400 dark:text-neutral-500">
                          {prediction.homeScore}–{prediction.awayScore}
                        </span>
                        {finished && <PointsBadge points={prediction.points} />}
                      </div>
                      {finished && (
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <span className="text-[10px] text-gray-300 dark:text-neutral-600">real</span>
                          <span className={cn(
                            "rounded px-1.5 py-px font-mono text-xs font-semibold",
                            prediction.points > 0
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-500 dark:text-red-400",
                          )}>
                            {fixture.homeScore}–{fixture.awayScore}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : live ? (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      EN VIVO
                    </span>
                  ) : null}
                </div>

                {/* Local */}
                <div className="flex items-center gap-2">
                  <TeamFlag team={fixture.homeTeam} />
                  <span className={cn(
                    "min-w-0 flex-1 truncate text-sm font-medium",
                    finished && result === "away" ? "text-gray-300 line-through dark:text-neutral-600" : "text-gray-800 dark:text-neutral-100",
                  )}>
                    {esTeamName(fixture.homeTeam)}
                  </span>
                  {canPredict ? (
                    <input
                      type="number" min={0} max={30}
                      value={inp.home}
                      onChange={e => setField(fixture.id, "home", e.target.value)}
                      className={inputCls}
                      placeholder="–"
                      style={{ height: "1.5rem" }}
                    />
                  ) : finished ? (
                    <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white">{fixture.homeScore}</span>
                  ) : null}
                </div>

                {/* Visitante */}
                <div className="flex items-center gap-2">
                  <TeamFlag team={fixture.awayTeam} />
                  <span className={cn(
                    "min-w-0 flex-1 truncate text-sm font-medium",
                    finished && result === "home" ? "text-gray-300 line-through dark:text-neutral-600" : "text-gray-800 dark:text-neutral-100",
                  )}>
                    {esTeamName(fixture.awayTeam)}
                  </span>
                  {canPredict ? (
                    <input
                      type="number" min={0} max={30}
                      value={inp.away}
                      onChange={e => setField(fixture.id, "away", e.target.value)}
                      className={inputCls}
                      placeholder="–"
                      style={{ height: "1.5rem" }}
                    />
                  ) : finished ? (
                    <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white">{fixture.awayScore}</span>
                  ) : null}
                </div>
              </div>

              {/* ── Desktop: una sola línea ── */}
              <div className="hidden items-center gap-1 px-2 py-2.5 sm:flex sm:gap-2 sm:px-3">

                {/* Status */}
                <div className="w-9 shrink-0 sm:w-11">
                  <StatusBadge started={started} finished={finished} matchday={fixture.matchday} group={dateMode ? fixture.group : undefined} />
                </div>

                {/* Home: name + flag + input */}
                <div className="flex flex-1 items-center justify-end gap-1.5 overflow-hidden">
                  <span className={cn(
                    "truncate text-sm font-medium",
                    finished && result === "away" ? "text-gray-300 line-through dark:text-neutral-600" : "text-gray-800 dark:text-neutral-100",
                  )}>
                    {esTeamName(fixture.homeTeam)}
                  </span>
                  <TeamFlag team={fixture.homeTeam} />
                  {canPredict && (
                    <input
                      type="number" min={0} max={30}
                      value={inp.home}
                      onChange={e => setField(fixture.id, "home", e.target.value)}
                      className={inputCls}
                      placeholder="–"
                      style={{ height: "1.5rem" }}
                    />
                  )}
                </div>

                {/* Center */}
                <div className="w-10 shrink-0 text-center sm:w-28">
                  {finished ? (
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{fixture.homeScore}–{fixture.awayScore}</span>
                  ) : started ? (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      EN VIVO
                    </span>
                  ) : (
                    <Kickoff date={fixture.matchDate} stacked mounted={mounted} />
                  )}
                </div>

                {/* Away: input + flag + name */}
                <div className="flex flex-1 items-center justify-start gap-1.5 overflow-hidden">
                  {canPredict && (
                    <input
                      type="number" min={0} max={30}
                      value={inp.away}
                      onChange={e => setField(fixture.id, "away", e.target.value)}
                      className={inputCls}
                      placeholder="–"
                      style={{ height: "1.5rem" }}
                    />
                  )}
                  <TeamFlag team={fixture.awayTeam} />
                  <span className={cn(
                    "truncate text-sm font-medium",
                    finished && result === "home" ? "text-gray-300 line-through dark:text-neutral-600" : "text-gray-800 dark:text-neutral-100",
                  )}>
                    {esTeamName(fixture.awayTeam)}
                  </span>
                </div>

                {/* Right: save btn / time / pred badge */}
                <div className="w-16 shrink-0 flex items-center justify-end gap-1 sm:w-20">
                  {canPredict ? (
                    <>
                      {inp.status === "ok" && (
                        <Save className="h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400" />
                      )}
                      <button
                        onClick={() => save(fixture.id)}
                        disabled={inp.saving || inp.home === "" || inp.away === ""}
                        className={cn(
                          "flex h-6 w-8 items-center justify-center rounded text-xs font-semibold transition-colors disabled:opacity-40",
                          inp.status === "ok"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                        )}
                      >
                        {inp.saving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </button>
                      {inp.status === "error" && <span className="text-[10px] text-red-500">!</span>}
                    </>
                  ) : prediction ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1">
                        {finished && <span className="text-[10px] text-gray-300 dark:text-neutral-600">pred</span>}
                        <span className="font-mono text-xs text-gray-400 dark:text-neutral-500">
                          {prediction.homeScore}–{prediction.awayScore}
                        </span>
                        {finished && <PointsBadge points={prediction.points} />}
                      </div>
                      {finished && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-300 dark:text-neutral-600">real</span>
                          <span className={cn(
                            "rounded px-1.5 py-px font-mono text-xs font-semibold",
                            prediction.points > 0
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-500 dark:text-red-400",
                          )}>
                            {fixture.homeScore}–{fixture.awayScore}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

              </div>

              {live && userId && (
                <div className="flex items-center gap-1 px-2 pb-2.5 sm:gap-2 sm:px-3">
                  {/* Espaciadores que replican las columnas del partido para que el
                      botón quede centrado bajo "EN VIVO" en desktop. */}
                  <div className="hidden shrink-0 sm:block sm:w-11" />
                  <div className="hidden flex-1 sm:block" />
                  <div className="flex flex-1 justify-center sm:w-28 sm:flex-none sm:shrink-0">
                    <MatchPredictionsModal
                      fixtureId={fixture.id}
                      homeTeam={fixture.homeTeam}
                      awayTeam={fixture.awayTeam}
                      currentUserId={userId}
                    />
                  </div>
                  <div className="hidden flex-1 sm:block" />
                  <div className="hidden shrink-0 sm:block sm:w-20" />
                </div>
              )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ started, finished, matchday, group }: { started: boolean; finished: boolean; matchday: number | null; group?: string | null }) {
  if (finished) return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">Final</span>
  )
  if (started) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />Live
    </span>
  )
  if (group) return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-neutral-800 dark:text-neutral-500">
      Gr. {group}
    </span>
  )
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-neutral-800 dark:text-neutral-500">
      {matchday ? `J${matchday}` : "–"}
    </span>
  )
}

function PointsBadge({ points }: { points: number }) {
  return (
    <span className={cn(
      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
      points >= 4  && "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
      points >= 2 && points < 4 && "bg-blue-500/15 text-blue-500 dark:text-blue-400",
      points === 1 && "bg-amber-500/15 text-amber-500 dark:text-amber-400",
      points === 0 && "bg-red-500/10 text-red-500",
    )}>
      {points > 0 ? `+${points}` : "0"}
    </span>
  )
}
