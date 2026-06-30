"use client"

import { useState, useTransition } from "react"
import { Check, Loader, Lock, LockOpen, Trash2 } from "lucide-react"
import { cn, ratingColor } from "@/lib/utils"
import { POS_LABEL, type Pos } from "@/lib/formations"
import { saveDreamPlayerScores, setDreamRoundFinalized } from "@/lib/actions"

export type ScoringPlayer = {
  playerId: string
  name: string
  club: string
  position: Pos
  count: number // por cuántos equipos fue elegido
  rating: number | null
}


export function DreamTeamScoringAdmin({
  round,
  roundLabel,
  players,
  finalized,
}: {
  round: string
  roundLabel: string
  players: ScoringPlayer[]
  finalized: boolean
}) {
  const [ratings, setRatings] = useState<Record<string, string>>(() =>
    Object.fromEntries(players.map((p) => [p.playerId, p.rating != null ? String(p.rating) : ""])),
  )
  const [saved, setSaved] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [isToggling, startToggle] = useTransition()

  function toggleFinalized() {
    startToggle(async () => {
      try {
        await setDreamRoundFinalized(round, !finalized)
      } catch {
        /* noop */
      }
    })
  }

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

  const posRank: Record<Pos, number> = { GK: 0, DEF: 1, MED: 2, FWD: 3 }
  const clubs = [...new Set(players.map((p) => p.club))].sort((a, b) => a.localeCompare(b))
  const byClub = (club: string) =>
    players
      .filter((p) => p.club === club)
      .sort((a, b) => posRank[a.position] - posRank[b.position] || a.name.localeCompare(b.name))
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

      {/* Finalizar / reabrir la fecha */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-white/5">
        <span className="text-sm text-gray-600 dark:text-neutral-300">
          {finalized ? (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Fecha cerrada · los puntos cuentan en el ranking</span>
          ) : (
            "Fecha en juego · los puntos NO se calculan hasta cerrarla"
          )}
        </span>
        <button
          onClick={toggleFinalized}
          disabled={isToggling}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50",
            finalized
              ? "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
              : "bg-gray-900 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200",
          )}
        >
          {isToggling ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : finalized ? (
            <LockOpen className="h-3.5 w-3.5" />
          ) : (
            <Lock className="h-3.5 w-3.5" />
          )}
          {finalized ? "Reabrir fecha" : "Finalizar fecha"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {clubs.map((club) => (
          <div key={club}>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
              {club}
            </p>
            <div className="space-y-1">
              {byClub(club).map((p) => {
                const val = ratings[p.playerId] ?? ""
                const num = val.trim() === "" ? null : Number(val)
                return (
                  <div key={p.playerId} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-neutral-200">
                      {p.name} <span className="text-gray-400 dark:text-neutral-500">· {POS_LABEL[p.position]}</span>
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
