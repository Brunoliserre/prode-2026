"use client"

import { useMemo, useState } from "react"
import { cn, ratingColor } from "@/lib/utils"
import { FORMATIONS, type Formation, type Pos, lineCounts, POS_LABEL } from "@/lib/formations"
import { TEAMS, squadFor } from "@/lib/dreamteam-mock"
import { DreamTeamPitch, type PitchPlayer } from "./DreamTeamPitch"

const POS_ORDER: Pos[] = ["GK", "DEF", "MED", "FWD"]

function remap(prev: Record<string, PitchPlayer>, f: Formation): Record<string, PitchPlayer> {
  const counts = lineCounts(f)
  const next: Record<string, PitchPlayer> = {}
  for (const pos of POS_ORDER) {
    const kept: PitchPlayer[] = []
    for (let i = 0; i < 12; i++) {
      const p = prev[`${pos}${i}`]
      if (p) kept.push(p)
    }
    kept.slice(0, counts[pos]).forEach((p, i) => (next[`${pos}${i}`] = p))
  }
  return next
}

export function DreamTeamBuilder() {
  const [formation, setFormation] = useState<Formation>("3-1-2")
  const [picks, setPicks] = useState<Record<string, PitchPlayer>>({})
  const [team, setTeam] = useState<string>(TEAMS[0])

  const counts = lineCounts(formation)
  const squad = useMemo(() => squadFor(team), [team])
  const pickedIds = new Set(Object.values(picks).map((p) => p.id))
  const filled = Object.keys(picks).length
  const total = Object.values(picks).reduce((s, p) => s + (p.rating ?? 0), 0)

  function changeFormation(f: Formation) {
    setFormation(f)
    setPicks((prev) => remap(prev, f))
  }

  function assign(p: PitchPlayer) {
    if (pickedIds.has(p.id)) return
    for (let i = 0; i < counts[p.position]; i++) {
      const k = `${p.position}${i}`
      if (!picks[k]) {
        setPicks((prev) => ({ ...prev, [k]: p }))
        return
      }
    }
  }

  function removeSlot(k: string) {
    setPicks((prev) => {
      const n = { ...prev }
      delete n[k]
      return n
    })
  }

  // Swap entre dos slots (la cancha solo permite soltar en la misma posición).
  function move(fromKey: string, toKey: string) {
    if (fromKey === toKey) return
    setPicks((prev) => {
      const n = { ...prev }
      const a = n[fromKey]
      const b = n[toKey]
      if (b) n[fromKey] = b
      else delete n[fromKey]
      if (a) n[toKey] = a
      else delete n[toKey]
      return n
    })
  }

  function posFull(pos: Pos) {
    let c = 0
    for (let i = 0; i < counts[pos]; i++) if (picks[`${pos}${i}`]) c++
    return c >= counts[pos]
  }

  return (
    <div className="space-y-5">
      {/* Header: formación + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
            Formación
          </span>
          {FORMATIONS.map((f) => (
            <button
              key={f}
              onClick={() => changeFormation(f)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums transition-colors",
                formation === f
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 dark:text-neutral-400">
            <span className="font-bold text-gray-900 dark:text-white">{filled}</span>/7
          </span>
          <span className="rounded-lg bg-emerald-100 px-2.5 py-1 font-bold tabular-nums text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {total.toFixed(1)} pts
          </span>
        </div>
      </div>

      {/* Cancha */}
      <DreamTeamPitch formation={formation} picks={picks} onRemove={removeSlot} onMove={move} />

      {/* Selector de equipo */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
          Equipo
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5">
          {TEAMS.map((t) => (
            <button
              key={t}
              onClick={() => setTeam(t)}
              className={cn(
                "whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                team === t
                  ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Pool de jugadores del equipo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {POS_ORDER.map((pos) => (
          <div key={pos} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/5 dark:bg-neutral-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                {POS_LABEL[pos]}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-neutral-600">
                {Object.keys(picks).filter((k) => k.startsWith(pos)).length}/{counts[pos]}
              </span>
            </div>
            <div className="space-y-1">
              {squad
                .filter((p) => p.position === pos)
                .map((p) => {
                  const picked = pickedIds.has(p.id)
                  const full = posFull(pos)
                  const disabled = picked || full
                  return (
                    <button
                      key={p.id}
                      onClick={() => assign(p)}
                      disabled={disabled}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        picked
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : full
                            ? "cursor-not-allowed text-gray-300 dark:text-neutral-600"
                            : "text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-white/5",
                      )}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.rating != null && (
                        <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums", ratingColor(p.rating))}>
                          {p.rating.toFixed(1)}
                        </span>
                      )}
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
