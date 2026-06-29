"use client"

import { useState, useTransition } from "react"
import { Check, Loader, Trash2 } from "lucide-react"
import { cn, ratingColor } from "@/lib/utils"
import { POS_LABEL, type Pos } from "@/lib/formations"
import { saveDreamPlayerScores } from "@/lib/actions"

export type ScoringPlayer = {
  playerId: string
  name: string
  club: string
  position: Pos
  count: number // por cuántos equipos fue elegido
  rating: number | null
}

const POS_ORDER: Pos[] = ["GK", "DEF", "MED", "FWD"]

export function DreamTeamScoringAdmin({
  round,
  roundLabel,
  players,
}: {
  round: string
  roundLabel: string
  players: ScoringPlayer[]
}) {
  const [ratings, setRatings] = useState<Record<string, string>>(() =>
    Object.fromEntries(players.map((p) => [p.playerId, p.rating != null ? String(p.rating) : ""])),
  )
  const [saved, setSaved] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  if (!players.length) {
    return (
      <p className="text-sm text-gray-400 dark:text-neutral-500">
        Todavía nadie eligió jugadores para {roundLabel}.
      </p>
    )
  }

  function set(playerId: string, value: string) {
    setRatings((r) => ({ ...r, [playerId]: value }))
    setSaved(false)
  }

  function clearAll() {
    setRatings(Object.fromEntries(players.map((p) => [p.playerId, ""])))
    setSaved(false)
  }
  const anyRating = Object.values(ratings).some((v) => v?.trim())

  function save() {
    const data = players.map((p) => {
      const raw = ratings[p.playerId]?.trim()
      const rating = raw === "" || raw == null ? null : Number(raw)
      return { playerId: p.playerId, rating: rating != null && Number.isNaN(rating) ? null : rating }
    })
    setError(null)
    startSaving(async () => {
      try {
        await saveDreamPlayerScores(round, data)
        setSaved(true)
      } catch (e) {
        console.error("saveDreamPlayerScores", e)
        setError(e instanceof Error ? e.message : "Error al guardar")
        setSaved(false)
      }
    })
  }

  const byPos = (pos: Pos) => players.filter((p) => p.position === pos)
  const loaded = players.filter((p) => ratings[p.playerId]?.trim()).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-neutral-400">
          Ronda <span className="font-semibold text-gray-800 dark:text-neutral-100">{roundLabel}</span> ·{" "}
          {loaded}/{players.length} con rating
        </p>
        {error && <span className="text-xs text-red-500">{error}</span>}
        <button
          onClick={clearAll}
          disabled={!anyRating}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpiar
        </button>
        <button
          onClick={save}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
            saved
              ? "bg-emerald-100 text-emerald-600 disabled:opacity-100 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40",
          )}
        >
          {isSaving ? <Loader className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
          {isSaving ? "Guardando" : saved ? "Guardado" : "Guardar ratings"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {POS_ORDER.map((pos) => (
          <div key={pos}>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
              {POS_LABEL[pos]}
            </p>
            <div className="space-y-1">
              {byPos(pos).map((p) => {
                const val = ratings[p.playerId] ?? ""
                const num = val.trim() === "" ? null : Number(val)
                return (
                  <div key={p.playerId} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-neutral-200">
                      {p.name} <span className="text-gray-400 dark:text-neutral-500">· {p.club}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400 dark:text-neutral-600" title="Elegido por N equipos">
                      ×{p.count}
                    </span>
                    <input
                      type="number" min={1} max={10} step={0.1}
                      value={val}
                      onChange={(e) => set(p.playerId, e.target.value)}
                      placeholder="–"
                      className={cn(
                        "w-16 rounded border border-gray-300 bg-white px-2 py-1 text-center text-sm font-semibold tabular-nums text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100",
                        num != null && !Number.isNaN(num) && ratingColor(num),
                      )}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
